import React from 'react';
import './StockCard.css';

const StockCard = ({ stock, onClick }) => {
  return (
    <div className="stock-card" onClick={onClick}>
      <h3>{stock.ticker} - {stock.company_name}</h3>
      <p className="stock-category">Category: {stock.category || 'N/A'}</p>
      <p className="stock-sector-industry">{stock.sector || 'N/A'} | {stock.industry || 'N/A'}</p>
      <div className="metrics-summary">
        <p>Market Cap: {stock.market_cap ? stock.market_cap.toLocaleString() : 'N/A'}</p>
        <p>P/E Ratio: {stock.pe_ratio !== null ? stock.pe_ratio : 'N/A'}</p>
      </div>
    </div>
  );
};

export default StockCard;