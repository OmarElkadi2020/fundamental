import yfinance as yf
from ..entities.models import Company

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
        ticker_obj = self.get_ticker(ticker)
        info = ticker_obj.info
        if not info:
            print(f"WARNING: No information found for ticker {ticker_obj.ticker}")
            return None

        return {
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
