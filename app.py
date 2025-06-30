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

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from src.logger import logger

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

from src.core.use_cases.ai_evaluation_service import AIEvaluationService

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    app.state.ai_service = AIEvaluationService()
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

@app.post("/api/run_analysis_step")
async def run_analysis_step(request: Request):
    body = await request.json()
    step = body.get("step")
    use_cache = body.get("use_cache", True)
    payload = body.get("payload")
    ai_service = request.app.state.ai_service

    cache = get_cache()

    if use_cache and step in cache:
        cached_data = cache[step]
        # Optional: Check for age of cache and decide if it's too old
        return {"status": "cached", "step": step, "data": cached_data['data']}

    try:
        logger.info(f"Running analysis step: {step} (Use Cache: {use_cache})")
        result = None
        if step == "idea_generation":
            count = payload.get("count", 150)
            result = ai_service.generate_ideas_scuttlebutt(count=count)
        elif step == "categorization_triage":
            companies_list = payload.get("companies_list")
            if not companies_list:
                raise HTTPException(status_code=400, detail="companies_list is required for categorization_triage step.")
            result = ai_service.categorize_and_filter_lynch(companies_list=companies_list)
        elif step == "vetting_fast_growers":
            fast_growers_data = payload.get("fast_growers_data")
            if not fast_growers_data:
                raise HTTPException(status_code=400, detail="fast_growers_data is required for vetting_fast_growers step.")
            result = ai_service.vet_fast_growers(fast_growers_data=fast_growers_data)
        elif step == "vetting_turnarounds":
            turnarounds_data = payload.get("turnarounds_data")
            if not turnarounds_data:
                raise HTTPException(status_code=400, detail="turnarounds_data is required for vetting_turnarounds step.")
            result = ai_service.vet_turnarounds(turnarounds_data=turnarounds_data)
        elif step == "sentiment_analysis":
            stocks_list = payload.get("stocks_list")
            if not stocks_list:
                raise HTTPException(status_code=400, detail="stocks_list is required for sentiment_analysis step.")
            result = ai_service.analyze_sentiment(stocks_list=stocks_list)
        elif step == "final_selection_synthesis":
            fast_growers_vetted = payload.get("fast_growers_vetted")
            turnarounds_vetted = payload.get("turnarounds_vetted")
            sentiment_analysis_results = payload.get("sentiment_analysis_results")
            if not fast_growers_vetted or not turnarounds_vetted or not sentiment_analysis_results:
                raise HTTPException(status_code=400, detail="All vetting and sentiment results are required for final_selection_synthesis step.")
            result = ai_service.final_selection_synthesis(
                fast_growers_vetted=fast_growers_vetted,
                turnarounds_vetted=turnarounds_vetted,
                sentiment_analysis_results=sentiment_analysis_results
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

@app.get("/api/get_full_cache")
async def get_full_cache():
    return JSONResponse(content=get_cache())
