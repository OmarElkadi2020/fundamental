import json
import re

def parse_categorization_markdown(markdown_content: str) -> dict:
    """
    Parses the categorization markdown table and returns a dictionary
    mapping categories to lists of dictionaries (ticker and justification).
    """
    categorized_stocks = {"Fast Grower": [], "Turnaround": []}
    lines = markdown_content.strip().split('\n')
    
    current_category = None
    for line in lines:
        trimmed_line = line.strip()
        if trimmed_line.startswith("###"): # Category header
            category_name = trimmed_line.replace("###", "").strip()
            if category_name in categorized_stocks: # Only consider known categories
                current_category = category_name
            else:
                current_category = None # Reset if unknown category
        elif trimmed_line.startswith("- ") and current_category: # Ticker line
            match = re.match(r"^- \*\*([A-Z]+)\*\*:(.*)", trimmed_line)
            if match:
                ticker = match.group(1)
                justification = match.group(2).strip()
                categorized_stocks[current_category].append({"ticker": ticker, "justification": justification})
    return categorized_stocks

if __name__ == "__main__":
    cache_file_path = "/home/omar/projects/fundamental/data/cache/spa_analysis_cache.json"

    try:
        with open(cache_file_path, 'r') as f:
            cache_data = json.load(f)

        categorization_content = cache_data.get("categorization_triage", {}).get("data", {}).get("content")

        if categorization_content:
            print("--- Raw Categorization Content ---")
            print(categorization_content)
            print("\n--- Parsed Categorization JSON ---")
            parsed_json = parse_categorization_markdown(categorization_content)
            print(json.dumps(parsed_json, indent=4))
        else:
            print("'categorization_triage' content not found in cache.")

    except FileNotFoundError:
        print(f"Cache file not found at {cache_file_path}")
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {cache_file_path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")