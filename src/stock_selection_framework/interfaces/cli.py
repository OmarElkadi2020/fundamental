import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from stock_selection_framework.application.services import VettingService

def main():
    if len(sys.argv) < 2:
        print("Usage: python cli.py <TICKER>")
        sys.exit(1)

    ticker = sys.argv[1]

    # Instantiate the vetting service and run the process
    vetting_service = VettingService()
    vetting_service.vet_candidate(ticker)

if __name__ == "__main__":
    main()
