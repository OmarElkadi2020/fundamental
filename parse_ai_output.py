import json
import re

def parse_ai_generated_markdown(markdown_content: str) -> list[str]:
    """
    Parses a markdown table from AI-generated content to extract stock tickers.
    Assumes the table has a 'Stock Ticker' column.
    """
    tickers = []
    lines = markdown_content.strip().split('\n')

    # Find the header line and its index
    header_line_index = -1
    for i, line in enumerate(lines):
        if '| Stock Ticker |' in line and '| Reasons for Selection |' in line:
            header_line_index = i
            break

    if header_line_index == -1:
        print("Error: Markdown table header not found.")
        return []

    # Find the separator line (e.g., |:-------------|:----------------------|)
    separator_line_index = -1
    for i in range(header_line_index + 1, len(lines)):
        if lines[i].startswith('|:') and '---' in lines[i]:
            separator_line_index = i
            break

    if separator_line_index == -1:
        print("Error: Markdown table separator not found.")
        return []

    # Extract headers to find the column index for 'Stock Ticker'
    header_line = lines[header_line_index]
    headers = [h.strip() for h in header_line.split('|') if h.strip()]
    try:
        ticker_col_index = headers.index('Stock Ticker')
    except ValueError:
        print("Error: 'Stock Ticker' column not found in header.")
        return []

    # Parse data rows starting from after the separator line
    for line in lines[separator_line_index + 1:]:
        parts = [p.strip() for p in line.split('|') if p.strip()]
        if len(parts) > ticker_col_index:
            ticker = parts[ticker_col_index].replace('*', '').strip()
            if ticker:
                tickers.append(ticker)
    return tickers


if __name__ == "__main__":
    cache_file_path = "/home/omar/projects/fundamental/data/cache/spa_analysis_cache.json"

    try:
        with open(cache_file_path, 'r') as f:
            cache_data = json.load(f)

        idea_generation_content = cache_data.get("idea_generation", {}).get("data", {}).get("content")

        if idea_generation_content:
            print("--- Raw AI Content ---")
            print(idea_generation_content)
            print("\n--- Parsed Stock Tickers ---")
            parsed_tickers = parse_ai_generated_markdown(idea_generation_content)
            for ticker in parsed_tickers:
                print(ticker)
            print(f"\nTotal parsed tickers: {len(parsed_tickers)}")
        else:
            print("'idea_generation' content not found in cache.")

    except FileNotFoundError:
        print(f"Cache file not found at {cache_file_path}")
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {cache_file_path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
