import React from 'react';
import './StockCard.css';

const StockCard = ({ stock, onClick }) => {
  return (
    <div className="stock-card" onClick={onClick}>
      <h3>{stock.company_name} ({stock.ticker})</h3>
      <p className="stock-category">Category: {stock.category}</p>
      {stock.sector && stock.industry && (
        <p className="stock-sector-industry">{stock.sector} | {stock.industry}</p>
      )}
      <div className="metrics-summary">
        {stock.market_cap && (
          <p>Market Cap: {stock.market_cap.toLocaleString()}</p>
        )}
        {stock.pe_ratio !== null && stock.pe_ratio !== undefined && (
          <p>P/E Ratio: {stock.pe_ratio}</p>
        )}
      </div>
    </div>
  );
};

export default StockCard;