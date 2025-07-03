import React, { useContext } from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { ThemeContext } from '../ThemeContext';

const Settings = () => {
  const { toggleTheme, darkMode } = useContext(ThemeContext);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <FormControlLabel
        control={<Switch checked={darkMode} onChange={toggleTheme} />}
        label="Dark Mode"
      />
    </Box>
  );
};

export default Settings;
