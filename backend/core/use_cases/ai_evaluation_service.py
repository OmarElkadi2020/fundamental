import os
import google.generativeai as genai
import json

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
                print(f"gemini-2.5-pro not available or failed to load: {e}. Falling back to gemini-2.5-flash.")
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.model_name = 'gemini-2.5-flash'

    def _generate_content(self, prompt: str) -> dict:
        self._initialize_model()
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            print(f"Gemini API raw response.text: {response_text}") # For debugging

            try:
                # Attempt to parse as JSON
                json_content = json.loads(response_text)
                # Basic validation for idea_generation structure
                if isinstance(json_content, list) and all(isinstance(item, dict) and "ticker" in item and "reason" in item for item in json_content):
                    return {"content": json_content, "model_name": self.model_name, "format": "json"}
                else:
                    print("Warning: AI response is JSON but does not match expected structure. Returning raw text.")
                    return {"content": response_text, "model_name": self.model_name, "format": "text"}
            except json.JSONDecodeError:
                print("Warning: AI response is not valid JSON. Returning raw text.")
                return {"content": response_text, "model_name": self.model_name, "format": "text"}
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return {"content": f"AI evaluation failed: {e}", "model_name": self.model_name, "format": "error"}

    def generate_ideas_scuttlebutt(self, count: int = 150) -> dict:
        prompt = f"""
        As an expert stock analyst specializing in the 'Scuttlebutt' methodology of Philip Fisher and Peter Lynch, generate a list of {count} public companies that are showing strong qualitative signals of success or significant operational change. For each company, provide a 1-2 sentence justification based on factors like positive customer reviews, high employee morale, new product buzz, industry disruption, or signs of a potential corporate turnaround. The list should be diverse but include companies that could potentially be classified as 'Fast Growers' or 'Turnarounds'.

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
        # for now, let's just pass the tickers and assume the AI has access to the data
        tickers = [data['ticker'] for data in fast_growers_data]
        tickers_str = ", ".join(tickers)
        prompt = f"""
        Present the results as a JSON array of objects. Each object should represent a stock and include its 'ticker' and a 'vetting_results' object containing the scores/pass-fail ratings for each criterion.

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

        Stocks: {tickers_str}
        """
        return self._generate_content(prompt)

    def vet_turnarounds(self, turnarounds_data: list[dict]) -> dict:
        # turnarounds_data is a list of dictionaries, each containing ticker and relevant financial info
        # for now, let's just pass the tickers and assume the AI has access to the data
        tickers = [data['ticker'] for data in turnarounds_data]
        tickers_str = ", ".join(tickers)
        prompt = f"""
        Present the results as a JSON array of objects. Each object should represent a stock and include its 'ticker' and a 'vetting_results' object containing the analysis for each factor.

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

        Stocks: {tickers_str}
        """
        return self._generate_content(prompt)

    def analyze_sentiment(self, stocks_list: list[str]) -> dict:
        stocks_str = ", ".join(stocks_list)
        prompt = f"""
        Present the results as a JSON array of objects. Each object should have a 'ticker' (string), 'sentiment_score' (float, e.g., -1.0 to 1.0), and 'summary' (string, brief summary of narratives).

        Example format:
        [
          {"ticker": "AAPL", "sentiment_score": 0.75, "summary": "Positive buzz around new product launches and strong sales."},
          {"ticker": "MSFT", "sentiment_score": 0.6, "summary": "Enterprise clients praising cloud solutions and AI integration."}
        ]

        Stocks: {stocks_str}
        """
        return self._generate_content(prompt)

    def final_selection_synthesis(self, fast_growers_vetted: list[dict], turnarounds_vetted: list[dict], sentiment_analysis_results: dict) -> dict:
        # This prompt will need to be carefully constructed to pass all the necessary data
        # For now, let's just pass the tickers and indicate the data is available
        fast_growers_tickers = [fg['ticker'] for fg in fast_growers_vetted]
        turnarounds_tickers = [t['ticker'] for t in turnarounds_vetted]

        prompt = f"""
        You are a master portfolio manager synthesizing the analysis from the previous steps. You have two lists: vetted Fast Growers ({', '.join(fast_growers_tickers)}) and vetted Turnarounds ({', '.join(turnarounds_tickers)}), along with their sentiment analysis scores (provided separately). Your task is to select the **absolute best 10 investment opportunities** from these combined lists.

        Your selection should be a mix of both categories, but weighted towards the highest conviction ideas regardless of category, using the sentiment analysis as a key tie-breaker or confirmation signal. For each of your 10 selections, provide:
        1.  **Ticker**
        2.  **Company Name**
        3.  **Category (Fast Grower or Turnaround)**
        4.  **A concise (3-5 sentence) investment thesis** explaining *why* it is a top pick, integrating the qualitative story, the quantitative data, the sentiment analysis, and the specific category criteria.

        The final output should be a JSON array of objects, each representing one of the 10 selected stocks. Each object should have the following keys:
        - "ticker" (string)
        - "company_name" (string)
        - "category" (string, either "Fast Grower" or "Turnaround")
        - "investment_thesis" (string, 3-5 sentences)

        Example format:
        [
          {
            "ticker": "NVDA",
            "company_name": "NVIDIA Corporation",
            "category": "Fast Grower",
            "investment_thesis": "NVIDIA continues to dominate the AI chip market..."
          },
          {
            "ticker": "SMCI",
            "company_name": "Super Micro Computer, Inc.",
            "category": "Fast Grower",
            "investment_thesis": "SMCI is a key beneficiary of the AI infrastructure buildout..."
          }
        ]
        """
        return self._generate_content(prompt)
