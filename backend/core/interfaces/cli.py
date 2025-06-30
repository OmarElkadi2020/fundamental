import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.interfaces.cli_orchestrator import run_investment_workflow

def main():
    print("Starting the AI-driven stock selection workflow...")
    run_investment_workflow()
    print("AI-driven stock selection workflow completed.")

if __name__ == "__main__":
    main()