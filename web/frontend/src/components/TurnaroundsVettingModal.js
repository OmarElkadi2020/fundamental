import React from 'react';
import './TurnaroundsVettingModal.css';

const TurnaroundsVettingModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Rigorous Vetting (Turnarounds)</h2>
        <div className="vetting-grid">
          {data.map((stock, index) => (
            <div key={index} className="vetting-item">
              <h3>{stock.ticker}</h3>
              <div className="vetting-results">
                {stock.vetting_result && Object.entries(stock.vetting_result).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {typeof value === 'object' && value !== null ? 
                      (value.pass !== undefined ? (value.pass ? 'Pass' : 'Fail') : value.score !== undefined ? value.score : JSON.stringify(value))
                      : value}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default TurnaroundsVettingModal;