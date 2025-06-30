import pandas as pd
from backend.core.infrastructure.yfinance_repository import YahooFinanceRepository
from backend.core.infrastructure.economic_data_repository import EconomicDataRepository
from backend.core.use_cases.categorization_service import CategorizationService
from backend.core.entities.models import Company, InvestmentCandidate

class VettingService:
    def __init__(self):
        self.yfinance_repo = YahooFinanceRepository()
        self.economic_repo = EconomicDataRepository()
        self.categorization_service = CategorizationService()

    def vet_candidate(self, ticker: str) -> dict:
        company = self.yfinance_repo.get_company_info(ticker)
        data = self.yfinance_repo.get_all_data(ticker)
        category = self.categorization_service.categorize(data)
        lynch = self._vet_lynch_criteria(data['info'])
        canslim = self._vet_canslim_criteria(data['info'], data)
        return {
            "ticker": ticker,
            "company_name": company.name,
            "category": category,
            "lynch_criteria": lynch,
            "canslim_criteria": canslim,
        }

    def _vet_lynch_criteria(self, info: dict) -> dict:
        peg = info.get('pegRatio')
        insider_count = info.get('netSharePurchaseActivity', {}).get('buyInfoCount', 0)
        return {
            "PEG Ratio": {
                "pass": peg is not None and peg <= 1.5,
                "value": peg,
            },
            "Insider Buying": {
                "pass": insider_count > 0,
                "value": insider_count,
            },
        }

    def _vet_canslim_criteria(self, info: dict, data: dict) -> dict:
        eps_growth = info.get('earningsQuarterlyGrowth', 0)
        history = pd.DataFrame(data.get('history'))
        if history.empty or history['High'].max() == 0 or history['Volume'].mean() == 0:
            high_status = "0.00%"
            volume_status = "0.00%"
        else:
            high_status = f"{(history['Close'].iloc[-1] / history['High'].max() - 1) * 100:.2f}%"
            volume_status = f"{(history['Volume'].iloc[-1] / history['Volume'].mean() - 1) * 100:.2f}%"
        return {
            "Quarterly EPS Growth": {"pass": eps_growth > 0.25},
            "52-Week High Status": {"value": high_status},
            "Volume vs. Avg": {"value": volume_status},
        }
