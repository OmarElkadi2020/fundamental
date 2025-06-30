import React from 'react';
import './StockDetail.css';

const StockDetail = ({ stock, onBack }) => {
  if (!stock) {
    return <div>Loading...</div>;
  }

  return (
    <div className="stock-detail">
      <button onClick={onBack} className="back-button">← Back to List</button>
      <div className="detail-header">
        <h2>{stock.symbol} - {stock.company_name}</h2>
        <p>{stock.sector} | {stock.industry}</p>
      </div>
      <div className="detail-metrics">
        <h3>Vetting Criteria & Metrics</h3>
        {stock.vetting_results && Object.entries(stock.vetting_results).map(([key, value]) => (
          <div key={key} className={`metric-item ${value.passed ? 'passed' : 'failed'}`}>
            <span className="metric-name">{value.name}</span>
            <span className="metric-value">{value.value}</span>
            <span className="metric-criteria">({value.criteria})</span>
            <span className="metric-status">{value.passed ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockDetail;