import React from 'react';
import './StockDetail.css';

const StockDetail = ({ stock, onBack }) => {
  if (!stock) {
    return <div>Loading...</div>;
  }

  const getSentimentColor = (score) => {
    if (score > 0.7) return 'positive';
    if (score >= 0.3) return 'positive';
    if (score >= -0.3) return 'neutral';
    if (score < -0.7) return 'negative';
    return 'negative';
  };

  return (
    <div className="stock-detail">
      <button onClick={onBack} className="back-button">← Back to List</button>
      <div className="detail-header">
        <h2>{stock.info.symbol} - {stock.info.longName}</h2>
        <p>{stock.info.sector} | {stock.info.industry}</p>
      </div>
      <div className="detail-metrics">
        <h3>Categorization</h3>
        <p><strong>Lynch Category (Rule-Based):</strong> {stock.category ?? 'N/A'}</p>

        <h3>AI Evaluations</h3>
        <div className="ai-evaluations">
          <h4>Investment Thesis</h4>
          <p>{stock.investment_thesis ?? 'N/A'}</p>
          <h4>Sentiment Analysis</h4>
          <p>
            <strong>Score:</strong> 
            {stock.sentiment_analysis && stock.sentiment_analysis.score !== null ? 
              <span className={getSentimentColor(stock.sentiment_analysis.score)}>{stock.sentiment_analysis.score.toFixed(2)}</span> 
              : 'N/A'}
          </p>
          <p><strong>Summary:</strong> {stock.sentiment_analysis?.summary ?? 'N/A'}</p>
        </div>

        <h3>Vetting & CAN SLIM Analysis</h3>
        <div className="can-slim-analysis">
          {stock.vetting_results && Object.entries(stock.vetting_results).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {typeof value === 'object' && value !== null ? 
                (value.pass !== undefined ? (value.pass ? 'Pass' : 'Fail') : value.score !== undefined ? value.score : JSON.stringify(value))
                : value}
            </p>
          ))}
        </div>

        <h3>Company Overview</h3>
        <p>{stock.info?.longBusinessSummary ?? 'N/A'}</p>

        <h3>Financials</h3>
        <p><strong>Market Cap:</strong> {stock.info?.marketCap ? stock.info.marketCap.toLocaleString() : 'N/A'}</p>
        <p><strong>Trailing P/E:</strong> {stock.info?.trailingPE !== null ? stock.info.trailingPE.toFixed(2) : 'N/A'}</p>
        <p><strong>Forward P/E:</strong> {stock.info?.forwardPE !== null ? stock.info.forwardPE.toFixed(2) : 'N/A'}</p>
        <p><strong>Dividend Yield:</strong> {stock.info?.dividendYield !== null ? (stock.info.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</p>
        <p><strong>Beta:</strong> {stock.info?.beta !== null ? stock.info.beta.toFixed(2) : 'N/A'}</p>
        <p><strong>52 Week High:</strong> {stock.info?.fiftyTwoWeekHigh !== null ? stock.info.fiftyTwoWeekHigh.toLocaleString() : 'N/A'}</p>
        <p><strong>52 Week Low:</strong> {stock.info?.fiftyTwoWeekLow !== null ? stock.info.fiftyTwoWeekLow.toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  );
}; 

export default StockDetail;