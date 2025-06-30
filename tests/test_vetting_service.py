import unittest
from unittest.mock import MagicMock, patch
import os
import sys
from io import StringIO
import pandas as pd

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from stock_selection_framework.application.services import VettingService
from stock_selection_framework.domain.models import Company, InvestmentCandidate

class TestVettingService(unittest.TestCase):

    @patch('stock_selection_framework.infrastructure.yfinance_repository.YahooFinanceRepository')
    @patch('stock_selection_framework.infrastructure.economic_data_repository.EconomicDataRepository')
    @patch('stock_selection_framework.application.categorization_service.CategorizationService')
    def test_vet_candidate_attractive(self, MockCategorizationService, MockEconomicDataRepository, MockYahooFinanceRepository):
        # Arrange
        mock_repo_instance = MockYahooFinanceRepository.return_value
        mock_repo_instance.get_company_info.return_value = Company(
            ticker='GOOD', name='Good Company Inc.', industry='Technology'
        )
        mock_repo_instance.get_all_data.return_value = {
            'info': {
                'pegRatio': 0.8,
                'trailingEps': 10.0,
                'forwardEps': 12.0,
                'netSharePurchaseActivity': {'buyInfoCount': 1},
                'longName': 'Good Company Inc.',
                'longBusinessSummary': 'Summary of Good Company Inc.',
                'earningsQuarterlyGrowth': 0.3,
                'revenueGrowth': 0.3,
                'returnOnEquity': 0.2,
                'heldPercentInstitutions': 0.4,
                'debtToEquity': 0.3
            },
            'history': pd.DataFrame({'Close': [10, 11, 12], 'High': [15, 16, 17], 'Volume': [100, 200, 300]})
        }

        service = VettingService()
        service.yfinance_repo = mock_repo_instance
        service.categorization_service = MockCategorizationService.return_value
        service.categorization_service.categorize.return_value = "Growth Stock"
        service.economic_repo = MockEconomicDataRepository.return_value
        service.economic_repo.get_market_direction.return_value = "Uptrend"

        # Act
        results = service.vet_candidate('GOOD')

        # Assert
        self.assertEqual(results["ticker"], "GOOD")
        self.assertEqual(results["company_name"], "Good Company Inc.")
        self.assertEqual(results["category"], "Growth Stock")
        self.assertTrue(results["lynch_criteria"]["PEG Ratio"]["pass"])
        self.assertTrue(results["lynch_criteria"]["Insider Buying"]["pass"])
        self.assertTrue(results["canslim_criteria"]["Quarterly EPS Growth"]["pass"])

    @patch('stock_selection_framework.infrastructure.yfinance_repository.YahooFinanceRepository')
    @patch('stock_selection_framework.infrastructure.economic_data_repository.EconomicDataRepository')
    @patch('stock_selection_framework.application.categorization_service.CategorizationService')
    def test_vet_candidate_unattractive(self, MockCategorizationService, MockEconomicDataRepository, MockYahooFinanceRepository):
        # Arrange
        mock_repo_instance = MockYahooFinanceRepository.return_value
        mock_repo_instance.get_company_info.return_value = Company(
            ticker='BAD', name='Bad Company Inc.', industry='Technology'
        )
        mock_repo_instance.get_all_data.return_value = {
            'info': {
                'pegRatio': 2.5,
                'trailingEps': 10.0,
                'forwardEps': 9.0,
                'netSharePurchaseActivity': {'buyInfoCount': 0},
                'longName': 'Bad Company Inc.',
                'longBusinessSummary': 'Summary of Bad Company Inc.',
                'earningsQuarterlyGrowth': 0.1,
                'revenueGrowth': 0.1,
                'returnOnEquity': 0.1,
                'heldPercentInstitutions': 0.2,
                'debtToEquity': 0.6
            },
            'history': pd.DataFrame({'Close': [10, 11, 12], 'High': [15, 16, 17], 'Volume': [100, 200, 300]})
        }

        service = VettingService()
        service.yfinance_repo = mock_repo_instance
        service.categorization_service = MockCategorizationService.return_value
        service.categorization_service.categorize.return_value = "Value Stock"
        service.economic_repo = MockEconomicDataRepository.return_value
        service.economic_repo.get_market_direction.return_value = "Downtrend"

        # Act
        results = service.vet_candidate('BAD')

        # Assert
        self.assertEqual(results["ticker"], "BAD")
        self.assertEqual(results["company_name"], "Bad Company Inc.")
        self.assertEqual(results["category"], "Value Stock")
        self.assertFalse(results["lynch_criteria"]["PEG Ratio"]["pass"])
        self.assertFalse(results["lynch_criteria"]["Insider Buying"]["pass"])
        self.assertFalse(results["canslim_criteria"]["Quarterly EPS Growth"]["pass"])

    @patch('stock_selection_framework.infrastructure.yfinance_repository.YahooFinanceRepository')
    @patch('stock_selection_framework.infrastructure.economic_data_repository.EconomicDataRepository')
    @patch('stock_selection_framework.application.categorization_service.CategorizationService')
    def test_vet_canslim_criteria_edge_cases(self, MockCategorizationService, MockEconomicDataRepository, MockYahooFinanceRepository):
        # Arrange
        mock_yfinance_repo_instance = MockYahooFinanceRepository.return_value
        mock_economic_repo_instance = MockEconomicDataRepository.return_value
        mock_categorization_service_instance = MockCategorizationService.return_value

        service = VettingService()
        service.yfinance_repo = mock_yfinance_repo_instance
        service.economic_repo = mock_economic_repo_instance
        service.categorization_service = mock_categorization_service_instance

        # Mock economic data for market direction
        mock_economic_repo_instance.get_market_direction.return_value = "Uptrend"

        # Test case 1: All zero values for history-related metrics
        info_zero = {
            "earningsQuarterlyGrowth": 0.3,
            "revenueGrowth": 0.3,
            "returnOnEquity": 0.2,
            "heldPercentInstitutions": 0.4
        }
        data_zero = {
            "history": pd.DataFrame({
                'Close': [0, 0, 0],
                'High': [0, 0, 0],
                'Volume': [0, 0, 0]
            })
        }
        canslim_results_zero = service._vet_canslim_criteria(info_zero, data_zero)
        self.assertEqual(canslim_results_zero["52-Week High Status"]["value"], "0.00%")
        self.assertEqual(canslim_results_zero["Volume vs. Avg"]["value"], "0.00%")

        # Test case 2: Non-zero values for history-related metrics
        info_non_zero = {
            "earningsQuarterlyGrowth": 0.3,
            "revenueGrowth": 0.3,
            "returnOnEquity": 0.2,
            "heldPercentInstitutions": 0.4
        }
        data_non_zero = {
            "history": pd.DataFrame({
                'Close': [10, 11, 12],
                'High': [15, 16, 17],
                'Volume': [100, 200, 300]
            })
        }
        canslim_results_non_zero = service._vet_canslim_criteria(info_non_zero, data_non_zero)
        self.assertNotEqual(canslim_results_non_zero["52-Week High Status"]["value"], "0.00%")
        self.assertNotEqual(canslim_results_non_zero["Volume vs. Avg"]["value"], "0.00%")

        # Test case 3: Empty history
        info_empty_history = {
            "earningsQuarterlyGrowth": 0.3,
            "revenueGrowth": 0.3,
            "returnOnEquity": 0.2,
            "heldPercentInstitutions": 0.4
        }
        data_empty_history = {
            "history": pd.DataFrame()
        }
        canslim_results_empty = service._vet_canslim_criteria(info_empty_history, data_empty_history)
        self.assertEqual(canslim_results_empty["52-Week High Status"]["value"], "0.00%")
        self.assertEqual(canslim_results_empty["Volume vs. Avg"]["value"], "0.00%")

if __name__ == '__main__':
    unittest.main()
