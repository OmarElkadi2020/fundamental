import React, { useState, useEffect } from 'react';
import Step from './Step';
import StockCard from './StockCard';
import StockDetail from './StockDetail';
import './Dashboard.css';

const stepsConfig = [
  { id: 'idea_generation', name: 'Step 1: AI-Powered Idea Generation' },
  { id: 'categorization_triage', name: 'Step 2: AI-Powered Categorization & Triage' },
  { id: 'vetting_fast_growers', name: 'Step 3a: Rigorous Vetting (Fast Growers)' },
  { id: 'vetting_turnarounds', name: 'Step 3b: Rigorous Vetting (Turnarounds)' },
  { id: 'sentiment_analysis', name: 'Step 4: News & Social Media Sentiment Analysis' },
  { id: 'final_selection_synthesis', name: 'Step 5: Final Selection & Synthesis' },
];

const Dashboard = () => {
  const [steps, setSteps] = useState(stepsConfig.map(step => ({ ...step, status: 'pending', useCache: true, data: null })));
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [finalStocks, setFinalStocks] = useState([]);

  const handleToggleCache = (stepId) => {
    if (analysisInProgress) return;
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, useCache: !step.useCache } : step
      )
    );
  };

  const _parseMarkdownTable = (markdown_content, column_name) => {
    const extracted_values = [];
    const lines = markdown_content.trim().split('\n');
    if (lines.length < 2) return [];

    const header_line = lines[0];
    const headers = header_line.split('|').map(h => h.trim()).filter(h => h);
    const col_index = headers.indexOf(column_name);

    if (col_index === -1) {
        console.warn(`Column '${column_name}' not found in markdown table header:`, headers);
        return [];
    }

    for (const line of lines.slice(2)) { // Skip header and separator line
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length > col_index) {
            const value = parts[col_index].replace(/\*/g, '').trim();
            if (value) {
                extracted_values.push(value);
            }
        }
    }
    return extracted_values;
  };

  const _parseCategorizationTable = (markdown_content) => {
    const categorized_stocks = { "Fast Grower": [], "Turnaround": [] };
    const lines = markdown_content.trim().split('\n');
    
    let current_category = null;
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("###")) { // Category header
            current_category = trimmedLine.replace("###", "").trim();
        } else if (trimmedLine.startsWith("- ")) { // Ticker line
            const match = trimmedLine.match(/^- \*\*([A-Z]+)\*\*:.*/);
            if (match && current_category && categorized_stocks.hasOwnProperty(current_category)) {
                categorized_stocks[current_category].push(match[1]);
            }
        }
    }
    return categorized_stocks;
  };

  const _parseMarkdownTableWithReasoning = (markdown_table) => {
    const selected_stocks = [];
    const lines = markdown_table.trim().split('\n');
    let header_found = false;
    for (const line of lines) {
        if (line.includes('Stock Ticker') && line.includes('|') && line.includes('Reasoning for Final Selection')) {
            header_found = true;
            continue;
        }
        if (header_found && line.includes('|') && !line.includes('---')) {
            const parts = line.split('|');
            if (parts.length > 2) {
                const ticker = parts[1].trim().replace(/[^a-zA-Z0-9]/g, '').trim();
                const reasoning = parts[2].trim();
                if (ticker) {
                    selected_stocks.push({ ticker, reasoning });
                }
            }
        }
    }
    return selected_stocks;
  };

  const startAnalysis = async () => {
    setAnalysisInProgress(true);
    setFinalStocks([]);
    let currentSteps = [...steps];

    let ideaGenerationData = null;
    let categorizationTriageData = null;
    let vettedFastGrowersData = [];
    let vettedTurnaroundsData = [];
    let sentimentAnalysisData = null;

    for (let i = 0; i < currentSteps.length; i++) {
      const step = currentSteps[i];
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s));

      try {
        let payload = {};
        let response;
        let result;

        switch (step.id) {
          case 'idea_generation':
            response = await fetch('/api/run_analysis_step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { count: 150 } }),
            });
            result = await response.json();
            ideaGenerationData = result.data.content; // Assuming content is the markdown table
            break;

          case 'categorization_triage':
            if (!ideaGenerationData) throw new Error('Idea generation data not available.');
            const initialTickers = _parseMarkdownTable(ideaGenerationData, 'Stock Ticker');
            response = await fetch('/api/run_analysis_step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { companies_list: initialTickers } }),
            });
            result = await response.json();
            categorizationTriageData = result.data.content; // Assuming content is the markdown table
            const { fastGrowers, turnarounds } = _parseCategorizationTable(categorizationTriageData);
            vettedFastGrowersData = fastGrowers.map(ticker => ({ ticker })); // Prepare for vetting steps
            vettedTurnaroundsData = turnarounds.map(ticker => ({ ticker })); // Prepare for vetting steps
            break;

          case 'vetting_fast_growers':
            if (vettedFastGrowersData.length > 0) {
              response = await fetch('/api/run_analysis_step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { fast_growers_data: vettedFastGrowersData } }),
              });
              result = await response.json();
              // For now, just store the AI response. In a real app, you'd parse this into structured data.
              vettedFastGrowersData = vettedFastGrowersData.map(stock => ({ ...stock, vetting_result: result.data.content }));
            }
            break;

          case 'vetting_turnarounds':
            if (vettedTurnaroundsData.length > 0) {
              response = await fetch('/api/run_analysis_step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { turnarounds_data: vettedTurnaroundsData } }),
              });
              result = await response.json();
              // For now, just store the AI response.
              vettedTurnaroundsData = vettedTurnaroundsData.map(stock => ({ ...stock, vetting_result: result.data.content }));
            }
            break;

          case 'sentiment_analysis':
            const allVettedTickers = [...vettedFastGrowersData, ...vettedTurnaroundsData].map(s => s.ticker);
            if (allVettedTickers.length > 0) {
              response = await fetch('/api/run_analysis_step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { stocks_list: allVettedTickers } }),
              });
              result = await response.json();
              sentimentAnalysisData = result.data.content; // Assuming content is the markdown table
            }
            break;

          case 'final_selection_synthesis':
            response = await fetch('/api/run_analysis_step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                step: step.id,
                use_cache: step.useCache,
                payload: {
                  fast_growers_vetted: vettedFastGrowersData,
                  turnarounds_vetted: vettedTurnaroundsData,
                  sentiment_analysis_results: { content: sentimentAnalysisData }, // Pass the raw markdown for now
                },
              }),
            });
            result = await response.json();
            const finalSelectionMarkdown = result.data.content;
            const selectedTickersWithReasoning = _parseMarkdownTableWithReasoning(finalSelectionMarkdown);
            setFinalStocks(selectedTickersWithReasoning);
            break;

          default:
            console.warn(`Unknown step ID: ${step.id}`);
            break;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Step failed');
        }

        currentSteps[i] = { ...step, status: 'completed', data: result.data };
        setSteps([...currentSteps]);

      } catch (error) {
        console.error(`Error in step ${step.id}:`, error);
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'failed' } : s));
        break;
      }
    }
    setAnalysisInProgress(false);
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  const handleBack = () => {
    setSelectedStock(null);
  };

  const handleViewData = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (step && step.data) {
      console.log(`Data for ${step.name}:`, step.data);
      alert(`Data for ${step.name}:\n` + JSON.stringify(step.data, null, 2));
    }
  };

  if (selectedStock) {
    return <StockDetail stock={selectedStock} onBack={handleBack} />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stock Analysis Workflow</h1>
        <button onClick={startAnalysis} disabled={analysisInProgress}>
          {analysisInProgress ? 'Analysis in Progress...' : 'Start Full Analysis'}
        </button>
      </header>
      <div className="workflow-steps">
        {steps.map(step => (
          <Step
            key={step.id}
            step={step}
            onToggleCache={handleToggleCache}
            onViewData={handleViewData}
            isClickable={!analysisInProgress}
          />
        ))}
      </div>
      <div className="results">
        <h2>Final Selected Stocks</h2>
        <div className="stock-list">
            {finalStocks.map(stock => (
                <StockCard key={stock.ticker} stock={stock} onClick={() => handleStockClick(stock)} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
