import os
import google.generativeai as genai

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
            return {"content": response.text, "model_name": self.model_name}
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return {"content": f"AI evaluation failed: {e}", "model_name": self.model_name}

    def generate_ideas_scuttlebutt(self, count: int = 150) -> dict:
        prompt = f"""
        As an expert stock analyst specializing in the 'Scuttlebutt' methodology of Philip Fisher and Peter Lynch, generate a list of {count} public companies that are showing strong qualitative signals of success or significant operational change. For each company, provide a 1-2 sentence justification based on factors like positive customer reviews, high employee morale, new product buzz, industry disruption, or signs of a potential corporate turnaround. The list should be diverse but include companies that could potentially be classified as 'Fast Growers' or 'Turnarounds'.

        Present your findings as a markdown table with two columns: 'Stock Ticker' and 'Reasons for Selection'.
        Example format:
        | Stock Ticker | Reasons for Selection |
        |--------------|-----------------------|
        | AAPL         | - Strong customer loyalty for new iPhone.\n- Positive employee reviews on Glassdoor. |
        | MSFT         | - Enterprise clients praising cloud solutions.\n- Growing developer community. |
        """
        return self._generate_content(prompt)

    def categorize_and_filter_lynch(self, companies_list: list[str]) -> dict:
        companies_str = "\n".join(companies_list)
        prompt = f"""
        You are an AI analyst trained in Peter Lynch's stock categorization methods. Given the following list of {len(companies_list)} companies, analyze each one and classify it into one of the six Lynch categories: Slow Grower, Stalwart, Fast Grower, Cyclical, Turnaround, or Asset Play. Provide a brief justification for your classification. After categorizing all of them, return a filtered list containing *only* the companies classified as **Fast Grower** or **Turnaround**.

        Present the filtered list in the following markdown format:
        ### Fast Grower
        - **[TICKER]**: [Brief justification]
        - **[TICKER]**: [Brief justification]

        ### Turnaround
        - **[TICKER]**: [Brief justification]
        - **[TICKER]**: [Brief justification]

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
        For the following list of stocks categorized as **Fast Growers**, perform a rigorous CAN SLIM and Lynchian analysis. For each stock, provide a score (1-10) or a pass/fail rating for each of the following criteria:
        *   **C - Current Quarterly EPS Growth:** Must be > 25%.
        *   **A - Annual EPS Growth:** Must be > 25% for the last 3 years.
        *   **N - New Highs:** Is the stock near its 52-week high?
        *   **L - Leader:** Is it a leader in its industry with a Relative Strength (RS) Rating > 80?
        *   **I - Institutional Sponsorship:** Is there increasing institutional ownership?
        *   **PEG Ratio (Lynch):** Is the PEG ratio <= 1.5?
        *   **Balance Sheet (Lynch):** Does the company have a strong balance sheet with low debt?

        Stocks: {tickers_str}
        """
        return self._generate_content(prompt)

    def vet_turnarounds(self, turnarounds_data: list[dict]) -> dict:
        # turnarounds_data is a list of dictionaries, each containing ticker and relevant financial info
        # for now, let's just pass the tickers and assume the AI has access to the data
        tickers = [data['ticker'] for data in turnarounds_data]
        tickers_str = ", ".join(tickers)
        prompt = f"""
        For the following list of stocks categorized as **Turnarounds**, perform a specialized vetting process. For each stock, analyze and report on the following key turnaround factors:
        *   **The Nature of the Turnaround:** What is the story? (e.g., new management, restructuring, successful new product, emerging from bankruptcy).
        *   **Balance Sheet Strength:** How much cash do they have versus debt? Can they survive a prolonged downturn? This is the most critical factor for a turnaround.
        *   **Insider Buying:** Are insiders buying shares, signaling confidence?
        *   **Early Signs of Success:** Is the plan working? Are sales starting to recover? Are profit margins improving?
        *   **O'Neil's 'N' (New):** Is there a 'New' element (management, product, etc.) that aligns with the turnaround story?

        Stocks: {tickers_str}
        """
        return self._generate_content(prompt)

    def analyze_sentiment(self, stocks_list: list[str]) -> dict:
        stocks_str = ", ".join(stocks_list)
        prompt = f"""
        For the following list of vetted stocks, conduct a sentiment analysis of recent news articles, press releases, and social media conversations (from sources like X.com, Reddit, and stock forums) over the last 30-60 days. For each stock, provide a sentiment score (e.g., -1.0 to 1.0, where > 0.5 is highly positive) and a brief summary of the key positive narratives or catalysts being discussed. Identify the top 5-10 stocks with the most positive and compelling sentiment.

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

        The final output should be a markdown table of these 10 stocks.
        """
        return self._generate_content(prompt)