import React, { useState } from 'react';
import Step from './Step';
import StockCard from './StockCard';
import StockDetail from './StockDetail';
import FinalSelectionModal from './FinalSelectionModal';
import SentimentAnalysisModal from './SentimentAnalysisModal';
import FastGrowersVettingModal from './FastGrowersVettingModal';
import TurnaroundsVettingModal from './TurnaroundsVettingModal';
import { Box, Button, Grid, Typography } from '@mui/material';

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
  const [showFinalSelectionModal, setShowFinalSelectionModal] = useState(false);
  const [finalSelectionData, setFinalSelectionData] = useState(null);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [sentimentData, setSentimentData] = useState(null);
  const [showFastGrowersVettingModal, setShowFastGrowersVettingModal] = useState(false);
  const [fastGrowersVettingData, setFastGrowersVettingData] = useState(null);
  const [showTurnaroundsVettingModal, setShowTurnaroundsVettingModal] = useState(false);
  const [turnaroundsVettingData, setTurnaroundsVettingData] = useState(null);

  const handleToggleCache = (stepId) => {
    if (analysisInProgress) return;
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, useCache: !step.useCache } : step
      )
    );
  };

  const _extractJsonFromMarkdown = (markdownContent) => {
    const jsonMatch = markdownContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    }
    return markdownContent; // Return original if no markdown json block found
  };

  const _parseAiGeneratedIdeas = (aiResponse) => {
    if (aiResponse.format === 'json') {
      return aiResponse.content.map(item => item.ticker);
    } else if (aiResponse.format === 'text') {
      try {
        const jsonString = _extractJsonFromMarkdown(aiResponse.content);
        if (!jsonString.trim()) {
          console.warn("Extracted JSON string for idea generation is empty.");
          return [];
        }
        const ideas = JSON.parse(jsonString);
        return ideas.map(item => item.ticker);
      } catch (e) {
        console.error(`Error parsing AI generated ideas from text: ${e}`);
        return [];
      }
    }
    return [];
  };

  const _parseCategorizationTable = (aiResponse) => {
    const categorized_stocks = { "Fast Grower": [], "Turnaround": [] };
    if (aiResponse.format === 'json') {
      if (aiResponse.content.fast_growers) {
        categorized_stocks["Fast Grower"] = aiResponse.content.fast_growers.map(item => item.ticker);
      }
      if (aiResponse.content.turnarounds) {
        categorized_stocks["Turnaround"] = aiResponse.content.turnarounds.map(item => item.ticker);
      }
      return categorized_stocks;
    } else if (aiResponse.format === 'text') {
      try {
        const jsonString = _extractJsonFromMarkdown(aiResponse.content);
        if (!jsonString.trim()) {
          console.warn("Extracted JSON string for categorization is empty.");
          return categorized_stocks;
        }
        const data = JSON.parse(jsonString);

        if (data.fast_growers) {
          categorized_stocks["Fast Grower"] = data.fast_growers.map(item => item.ticker);
        }
        if (data.turnarounds) {
          categorized_stocks["Turnaround"] = data.turnarounds.map(item => item.ticker);
        }
        return categorized_stocks;
      } catch (e) {
        console.error(`Error parsing AI categorization data from text: ${e}`);
        return categorized_stocks;
      }
    }
    return categorized_stocks;
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
            ideaGenerationData = _parseAiGeneratedIdeas(result.data);
            break;

          case 'categorization_triage':
            if (!ideaGenerationData) throw new Error('Idea generation data not available.');
            const initialTickers = ideaGenerationData;
            response = await fetch('/api/run_analysis_step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { companies_list: initialTickers } }),
            });
            result = await response.json();
            categorizationTriageData = result.data;
            const { "Fast Grower": fastGrowers, "Turnaround": turnarounds } = _parseCategorizationTable(categorizationTriageData);
            vettedFastGrowersData = fastGrowers.map(ticker => ({ ticker }));
            vettedTurnaroundsData = turnarounds.map(ticker => ({ ticker }));
            break;

          case 'vetting_fast_growers':
            if (vettedFastGrowersData.length > 0) {
              response = await fetch('/api/run_analysis_step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: { fast_growers_data: vettedFastGrowersData } }),
              });
              result = await response.json();
              let parsedVettingResult;
              if (result.data.format === 'json') {
                parsedVettingResult = result.data.content;
              } else if (result.data.format === 'text') {
                try {
                  const jsonString = _extractJsonFromMarkdown(result.data.content);
                  if (!jsonString.trim()) {
                    console.warn("Extracted JSON string for fast growers vetting is empty.");
                    parsedVettingResult = [];
                  } else {
                    parsedVettingResult = JSON.parse(jsonString);
                  }
                } catch (e) {
                  console.error("Error parsing fast growers vetting data from text:", e);
                  parsedVettingResult = [];
                }
              }
              vettedFastGrowersData = parsedVettingResult;
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
              let parsedVettingResult;
              if (result.data.format === 'json') {
                parsedVettingResult = result.data.content;
              } else if (result.data.format === 'text') {
                try {
                  const jsonString = _extractJsonFromMarkdown(result.data.content);
                  if (!jsonString.trim()) {
                    console.warn("Extracted JSON string for turnarounds vetting is empty.");
                    parsedVettingResult = [];
                  } else {
                    parsedVettingResult = JSON.parse(jsonString);
                  }
                } catch (e) {
                  console.error("Error parsing turnarounds vetting data from text:", e);
                  parsedVettingResult = [];
                }
              }
              vettedTurnaroundsData = parsedVettingResult;
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
              if (result.data.format === 'json') {
                sentimentAnalysisData = result.data.content;
              } else if (result.data.format === 'text') {
                try {
                  const jsonString = _extractJsonFromMarkdown(result.data.content);
                  if (!jsonString.trim()) {
                    console.warn("Extracted JSON string for sentiment analysis is empty.");
                    sentimentAnalysisData = [];
                  } else {
                    sentimentAnalysisData = JSON.parse(jsonString);
                  }
                } catch (e) {
                  console.error("Error parsing sentiment analysis data from text:", e);
                  sentimentAnalysisData = [];
                }
              }
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
                  sentiment_analysis_results: { content: JSON.stringify(sentimentAnalysisData) },
                },
              }),
            });
            result = await response.json();
            let finalSelectionParsedData;
            if (result.data.format === 'json') {
              finalSelectionParsedData = result.data.content;
            } else if (result.data.format === 'text') {
              try {
                const jsonString = _extractJsonFromMarkdown(result.data.content);
                if (!jsonString.trim()) {
                  console.warn("Extracted JSON string for final selection is empty.");
                  finalSelectionParsedData = [];
                } else {
                  finalSelectionParsedData = JSON.parse(jsonString);
                }
              } catch (e) {
                console.error("Error parsing final selection data from text:", e);
                finalSelectionParsedData = [];
              }
            }
            setFinalStocks(finalSelectionParsedData);
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

  const handleStockClick = async (stock) => {
    setSelectedStock(null); // Clear previous selection
    try {
      // Fetch all data in parallel
      const [yfinanceResponse, vettingResponse, sentimentResponse] = await Promise.all([
        fetch(`/api/yfinance/${stock.ticker}`),
        fetch(`/api/stock/${stock.ticker}/vetting_results`),
        fetch(`/api/stock/${stock.ticker}/sentiment_analysis`)
      ]);

      if (!yfinanceResponse.ok) throw new Error(`HTTP error! status: ${yfinanceResponse.status} for yfinance data`);
      const yfinanceData = await yfinanceResponse.json();

      let vettingResults = {};
      if (vettingResponse.ok) {
        vettingResults = await vettingResponse.json();
      } else {
        console.warn(`Vetting results not found for ${stock.ticker}, status: ${vettingResponse.status}`);
      }

      let sentimentAnalysis = {};
      if (sentimentResponse.ok) {
        sentimentAnalysis = await sentimentResponse.json();
      }
      else {
        console.warn(`Sentiment analysis not found for ${stock.ticker}, status: ${sentimentResponse.status}`);
      }

      // Combine all data
      const combinedStockData = {
        ...stock, // Keep existing data from finalStocks (e.g., category, investment_thesis, vetting_results, sentiment_analysis)
        ...yfinanceData, // Add/override yfinance data (info, financials, etc.)
        vetting_results: vettingResults, // Ensure vetting results are explicitly included
        sentiment_analysis: sentimentAnalysis, // Ensure sentiment analysis is explicitly included
      };

      setSelectedStock(combinedStockData);
    } catch (error) {
      console.error("Error fetching stock details:", error);
      alert("Failed to load stock details. Please try again.");
    }
  };

  const handleBack = () => {
    setSelectedStock(null);
  };

  const handleViewData = async (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (step && step.data) {
      let displayData = step.data.content;
      if (step.data.format === 'text') {
        try {
          const jsonString = _extractJsonFromMarkdown(step.data.content);
          if (jsonString.trim()) { // Only parse if not empty
            displayData = JSON.parse(jsonString);
          } else {
            console.warn(`Data for ${step.name} is text and empty after markdown extraction.`);
            displayData = null; // Set to null or empty array/object as appropriate
          }
        } catch (e) {
          console.warn(`Data for ${step.name} is text and not JSON parsable. Keeping as raw text.`, e);
          // Keep displayData as raw text if parsing fails
        }
      }

      if (stepId === 'final_selection_synthesis') {
        try {
          setFinalSelectionData(displayData);
          setShowFinalSelectionModal(true);
        } catch (e) {
          console.error("Error setting final selection data for modal:", e);
          alert(`Error displaying data for ${step.name}:\n` + e.message);
        }
      } else if (stepId === 'sentiment_analysis') {
        try {
          setSentimentData(displayData);
          setShowSentimentModal(true);
        } catch (e) {
          console.error("Error setting sentiment analysis data for modal:", e);
          alert(`Error displaying data for ${step.name}:\n` + e.message);
        }
      } else if (stepId === 'vetting_fast_growers') {
        try {
          setFastGrowersVettingData(displayData);
          setShowFastGrowersVettingModal(true);
        } catch (e) {
          console.error("Error setting fast growers vetting data for modal:", e);
          alert(`Error displaying data for ${step.name}:\n` + e.message);
        }
      } else if (stepId === 'vetting_turnarounds') {
        try {
          setTurnaroundsVettingData(displayData);
          setShowTurnaroundsVettingModal(true);
        } catch (e) {
          console.error("Error setting turnarounds vetting data for modal:", e);
          alert(`Error displaying data for ${step.name}:\n` + e.message);
        }
      } else {
        console.log(`Data for ${step.name}:`, step.data);
        alert(`Data for ${step.name}:\n` + JSON.stringify(displayData, null, 2));
      }
    }
  };

  const handleCloseFinalSelectionModal = () => {
    setShowFinalSelectionModal(false);
    setFinalSelectionData(null);
  };

  const handleCloseSentimentModal = () => {
    setShowSentimentModal(false);
    setSentimentData(null);
  };

  const handleCloseFastGrowersVettingModal = () => {
    setShowFastGrowersVettingModal(false);
    setFastGrowersVettingData(null);
  };

  const handleCloseTurnaroundsVettingModal = () => {
    setShowTurnaroundsVettingModal(false);
    setTurnaroundsVettingData(null);
  };

  if (selectedStock) {
    return <StockDetail stock={selectedStock} onBack={handleBack} />;
  }

  return (
    <Box className="dashboard" sx={{ p: 2 }}>
      <Box component="header" className="dashboard-header" sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Stock Analysis Workflow</Typography>
        <Button variant="contained" onClick={startAnalysis} disabled={analysisInProgress}>
          {analysisInProgress ? 'Analysis in Progress...' : 'Start Full Analysis'}
        </Button>
      </Box>
      <Grid container spacing={2} className="workflow-steps">
        {steps.map(step => (
          <Grid item xs={12} sm={6} md={4} key={step.id}>
            <Step
              step={step}
              onToggleCache={handleToggleCache}
              onViewData={handleViewData}
              isClickable={!analysisInProgress}
            />
          </Grid>
        ))}
      </Grid>
      <Box className="results" sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Final Selected Stocks</Typography>
        <Grid container spacing={2} className="stock-list">
            {finalStocks.map(stock => (
                <Grid item xs={12} sm={6} md={4} key={stock.ticker}>
                  <StockCard stock={stock} onClick={() => handleStockClick(stock)} />
                </Grid>
            ))}
        </Grid>
      </Box>
      {showFinalSelectionModal && (
        <FinalSelectionModal
          data={finalSelectionData}
          onClose={handleCloseFinalSelectionModal}
        />
      )}
      {showSentimentModal && (
        <SentimentAnalysisModal
          data={sentimentData}
          onClose={handleCloseSentimentModal}
        />
      )}
      {showFastGrowersVettingModal && (
        <FastGrowersVettingModal
          data={fastGrowersVettingData}
          onClose={handleCloseFastGrowersVettingModal}
        />
      )}
      {showTurnaroundsVettingModal && (
        <TurnaroundsVettingModal
          data={turnaroundsVettingData}
          onClose={handleCloseTurnaroundsVettingModal}
        />
      )}
    </Box>
  );
};

export default Dashboard;

