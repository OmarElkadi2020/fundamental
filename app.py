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
CACHE_FILE = "./knowladgebase/cache/spa_analysis_cache.json"

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

from stock_selection_framework.application.services import VettingService

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    app.state.vetting_service = VettingService()
    yield
    logger.info("Shutting down application...")

app = FastAPI(lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="static/frontend/build/static"), name="static")

# Configure Jinja2Templates
templates = Jinja2Templates(directory="static/frontend/build")

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
    vetting_service = request.app.state.vetting_service

    cache = get_cache()

    if use_cache and step in cache:
        cached_data = cache[step]
        # Optional: Check for age of cache and decide if it's too old
        return {"status": "cached", "step": step, "data": cached_data['data']}

    try:
        logger.info(f"Running analysis step: {step} (Use Cache: {use_cache})")
        if step == "idea_generation":
            result = vetting_service.ai_service.generate_stock_ideas(count=100)
        elif step == "filtering":
            if not payload or 'ideas' not in payload:
                logger.error("Payload with ideas is required for filtering step.")
                raise HTTPException(status_code=400, detail="Payload with ideas is required for filtering step.")
            result = vetting_service.ai_service.filter_stock_ideas(stock_ideas=payload['ideas'], count=50)
        # Add other steps here (categorization, vetting) as they are implemented
        # elif step == "categorization":
        #     result = ...
        # elif step == "vetting":
        #     result = ...
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

@app.get("/api/vet_stock/{ticker}")
async def vet_stock(ticker: str, request: Request):
    vetting_service = request.app.state.vetting_service
    try:
        logger.info(f"Vetting stock: {ticker}")
        result = vetting_service.vet_candidate(ticker)
        logger.info(f"Successfully vetted stock: {ticker}")
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"An error occurred during stock vetting for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
