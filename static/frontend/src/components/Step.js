import React from 'react';
import './Step.css';

const Step = ({ step, onToggleCache, onViewData, isClickable }) => {
  const { id, name, status, useCache } = step;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isClickable) {
      onToggleCache(id);
    }
  };

  const handleView = (e) => {
    e.stopPropagation();
    onViewData(id);
  };

  return (
    <div className={`step ${status}`}>
      <div className="step-info">
        <h3>{name}</h3>
        <div className="step-controls">
          <label className="cache-toggle">
            <input
              type="checkbox"
              checked={useCache}
              onChange={handleToggle}
              disabled={!isClickable}
            />
            <span>Use Cache</span>
          </label>
          {status === 'completed' && (
            <button onClick={handleView} className="view-data-btn">
              View Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step;
