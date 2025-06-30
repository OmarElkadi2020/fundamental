import React from 'react';
import { Card, CardContent, Typography, CardActionArea, Box, Chip, Stack } from '@mui/material';
import { TrendingUp, TrendingDown, AttachMoney, Business, MonetizationOn } from '@mui/icons-material';

const StockCard = ({ stock, onClick }) => {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Fast Grower':
        return <TrendingUp sx={{ fontSize: 18, mr: 0.5 }} />;
      case 'Turnaround':
        return <TrendingDown sx={{ fontSize: 18, mr: 0.5 }} />;
      default:
        return <AttachMoney sx={{ fontSize: 18, mr: 0.5 }} />;
    }
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1_000_000_000_000) return `${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
    if (marketCap >= 1_000_000_000) return `${(marketCap / 1_000_000_000).toFixed(2)}B`;
    if (marketCap >= 1_000_000) return `${(marketCap / 1_000_000).toFixed(2)}M`;
    return marketCap.toLocaleString();
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 6px 25px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Stack>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.dark', lineHeight: 1.2 }}>
              {stock.ticker}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {stock.company_name}
            </Typography>
          </Stack>
          {stock.category && (
            <Chip
              label={stock.category}
              size="small"
              color={stock.category === 'Fast Grower' ? 'success' : 'info'}
              icon={getCategoryIcon(stock.category)}
              sx={{ borderRadius: '12px', fontWeight: 'bold', px: 0.5, fontSize: '0.75rem' }}
            />
          )}
        </Box>

        {(stock.sector || stock.industry) && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5, color: 'text.secondary' }}>
            <Business sx={{ fontSize: 14 }} />
            <Typography variant="caption">
              {stock.sector}{stock.sector && stock.industry ? ' | ' : ''}{stock.industry}
            </Typography>
          </Stack>
        )}

        <Stack spacing={0.5}>
          {stock.market_cap && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Market Cap:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                {formatMarketCap(stock.market_cap)}
              </Typography>
            </Box>
          )}
          {stock.pe_ratio !== null && stock.pe_ratio !== undefined && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">P/E Ratio:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                {stock.pe_ratio.toFixed(2)}
              </Typography>
            </Box>
          )}
          {/* Add more key metrics here if available in the stock object */}
          {/* Example: if stock.current_price exists */}
          {stock.current_price && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Price:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                ${stock.current_price.toFixed(2)}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
};

export default StockCard;