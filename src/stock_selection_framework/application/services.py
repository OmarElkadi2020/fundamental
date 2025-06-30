from .categorization_service import CategorizationService
from .ai_evaluation_service import AIEvaluationService
from ..infrastructure.yfinance_repository import YahooFinanceRepository
from ..infrastructure.economic_data_repository import EconomicDataRepository
import numpy as np

class VettingService:
    def __init__(self):
        self.yfinance_repo = YahooFinanceRepository()
        self.economic_repo = EconomicDataRepository()
        self.categorization_service = CategorizationService()
        self.ai_service = AIEvaluationService()

    def _clean_value(self, value, precision=2):
        if value is None or np.isnan(value):
            return None
        if isinstance(value, (int, float)):
            return round(float(value), precision)
        return value

    def vet_candidate(self, ticker: str):
        data = self.yfinance_repo.get_all_data(ticker)
        info = data.get("info", {})
        history = data.get("history", {})

        category = self.categorization_service.categorize(data)

        lynch_criteria = self._vet_lynch_criteria(info)
        canslim_criteria = self._vet_canslim_criteria(info, data)

        # AI-driven evaluations
        invest_what_you_know_eval = self.ai_service.evaluate_know_principle(ticker, info)
        scuttlebutt_eval = self.ai_service.execute_scuttlebutt(ticker, info)
        lynch_category_ai = self.ai_service.assign_lynch_category(ticker, info)
        growth_potential_triage = self.ai_service.triage_growth_potential(ticker, info)

        return {
            "ticker": ticker,
            "company_name": info.get("longName", "N/A"),
            "category": category,
            "lynch_criteria": lynch_criteria,
            "canslim_criteria": canslim_criteria,
            "ai_evaluations": {
                "invest_what_you_know": invest_what_you_know_eval,
                "scuttlebutt": scuttlebutt_eval,
                "lynch_category_ai": lynch_category_ai,
                "growth_potential_triage": growth_potential_triage,
            }
        }

    def generate_ideas(self) -> dict:
        result = self.ai_service.generate_stock_ideas()
        return {"content": result["content"], "model_name": result["model_name"]}

    def filter_ideas(self, stock_ideas: list[str]) -> dict:
        result = self.ai_service.filter_stock_ideas(stock_ideas)
        return {"content": result["content"], "model_name": result["model_name"]}

    def _vet_lynch_criteria(self, info):
        peg_ratio = self._clean_value(info.get("pegRatio"))
        debt_to_equity = self._clean_value(info.get("debtToEquity"))
        insider_purchases = info.get("netSharePurchaseActivity", {}).get("buyInfoCount", 0) > 0

        return {
            "PEG Ratio": {"pass": peg_ratio is not None and peg_ratio <= 1.0, "value": peg_ratio},
            "Debt/Equity": {"pass": debt_to_equity is not None and debt_to_equity < 0.5, "value": debt_to_equity},
            "Insider Buying": {"pass": insider_purchases, "value": insider_purchases},
        }

    def _vet_canslim_criteria(self, info, data):
        history = data.get("history", {})
        last_close = self._clean_value(history['Close'].iloc[-1]) if not history.empty else 0
        high_52_week = self._clean_value(history['High'].max()) if not history.empty else 0
        avg_volume = self._clean_value(history['Volume'].mean()) if not history.empty else 0
        last_volume = self._clean_value(history['Volume'].iloc[-1]) if not history.empty else 0

        quarterly_growth = self._clean_value(info.get("earningsQuarterlyGrowth"))
        annual_growth = self._clean_value(info.get("revenueGrowth"))
        roe = self._clean_value(info.get("returnOnEquity"))
        institutional_ownership = self._clean_value(info.get("heldPercentInstitutions"))
        market_direction = self.economic_repo.get_market_direction()

        high_52_week_status = (last_close / high_52_week) if high_52_week != 0 and last_close else 0
        volume_status = (last_volume / avg_volume) if avg_volume != 0 and last_volume else 0

        return {
            "Quarterly EPS Growth": {"pass": bool(quarterly_growth is not None and quarterly_growth > 0.25), "value": quarterly_growth},
            "Annual EPS Growth": {"pass": bool(annual_growth is not None and annual_growth > 0.25), "value": annual_growth},
            "Return on Equity (ROE)": {"pass": bool(roe is not None and roe > 0.17), "value": roe},
            "52-Week High Status": {"pass": bool(high_52_week_status > 0.85), "value": f"{high_52_week_status:.2%}"},
            "Volume vs. Avg": {"pass": bool(volume_status > 1.5), "value": f"{volume_status:.2%}"},
            "Institutional Ownership": {"pass": bool(institutional_ownership is not None and institutional_ownership > 0.3), "value": institutional_ownership},
            "Market Direction": {"pass": bool(market_direction == "Uptrend"), "value": market_direction},
        }
