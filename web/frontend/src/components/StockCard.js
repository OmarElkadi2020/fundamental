import React from 'react';
import { Card, CardContent, Typography, CardActionArea, Box } from '@mui/material';

const StockCard = ({ stock, onClick }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ p: 2 }}>
        <Typography variant="h6">{stock.company_name} ({stock.ticker})</Typography>
        <Typography variant="body2" color="text.secondary">
          {stock.category}
        </Typography>
        {stock.sector && stock.industry && (
          <Typography variant="body2" color="text.secondary">
            {stock.sector} | {stock.industry}
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>
          {stock.market_cap && (
            <Typography variant="body2">Market Cap: {stock.market_cap.toLocaleString()}</Typography>
          )}
          {stock.pe_ratio !== null && stock.pe_ratio !== undefined && (
            <Typography variant="body2">P/E Ratio: {stock.pe_ratio}</Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default StockCard;