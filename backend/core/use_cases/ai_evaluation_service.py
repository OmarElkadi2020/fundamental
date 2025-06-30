import os
import google.generativeai as genai
import json
import re
from backend.logger import logger

def _extract_json_from_text(text_content: str) -> str:
    """Extracts a JSON string from a text, handling markdown code blocks."""
    json_match = re.search(r"```json\n([\s\S]*?)\n```", text_content)
    if json_match:
        return json_match.group(1)
    # If no markdown json block, assume the whole content might be JSON
    return text_content

class AIEvaluationService:

    def __init__(self):
        self.model = None
        self.model_name = None

    def _initialize_model(self):
        if self.model is None:
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            try:
                self.model = genai.GenerativeModel('gemini-2.5-pro')
                self.model_name = 'gemini-2.5-pro'
                # A quick test to see if the model is actually available for content generation
                self.model.generate_content("test", stream=False)
            except Exception as e:
                logger.warning(f"gemini-2.5-pro not available or failed to load: {e}. Falling back to gemini-2.5-flash.")
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.model_name = 'gemini-2.5-flash'

    def _generate_content(self, prompt: str) -> dict:
        self._initialize_model()
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            logger.debug(f"Gemini API raw response.text: {response_text}") # For debugging

            try:
                # Attempt to parse as JSON
                json_content = json.loads(response_text)
                return {"content": json_content, "model_name": self.model_name, "format": "json"}
            except json.JSONDecodeError:
                logger.warning("Warning: AI response is not valid JSON. Returning raw text.")
                return {"content": response_text, "model_name": self.model_name, "format": "text"}
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return {"content": f"AI evaluation failed: {e}", "model_name": self.model_name, "format": "error"}

    def generate_ideas_scuttlebutt(self, count: int = 150) -> dict:
        prompt = f"""
        As an expert stock analyst specializing in the 'Scuttlebutt' methodology of Philip Fisher and Peter Lynch, generate a list of {count} public companies that are showing strong qualitative signals of success or significant operational change. For each company, provide a 1-2 sentence justification based on factors like positive customer reviews, high employee morale, new product buzz, industry disruption, or signs of a potential corporate turnaround.

        Present your findings as a JSON array of objects. Each object should have two keys: "ticker" (string, for the stock ticker) and "reason" (string, for the 1-2 sentence justification).
        Example format:
        [
            {{"ticker": "AAPL", "reason": "Strong customer loyalty for new iPhone. Positive employee reviews on Glassdoor."}},
            {{"ticker": "MSFT", "reason": "Enterprise clients praising cloud solutions. Growing developer community."}}
        ]
        """
        return self._generate_content(prompt)

    def categorize_and_filter_lynch(self, companies_list: list[str]) -> dict:
        companies_str = "\n".join(companies_list)
        prompt = f"""
        You are an AI analyst trained in Peter Lynch's stock categorization methods. Given the following list of {len(companies_list)} companies, analyze each one and classify it into one of the six Lynch categories: Slow Grower, Stalwart, Fast Grower, Cyclical, Turnaround, or Asset Play. Provide a brief justification for your classification. After categorizing all of them, return a filtered list containing *only* the companies classified as **Fast Grower** or **Turnaround**.

        Present the filtered list as a JSON object with two keys: "fast_growers" and "turnarounds". Each key should contain a JSON array of objects. Each object in these arrays should have two keys: "ticker" (string) and "justification" (string).

        Example format:
        {{
          "fast_growers": [
            {{"ticker": "NVDA", "justification": "Leader in AI chips."}},
            {{"ticker": "SMCI", "justification": "Rapidly expanding server infrastructure."}}
          ],
          "turnarounds": [
            {{"ticker": "CCL", "justification": "Recovering from pandemic impact."}},
            {{"ticker": "BA", "justification": "Addressing operational issues."}}
          ]
        }}

        Companies list:
        {companies_str}
        """
        return self._generate_content(prompt)

    def vet_fast_growers(self, fast_growers_data: list[dict]) -> dict:
        # fast_growers_data is a list of dictionaries, each containing ticker and relevant financial info
        # including initial vetting results from categorization.
        fast_growers_str = json.dumps(fast_growers_data, indent=2)
        prompt = f"""
        You are an expert stock analyst specializing in rigorous vetting of 'Fast Growers'.
        Given the following list of fast-growing companies, which includes their tickers and any initial vetting results:
        {fast_growers_str}

        For each company, perform a rigorous vetting based on typical 'Fast Grower' criteria (e.g., consistent EPS growth, sales growth, new products/management/highs, strong institutional sponsorship, market leadership, sound balance sheet). If initial vetting results are provided, use them as a starting point and refine or expand upon them. If no initial results are provided, generate them from scratch.

        Present the results as a JSON array of objects. Each object should represent a stock and include its 'ticker' and a 'vetting_results' object containing the scores/pass-fail ratings for each criterion. Ensure all relevant criteria are covered.

        Example format:
        [
          {{
            "ticker": "AAPL",
            "vetting_results": {{
              "Current Quarterly EPS Growth": {{"score": 8, "pass": true}},
              "Annual EPS Growth": {{"score": 7, "pass": true}},
              "New Highs": {{"score": 9, "pass": true}},
              "Leader": {{"score": 8, "pass": true}},
              "Institutional Sponsorship": {{"score": 7, "pass": true}},
              "PEG Ratio": {{"score": 9, "pass": true}},
              "Balance Sheet": {{"score": 8, "pass": true}}
            }}
          }}
        ]
        """
        return self._generate_content(prompt)

    def vet_turnarounds(self, turnarounds_data: list[dict]) -> dict:
        # turnarounds_data is a list of dictionaries, each containing ticker and relevant financial info
        # including initial vetting results from categorization.
        turnarounds_str = json.dumps(turnarounds_data, indent=2)
        prompt = f"""
        You are an expert stock analyst specializing in rigorous vetting of 'Turnarounds'.
        Given the following list of turnaround companies, which includes their tickers and any initial vetting results:
        {turnarounds_str}

        For each company, perform a rigorous vetting based on typical 'Turnaround' criteria (e.g., nature of the turnaround, balance sheet strength, insider buying, early signs of success, O'Neil's 'N' for new). If initial vetting results are provided, use them as a starting point and refine or expand upon them. If no initial results are provided, generate them from scratch.

        Present the results as a JSON array of objects. Each object should represent a stock and include its 'ticker' and a 'vetting_results' object containing the analysis for each factor. Ensure all relevant criteria are covered.

        Example format:
        [
          {{
            "ticker": "CCL",
            "vetting_results": {{
              "Nature of the Turnaround": "Recovering from pandemic, managing debt.",
              "Balance Sheet Strength": "Improving cash flow, still high debt.",
              "Insider Buying": "Some insider buying observed.",
              "Early Signs of Success": "Increased bookings, positive sentiment.",
              "O'Neil's 'N' (New)": "New itineraries and marketing strategies."
            }}
          }}
        ]
        """
        return self._generate_content(prompt)

    def analyze_sentiment(self, stocks_list: list[str]) -> dict:
        stocks_str = ", ".join(stocks_list)
        prompt = f"""
        Present the results as a JSON array of objects. Each object should have a 'ticker' (string), 'sentiment_score' (float, e.g., -1.0 to 1.0), and 'summary' (string, brief summary of narratives).

        Example format:
        [
          {{"ticker": "AAPL", "sentiment_score": 0.75, "summary": "Positive buzz around new product launches and strong sales."}},
          {{"ticker": "MSFT", "sentiment_score": 0.6, "summary": "Enterprise clients praising cloud solutions and AI integration."}}
        ]

        Stocks: {stocks_str}
        """
        return self._generate_content(prompt)

    def final_selection_synthesis(self, fast_growers_vetted: list[dict], turnarounds_vetted: list[dict], sentiment_analysis_results: dict) -> dict:
        # Prepare detailed data for the prompt
        all_vetted_stocks_data = {}
        for stock in fast_growers_vetted:
            all_vetted_stocks_data[stock['ticker']] = {
                'category': 'Fast Grower',
                'vetting_result': stock.get('vetting_result', {}),
                'sentiment': {} # Will be populated below
            }
        for stock in turnarounds_vetted:
            all_vetted_stocks_data[stock['ticker']] = {
                'category': 'Turnaround',
                'vetting_result': stock.get('vetting_result', {}),
                'sentiment': {} # Will be populated below
            }

        # Populate sentiment data
        parsed_sentiment_content = []
        try:
            json_string = _extract_json_from_text(sentiment_analysis_results['content'])
            if not json_string.strip(): # Check if the extracted string is empty or just whitespace
                logger.warning("Extracted sentiment JSON string is empty.")
            else:
                parsed_sentiment_content = json.loads(json_string)
                logger.debug(f"Parsed sentiment content: {parsed_sentiment_content}")
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing sentiment_analysis_results['content'] as JSON: {e}")
        except Exception as e:
            logger.error(f"Unexpected error extracting or parsing sentiment JSON: {e}")

        # Create a dictionary for quick lookup of sentiment data by ticker
        sentiment_lookup = {item.get('ticker'): item for item in parsed_sentiment_content if item.get('ticker')}

        for ticker, data in all_vetted_stocks_data.items():
            sentiment_item = sentiment_lookup.get(ticker)
            if sentiment_item:
                data['sentiment'] = {
                    'score': sentiment_item.get('sentiment_score'),
                    'summary': sentiment_item.get('summary')
                }
            else:
                logger.warning(f"Sentiment data not found for ticker: {ticker}")
                data['sentiment'] = {'score': None, 'summary': 'N/A'} # Initialize with N/A if not found

        # Convert to a list for the prompt
        detailed_stocks_for_prompt = []
        for ticker, data in all_vetted_stocks_data.items():
            detailed_stocks_for_prompt.append({
                'ticker': ticker,
                'category': data['category'],
                'vetting_result': data['vetting_result'],
                'sentiment': data['sentiment']
            })

        # Convert to string for the prompt
        detailed_stocks_str = json.dumps(detailed_stocks_for_prompt, indent=2)

        prompt = f"""
        You are a master portfolio manager synthesizing the analysis from the previous steps. You have the following detailed data for vetted stocks:
        {detailed_stocks_str}

        Your task is to select the **absolute best 10 investment opportunities** from these combined lists.

        Your selection should be a mix of both categories, but weighted towards the highest conviction ideas regardless of category. The detailed sentiment analysis (score, narratives, and drivers) should be a key factor in your decision-making, acting as a powerful confirmation signal or a critical red flag. For each of your 10 selections, provide:
        1.  **Ticker**
        2.  **Company Name** (You will need to infer this from the ticker or use external knowledge if not provided in the detailed data)
        3.  **Category (Fast Grower or Turnaround)**
        4.  **A concise (3-5 sentence) investment thesis** explaining *why* it is a top pick, integrating the qualitative story, the quantitative data, the sentiment analysis, and the specific category criteria.
        5.  **Vetting Results:** Include the detailed vetting results (e.g., CAN SLIM criteria for Fast Growers, Turnaround factors for Turnarounds) that were provided in the input data for this stock.
        6.  **Sentiment Analysis:** Include the sentiment score and summary for this stock.

        The final output should be a JSON array of objects, each representing one of the 10 selected stocks. Each object should have the following keys:
        - "ticker" (string)
        - "company_name" (string)
        - "category" (string, either "Fast Grower" or "Turnaround")
        - "investment_thesis" (string, 3-5 sentences)
        - "can_slim_results" (object, containing both the detailed vetting criteria and the CAN SLIM analysis)
        - "sentiment_analysis" (object, containing "score" and "summary")

        Example format:
        ```json
        [
          {{
            "ticker": "NVDA",
            "company_name": "NVIDIA Corporation",
            "category": "Fast Grower",
            "investment_thesis": "NVIDIA continues to dominate the AI chip market due to its strong innovation in GPU technology. The recent sentiment analysis shows highly positive buzz around its new product launches, confirming strong market reception and investor confidence.",
            "can_slim_results": {{
              "Current Quarterly EPS Growth": {{"score": 8, "pass": true}},
              "Annual EPS Growth": {{"score": 7, "pass": true}},
              "New Highs": {{"score": 9, "pass": true}},
              "Leader": {{"score": 8, "pass": true}},
              "Institutional Sponsorship": {{"score": 7, "pass": true}},
              "PEG Ratio": {{"score": 9, "pass": true}},
              "Balance Sheet": {{"score": 8, "pass": true}},
              "C": "Current Quarterly EPS Growth: Strong, consistently exceeding expectations.",
              "A": "Annual EPS Growth: Excellent, with multi-year sustained growth.",
              "N": "New Products, New Management, New Highs: Constantly innovating with new AI chips, strong leadership, and hitting new price highs.",
              "S": "Supply and Demand: High demand for chips, limited supply, driving prices up.",
              "L": "Leader or Laggard: Clear market leader in AI and GPUs.",
              "I": "Institutional Sponsorship: Strong and increasing institutional ownership.",
              "M": "Market Direction: Aligned with a strong bull market in technology."
            }},
            "sentiment_analysis": {{
              "score": 0.85,
              "summary": "Overwhelmingly positive sentiment driven by strong earnings, AI leadership, and new product announcements."
            }}
          }},
          {{
            "ticker": "SMCI",
            "company_name": "Super Micro Computer, Inc.",
            "category": "Fast Grower",
            "investment_thesis": "SMCI is a key beneficiary of the AI infrastructure buildout, providing essential server and storage solutions. Sentiment analysis indicates a positive narrative driven by increasing demand for its specialized hardware, reinforcing its position as a top pick.",
            "can_slim_results": {{
              "Current Quarterly EPS Growth": {{"score": 9, "pass": true}},
              "Annual EPS Growth": {{"score": 8, "pass": true}},
              "New Highs": {{"score": 7, "pass": true}},
              "Leader": {{"score": 8, "pass": true}},
              "Institutional Sponsorship": {{"score": 6, "pass": true}},
              "PEG Ratio": {{"score": 8, "pass": true}},
              "Balance Sheet": {{"score": 7, "pass": true}},
              "C": "Current Quarterly EPS Growth: Very strong, driven by AI server demand.",
              "A": "Annual EPS Growth: Significant, with accelerating growth trends.",
              "N": "New Products, New Management, New Highs: Rapidly deploying new liquid-cooled server solutions, benefiting from new AI trends, and hitting new highs.",
              "S": "Supply and Demand: High demand for specialized AI servers, tight supply.",
              "L": "Leader or Laggard: Emerging leader in AI server infrastructure.",
              "I": "Institutional Sponsorship: Growing institutional interest and ownership.",
              "M": "Market Direction: Aligned with the strong growth in AI and technology sectors."
            }},
            "sentiment_analysis": {{
              "score": 0.70,
              "summary": "Positive sentiment due to strong demand for AI servers and strategic partnerships."
            }}
          }}
        ]
        ```
        """
        return self._generate_content(prompt)
