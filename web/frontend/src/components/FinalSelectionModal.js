import React from 'react';
import './FinalSelectionModal.css';

const FinalSelectionModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Final Selection & Synthesis</h2>
        <div className="stock-grid">
          {data.map((stock, index) => (
            <div key={index} className="stock-item">
              <h3>{stock.company_name} ({stock.ticker})</h3>
              <p><strong>Category:</strong> {stock.category}</p>
              <p><strong>Investment Thesis:</strong> {stock.investment_thesis}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default FinalSelectionModal;