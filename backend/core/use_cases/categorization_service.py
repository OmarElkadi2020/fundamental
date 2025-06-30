from ..entities.models import InvestmentCandidate

class CategorizationService:
    def categorize(self, data: dict) -> str:
        """
        Categorizes a stock based on simplified metrics.
        This is a placeholder for a more sophisticated model.
        """
        info = data.get("info", {})
        
        growth = info.get("revenueGrowth")
        try:
            growth = float(growth)
        except (ValueError, TypeError):
            growth = None  # Set to None if not a valid number

        pe_ratio = info.get("trailingPE")
        try:
            pe_ratio = float(pe_ratio)
        except (ValueError, TypeError):
            pe_ratio = None  # Set to None if not a valid number

        # If either growth or pe_ratio is invalid, categorize as "Turnaround or Asset Play"
        if growth is None or pe_ratio is None:
            return "Turnaround or Asset Play"

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
