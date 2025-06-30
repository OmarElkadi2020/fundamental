import pandas as pd
from io import StringIO
import re
from src.core.use_cases.ai_evaluation_service import AIEvaluationService
from src.core.infrastructure.yfinance_repository import YFinanceRepository
from src.stock_selection_framework.application.categorization_service import CategorizationService

def _parse_markdown_table(markdown_content: str, column_name: str) -> list[str]:
    """
    Parses a markdown table and extracts values from a specified column.
    Assumes the first row is the header and the second row is the separator.
    """
    lines = markdown_content.strip().split('\n')
    if len(lines) < 2:
        return []

    # Find header and column index
    header_line = lines[0]
    headers = [h.strip() for h in header_line.split('|') if h.strip()]
    try:
        col_index = headers.index(column_name)
    except ValueError:
        print(f"Column '{column_name}' not found in markdown table header: {headers}")
        return []

    extracted_values = []
    # Iterate through data rows, skipping header and separator
    for line in lines[2:]:
        parts = [p.strip() for p in line.split('|') if p.strip()]
        if len(parts) > col_index:
            value = parts[col_index].replace('*', '').strip()
            if value:
                extracted_values.append(value)
    return extracted_values

def _parse_categorization_table(markdown_content: str) -> dict:
    """
    Parses the categorization markdown table and returns a dictionary
    mapping categories to lists of tickers.
    """
    categorized_stocks = {"Fast Grower": [], "Turnaround": []}
    lines = markdown_content.strip().split('\n')
    
    current_category = None
    for line in lines:
        line = line.strip()
        if line.startswith("###"): # Category header
            current_category = line.replace("###", "").strip()
        elif line.startswith("- "): # Ticker line
            match = re.match(r"- \*\*([A-Z]+)\*\*:.*", line)
            if match and current_category in categorized_stocks:
                categorized_stocks[current_category].append(match.group(1))
    return categorized_stocks

def run_investment_workflow():
    ai_service = AIEvaluationService()
    yfinance_repo = YFinanceRepository()

    print("--- Starting Refined Investment Workflow ---")

    # Step 1: AI-Powered Idea Generation
    print("\nStep 1: Generating 150 stock ideas with AI (Scuttlebutt methodology)...")
    generated_ideas_response = ai_service.generate_ideas_scuttlebutt(count=150)
    generated_ideas_markdown = generated_ideas_response.get("content", "")
    print("AI Generated Ideas:\n", generated_ideas_markdown)
    
    # Assuming the AI returns a markdown table with 'Stock Ticker' column
    initial_stock_tickers = _parse_markdown_table(generated_ideas_markdown, "Stock Ticker")
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
        fast_grower_info_for_ai = [{"ticker": t} for t in fast_growers] # Placeholder
        vet_fg_response = ai_service.vet_fast_growers(fast_grower_info_for_ai)
        print("AI Vetting (Fast Growers):\n", vet_fg_response.get("content", ""))
        # Parse and store vetted fast growers. For now, just keep the tickers.
        vetted_fast_growers_data = fast_grower_info_for_ai # This needs proper parsing later

    vetted_turnarounds_data = []
    if turnarounds:
        print("\n  Vetting Turnarounds...")
        # Similar to Fast Growers, fetch data and pass to AI
        turnaround_info_for_ai = [{"ticker": t} for t in turnarounds] # Placeholder
        vet_tr_response = ai_service.vet_turnarounds(turnaround_info_for_ai)
        print("AI Vetting (Turnarounds):\n", vet_tr_response.get("content", ""))
        # Parse and store vetted turnarounds. For now, just keep the tickers.
        vetted_turnarounds_data = turnaround_info_for_ai # This needs proper parsing later

    all_vetted_tickers = [d["ticker"] for d in vetted_fast_growers_data + vetted_turnarounds_data]
    if not all_vetted_tickers:
        print("No stocks vetted. Exiting workflow.")
        return

    # Step 4: News & Social Media Sentiment Analysis
    print("\nStep 4: Conducting News & Social Media Sentiment Analysis...")
    sentiment_response = ai_service.analyze_sentiment(all_vetted_tickers)
    sentiment_markdown = sentiment_response.get("content", "")
    print("AI Sentiment Analysis Results:\n", sentiment_markdown)
    # Parse sentiment results if needed for Step 5, for now just pass the raw markdown

    # Step 5: Final Selection & Synthesis
    print("\nStep 5: Performing Final Selection & Synthesis...")
    final_selection_response = ai_service.final_selection_synthesis(
        vetted_fast_growers_data, # This should be parsed data, not just tickers
        vetted_turnarounds_data,  # This should be parsed data, not just tickers
        {"sentiment_markdown": sentiment_markdown} # Pass sentiment results
    )
    final_selection_markdown = final_selection_response.get("content", "")
    print("AI Final Selection:\n", final_selection_markdown)

    print("\n--- Refined Investment Workflow Complete ---")

if __name__ == "__main__":
    run_investment_workflow()
