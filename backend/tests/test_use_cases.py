import unittest
from backend.core.use_cases.categorization_service import CategorizationService
from backend.core.use_cases.screening_service import ScreeningService
from backend.core.use_cases.valuation_service import ValuationService
from backend.core.entities.models import InvestmentCandidate, Company, CriterionCategory

class TestUseCases(unittest.TestCase):

    def setUp(self):
        self.dummy_company = Company(ticker="TEST", name="Test Company", industry="Tech")
        self.dummy_candidate = InvestmentCandidate(company=self.dummy_company)

    def test_categorization_service(self):
        service = CategorizationService()
        # The categorize method in use_cases/categorization_service.py expects a dict
        # Let's create a dummy dict that matches the expected structure
        dummy_data = {
            "info": {
                "revenueGrowth": 0.25, # For Fast Grower
                "trailingPE": 30
            }
        }
        category = service.categorize(dummy_data)
        self.assertEqual(category, "Fast Grower")

        dummy_data_stalwart = {
            "info": {
                "revenueGrowth": 0.15, # For Stalwart
                "trailingPE": 20
            }
        }
        category_stalwart = service.categorize(dummy_data_stalwart)
        self.assertEqual(category_stalwart, "Stalwart")

        dummy_data_slow_grower = {
            "info": {
                "revenueGrowth": 0.05, # For Slow Grower
                "trailingPE": 15
            }
        }
        category_slow_grower = service.categorize(dummy_data_slow_grower)
        self.assertEqual(category_slow_grower, "Slow Grower")

        dummy_data_cyclical = {
            "info": {
                "revenueGrowth": -0.05, # For Cyclical
                "trailingPE": 10
            }
        }
        category_cyclical = service.categorize(dummy_data_cyclical)
        self.assertEqual(category_cyclical, "Cyclical")

        dummy_data_turnaround = {
            "info": {
                "revenueGrowth": 0.0, # For Turnaround or Asset Play
                "trailingPE": 50 # High PE for Turnaround
            }
        }
        category_turnaround = service.categorize(dummy_data_turnaround)
        self.assertEqual(category_turnaround, "Turnaround or Asset Play")

    def test_categorization_service_invalid_data(self):
        service = CategorizationService()
        # Test with missing 'info' key
        dummy_data_missing_info = {}
        category = service.categorize(dummy_data_missing_info)
        self.assertEqual(category, "Turnaround or Asset Play") # Assuming default behavior

        # Test with missing 'revenueGrowth' key
        dummy_data_missing_growth = {
            "info": {
                "trailingPE": 20
            }
        }
        category = service.categorize(dummy_data_missing_growth)
        self.assertEqual(category, "Turnaround or Asset Play") # Assuming default behavior

        # Test with missing 'trailingPE' key
        dummy_data_missing_pe = {
            "info": {
                "revenueGrowth": 0.15
            }
        }
        category = service.categorize(dummy_data_missing_pe)
        self.assertEqual(category, "Turnaround or Asset Play") # Assuming default behavior

        # Test with non-numeric values
        dummy_data_non_numeric = {
            "info": {
                "revenueGrowth": "abc",
                "trailingPE": "xyz"
            }
        }
        category = service.categorize(dummy_data_non_numeric)
        self.assertEqual(category, "Turnaround or Asset Play") # Assuming default behavior


    def test_screening_service(self):
        service = ScreeningService()
        criteria_ids = ["criterion1", "criterion2"]
        result = service.screen(self.dummy_candidate, criteria_ids)
        self.assertTrue(result)

    def test_valuation_service(self):
        service = ValuationService()
        peg_ratio = service.calculate_peg_ratio(self.dummy_candidate)
        self.assertEqual(peg_ratio, 0.9)

if __name__ == '__main__':
    unittest.main()
