import React from 'react';
import { Box, Button, Typography, Card, CardContent } from '@mui/material';

const StockDetail = ({ stock, onBack }) => {
  if (!stock) {
    return <div>Loading...</div>;
  }

  const getSentimentColor = (score) => {
    if (score > 0.7) return 'positive';
    if (score >= 0.3) return 'positive';
    if (score >= -0.3) return 'neutral';
    if (score < -0.7) return 'negative';
    return 'negative';
  };

  return (
    <Card className="stock-detail" sx={{ m: 'auto', maxWidth: 800 }}>
      <CardContent>
        <Button onClick={onBack} sx={{ mb: 2 }}>&larr; Back to List</Button>
        <Box className="detail-header" sx={{ mb: 2 }}>
          <Typography variant="h5">{stock.info.symbol} - {stock.info.longName}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {stock.info.sector} | {stock.info.industry}
          </Typography>
        </Box>
        <Box className="detail-metrics">
          <Typography variant="h6">Categorization</Typography>
          <Typography><strong>Lynch Category (Rule-Based):</strong> {stock.category ?? 'N/A'}</Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>AI Evaluations</Typography>
          <Box className="ai-evaluations" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Investment Thesis</Typography>
            <Typography>{stock.investment_thesis ?? 'N/A'}</Typography>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>Sentiment Analysis</Typography>
            <Typography>
              <strong>Score:</strong>
              {stock.sentiment_analysis && stock.sentiment_analysis.score !== null ?
                <span className={getSentimentColor(stock.sentiment_analysis.score)}>{stock.sentiment_analysis.score.toFixed(2)}</span>
                : 'N/A'}
            </Typography>
            <Typography><strong>Summary:</strong> {stock.sentiment_analysis?.summary ?? 'N/A'}</Typography>
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Vetting &amp; CAN SLIM Analysis</Typography>
          <Box className="can-slim-analysis" sx={{ mb: 2 }}>
            {stock.vetting_results && Object.entries(stock.vetting_results).map(([key, value]) => (
              <Typography key={key}>
                <strong>{key}:</strong> {typeof value === 'object' && value !== null ?
                  (value.pass !== undefined ? (value.pass ? 'Pass' : 'Fail') : value.score !== undefined ? value.score : JSON.stringify(value))
                  : value}
              </Typography>
            ))}
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Company Overview</Typography>
          <Typography>{stock.info?.longBusinessSummary ?? 'N/A'}</Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>Financials</Typography>
          <Typography><strong>Market Cap:</strong> {stock.info?.marketCap ? stock.info.marketCap.toLocaleString() : 'N/A'}</Typography>
          <Typography><strong>Trailing P/E:</strong> {stock.info?.trailingPE !== null ? stock.info.trailingPE.toFixed(2) : 'N/A'}</Typography>
          <Typography><strong>Forward P/E:</strong> {stock.info?.forwardPE !== null ? stock.info.forwardPE.toFixed(2) : 'N/A'}</Typography>
          <Typography><strong>Dividend Yield:</strong> {stock.info?.dividendYield !== null ? (stock.info.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</Typography>
          <Typography><strong>Beta:</strong> {stock.info?.beta !== null ? stock.info.beta.toFixed(2) : 'N/A'}</Typography>
          <Typography><strong>52 Week High:</strong> {stock.info?.fiftyTwoWeekHigh !== null ? stock.info.fiftyTwoWeekHigh.toLocaleString() : 'N/A'}</Typography>
          <Typography><strong>52 Week Low:</strong> {stock.info?.fiftyTwoWeekLow !== null ? stock.info.fiftyTwoWeekLow.toLocaleString() : 'N/A'}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockDetail;