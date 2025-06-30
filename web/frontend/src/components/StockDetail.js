import React from 'react';
import { marked } from 'marked';
import './StockDetail.css';

const StockDetail = ({ stock, onBack }) => {
  if (!stock) {
    return <div>Loading...</div>;
  }

  return (
    <div className="stock-detail">
      <button onClick={onBack} className="back-button">← Back to List</button>
      <div className="detail-header">
        <h2>{stock.ticker} - {stock.company_name}</h2>
        <p>{stock.sector} | {stock.industry}</p>
      </div>
      <div className="detail-metrics">
        <h3>Categorization</h3>
        <p><strong>Lynch Category (Rule-Based):</strong> {stock.category}</p>
        <p><strong>Lynch Category (AI):</strong> {stock.ai_evaluations?.lynch_category_ai?.content || 'N/A'}</p>

        <h3>Vetting Criteria & Metrics</h3>
        <h4>Lynch Criteria</h4>
        {stock.lynch_criteria && Object.entries(stock.lynch_criteria).map(([key, value]) => (
          <div key={key} className={`metric-item ${value.pass ? 'passed' : 'failed'}`}>
            <span className="metric-name">{key}:</span>
            <span className="metric-value">{value.value !== null ? (typeof value.value === 'boolean' ? (value.value ? 'Yes' : 'No') : value.value) : 'N/A'}</span>
            <span className="metric-status">{value.pass ? '✓' : '✗'}</span>
          </div>
        ))}

        <h4>CANSLIM Criteria</h4>
        {stock.canslim_criteria && Object.entries(stock.canslim_criteria).map(([key, value]) => (
          <div key={key} className={`metric-item ${value.pass ? 'passed' : 'failed'}`}>
            <span className="metric-name">{key}:</span>
            <span className="metric-value">{value.value !== null ? (typeof value.value === 'boolean' ? (value.value ? 'Yes' : 'No') : value.value) : 'N/A'}</span>
            <span className="metric-status">{value.pass ? '✓' : '✗'}</span>
          </div>
        ))}

        <h3>AI Evaluations</h3>
        <div className="ai-evaluations">
          <h4>Invest in What You Know</h4>
          <p>{stock.ai_evaluations?.invest_what_you_know?.content || 'N/A'}</p>

          <h4>Scuttlebutt Analysis</h4>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(stock.ai_evaluations?.scuttlebutt?.content || '') }} />

          <h4>Growth Potential Triage</h4>
          <p>{stock.ai_evaluations?.growth_potential_triage?.content || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;