import React from 'react';
import { Modal, Box, Typography, Grid, Paper, Button, IconButton, Chip, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: '80%', lg: '60%' },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: 24,
  p: { xs: 2, md: 3 },
  overflowY: 'auto',
  outline: 'none',
};

const SentimentAnalysisModal = ({ data, onClose }) => {
  if (!data) return null;

  const getSentimentColor = (score) => {
    if (score > 0.7) return 'success';
    if (score >= 0.3) return 'primary';
    if (score >= -0.3) return 'warning';
    if (score < -0.7) return 'error';
    return 'default'; // Fallback
  };

  return (
    <Modal open={!!data} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            News &amp; Social Media Sentiment Analysis
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          {data.length > 0 ? data.map((stock, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', color: 'text.primary' }}>{stock.ticker}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{stock.company_name}</Typography>
                
                <Stack spacing={0.5} sx={{ mt: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}><strong>Sentiment Score:</strong></Typography>
                    {stock.sentiment_score != null ? (
                      <Chip
                        label={stock.sentiment_score.toFixed(2)}
                        color={getSentimentColor(stock.sentiment_score)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    )}
                  </Box>
                  <Typography variant="body2"><strong>Summary:</strong></Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {stock.summary ?? 'No summary available.'}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No sentiment analysis data available.
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="contained" color="primary" onClick={onClose} size="medium" sx={{ px: 3, borderRadius: '20px' }}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SentimentAnalysisModal;