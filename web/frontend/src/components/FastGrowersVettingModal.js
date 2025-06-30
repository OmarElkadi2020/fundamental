import React from 'react';
import { Modal, Box, Typography, Grid, Paper, Button } from '@mui/material';

import './FastGrowersVettingModal.css';

const FastGrowersVettingModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <Modal open={!!data} onClose={onClose}>
      <Box className="modal-content-box">
        <Typography variant="h6" sx={{ mb: 2 }}>Rigorous Vetting (Fast Growers)</Typography>
        <Grid container spacing={2} className="vetting-grid">
          {data.map((stock, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper className="vetting-item" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{stock.ticker}</Typography>
                <div className="vetting-results">
                  {stock.vetting_result && Object.entries(stock.vetting_result).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      <strong>{key}:</strong> {typeof value === 'object' && value !== null ?
                        (value.pass !== undefined ? (value.pass ? 'Pass' : 'Fail') : value.score !== undefined ? value.score : JSON.stringify(value))
                        : value}
                    </Typography>
                  ))}
                </div>
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

export default FastGrowersVettingModal;