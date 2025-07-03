/* StockDetail.jsx */
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Container,
  Stack,
  IconButton,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Slide,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/* ---------- utility helpers ---------- */
const sentimentColor = (s) =>
  s > 0.7 ? 'success' : s >= 0.3 ? 'primary' : s >= -0.3 ? 'warning' : 'error';

const categoryIcon = (c) =>
  c === 'Fast Grower'
    ? <TrendingUpIcon sx={{ fontSize: 20 }} />
    : c === 'Turnaround'
      ? <TrendingDownIcon sx={{ fontSize: 20 }} />
      : <AttachMoneyIcon sx={{ fontSize: 20 }} />;

const formatCap = (cap) => {
  if (!cap) return 'N/A';
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(1)} T`;
  if (cap >= 1e9) return `${(cap / 1e9).toFixed(1)} B`;
  if (cap >= 1e6) return `${(cap / 1e6).toFixed(1)} M`;
  return cap.toLocaleString();
};

/* ---------- tiny components ---------- */
const ValueChip = ({ value, color }) => (
  <Chip label={value} size="small" color={color || 'default'} sx={{ fontWeight: 600 }} />
);

const Gauge = ({ score }) => {
  const pct = Math.min(Math.max(score, -1), 1) * 50 + 50; // -1..1 → 0..100
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 6, bgcolor: 'divider', borderRadius: 3 }}>
      <Box
        sx={{
          position: 'absolute',
          left: `${pct}%`,
          transform: 'translateX(-50%)',
          top: -4,
          width: 2,
          height: 14,
          bgcolor: 'primary.main',
          borderRadius: 1,
        }}
      />
    </Box>
  );
};

const Row = ({ label, children }) => (
  <Stack direction="row" justifyContent="space-between" py={0.75}>
    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '65%' }}>
      {label}
    </Typography>
    {children}
  </Stack>
);

/* ---------- main component ---------- */
const StockDetail = ({
  stock,
  onBack,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onSave,
}) => {
  /* hooks must ALWAYS run, even before early returns */
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [tab, setTab] = useState(0);

  /* memoised radar data (runs unconditionally) */
  const radarData = useMemo(() => {
    const src = stock?.vetting_results ?? {};
    return Object.entries(src)
      .filter(([, v]) => v && typeof v === 'object' && typeof v.score === 'number')
      .map(([k, v]) => ({ factor: k, score: v.score }));
  }, [stock?.vetting_results]);

  /* early return AFTER hooks */
  if (!stock?.info) return <Typography sx={{ p: 4 }}>Loading…</Typography>;
  const { info } = stock;

  /* floating save button */
  const FloatingSave = () => (
    <Slide direction="left" in={!!onSave} mountOnEnter unmountOnExit>
      <IconButton
        size="large"
        onClick={() => onSave(stock?.info?.symbol)}
        sx={{
          position: 'fixed',
          top: 90,
          right: 24,
          zIndex: 1100,
          bgcolor: 'primary.main',
          color: '#fff',
          boxShadow: 6,
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <StarBorderIcon />
      </IconButton>
    </Slide>
  );

  /* quick dashboard data */
  const dashboard = [
    { label: 'Mkt Cap', value: formatCap(info.marketCap) },
    { label: 'P/E (T)', value: info.trailingPE?.toFixed(1) ?? 'N/A' },
    { label: 'Div Yield', value: info.dividendYield ? (info.dividendYield * 100).toFixed(1) + '%' : 'N/A' },
    { label: 'Beta', value: info.beta?.toFixed(2) ?? 'N/A' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <FloatingSave />

      <Button
        onClick={onBack}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }}
        variant="contained"
      >
        Back to Dashboard
      </Button>

      <Card elevation={6} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {/* header */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} mb={2}>
            <Typography variant="h5" fontWeight={700} color="primary.dark">
              {info.longName} ({info.symbol})
            </Typography>
            {stock.category && (
              <Chip
                icon={categoryIcon(stock.category)}
                label={stock.category}
                color={stock.category === 'Fast Grower' ? 'success' : 'info'}
                size="small"
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {info.sector} | {info.industry} | {info.country}
          </Typography>

          {/* tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
            <Tab label="Overview" />
            <Tab label="Financials" />
            <Tab label="AI" />
            <Tab label="Vetting" />
          </Tabs>

          {/* ---------- tab panels ---------- */}
          {tab === 0 && (
            <Typography variant="body2" whiteSpace="pre-wrap">
              {info.longBusinessSummary || 'No business summary available.'}
            </Typography>
          )}

          {tab === 1 && (
            <>
              <Grid container spacing={2} mb={2}>
                {dashboard.map((d) => (
                  <Grid item xs={6} sm={3} key={d.label}>
                    <Stack spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">{d.label}</Typography>
                      <ValueChip value={d.value} />
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 2 }} />
              <Row label="Forward P/E:"><ValueChip value={info.forwardPE?.toFixed(1) ?? 'N/A'} /></Row>
              <Row label="52 Wk High:"><ValueChip value={info.fiftyTwoWeekHigh?.toLocaleString() ?? 'N/A'} /></Row>
              <Row label="52 Wk Low:"><ValueChip value={info.fiftyTwoWeekLow?.toLocaleString() ?? 'N/A'} /></Row>
            </>
          )}

          {tab === 2 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Sentiment Analysis</Typography>
              {stock.sentiment_analysis?.score != null ? (
                <Stack spacing={1}>
                  <Gauge score={stock.sentiment_analysis.score} />
                  <Row label="Score:">
                    <ValueChip
                      value={stock.sentiment_analysis.score.toFixed(2)}
                      color={sentimentColor(stock.sentiment_analysis.score)}
                    />
                  </Row>
                  <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                    {stock.sentiment_analysis.summary || 'No summary.'}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">N/A</Typography>
              )}

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Investment Thesis</Typography>
              <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                {stock.investment_thesis || 'No thesis available.'}
              </Typography>
            </>
          )}

          {tab === 3 && (
            <>
              {/* radar chart */}
              {radarData.length ? (
                <Box sx={{ height: 280, mb: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tickCount={6} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.light}
                        fillOpacity={0.4}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Stack direction="row" spacing={0.5} mb={2}>
                  <InfoOutlinedIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">No scores to chart.</Typography>
                </Stack>
              )}

              {/* detailed rows */}
              {stock.vetting_results && Object.keys(stock.vetting_results).length ? (
                <Box border="1px solid" borderColor="divider" borderRadius={1}>
                  {Object.entries(stock.vetting_results).map(([k, v], i, arr) => (
                    <React.Fragment key={k}>
                      <Row label={k}>
                        {v.pass !== undefined ? (
                          v.pass ? <CheckCircleOutlineIcon color="success" fontSize="small" /> :
                            <CancelOutlinedIcon color="error" fontSize="small" />
                        ) : (
                          <ValueChip value={v.score?.toFixed(2) ?? '—'} color="info" />
                        )}
                      </Row>
                      {i !== arr.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              ) : (
                <Stack direction="row" spacing={0.5}>
                  <InfoOutlinedIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">No vetting data.</Typography>
                </Stack>
              )}
            </>
          )}
          {/* navigation footer */}
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Button
              variant="contained"
              disabled={!hasPrev}
              onClick={onPrev}
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: 'none', flexGrow: 1 }}
            >
              Previous Stock
            </Button>
            <Button
              variant="contained"
              disabled={!hasNext}
              onClick={onNext}
              endIcon={<ArrowForwardIcon />}
              sx={{ textTransform: 'none', flexGrow: 1 }}
            >
              Next Stock
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StockDetail;
