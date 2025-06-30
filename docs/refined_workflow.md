# Refined Investment Workflow: Finding Top 10 Fast Growers & Turnarounds

This document outlines a refined, five-step investment workflow designed to identify the top 10 stock opportunities, specifically focusing on Peter Lynch's "Fast Grower" and "Turnaround" categories. It synthesizes the qualitative "scuttlebutt" approach with rigorous quantitative and sentiment analysis.

---

### **Step 1: AI-Powered Idea Generation**

*   **Goal:** Generate a broad, diverse list of 100-150 potential investment ideas based on qualitative signals that suggest growth or significant corporate change.
*   **Method:** Use an AI model prompted to act as a "Scuttlebutt" analyst.
*   **Prompt:**
    > "As an expert stock analyst specializing in the 'Scuttlebutt' methodology of Philip Fisher and Peter Lynch, generate a list of 150 public companies that are showing strong qualitative signals of success or significant operational change. For each company, provide a 1-2 sentence justification based on factors like positive customer reviews, high employee morale, new product buzz, industry disruption, or signs of a potential corporate turnaround. The list should be diverse but include companies that could potentially be classified as 'Fast Growers' or 'Turnarounds'."

---

### **Step 2: AI-Powered Categorization & Triage**

*   **Goal:** Classify the initial list of ideas into Lynch's six categories and then filter it down to a focused list of only "Fast Growers" and "Turnarounds".
*   **Method:** Use an AI model prompted to act as a Lynch-style analyst.
*   **Prompt:**
    > "You are an AI analyst trained in Peter Lynch's stock categorization methods. Given the following list of 150 companies, analyze each one and classify it into one of the six Lynch categories: Slow Grower, Stalwart, Fast Grower, Cyclical, Turnaround, or Asset Play. Provide a brief justification for your classification. After categorizing all of them, return a filtered list containing *only* the companies classified as **Fast Grower** or **Turnaround**. The final list should contain approximately 40-50 companies."

---

### **Step 3: Rigorous Vetting (Dual-Path Analysis)**

*   **Goal:** Subject the filtered list to a demanding vetting process tailored to its category. Fast Growers are checked for momentum and growth, while Turnarounds are checked for survivability and evidence of recovery.
*   **Method:** Use two separate, specialized prompts for each category.

#### **Prompt for Vetting Fast Growers:**
> "For the following list of stocks categorized as **Fast Growers**, perform a rigorous CAN SLIM and Lynchian analysis. For each stock, provide a score (1-10) or a pass/fail rating for each of the following criteria:
> *   **C - Current Quarterly EPS Growth:** Must be > 25%.
> *   **A - Annual EPS Growth:** Must be > 25% for the last 3 years.
> *   **N - New Highs:** Is the stock near its 52-week high?
> *   **L - Leader:** Is it a leader in its industry with a Relative Strength (RS) Rating > 80?
> *   **I - Institutional Sponsorship:** Is there increasing institutional ownership?
> *   **PEG Ratio (Lynch):** Is the PEG ratio <= 1.5?
> *   **Balance Sheet (Lynch):** Does the company have a strong balance sheet with low debt?"

#### **Prompt for Vetting Turnarounds:**
> "For the following list of stocks categorized as **Turnarounds**, perform a specialized vetting process. For each stock, analyze and report on the following key turnaround factors:
> *   **The Nature of the Turnaround:** What is the story? (e.g., new management, restructuring, successful new product, emerging from bankruptcy).
> *   **Balance Sheet Strength:** How much cash do they have versus debt? Can they survive a prolonged downturn? This is the most critical factor for a turnaround.
> *   **Insider Buying:** Are insiders buying shares, signaling confidence?
> *   **Early Signs of Success:** Is the plan working? Are sales starting to recover? Are profit margins improving?
> *   **O'Neil's 'N' (New):** Is there a 'New' element (management, product, etc.) that aligns with the turnaround story?"

---

### **Step 4: News & Social Media Sentiment Analysis**

*   **Goal:** Gauge the current market sentiment and public narrative surrounding the vetted stocks to identify those with strong positive momentum.
*   **Method:** Use an AI model to search and analyze recent news and social media mentions.
*   **Prompt:**
    > "For the following list of vetted stocks, conduct a sentiment analysis of recent news articles, press releases, and social media conversations (from sources like X.com, Reddit, and stock forums) over the last 30-60 days. For each stock, provide a sentiment score (e.g., -1.0 to 1.0, where > 0.5 is highly positive) and a brief summary of the key positive narratives or catalysts being discussed. Identify the top 5-10 stocks with the most positive and compelling sentiment."

---

### **Step 5: Final Selection & Synthesis**

*   **Goal:** Synthesize all the vetted analysis to select the absolute best 10 investment opportunities, mixing the two categories based on conviction.
*   **Method:** Use a final AI prompt to act as a portfolio manager, creating a concise investment thesis for each pick.
*   **Prompt:**
    > "You are a master portfolio manager synthesizing the analysis from the previous steps. You have two lists: vetted Fast Growers and vetted Turnarounds, along with their sentiment analysis scores. Your task is to select the **absolute best 10 investment opportunities** from these combined lists.
    >
    > Your selection should be a mix of both categories, but weighted towards the highest conviction ideas regardless of category, using the sentiment analysis as a key tie-breaker or confirmation signal. For each of your 10 selections, provide:
    > 1.  **Ticker**
    > 2.  **Company Name**
    > 3.  **Category (Fast Grower or Turnaround)**
    > 4.  **A concise (3-5 sentence) investment thesis** explaining *why* it is a top pick, integrating the qualitative story, the quantitative data, the sentiment analysis, and the specific category criteria.
    >
    > The final output should be a markdown table of these 10 stocks."
