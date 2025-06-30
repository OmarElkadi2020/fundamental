import React from 'react';
import { Card, CardContent, Typography, Checkbox, FormControlLabel, Button, Box } from '@mui/material';

const Step = ({ step, onToggleCache, onViewData, isClickable }) => {
  const { id, name, status, useCache } = step;

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

  const borderColors = {
    pending: 'grey.300',
    running: 'warning.main',
    completed: 'success.main',
    failed: 'error.main'
  };

  return (
    <Card sx={{ borderLeft: 4, borderColor: borderColors[status] || 'grey.300' }}>
      <CardContent>
        <Typography variant="h6">{name}</Typography>
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={useCache}
                onChange={handleToggle}
                disabled={!isClickable}
              />
            }
            label="Use Cache"
          />
          {status === 'completed' && (
            <Button size="small" variant="outlined" onClick={handleView}>
              View Data
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default Step;
