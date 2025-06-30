import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const StockCard = ({ stock, onClick }) => {
  return (
    <Card onClick={onClick} sx={{ cursor: 'pointer' }}>
      <CardContent>
        <Typography variant="h6">{stock.company_name} ({stock.ticker})</Typography>
        <Typography variant="body2" color="text.secondary">
          Category: {stock.category}
        </Typography>
        {stock.sector && stock.industry && (
          <Typography variant="body2" color="text.secondary">
            {stock.sector} | {stock.industry}
          </Typography>
        )}
        <div className="metrics-summary">
          {stock.market_cap && (
            <Typography variant="body2">Market Cap: {stock.market_cap.toLocaleString()}</Typography>
          )}
          {stock.pe_ratio !== null && stock.pe_ratio !== undefined && (
            <Typography variant="body2">P/E Ratio: {stock.pe_ratio}</Typography>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;