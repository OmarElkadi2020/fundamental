import React, { useState, useContext } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Data from './components/Data';
import Settings from './components/Settings';
import { ThemeContext } from './ThemeContext';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

const drawerWidth = 240;
const navItems = [
  { name: 'Home', path: '/', icon: <HomeIcon /> },
  { name: 'About', path: '/about', icon: <InfoIcon /> },
  { name: 'Data', path: '/data', icon: <StorageIcon /> },
  { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const About = () => (
  <div>
    <h2>About Page</h2>
    <p>This is a simple about page for the Fundamental Analysis App.</p>
  </div>
);

function App() {
  const { darkMode } = useContext(ThemeContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const activeLinkStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Fundamental App
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component={NavLink} to={item.path} style={({ isActive }) => isActive ? activeLinkStyle : undefined} sx={{ textAlign: 'center' }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <AppBar component="nav">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
            >
              Fundamental Analysis App
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {navItems.map((item) => (
                <Button key={item.name} sx={{ color: '#fff' }} component={NavLink} to={item.path} style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
                  {item.name}
                </Button>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
        <nav>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        </nav>
        <Box component="main" sx={{ p: 3, width: '100%' }}>
          <Toolbar /> {/* This is to offset content below the AppBar */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/data" element={<Data />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;