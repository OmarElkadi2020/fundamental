import React from 'react';
import { Modal, Box, Typography, Grid, Paper, Button } from '@mui/material';

import './FinalSelectionModal.css';

const FinalSelectionModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <Modal open={!!data} onClose={onClose}>
      <Box className="modal-content-box">
        <Typography variant="h6" sx={{ mb: 2 }}>Final Selection &amp; Synthesis</Typography>
        <Grid container spacing={2} className="stock-grid">
          {data.map((stock, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper className="stock-item" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{stock.company_name} ({stock.ticker})</Typography>
                <Typography variant="body2"><strong>Category:</strong> {stock.category}</Typography>
                <Typography variant="body2"><strong>Investment Thesis:</strong> {stock.investment_thesis}</Typography>
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

export default FinalSelectionModal;