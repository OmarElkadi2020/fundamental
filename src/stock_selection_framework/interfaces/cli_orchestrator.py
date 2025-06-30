import pandas as pd
from io import StringIO
import re
from src.stock_selection_framework.application.ai_evaluation_service import AIEvaluationService

def demonstrate_ai_driven_idea_generation():
    """
    Demonstrates the AI-driven process for generating and filtering stock ideas.
    """
    ai_service = AIEvaluationService()

    # Step 1.1: Generate a list of 100 stock ideas
    print("Step 1.1: Generating 100 stock ideas with AI...")
    generated_ideas_markdown = ai_service.generate_stock_ideas(count=100)
    print("Generated Ideas Markdown:\n", generated_ideas_markdown)

    # Parse the markdown table to extract stock tickers
    stock_tickers = []
    lines = generated_ideas_markdown.strip().split('\n')
    header_found = False
    for line in lines:
        if 'Stock Ticker' in line and '|' in line:
            header_found = True
            continue
        
        if header_found and '|' in line and '---' not in line:
            parts = line.split('|')
            if len(parts) > 2:
                ticker = parts[1].strip().replace('*', '').strip()
                if ticker:
                    stock_tickers.append(ticker)

    print(f"Successfully extracted {len(stock_tickers)} stock tickers.")
    print("Tickers:", stock_tickers)


    # Step 1.2: Filter the list down to 50 ideas
    if stock_tickers:
        print("\nStep 1.2: Filtering down to 50 stock ideas using the 'Scuttlebutt' method...")
        filtered_ideas_markdown = ai_service.filter_stock_ideas(stock_ideas=stock_tickers, count=50)
        print("Filtered Ideas Markdown:\n", filtered_ideas_markdown)
    else:
        print("\nSkipping filtering step as no stock tickers were extracted.")


    # Display the final list
    print("\nDemonstration Complete.")
    if stock_tickers:
        print("The final filtered list of 50 stock ideas is shown above.")
    else:
        print("Could not generate or parse stock ideas.")

if __name__ == "__main__":
    demonstrate_ai_driven_idea_generation()