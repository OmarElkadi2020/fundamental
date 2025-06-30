import React, { useState } from 'react';
import Step from './Step';
import StockCard from './StockCard';
import StockDetail from './StockDetail';
import FinalSelectionModal from './FinalSelectionModal';
import SentimentAnalysisModal from './SentimentAnalysisModal';
import FastGrowersVettingModal from './FastGrowersVettingModal';
import TurnaroundsVettingModal from './TurnaroundsVettingModal';
import { Box, Button, Grid, Typography, Container, Paper } from '@mui/material';

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
              vettedFastGrowersData = vettedFastGrowersData.map(stock => {
                const vettingResultForStock = parsedVettingResult.find(res => res.ticker === stock.ticker);
                return { ...stock, ...vettingResultForStock };
              });
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
              vettedTurnaroundsData = vettedTurnaroundsData.map(stock => {
                const vettingResultForStock = parsedVettingResult.find(res => res.ticker === stock.ticker);
                return { ...stock, ...vettingResultForStock };
              });
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
    if (!step) return;

    try {
      const response = await fetch('/api/run_analysis_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: step.id, use_cache: true }), // Request cached data for viewing
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch data for ${step.name}: ${errorText}`);
      }

      const result = await response.json();
      let displayData = result.data.content;

      // First, extract JSON from markdown if format is text
      if (result.data.format === 'text') {
        try {
          const jsonString = _extractJsonFromMarkdown(result.data.content);
          if (jsonString.trim()) {
            displayData = JSON.parse(jsonString); // Correctly reassign parsed data
          } else {
            console.warn(`Extracted JSON string for ${step.name} is empty.`);
            displayData = []; // Default to empty array if no valid JSON
          }
        } catch (e) {
          console.error(`Error parsing AI data from text for ${step.name}:`, e);
          displayData = []; // Default to empty array on parse error
        }
      }

      // Then, transform data if it's an object (e.g., from vetting or sentiment analysis steps)
      if (typeof displayData === 'object' && displayData !== null && !Array.isArray(displayData)) {
        displayData = Object.entries(displayData).map(([ticker, details]) => {
          const stockInfo = finalStocks.find(s => s.ticker === ticker) || {};
          return { ticker, company_name: stockInfo.company_name || 'N/A', ...details };
        });
      }

      if (stepId === 'final_selection_synthesis') {
        setFinalSelectionData(displayData);
        setShowFinalSelectionModal(true);
      } else if (stepId === 'sentiment_analysis') {
        console.log('Sentiment data for modal:', displayData);
        setSentimentData(displayData);
        setShowSentimentModal(true);
      } else if (stepId === 'vetting_fast_growers') {
        console.log('Vetting data for modal (Fast Growers):', displayData);
        setFastGrowersVettingData(displayData);
        setShowFastGrowersVettingModal(true);
      } else if (stepId === 'vetting_turnarounds') {
        console.log('Vetting data for modal (Turnarounds):', displayData);
        setTurnaroundsVettingData(displayData);
        setShowTurnaroundsVettingModal(true);
      } else {
        // For other steps, just alert the raw data for now
        alert(`Data for ${step.name}:\n` + JSON.stringify(displayData, null, 2));
      }
    } catch (error) {
      console.error(`Error viewing data for step ${step.id}:`, error);
      alert(`Failed to load data for ${step.name}. Please try again.\nError: ${error.message}`);
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark', letterSpacing: '0.05em', fontSize: { xs: '2rem', md: '3rem' } }}>
          AI-Powered Stock Analysis Workflow
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: { xs: 2, md: 4 }, maxWidth: '800px', mx: 'auto', fontSize: { xs: '1rem', md: '1.5rem' } }}>
          Navigate through the automated stock selection process, from initial idea generation to final investment synthesis.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={startAnalysis}
          disabled={analysisInProgress}
          sx={{
            px: { xs: 3, md: 6 },
            py: { xs: 1, md: 1.8 },
            borderRadius: '30px',
            fontSize: { xs: '0.9rem', md: '1.1rem' },
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
            },
          }}
        >
          {analysisInProgress ? 'Analysis in Progress...' : 'Start Full Analysis'}
        </Button>
      </Box>

      <Paper elevation={6} sx={{ p: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 }, borderRadius: '16px', bgcolor: 'background.paper' }}>
        <Typography variant="h4" component="h2" sx={{ mb: { xs: 2, md: 4 }, fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Workflow Steps
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            sm: 'repeat(auto-fit, minmax(min(300px, 50%), 1fr))',
            md: 'repeat(auto-fit, minmax(min(300px, 33.3333%), 1fr))'
          },
          gap: { xs: '16px', md: '32px' }, // Use gap for spacing
        }}>
          {steps.map(step => (
            <Step
              key={step.id}
              step={step}
              onToggleCache={handleToggleCache}
              onViewData={handleViewData}
              isClickable={!analysisInProgress}
            />
          ))}
        </Box>
      </Paper>

      {finalStocks.length > 0 && (
        <Paper elevation={6} sx={{ p: { xs: 2, md: 4 }, borderRadius: '16px', bgcolor: 'background.paper' }}>
          <Typography variant="h4" component="h2" sx={{ mb: { xs: 2, md: 4 }, fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Final Selected Stocks
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
              sm: 'repeat(auto-fit, minmax(min(250px, 50%), 1fr))',
              md: 'repeat(auto-fit, minmax(min(250px, 25%), 1fr))' // 4 cards per row
            },
            gap: { xs: '16px', md: '32px' }, // Use gap for spacing
          }}>
            {finalStocks.map(stock => (
              <StockCard key={stock.ticker} stock={stock} onClick={() => handleStockClick(stock)} />
            ))}
          </Box>
        </Paper>
      )}

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
    </Container>
  );
};

export default Dashboard;

