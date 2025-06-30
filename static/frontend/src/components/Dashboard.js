import React, { useState, useEffect } from 'react';
import Step from './Step';
import StockCard from './StockCard';
import StockDetail from './StockDetail';
import './Dashboard.css';

const stepsConfig = [
  { id: 'idea_generation', name: 'Idea Generation' },
  { id: 'filtering', name: 'Filtering' },
  { id: 'categorization', name: 'Categorization' },
  { id: 'vetting', name: 'Vetting' },
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

  const startAnalysis = async () => {
    setAnalysisInProgress(true);
    setFinalStocks([]);
    let currentSteps = [...steps];

    for (let i = 0; i < currentSteps.length; i++) {
      const step = currentSteps[i];
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s));

      try {
        let payload = {};
        if (step.id === 'filtering') {
            const previousStep = currentSteps[i-1];
            payload = { ideas: previousStep.data };
        } else if (i > 0) {
            const previousStep = currentSteps[i-1];
            payload = previousStep.data;
        }
        const response = await fetch('/api/run_analysis_step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: step.id, use_cache: step.useCache, payload: payload }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Step failed');

        currentSteps[i] = { ...step, status: 'completed', data: result.data };
        setSteps([...currentSteps]);

        if (step.id === 'vetting') {
            setFinalStocks(result.data);
        }

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
      // For simplicity, we'll just log the data for now.
      // A modal or a dedicated view could be implemented here.
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
        <h2>Vetted Stocks</h2>
        <div className="stock-list">
            {finalStocks.map(stock => (
                <StockCard key={stock.symbol} stock={stock} onClick={() => handleStockClick(stock)} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
