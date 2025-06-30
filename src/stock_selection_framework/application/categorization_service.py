from ..domain.models import InvestmentCandidate

class CategorizationService:
    def categorize(self, data: dict) -> str:
        """
        Categorizes a stock based on simplified metrics.
        This is a placeholder for a more sophisticated model.
        """
        info = data.get("info", {})
        growth = info.get("revenueGrowth", 0)
        pe_ratio = info.get("trailingPE")

        if not pe_ratio or pe_ratio > 40:
            return "Turnaround or Asset Play"
        if growth > 0.20:
            return "Fast Grower"
        elif growth > 0.10:
            return "Stalwart"
        elif growth > 0:
            return "Slow Grower"
        else:
            return "Cyclical"
