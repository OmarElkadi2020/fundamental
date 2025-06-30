import React from 'react';
import { Box, Typography, Button, Paper, Switch, FormControlLabel, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';

const Step = ({ step, onToggleCache, onViewData, isClickable }) => {
  const { id, name, status, useCache, data } = step;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isClickable) {
      onToggleCache(id);
    }
  };

  const handleView = (e) => {
    e.stopPropagation();
    onViewData(id);
  };

  const getStatusIcon = (currentStatus) => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />;
      case 'failed':
        return <ErrorIcon color="error" sx={{ fontSize: 32 }} />;
      case 'running':
        return <CircularProgress size={28} />;
      default:
        return <HourglassEmptyIcon color="action" sx={{ fontSize: 32 }} />;
    }
  };

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case 'completed':
        return 'success.main';
      case 'failed':
        return 'error.main';
      case 'running':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: '12px',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: isClickable ? 'translateY(-5px)' : 'none',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        },
        opacity: isClickable ? 1 : 0.7,
        cursor: isClickable ? 'default' : 'not-allowed',
        borderLeft: `4px solid ${getStatusColor(status)}`,
        width: '100%', // Ensure the paper takes the full width of its grid item
        height: '100%', // Ensure the paper takes the full height of its grid item
        boxSizing: 'border-box', // Ensure padding is included in the width calculation
        minWidth: 0, // Allow the item to shrink below its content size
        
        // Robust flex properties
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'space-between',
        flex: '1 1 auto', // Allow it to grow and shrink, with a base size determined by content/parent
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        {getStatusIcon(status)}
        <Typography variant="subtitle1" component="h3" sx={{ mt: 0.5, fontWeight: 'bold', color: getStatusColor(status), whiteSpace: 'normal', overflowWrap: 'break-word' }}>
          {name}
        </Typography>
      </Box>

      <Box sx={{ mb: 1.5 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useCache}
              onChange={handleToggle}
              name="useCache"
              color="primary"
              size="small"
              disabled={!isClickable}
            />
          }
          label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Use Cache</Typography>}
        />
      </Box>

      <Button
        variant="outlined"
        color="info"
        onClick={handleView}
        disabled={!data || !isClickable}
        startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
        sx={{ mt: 'auto', fontSize: '0.75rem', px: 2, py: 0.5 }}
      >
        View Data
      </Button>
    </Paper>
  );
};

export default Step;
