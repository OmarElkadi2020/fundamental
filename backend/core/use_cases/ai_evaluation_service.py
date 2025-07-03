
"""
ai_evaluation_service.py  –  v3
Re-implements your stock-analysis pipeline using local_deep_research.api
instead of the Gemini SDK.  No model object is stored; generation routes
through:

    • quick_summary(text)            – cheap TL;DR   («fast»)
    • detailed_research(text, …)     – deep analysis («detailed»)
    • detailed_research(text, llms={"gemini_custom": GeminiCustomLLM(model_name="gemini-2.5-pro")}, provider="gemini_custom")

The caller can select the path via the detail_level kw-arg.
"""

from __future__ import annotations

import os
import json
import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime

import logging
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from backend.logger import logger
from local_deep_research.api import detailed_research, quick_summary, generate_report
from pydantic import BaseModel, Field, ValidationError

from .gemini_llm import GeminiCustomLLM

# This will display logs from all libraries, including local-deep-research
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')

# --------------------------------------------------------------------------- #
#  Schemas for Validation                                                     #
# --------------------------------------------------------------------------- #
class ScuttlebuttIdeaSchema(BaseModel):
    ticker: str
    reason: str


class LynchCategorizationSchema(BaseModel):
    ticker: str
    justification: str


class LynchResultSchema(BaseModel):
    fast_growers: List[LynchCategorizationSchema]
    turnarounds: List[LynchCategorizationSchema]


class VettingScoreSchema(BaseModel):
    score: int
    pas: bool = Field(..., alias="pass")


class FastGrowerVettingResultSchema(BaseModel):
    current_quarterly_eps_growth: VettingScoreSchema = Field(
        ..., alias="Current Quarterly EPS Growth"
    )
    annual_eps_growth: VettingScoreSchema = Field(..., alias="Annual EPS Growth")
    new_highs: VettingScoreSchema = Field(..., alias="New Highs")
    leader: VettingScoreSchema = Field(..., alias="Leader")
    institutional_sponsorship: VettingScoreSchema = Field(
        ..., alias="Institutional Sponsorship"
    )
    peg_ratio: VettingScoreSchema = Field(..., alias="PEG Ratio")
    balance_sheet: VettingScoreSchema = Field(..., alias="Balance Sheet")


class FastGrowerVettingSchema(BaseModel):
    ticker: str
    vetting_results: FastGrowerVettingResultSchema


class TurnaroundVettingResultSchema(BaseModel):
    nature_of_the_turnaround: str = Field(..., alias="Nature of the Turnaround")
    balance_sheet_strength: str = Field(..., alias="Balance Sheet Strength")
    insider_buying: str = Field(..., alias="Insider Buying")
    early_signs_of_success: str = Field(..., alias="Early Signs of Success")
    oneils_n_new: str = Field(..., alias="O'Neil's 'N' (New)")


class TurnaroundVettingSchema(BaseModel):
    ticker: str
    vetting_results: TurnaroundVettingResultSchema


class SentimentAnalysisSchema(BaseModel):
    ticker: str
    sentiment_score: float
    summary: str


class FinalSelectionSentimentSchema(BaseModel):
    score: float
    summary: str


class FinalSelectionSchema(BaseModel):
    ticker: str
    company_name: str
    category: str
    investment_thesis: str
    can_slim_results: Dict[str, Any]
    sentiment_analysis: FinalSelectionSentimentSchema


# --------------------------------------------------------------------------- #
#  helpers                                                                    #
# --------------------------------------------------------------------------- #
_JSON_BLOCK = re.compile(r"```json\n([\s\S]*?)\n```", re.MULTILINE)



def _extract_json(text: str) -> str:
    """Return raw JSON inside ```json``` if present, else the whole string."""
    m = _JSON_BLOCK.search(text)
    return m.group(1) if m else text


