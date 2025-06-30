import React from 'react';
import { Box, Button, Typography, Card, CardContent, Grid, Chip, Divider, Container, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StockDetail = ({ stock, onBack }) => {
  if (!stock || !stock.info) {
    return <Typography>Loading stock details...</Typography>;
  }

  const getSentimentColor = (score) => {
    if (score > 0.7) return 'success';
    if (score >= 0.3) return 'primary';
    if (score >= -0.3) return 'warning';
    if (score < -0.7) return 'error';
    return 'default'; // Fallback
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Fast Grower':
        return <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5 }} />;
      case 'Turnaround':
        return <TrendingDownIcon sx={{ fontSize: 18, mr: 0.5 }} />;
      default:
        return <AttachMoneyIcon sx={{ fontSize: 18, mr: 0.5 }} />;
    }
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1_000_000_000_000) return `${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
    if (marketCap >= 1_000_000_000) return `${(marketCap / 1_000_000_000).toFixed(2)}B`;
    if (marketCap >= 1_000_000) return `${(marketCap / 1_000_000).toFixed(2)}M`;
    return marketCap.toLocaleString();
  };

  const renderVettingResult = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.pass !== undefined) {
        return (
          <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px dashed #eee' }}>
            <Typography variant="body2" color="text.secondary">{key}:</Typography>
            {value.pass ? (
              <Chip label="Pass" color="success" size="small" icon={<CheckCircleOutlineIcon />} />
            ) : (
              <Chip label="Fail" color="error" size="small" icon={<CancelOutlinedIcon />} />
            )}
          </Box>
        );
      } else if (value.score !== undefined) {
        return (
          <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px dashed #eee' }}>
            <Typography variant="body2" color="text.secondary">{key}:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{value.score.toFixed(2)}</Typography>
          </Box>
        );
      }
    }
    return (
      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px dashed #eee' }}>
        <Typography variant="body2" color="text.secondary">{key}:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{String(value)}</Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mb: 3, textTransform: 'none', fontWeight: 'bold' }}>
        Back to Dashboard
      </Button>

      <Card elevation={6} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              {stock.info.longName} ({stock.info.symbol})
            </Typography>
            {stock.category && (
              <Chip
                label={stock.category}
                color={stock.category === 'Fast Grower' ? 'success' : 'info'}
                icon={getCategoryIcon(stock.category)}
                size="small"
                sx={{ fontSize: '0.75rem', padding: '3px 8px', height: 'auto', borderRadius: '12px' }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {stock.info.sector} | {stock.info.industry} | {stock.info.country}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>Company Overview</Typography>
              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
                {stock.info?.longBusinessSummary ?? 'No business summary available.'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>Key Financials</Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Market Cap:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{formatMarketCap(stock.info?.marketCap)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Trailing P/E:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{stock.info?.trailingPE != null ? stock.info.trailingPE.toFixed(2) : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Forward P/E:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{stock.info?.forwardPE !== null ? stock.info.forwardPE.toFixed(2) : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Dividend Yield:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{stock.info?.dividendYield !== null ? (stock.info.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Beta:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{stock.info?.beta !== null ? stock.info.beta.toFixed(2) : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">52 Week High:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{stock.info?.fiftyTwoWeekHigh !== null ? stock.info.fiftyTwoWeekHigh.toLocaleString() : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">52 Week Low:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{stock.info?.fiftyTwoWeekLow !== null ? stock.info.fiftyTwoWeekLow.toLocaleString() : 'N/A'}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>AI Evaluations</Typography>
              
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 0.5, color: 'text.primary' }}>Investment Thesis</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{stock.investment_thesis ?? 'No investment thesis available.'}</Typography>
              </Box>

              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 0.5, color: 'text.primary' }}>Sentiment Analysis</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}><strong>Score:</strong></Typography>
                  {stock.sentiment_analysis?.score != null ? (
                    <Chip
                      label={stock.sentiment_analysis.score.toFixed(2)}
                      color={getSentimentColor(stock.sentiment_analysis.score)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">N/A</Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary"><strong>Summary:</strong> {stock.sentiment_analysis?.summary ?? 'No sentiment summary available.'}</Typography>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 0.5, color: 'text.primary' }}>Vetting &amp; CAN SLIM Analysis</Typography>
                {stock.vetting_results && Object.keys(stock.vetting_results).length > 0 ? (
                  <Box sx={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                    {Object.entries(stock.vetting_results).map(([key, value]) => renderVettingResult(key, value))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoOutlinedIcon sx={{ mr: 0.5, fontSize: 16 }} /> No vetting results available.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StockDetail;