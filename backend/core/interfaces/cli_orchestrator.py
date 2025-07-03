import pandas as pd
from io import StringIO
import re
import json
from backend.core.use_cases.ai_evaluation_service import AIEvaluationService
from backend.core.infrastructure.yfinance_repository import YahooFinanceRepository
from backend.core.use_cases.categorization_service import CategorizationService

def _parse_ai_generated_ideas(ai_response_content: str) -> list[str]:
    """
    Parses the AI-generated content to extract stock tickers.
    Assumes the AI response contains a JSON array within a markdown code block.
    """
    try:
        # Extract JSON string from markdown code block
        json_match = re.search(r'```json\n([\s\S]*?)\n```', ai_response_content)
        if not json_match:
            print("Error: No JSON code block found in AI response.")
            return []

        json_content = json_match.group(1)
        ideas = json.loads(json_content)

        tickers = [item["ticker"] for item in ideas if "ticker" in item]
        return tickers
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from AI response: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred during AI response parsing: {e}")
        return []

def _parse_categorization_table(ai_response_content: str) -> dict:
    """
    Parses the AI-generated categorization content to extract fast growers and turnarounds.
    Assumes the AI response contains a JSON object within a markdown code block.
    """
    categorized_stocks = {"Fast Grower": [], "Turnaround": []}
    try:
        json_match = re.search(r'```json\n([\s\S]*?)\n```', ai_response_content)
        if not json_match:
            print("Error: No JSON code block found in AI categorization response.")
            return categorized_stocks

        json_content = json_match.group(1)
        data = json.loads(json_content)

        if "fast_growers" in data:
            categorized_stocks["Fast Grower"] = [item["ticker"] for item in data["fast_growers"] if "ticker" in item]
        if "turnarounds" in data:
            categorized_stocks["Turnaround"] = [item["ticker"] for item in data["turnarounds"] if "ticker" in item]

        return categorized_stocks
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from AI categorization response: {e}")
        return categorized_stocks
    except Exception as e:
        print(f"An unexpected error occurred during AI categorization parsing: {e}")
        return categorized_stocks

def _parse_vetting_results(ai_response_content: str) -> list[dict]:
    """
    Parses the AI-generated vetting content to extract detailed vetting results.
    Assumes the AI response contains a JSON array within a markdown code block.
    """
    try:
        json_match = re.search(r'```json\n([\s\S]*?)\n```', ai_response_content)
        if not json_match:
            print("Error: No JSON code block found in AI vetting response.")
            return []

        json_content = json_match.group(1)
        results = json.loads(json_content)
        return results
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from AI vetting response: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred during AI vetting parsing: {e}")
        return []


def run_investment_workflow():
    ai_service = AIEvaluationService()
    yfinance_repo = YahooFinanceRepository()

    print("--- Starting Refined Investment Workflow ---")

    # Step 1: AI-Powered Idea Generation
    print("\nStep 1: Generating 150 stock ideas with AI (Scuttlebutt methodology)...")
    generated_ideas_response = ai_service.generate_ideas_scuttlebutt(count=150, detail_level="fast")
    generated_ideas_markdown = generated_ideas_response.get("content", "")
    print("AI Generated Ideas:\n", generated_ideas_markdown)
    
    # Assuming the AI returns a markdown table with 'Stock Ticker' column
    initial_stock_tickers = _parse_ai_generated_ideas(generated_ideas_markdown)
    print(f"Successfully extracted {len(initial_stock_tickers)} initial stock tickers.")
    if not initial_stock_tickers:
        print("No initial stock tickers found. Exiting workflow.")
        return

    # Step 2: AI-Powered Categorization & Triage
    print("\nStep 2: Categorizing and triaging stocks into Peter Lynch categories...")
    categorization_response = ai_service.categorize_and_filter_lynch(initial_stock_tickers)
    categorization_markdown = categorization_response.get("content", "")
    print("AI Categorization Results:\n", categorization_markdown)

    categorized_stocks = _parse_categorization_table(categorization_markdown)
    fast_growers = categorized_stocks.get("Fast Grower", [])
    turnarounds = categorized_stocks.get("Turnaround", [])
    
    print(f"Found {len(fast_growers)} Fast Growers and {len(turnarounds)} Turnarounds.")
    if not fast_growers and not turnarounds:
        print("No Fast Growers or Turnarounds found after categorization. Exiting workflow.")
        return

    # Step 3: Rigorous Vetting (Dual-Path Analysis)
    print("\nStep 3: Performing rigorous vetting for Fast Growers and Turnarounds...")
    
    vetted_fast_growers_data = []
    if fast_growers:
        print("\n  Vetting Fast Growers...")
        # In a real scenario, you'd fetch detailed financial data for each ticker here
        # For demonstration, we'll just pass the tickers to the AI prompt
        # and assume the AI has access to the necessary data or we'd pass it in a more complex structure.
        fast_grower_info_for_ai = [{"ticker": t, "data": yfinance_repo.get_all_data(t) } for t in fast_growers] # Placeholder

        vet_fg_response = ai_service.vet_fast_growers(fast_grower_info_for_ai)
        vet_fg_content = vet_fg_response.get("content", "")
        print("AI Vetting (Fast Growers):\n", vet_fg_content)
        vetted_fast_growers_data = _parse_vetting_results(vet_fg_content)

    vetted_turnarounds_data = []
    if turnarounds:
        print("\n  Vetting Turnarounds...")
        turnaround_info_for_ai = [{"ticker": t} for t in turnarounds]
        vet_tr_response = ai_service.vet_turnarounds(turnaround_info_for_ai)
        vet_tr_content = vet_tr_response.get("content", "")
        print("AI Vetting (Turnarounds):\n", vet_tr_content)
        vetted_turnarounds_data = _parse_vetting_results(vet_tr_content)

    all_vetted_tickers = [d["ticker"] for d in vetted_fast_growers_data + vetted_turnarounds_data]
    if not all_vetted_tickers:
        print("No stocks vetted. Exiting workflow.")
        return

    # Step 4: News & Social Media Sentiment Analysis
    print("\nStep 4: Conducting News & Social Media Sentiment Analysis...")
    sentiment_response = ai_service.analyze_sentiment(all_vetted_tickers)
    sentiment_markdown = sentiment_response.get("content", "")
    print("AI Sentiment Analysis Results:\n", sentiment_markdown)

    # Step 5: Final Selection & Synthesis
    print("\nStep 5: Performing Final Selection & Synthesis...")
    final_selection_response = ai_service.final_selection_synthesis(
        vetted_fast_growers_data,
        vetted_turnarounds_data,
        {"content": sentiment_markdown} # Pass the full sentiment response content
    )
    final_selection_markdown = final_selection_response.get("content", "")
    print("AI Final Selection:\n", final_selection_markdown)

    print("\n--- Refined Investment Workflow Complete ---")

if __name__ == "__main__":
    run_investment_workflow()
