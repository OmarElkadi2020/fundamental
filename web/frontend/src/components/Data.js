import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Data = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/get_full_cache');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cached Analysis Data
      </Typography>
      {data && Object.entries(data).map(([key, value]) => (
        <Accordion key={key}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{key}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper sx={{ p: 2, overflowX: 'auto' }}>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </Paper>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default Data;
