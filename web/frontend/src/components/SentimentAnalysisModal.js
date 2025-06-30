import React from 'react';
import './SentimentAnalysisModal.css';

const SentimentAnalysisModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>News & Social Media Sentiment Analysis</h2>
        <div className="sentiment-grid">
          {data.map((stock, index) => (
            <div key={index} className="sentiment-item">
              <h3>{stock.ticker}</h3>
              <p><strong>Sentiment Score:</strong> <span className={stock.sentiment_score > 0.5 ? 'positive' : stock.sentiment_score < -0.5 ? 'negative' : 'neutral'}>{stock.sentiment_score.toFixed(2)}</span></p>
              <p><strong>Summary:</strong> {stock.summary}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default SentimentAnalysisModal;