import unittest
import yfinance as yf
from backend.core.infrastructure.yfinance_repository import YahooFinanceRepository
from backend.core.entities.models import Company

class TestYahooFinanceRepository(unittest.TestCase):

    def setUp(self):
        self.repo = YahooFinanceRepository()
        self.test_ticker = "AAPL" # Using a well-known ticker for testing

    def test_get_company_info(self):
        ticker_obj = self.repo.get_ticker(self.test_ticker)
        company_info = self.repo.get_company_info(ticker_obj)

        self.assertIsInstance(company_info, Company)
        self.assertEqual(company_info.ticker, self.test_ticker)
        self.assertIsNotNone(company_info.name)
        self.assertIsInstance(company_info.name, str)
        self.assertIsNotNone(company_info.industry)
        self.assertIsInstance(company_info.industry, str)

    def test_get_all_data(self):
        all_data = self.repo.get_all_data(self.test_ticker)

        self.assertIsNotNone(all_data)
        self.assertIsInstance(all_data, dict)

        self.assertIn("info", all_data)
        self.assertIsInstance(all_data["info"], dict)
        self.assertGreater(len(all_data["info"]), 0)

        self.assertIn("financials", all_data)
        self.assertIsNotNone(all_data["financials"])

        self.assertIn("history", all_data)
        self.assertIsNotNone(all_data["history"])
        self.assertFalse(all_data["history"].empty)

        # Check for some specific keys in info to ensure data richness
        self.assertIn("longName", all_data["info"])
        self.assertIn("marketCap", all_data["info"])
        self.assertIn("trailingPE", all_data["info"])

if __name__ == '__main__':
    unittest.main()
