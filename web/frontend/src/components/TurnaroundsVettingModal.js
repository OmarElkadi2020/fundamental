import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';


/* ---------- helpers ---------- */
const linearColor = (s: number) => (s > 75 ? '#4caf50' : s > 50 ? '#ffb300' : '#f44336');



/* keep your linearColor helper … */

const toTableRow = (label, raw) => {
  /* 1️⃣  declare a placeholder */
  let valueNode = null;

  /* ---------- build the value cell ---------- */
  if (raw && typeof raw === 'object') {
    /* pass / fail object */
    if (raw.pass !== undefined) {
      valueNode = raw.pass ? (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', fontWeight: 600 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Pass
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', fontWeight: 600 }}>
          <CancelOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Fail
        </Box>
      );
    }
    /* score object */
    else if (raw.score !== undefined) {
      valueNode = (
        <Box sx={{ minWidth: 160 }}>
          <LinearProgress
            variant="determinate"
            value={raw.score}
            sx={{
              height: 6,
              borderRadius: 3,
              mb: 0.5,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': { backgroundColor: linearColor(raw.score) },
            }}
          />
          <Typography variant="caption">{raw.score.toFixed(2)}</Typography>
        </Box>
      );
    }
  }

  /* 2️⃣  default fallback for plain strings / numbers */
  if (valueNode === null) {
    valueNode = (
      <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
        {String(raw)}
      </Typography>
    );
  }

  /* ---------- row ---------- */
  return (
    <TableRow key={label}>
      {/* key / label cell */}
      <TableCell
        component="th"
        scope="row"
        sx={{
          width: '25%',            // fixed 20 %
          fontWeight: 600,
          fontSize: '0.85rem',
          whiteSpace: 'normal',    // ⬅️ allow wrapping
          pr: 2,
          verticalAlign: 'top',
          wordBreak: 'break-word', // wrap long labels if needed
        }}
      >
        {label}
      </TableCell>

      {/* value cell */}
      <TableCell
        sx={{
          lineHeight: 1.45,
          py: 0.75,
          whiteSpace: 'normal',    // ⬅️ allow wrapping
          wordBreak: 'break-word', // wrap long tokens
        }}
      >
        {valueNode}
      </TableCell>
    </TableRow>
  );

};




/* ---------- card list shell ---------- */
const CardGrid = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: '1fr',
        [theme.breakpoints.up('sm')]: { gridTemplateColumns: '1fr 1fr' }, // two per row ≥600 px
      }}
    >
      {children}
    </Box>
  );
};

/* ---------- main component ---------- */
const TurnaroundsVettingModal = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <Modal open={!!data} onClose={onClose} keepMounted>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '94%', sm: '80%', md: '70%' },
          maxWidth: 1200,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 4,
          boxShadow: 24,
          p: { xs: 2.5, md: 4 },
          overflowY: 'auto',
        }}
      >
        {/* header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Rigorous Vetting&nbsp;(Turnarounds)
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* cards */}
        <CardGrid>
          {data.map((stock, i) => (
            <Paper
              key={i}
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 3,
                transition: '0.2s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
              }}
            >
              {/* ticker row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {stock.ticker}
                </Typography>
                {stock.overall_pass !== undefined && (
                  <Tooltip title={stock.overall_pass ? 'Overall Vetting Passed' : 'Overall Vetting Failed'}>
                    {stock.overall_pass ? (
                      <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <CancelOutlinedIcon sx={{ color: 'error.main' }} />
                    )}
                  </Tooltip>
                )}
              </Box>

              {/* company name */}
              {stock.company_name && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {stock.company_name}
                </Typography>
              )}

              {/* overall score */}
              {stock.overall_score !== undefined && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Overall&nbsp;Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stock.overall_score}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 0.5,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: linearColor(stock.overall_score),
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {stock.overall_score.toFixed(2)}%
                  </Typography>
                </Box>
              )}

              {/* table of vetting items */}
              {stock.vetting_results && Object.keys(stock.vetting_results).length ? (
                <Table
                  size="small"
                  sx={{ mt: 1, tableLayout: 'fixed', width: '100%', wordBreak: 'break-word' }}  // ← important
                >
                  <TableBody>
                    {Object.entries(stock.vetting_results).map(([k, v]) => toTableRow(k, v))}
                  </TableBody>
                </Table>

              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  No vetting results available
                </Typography>
              )}
            </Paper>
          ))}
        </CardGrid>

        {/* footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" color="primary" onClick={onClose} sx={{ px: 4, borderRadius: 999 }}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TurnaroundsVettingModal;
