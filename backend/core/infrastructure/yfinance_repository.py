import yfinance as yf
import os
import json
from datetime import datetime, timedelta
from ..entities.models import Company
from backend.logger import logger

YFINANCE_CACHE_DIR = "./data/cache/yfinance_data"
CACHE_DURATION_HOURS = 24 # Cache data for 24 hours

def _get_cache_file_path(ticker: str) -> str:
    os.makedirs(YFINANCE_CACHE_DIR, exist_ok=True)
    return os.path.join(YFINANCE_CACHE_DIR, f"{ticker.upper()}.json")

def _read_yfinance_cache(ticker: str) -> dict | None:
    file_path = _get_cache_file_path(ticker)
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
            timestamp = datetime.fromisoformat(data["timestamp"])
            if datetime.now() - timestamp < timedelta(hours=CACHE_DURATION_HOURS):
                logger.info(f"Returning cached Yahoo Finance data for {ticker}")
                return data["data"]
            else:
                logger.info(f"Cached Yahoo Finance data for {ticker} is expired.")
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(f"Error reading or parsing cache for {ticker}: {e}")
        # If there's an error or cache is expired, delete it to force fresh fetch
        os.remove(file_path)
    return None

def _write_yfinance_cache(ticker: str, data: dict):
    file_path = _get_cache_file_path(ticker)
    with open(file_path, "w") as f:
        json.dump({"timestamp": datetime.now().isoformat(), "data": data}, f, indent=4)
    logger.info(f"Cached Yahoo Finance data for {ticker}")

class YahooFinanceRepository:
    def get_ticker(self, ticker: str):
        return yf.Ticker(ticker)

    def get_company_info(self, ticker_obj) -> Company:
        info = ticker_obj.info
        return Company(
            ticker=ticker_obj.ticker,
            name=info.get("longName"),
            industry=info.get("industry"),
            story=info.get("longBusinessSummary"),
        )

    def get_all_data(self, ticker: str):
        # Try to read from cache first
        cached_data = _read_yfinance_cache(ticker)
        if cached_data:
            return cached_data

        # If not in cache or expired, fetch from yfinance
        ticker_obj = self.get_ticker(ticker)
        info = ticker_obj.info
        if not info:
            logger.warning(f"No information found for ticker {ticker_obj.ticker}")
            return None

        data = {
            "info": info,
            "financials": ticker_obj.financials.to_json(),
            "balance_sheet": ticker_obj.balance_sheet.to_json(),
            "cashflow": ticker_obj.cashflow.to_json(),
            "quarterly_financials": ticker_obj.quarterly_financials.to_json(),
            "insider_transactions": ticker_obj.insider_transactions.to_json(),
            "history": ticker_obj.history(period="1y").to_json(),
            "market_cap": info.get("marketCap"),
            "trailing_pe": info.get("trailingPE"),
        }
        _write_yfinance_cache(ticker, data)
        return data
