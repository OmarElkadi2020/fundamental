/* FastGrowersVettingModal.jsx */
import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  Chip,
  Tooltip,          // ⬅️  NEW
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/* ---------- short explanations for each metric ---------- */
const factorInfo: Record<string, string> = {
  'Current Quarterly EPS Growth':
    'EPS growth for the most recent reported quarter vs. same quarter last year.',
  'Annual EPS Growth':
    'Year-over-year growth in earnings per share, measured on an annual basis.',
  'Sales Growth':
    'Revenue growth rate compared with the prior period.',
  'Innovation & Catalysts / Price Action':
    'Qualitative assessment of innovation pipeline, upcoming catalysts and recent price momentum.',
  'Market Leadership / Moat':
    'Competitive positioning, barriers to entry and overall market share strength.',
  'Institutional Sponsorship':
    'Level and trend of ownership by large funds and institutional investors.',
  'Balance Sheet Strength':
    'Liquidity, leverage, cash-flow coverage and other solvency ratios.',
  'PEG Ratio (Valuation)':
    'Price-to-Earnings-to-Growth ratio as a quick check on valuation versus growth.',
};

/* ---------- modal shell ---------- */
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: '80%', lg: '60%' },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: 3,
  boxShadow: 24,
  p: { xs: 2, md: 3 },
  overflowY: 'auto',
  outline: 'none',
};

/* ---------- 0-10 gauge with ideal 7-10 ---------- */
const GaugeBar = ({ score }: { score: number }) => {
  const pct = Math.min(Math.max(score, 0), 10) * 10; // clamp then map to %

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 20 }}>
      {/* track */}
      <Box sx={{ position: 'absolute', top: 6, left: 0, right: 0, height: 8, bgcolor: '#e0e0e0', borderRadius: 4 }} />
      {/* ideal band */}
      <Box
        sx={{
          position: 'absolute',
          top: 6,
          left: '70%',
          width: '30%',
          height: 8,
          bgcolor: 'success.light',
          opacity: 0.45,
          borderRadius: 4,
        }}
      />
      {/* score marker + label */}
      <Box
        sx={{
          position: 'absolute',
          left: `${pct}%`,
          transform: 'translateX(-50%)',
          top: 0,
          width: 2,
          height: 20,
          bgcolor: 'primary.main',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: -14,
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            px: 0.5,
            fontSize: '0.7rem',
            lineHeight: 1,
            borderRadius: 0.5,
          }}
        >
          {score}
        </Typography>
      </Box>
    </Box>
  );
};

/* ---------- main component ---------- */
const FastGrowersVettingModal = ({ data, onClose }) => {
  if (!data) return null;

  /* render one metric row */
  const renderMetric = (label: string, obj: any) => {
    const score =
      typeof obj === 'number'
        ? obj
        : obj && typeof obj === 'object'
        ? obj.score ?? obj.value ?? null
        : null;
    const pass = obj && typeof obj === 'object' ? obj.pass : undefined;

    /* row header with tooltip */
    const Header = () => (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Tooltip title={factorInfo[label] ?? ''} arrow placement="top-start">
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ cursor: factorInfo[label] ? 'help' : 'default' }}
          >
            {label}
          </Typography>
        </Tooltip>

        {pass !== undefined && (
          pass ? (
            <Chip size="small" label="Pass" color="success" icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />} />
          ) : (
            <Chip size="small" label="Fail" color="error" icon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />} />
          )
        )}
      </Box>
    );

    if (score !== null) {
      return (
        <ListItem disableGutters key={label} sx={{ py: 1 }}>
          <Box sx={{ width: '100%' }}>
            <Header />
            <GaugeBar score={score} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
              <Typography variant="caption" color="text.secondary">0</Typography>
              <Typography variant="caption" color="text.secondary">10</Typography>
            </Box>
          </Box>
        </ListItem>
      );
    }

    return (
      <ListItem disableGutters key={label} sx={{ py: 0.5 }}>
        <Header />
      </ListItem>
    );
  };

  /* render modal */
  return (
    <Modal open={!!data} onClose={onClose} keepMounted>
      <Box sx={modalStyle}>
        {/* header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            Rigorous Vetting&nbsp;(Fast Growers)
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* grid of cards */}
        <Grid container spacing={2}>
          {data.length ? (
            data.map((stock, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {stock.ticker}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {stock.company_name}
                  </Typography>

                  {stock.vetting_results && Object.keys(stock.vetting_results).length ? (
                    <List dense>
                      {Object.entries(stock.vetting_results).map(([k, v]) => renderMetric(k, v))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoOutlinedIcon sx={{ mr: 0.5, fontSize: 16 }} />
                      No vetting results available.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No fast-growers vetting data available.
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="contained" onClick={onClose} sx={{ px: 3, borderRadius: 999 }}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default FastGrowersVettingModal;
