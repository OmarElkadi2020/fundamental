from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import json
from datetime import datetime
from contextlib import asynccontextmanager
import re

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from backend.logger import logger

# --- Caching --- #
CACHE_FILE = "./data/cache/spa_analysis_cache.json"

def get_cache():
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def write_cache(data):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(data, f, indent=4)

def _extract_json_from_text(text_content: str) -> str:
    """Extracts a JSON string from a text, handling markdown code blocks."""
    json_match = re.search(r"```json\n([\s\S]*?)\n```", text_content)
    if json_match:
        return json_match.group(1)
    # If no markdown json block, assume the whole content might be JSON
    return text_content

from backend.core.use_cases.ai_evaluation_service import AIEvaluationService
from backend.core.infrastructure.yfinance_repository import YahooFinanceRepository

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    app.state.ai_service = AIEvaluationService()
    app.state.yfinance_repo = YahooFinanceRepository()
    yield
    logger.info("Shutting down application...")

app = FastAPI(lifespan=lifespan)

# Mount static files
app.mount("/web", StaticFiles(directory="web/frontend/build"), name="web")

# Configure Jinja2Templates
templates = Jinja2Templates(directory="web/frontend/build")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SPA Serving --- #
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# --- API Endpoints for SPA --- #

@app.get("/api/stock_detail/{ticker}")
async def get_stock_detail(ticker: str, request: Request):
    yfinance_repo = request.app.state.yfinance_repo
    try:
        data = yfinance_repo.get_all_data(ticker)
        if data:
            return JSONResponse(content=data)
        raise HTTPException(status_code=404, detail=f"Stock data not found for {ticker}")
    except Exception as e:
        logger.error(f"Error fetching stock detail for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve stock data: {e}")

@app.get("/api/yfinance/{ticker}")
async def get_yfinance_data(ticker: str, request: Request):
    yfinance_repo = request.app.state.yfinance_repo
    try:
        data = yfinance_repo.get_all_data(ticker)
        if data:
            return JSONResponse(content=data)
        raise HTTPException(status_code=404, detail=f"Yahoo Finance data not found for {ticker}")
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance data for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve Yahoo Finance data: {e}")

@app.post("/api/run_analysis_step")
async def run_analysis_step(request: Request):
    body = await request.json()
    step = body.get("step")
    use_cache = body.get("use_cache", True)
    payload = body.get("payload")
    detail_level = body.get("detail_level", "fast")
    ai_service: AIEvaluationService = request.app.state.ai_service

    cache = get_cache()

    if use_cache and step in cache:
        cached_step_data = cache[step]
        # The 'data' key holds the content from the AI service
        raw_data = cached_step_data.get("data", {})
        
        # The actual content is under the 'content' key
        content = raw_data.get("content", "")
        
        # Ensure content is parsed to a dictionary or list before sending
        if isinstance(content, str):
            try:
                # Extract from markdown and parse
                parsed_content = json.loads(_extract_json_from_text(content))
            except json.JSONDecodeError:
                # If parsing fails, it might be a plain string; send as is
                logger.warning(f"Could not parse cached content for step '{step}'. Sending raw content.")
                parsed_content = content
        else:
            # If it's already a dict/list, use it directly
            parsed_content = content
            
        # Reconstruct the data object to be sent to the frontend
        response_data = {
            "content": parsed_content,
            "format": "json" if isinstance(parsed_content, (dict, list)) else "text",
            "model": raw_data.get("model", "cached")
        }
        
        logger.info(f"Returning cached data for step: {step}")
        return {"status": "cached", "step": step, "data": response_data}

    try:
        logger.info(f"Running analysis step: {step} (Use Cache: {use_cache})")
        result = None
        if step == "idea_generation":
            count = payload.get("count", 150)
            result = ai_service.generate_ideas_scuttlebutt(count=count, detail_level=detail_level)
        elif step == "categorization_triage":
            companies_list = payload.get("companies_list")
            if not companies_list:
                raise HTTPException(status_code=400, detail="companies_list is required for categorization_triage step.")
            result = ai_service.categorize_and_filter_lynch(companies_list=companies_list, detail_level=detail_level)
        elif step == "vetting_fast_growers":
            fast_growers_data = payload.get("fast_growers_data")
            if not fast_growers_data:
                raise HTTPException(status_code=400, detail="fast_growers_data is required for vetting_fast_growers step.")
            result = ai_service.vet_fast_growers(fast_growers_data=fast_growers_data, detail_level=detail_level)
        elif step == "vetting_turnarounds":
            turnarounds_data = payload.get("turnarounds_data")
            if not turnarounds_data:
                raise HTTPException(status_code=400, detail="turnarounds_data is required for vetting_turnarounds step.")
            result = ai_service.vet_turnarounds(turnarounds_data=turnarounds_data, detail_level=detail_level)
        elif step == "sentiment_analysis":
            stocks_list = payload.get("stocks_list")
            if not stocks_list:
                raise HTTPException(status_code=400, detail="stocks_list is required for sentiment_analysis step.")
            result = ai_service.analyze_sentiment(stocks_list=stocks_list, detail_level=detail_level)
        elif step == "final_selection_synthesis":
            fast_growers_vetted_data = cache.get("vetting_fast_growers", {}).get("data", {}).get("content", "[]")
            turnarounds_vetted_data = cache.get("vetting_turnarounds", {}).get("data", {}).get("content", "[]")
            sentiment_analysis_results = payload.get("sentiment_analysis_results")
            
            if isinstance(fast_growers_vetted_data, str):
                try:
                    fast_growers_vetted_data = json.loads(_extract_json_from_text(fast_growers_vetted_data))
                except json.JSONDecodeError:
                    logger.error("Error parsing fast_growers_vetted_data from cache.")
                    fast_growers_vetted_data = []
            else: logger.warning(f"The fast_growers_vetted_data is not a json string, but {type(fast_growers_vetted_data)}. it will not be converted to json")
            
            if isinstance(fast_growers_vetted_data, str):
                try:
                    turnarounds_vetted_data = json.loads(_extract_json_from_text(turnarounds_vetted_data))
                except json.JSONDecodeError:
                    logger.error("Error parsing turnarounds_vetted_data from cache.")
                    turnarounds_vetted_data = []
            else: logger.warning(f"The turnarounds_vetted_data is not a json string, but {type(turnarounds_vetted_data)}. it will not be converted to json")

            if not fast_growers_vetted_data and not turnarounds_vetted_data:
                raise HTTPException(status_code=400, detail="No vetting data available for final synthesis.")
            if not sentiment_analysis_results:
                raise HTTPException(status_code=400, detail="Sentiment analysis results are required for final_selection_synthesis step.")

            result = ai_service.final_selection_synthesis(
                fast_growers_vetted=fast_growers_vetted_data,
                turnarounds_vetted=turnarounds_vetted_data,
                sentiment_analysis_results=sentiment_analysis_results,
                detail_level=detail_level
            )
        else:
            logger.warning(f"Unknown analysis step requested: {step}")
            raise HTTPException(status_code=400, detail=f"Unknown step: {step}")

        # Update cache
        cache[step] = {
            "timestamp": datetime.now().isoformat(),
            "data": result
        }
        write_cache(cache)
        logger.info(f"Successfully completed analysis step: {step}")
        return {"status": "success", "step": step, "data": result}

    except Exception as e:
        logger.error(f"An error occurred during analysis step {step}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get_cached_step/{step_name}")
