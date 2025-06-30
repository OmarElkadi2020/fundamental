import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  const theme = createTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;