# --------------------------------------------------------------------------- #
#  main service                                                               #
# --------------------------------------------------------------------------- #
class AIEvaluationService:
    """
    detail_level:
        "fast"     → quick_summary()        (default)
        "detailed" → detailed_research()
        "gemini_custom" → detailed_research(llms={"gemini_custom": GeminiCustomLLM(model_name="gemini-2.5-pro")}, provider="gemini_custom")
    """
    def create_gemini_provider(self, version:str ="2.5", id: str= "flash"):
        full_name =  "gemini" + version + id
        
    # ---------- single gateway ------------------------------------------------
    def deep_research(
        self,
        prompt: str,
        *,
        detail_level: str = "fast",
        schema
    ) -> Dict[str, Any]:
        """
        Run the prompt through quick_summary or detailed_research,
        then attempt to parse JSON (falls back to text).
        """
        logger.info("Starting deep research with detail_level: %s", detail_level)
        
        try:
            response_text = ""
            if detail_level == "fast":
                llm_config = {"gemini_pro": GeminiCustomLLM(model_name="gemini-2.5-flash")}
                provider = "gemini_pro"
                logger.info("Using quick_summary with provider: %s", provider)
                response_text = quick_summary(
                    prompt, 
                    llms=llm_config,
                    provider=provider,
                    search_tool="searxng",
                )["summary"]
            
            elif detail_level == "detailed":
                llm_config = {"gemini_pro": GeminiCustomLLM(model_name="gemini-2.5-pro")}
                provider = "gemini_pro"
                logger.info("Using detailed_research with provider: %s", provider)
                response_text = quick_summary(
                    prompt,
                    llms=llm_config,
                    provider=provider,
                    search_tool="searxng",
                    
                )["summary"]

            elif detail_level ==  "report": 
                llm_config = {"gemini_pro": GeminiCustomLLM(model_name="gemini-2.5-pro")}
                provider = "gemini_pro"
                logger.info("Using detailed_research with provider: %s", provider)
                response_text = generate_report(
                    prompt,
                    llms=llm_config,
                    provider=provider,
                    search_tool="searxng",
                )["content"]
            
            else:
                raise ValueError(
                    f"Unsupported detail_level: {detail_level}. Use 'fast', 'detailed', or 'gemini_custom'."
                )

            logger.info("Generated content via %s: %s", detail_level, response_text)
            
            try:
                json_content = json.loads(_extract_json(response_text))
                return {
                    "content": json_content,
                    "model": detail_level,
                    "format": "json",
                }
            except json.JSONDecodeError:
                logger.warning("Response for detail_level '%s' is not JSON. Returning as text.", detail_level)
                return {
                    "content": response_text,
                    "model": detail_level,
                    "format": "text",
                }
        except ResourceExhausted as e:
            logger.error("Resource exhausted for detail_level '%s': %s", detail_level, e)
            return {
                "content": "AI evaluation failed: Resource exhausted. The service is temporarily unavailable. Please try again later.",
                "model": detail_level,
                "format": "error",
            }
        except Exception as exc:
            logger.error("Generation failure for detail_level '%s': %s", detail_level, exc, exc_info=True)
            return {
                "content": f"AI evaluation failed: {exc}",
                "model": detail_level,
                "format": "error",
            }

    def _correct_json_format(
        self, text: str, schema: BaseModel
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Use google-generativeai to correct the JSON format.
        """
        logger.info("Attempting to correct JSON format.")
        model = genai.GenerativeModel("gemini-2.5-flash")  # Use the Flash model for correction
        response = model.generate_content(
            f"The following text is supposed to be in JSON format, but it's malformed. Please correct it according to the following schema:\n\nSchema:\n{schema.schema_json(indent=2)}\n\nMalformed Text:\n{text}\n\nPlease only return the corrected JSON, with no other text or explanations."
        )
        try:
            corrected_text = _extract_json(response.text)
            logger.info("Corrected JSON received: %s", corrected_text)
            return json.loads(corrected_text)
        except (json.JSONDecodeError, AttributeError) as e:
            logger.error("Failed to correct JSON format: %s", e)
            return {"error": "Failed to correct JSON format", "original_text": text}

    # ------------------------------------------------------------------ #
    #  business-logic methods (prompts unchanged)                        #
    # ------------------------------------------------------------------ #
    def generate_ideas_scuttlebutt(
        self, count: int = 150, *, detail_level: str = "fast"
    ) -> Dict[str, Any]:
        prompt = f"""
                    As an expert stock analyst specializing in the 'Scuttlebutt' methodology of Philip Fisher and Peter Lynch, generate a list of {count} public companies that are showing strong qualitative signals of success or significant operational change. For each company, provide a 1-2 sentence justification based on factors like positive customer reviews, high employee morale, new product buzz, industry disruption, or signs of a potential corporate turnaround.

                    Return JSON:
                    [
                      {{"ticker": "AAPL", "reason": "Strong customer loyalty for new iPhone. Positive Glassdoor reviews."}},
                      {{"ticker": "MSFT", "reason": "Enterprise clients praising cloud solutions. Growing developer community."}}
                    ]
                    """
        return self.deep_research(
            prompt, detail_level=detail_level, schema=ScuttlebuttIdeaSchema
        )


    def categorize_and_filter_lynch(
        self, companies_list: List[str], *, detail_level: str = "fast"
    ) -> Dict[str, Any]:
        companies_str = "\n".join(companies_list)
        prompt = f"""
        **Task**:
        
        You are an AI analyst trained in Peter Lynch's stock categorization methods. Given the following list of {len(companies_list)} companies, analyze each one and classify it into one of the six Lynch categories: Slow Grower, Stalwart, Fast Grower, Cyclical, Turnaround, or Asset Play. Provide a brief justification for your classification. After categorizing all of them, return a filtered list containing *only* the companies classified as **Fast Grower** or **Turnaround**.
        Present the filtered list as a JSON object with two keys: "fast_growers" and "turnarounds". Each key should contain a JSON array of objects. Each object in these arrays should have two keys: "ticker" (string) and "justification" (string).
        
        **Companies list**:
        {companies_str}

        **Example format**:
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


        """
        return self.deep_research(
            prompt, detail_level=detail_level, schema=LynchResultSchema
        )

    def vet_fast_growers(self, fast_growers_data: list[dict], detail_level) -> dict:
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
        return self.deep_research(
            prompt, detail_level=detail_level, schema=FastGrowerVettingSchema
        )

    def vet_turnarounds(self, turnarounds_data: list[dict], detail_level) -> dict:
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
        return self.deep_research(
            prompt, detail_level=detail_level, schema=TurnaroundVettingSchema
        )

    def analyze_sentiment(self, stocks_list: list[str], detail_level) -> dict:
        companies_str = "\n".join(stocks_list)
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prompt = f"""
        As an expert financial analyst, perform a sentiment analysis for the following list of companies.
        The current date and time is {current_time}. Your analysis should focus on very recent information, from the last minute up to the last Month.
        Scan financial news, social media, and other relevant sources to determine the current market sentiment.
        
        **Companies to analyze**:
        {companies_str}

        For each company, provide:
        1. A 'ticker' for the company.
        2. A 'sentiment_score' from -1.0 (very negative) to 1.0 (very positive).
        3. A 'summary' of the key drivers for the sentiment, including any recent news, events, or discussions.

        **Output Format**:
        Return a JSON array of objects. Each object must contain 'ticker', 'sentiment_score', and 'summary'.

        **Example**:
        [
          {{"ticker": "AAPL", "sentiment_score": 0.85, "summary": "Very positive sentiment driven by strong pre-orders for the new iPhone and bullish analyst ratings in the last 48 hours."}},
          {{"ticker": "MSFT", "sentiment_score": 0.6, "summary": "Positive sentiment following the announcement of a new AI partnership. Some mixed discussion on social media regarding recent UI changes."}}
        ]
        """
        return self.deep_research(
            prompt, detail_level=detail_level, schema=SentimentAnalysisSchema
        )

    def final_selection_synthesis(
        self,
        fast_growers_vetted: list[dict],
        turnarounds_vetted: list[dict],
        sentiment_analysis_results: dict,
        detail_level: str,
    ) -> dict:
        # Prepare detailed data for the prompt
        all_vetted_stocks_data = {}
        for stock in fast_growers_vetted:
            all_vetted_stocks_data[stock["ticker"]] = {
                "category": "Fast Grower",
                "vetting_result": stock.get("vetting_result", {}),
                "sentiment": {},  # Will be populated below
            }
        for stock in turnarounds_vetted:
            all_vetted_stocks_data[stock["ticker"]] = {
                "category": "Turnaround",
                "vetting_result": stock.get("vetting_result", {}),
                "sentiment": {},  # Will be populated below
            }

        # Populate sentiment data
        parsed_sentiment_content = []
        try:
            json_string = _extract_json(sentiment_analysis_results["content"])
            if not json_string.strip():  # Check if the extracted string is empty or just whitespace
                logger.warning("Extracted sentiment JSON string is empty.")
            else:
                parsed_sentiment_content = json.loads(json_string)
                logger.debug(f"Parsed sentiment content: {parsed_sentiment_content}")
        except json.JSONDecodeError as e:
            logger.error(
                f"Error parsing sentiment_analysis_results['content'] as JSON: {e}"
            )
        except Exception as e:
            logger.error(f"Unexpected error extracting or parsing sentiment JSON: {e}")

        # Create a dictionary for quick lookup of sentiment data by ticker
        sentiment_lookup = {
            item.get("ticker"): item
            for item in parsed_sentiment_content
            if item.get("ticker")
        }

        for ticker, data in all_vetted_stocks_data.items():
            sentiment_item = sentiment_lookup.get(ticker)
            if sentiment_item:
                data["sentiment"] = {
                    "score": sentiment_item.get("sentiment_score"),
                    "summary": sentiment_item.get("summary"),
                }
            else:
                logger.warning(f"Sentiment data not found for ticker: {ticker}")
                data["sentiment"] = {
                    "score": None,
                    "summary": "N/A",
                }  # Initialize with N/A if not found

        # Convert to a list for the prompt
        detailed_stocks_for_prompt = []
        for ticker, data in all_vetted_stocks_data.items():
            detailed_stocks_for_prompt.append(
                {
                    "ticker": ticker,
                    "category": data["category"],
                    "vetting_result": data["vetting_result"],
                    "sentiment": data["sentiment"],
                }
            )

        # Convert to string for the prompt
        detailed_stocks_str = json.dumps(detailed_stocks_for_prompt, indent=2)

        prompt = f"""
        You are a master portfolio manager synthesizing the analysis from the previous steps. You have the following detailed data for vetted stocks:
        {detailed_stocks_str}

        Your task is to select the **absolute best 10 investment opportunities** from these combined lists, to invest in right now, with a very high potential to surge explodly in value over the next 1-4 weeks.

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
        return self.deep_research(
            prompt, detail_level=detail_level, schema=FinalSelectionSchema
        )
