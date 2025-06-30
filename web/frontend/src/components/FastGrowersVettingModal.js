import React from 'react';
import { Modal, Box, Typography, Grid, Paper, Button, IconButton, List, ListItem, ListItemText, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

const FastGrowersVettingModal = ({ data, onClose }) => {
  if (!data) return null;

  const renderVettingResult = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.pass !== undefined) {
        return (
          <ListItem disableGutters key={key} sx={{ py: 0.25 }}>
            <ListItemText
              primary={<Typography variant="body2" color="text.secondary">{key}:</Typography>}
              secondary={
                value.pass ? (
                  <Chip label="Pass" color="success" size="small" icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />} />
                ) : (
                  <Chip label="Fail" color="error" size="small" icon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />} />
                )
              }
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            />
          </ListItem>
        );
      } else if (value.score !== undefined) {
        return (
          <ListItem disableGutters key={key} sx={{ py: 0.25 }}>
            <ListItemText
              primary={<Typography variant="body2" color="text.secondary">{key}:</Typography>}
              secondary={<Typography variant="body2" sx={{ fontWeight: 'medium' }}>{value.score.toFixed(2)}</Typography>}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            />
          </ListItem>
        );
      }
    }
    return (
      <ListItem disableGutters key={key} sx={{ py: 0.25 }}>
        <ListItemText
          primary={<Typography variant="body2" color="text.secondary">{key}:</Typography>}
          secondary={<Typography variant="body2" sx={{ fontWeight: 'medium' }}>{String(value)}</Typography>}
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        />
      </ListItem>
    );
  };

  return (
    <Modal open={!!data} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Rigorous Vetting (Fast Growers)
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
                
                {stock.vetting_results && Object.keys(stock.vetting_results).length > 0 ? (
                  <List dense sx={{ width: '100%' }}>
                    {Object.entries(stock.vetting_results).map(([key, value]) => renderVettingResult(key, value))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <InfoOutlinedIcon sx={{ mr: 0.5, fontSize: 16 }} /> No vetting results available.
                  </Typography>
                )}
              </Paper>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No fast growers vetting data available.
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

export default FastGrowersVettingModal;