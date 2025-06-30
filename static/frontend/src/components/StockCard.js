import React from 'react';
import './StockCard.css';

const StockCard = ({ stock, onClick }) => {
  return (
    <div className="stock-card" onClick={onClick}>
      <h3>{stock.symbol}</h3>
      <p>{stock.company_name}</p>
      {/* Display a summary of key metrics */}
      <div className="metrics-summary">
        <p>Market Cap: {stock.market_cap}</p>
        <p>P/E Ratio: {stock.pe_ratio}</p>
      </div>
    </div>
  );
};

export default StockCard;