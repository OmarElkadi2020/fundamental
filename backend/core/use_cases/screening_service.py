from ..entities.models import InvestmentCandidate

class ScreeningService:
    def screen(self, candidate: InvestmentCandidate, criteria_ids: list[str]) -> bool:
        # This service would run quantitative screens.
        # For now, it's a placeholder.
        print(f"Screening {candidate.company.ticker} for {criteria_ids}...")
        return True