async def get_cached_step(step_name: str):
    cache = get_cache()
    if step_name in cache:
        return JSONResponse(content=cache[step_name])
    return JSONResponse(content=None, status_code=404)

@app.get("/api/stock/{ticker}/vetting_results")
async def get_stock_vetting_results(ticker: str):
    cache = get_cache()
    fast_growers_vetting = cache.get("vetting_fast_growers", {}).get("data", {}).get("content")
    turnarounds_vetting = cache.get("vetting_turnarounds", {}).get("data", {}).get("content")

    all_vetting_results = []
    if fast_growers_vetting:
        try:
            json_string = json.loads(_extract_json_from_text(fast_growers_vetting)) if isinstance(fast_growers_vetting, str) else fast_growers_vetting
            all_vetting_results.extend(json_string)
        except json.JSONDecodeError:
            logger.error("Error decoding fast_growers_vetting from cache.")
    if turnarounds_vetting:
        try:
            json_string = json.loads(_extract_json_from_text(turnarounds_vetting)) if isinstance(turnarounds_vetting, str) else turnarounds_vetting
        except json.JSONDecodeError:
            logger.error("Error decoding turnarounds_vetting from cache.")

    for stock_data in all_vetting_results:
        if stock_data.get("ticker") == ticker:
            return JSONResponse(content=stock_data.get("vetting_results"))

    raise HTTPException(status_code=404, detail=f"Vetting results not found for {ticker}")

@app.get("/api/stock/{ticker}/sentiment_analysis")
async def get_stock_sentiment_analysis(ticker: str):
    cache = get_cache()
    sentiment_analysis_data = cache.get("sentiment_analysis", {}).get("data", {}).get("content")

    if sentiment_analysis_data:
        try:
            parsed_sentiment = json.loads(_extract_json_from_text(sentiment_analysis_data)) if isinstance(sentiment_analysis_data, str) else sentiment_analysis_data
            for item in parsed_sentiment:
                if item.get("ticker") == ticker:
                    return JSONResponse(content={"score": item.get("sentiment_score"), "summary": item.get("summary")})
        except json.JSONDecodeError:
            logger.error("Error decoding sentiment_analysis_data from cache.")

    raise HTTPException(status_code=404, detail=f"Sentiment analysis not found for {ticker}")

@app.get("/api/get_full_cache")
async def get_full_cache():
    return JSONResponse(content=get_cache())
