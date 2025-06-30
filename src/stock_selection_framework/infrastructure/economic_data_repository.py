import os
from fredapi import Fred
import yfinance as yf

class EconomicDataRepository:
    def __init__(self):
        self.fred = Fred(api_key=os.environ.get("FRED_API_KEY"))

    def get_gdp_growth(self):
        gdp_data = self.fred.get_series('GDPC1')
        gdp_growth = gdp_data.pct_change().iloc[-1] * 100
        return gdp_growth

    def get_interest_rates(self):
        interest_rate_data = self.fred.get_series('FEDFUNDS')
        return interest_rate_data.iloc[-1]

    def get_market_direction(self):
        # Use S&P 500 as a proxy for market direction
        market_data = yf.Ticker("^GSPC").history(period="1y")
        # Simple check: is the 50-day moving average above the 200-day?
        ma50 = market_data['Close'].rolling(window=50).mean().iloc[-1]
        ma200 = market_data['Close'].rolling(window=200).mean().iloc[-1]
        return "Uptrend" if ma50 > ma200 else "Downtrend"
