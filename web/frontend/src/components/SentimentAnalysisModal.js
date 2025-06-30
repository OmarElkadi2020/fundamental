import React from 'react';
import { Modal, Box, Typography, Grid, Paper, Button } from '@mui/material';

import './SentimentAnalysisModal.css';

const SentimentAnalysisModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <Modal open={!!data} onClose={onClose}>
      <Box className="modal-content-box">
        <Typography variant="h6" sx={{ mb: 2 }}>News &amp; Social Media Sentiment Analysis</Typography>
        <Grid container spacing={2} className="sentiment-grid">
          {data.map((stock, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper className="sentiment-item" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{stock.ticker}</Typography>
                <Typography variant="body2"><strong>Sentiment Score:</strong> <span className={stock.sentiment_score > 0.5 ? 'positive' : stock.sentiment_score < -0.5 ? 'negative' : 'neutral'}>{stock.sentiment_score.toFixed(2)}</span></Typography>
                <Typography variant="body2"><strong>Summary:</strong> {stock.summary}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Box textAlign="center" sx={{ mt: 3 }}>
          <Button variant="contained" onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SentimentAnalysisModal;