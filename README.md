# fundamental

This project is a Python-based framework for analyzing stocks using a hybrid methodology that combines the qualitative principles of Peter Lynch and the quantitative criteria of William J. O'Neil's CAN SLIM system. It leverages Domain-Driven Design (DDD) principles to structure the application and integrates with external APIs for fundamental and economic data.

## Features

*   **Hybrid Investment Strategy:** Combines Lynch's "invest in what you know" philosophy with O'Neil's rigorous CAN SLIM screening.
*   **Data-Driven Analysis:** Fetches real-time and historical data for fundamental and economic analysis.
*   **Extensible Architecture:** Built with a clean, decoupled architecture that is easy to extend.
*   **Command-Line Interface:** Provides a simple CLI for vetting stocks.

## Getting Started

### Prerequisites

*   Python 3.10 or higher
*   A FRED API key (get one for free [here](https://fred.stlouisfed.org/docs/api/api_key.html))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up your FRED API key:**
    The application requires a FRED API key to be set as an environment variable.

    *   **Linux/macOS:**
        ```bash
        export FRED_API_KEY='your_api_key'
        ```
    *   **Windows:**
        ```bash
        set FRED_API_KEY='your_api_key'
        ```
    Replace `'your_api_key'` with your actual FRED API key.

## Usage

There are two ways to interact with the framework: a web-based UI and a command-line interface (CLI).

### Web-Based UI (Recommended)

The web UI provides a rich, interactive experience for analyzing stocks.

To run the web UI, use the following command:

```bash
streamlit run app.py
```

This will open a new tab in your browser with the application.

### Command-Line Interface (CLI)

The CLI provides a quick way to get a summary of a stock's analysis.

To analyze a stock, run the `cli.py` script with the stock's ticker symbol as an argument:

```bash
python src/stock_selection_framework/interfaces/cli.py <TICKER>
```

**Example:**

```bash
python src/stock_selection_framework/interfaces/cli.py AAPL
```

This will output a summary of the fundamental analysis for the specified stock, along with the current economic context.

## Project Structure

The project is organized using Domain-Driven Design (DDD) principles:

*   `src/stock_selection_framework/domain`: Contains the core business logic, entities, and value objects.
*   `src/stock_selection_framework/application`: Orchestrates the domain logic to perform use cases.
*   `src/stock_selection_framework/infrastructure`: Handles external concerns like data fetching and persistence.
*   `src/stock_selection_framework/interfaces`: Exposes the application to the outside world (e.g., the CLI).

## Libraries Used

*   [yfinance](https://pypi.org/project/yfinance/): For fetching fundamental stock data from Yahoo Finance.
*   [fredapi](https://pypi.org/project/fredapi/): For fetching economic data from the FRED (Federal Reserve Economic Data) database.