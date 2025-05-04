// client/src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import io from 'socket.io-client';
import {
  AppBar, Toolbar, Typography, Button, Badge, Menu,
  MenuItem, IconButton, Box, useTheme, useMediaQuery,
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navbar = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userId = localStorage.getItem('userId');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (socket && userId) {
      socket.on('new_match', (data) => {
        setNotifications(prev => [
          ...prev, 
          { 
            type: 'match', 
            message: `You matched with ${data.userName}!`,
            matchId: data.matchId,
            time: new Date()
          }
        ]);
      });
      
      socket.on('new_message', (data) => {
        if (data.sender !== userId) {
          setNotifications(prev => [
            ...prev, 
            { 
              type: 'message', 
              message: `New message from ${data.senderName}`,
              matchId: data.chatId,
              time: new Date()
            }
          ]);
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('new_match');
        socket.off('new_message');
      }
    };
  }, [socket, userId]);
  
  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationClose = () => {
    setAnchorEl(null);
  };
  
  const clearNotifications = () => {
    setNotifications([]);
    handleNotificationClose();
  };
  
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const navigationItems = [
    { text: 'Discover', icon: <PersonIcon />, path: '/discover' },
    { text: 'Matches', icon: <ChatIcon />, path: '/matches' },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
  ];
  
  const mobileDrawer = (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={toggleDrawer(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 250,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        },
      }}
    >
      <Box
        sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column' }}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 24, color: 'primary.main', mr: 1 }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: '"Pacifico", cursive',
              color: 'primary.main'
            }}
          >
            ConnectHeart
          </Typography>
        </Box>
        <List sx={{ flexGrow: 1 }}>
          {navigationItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              component={RouterLink}
              to={item.path}
              sx={{
                py: 2,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: 'medium',
                  color: 'text.primary'
                }} 
              />
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<NotificationsIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleNotificationClick(e);
            }}
            sx={{ 
              borderRadius: 3,
              mb: 2,
            }}
          >
            Notifications ({notifications.length})
          </Button>
          
          <Button
            fullWidth
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/profile"
            sx={{ 
              borderRadius: 3,
            }}
          >
            My Profile
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
  
  return (
    <AppBar 
      position="sticky"
      sx={{
        background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteIcon sx={{ fontSize: 28, color: 'white' }} />
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            component={RouterLink} 
            to="/" 
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 'bold',
              fontFamily: '"Pacifico", cursive',
              letterSpacing: '0.5px'
            }}
          >
            {isMobile ? 'CH' : 'ConnectHeart'}
          </Typography>
        </Box>
        
        {isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color="inherit" 
              onClick={handleNotificationClick}
              sx={{ mr: 1 }}
            >
              <Badge 
                badgeContent={notifications.length} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    animation: notifications.length > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/discover" 
              startIcon={<PersonIcon />}
              sx={{ 
                borderRadius: 3,
                px: 2,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              Discover
            </Button>
            
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/matches" 
              startIcon={<ChatIcon />}
              sx={{ 
                borderRadius: 3,
                px: 2,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              Matches
            </Button>
            
            <IconButton 
              color="inherit" 
              onClick={handleNotificationClick}
              sx={{ 
                borderRadius: 2,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <Badge 
                badgeContent={notifications.length} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    animation: notifications.length > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/profile"
              sx={{ 
                borderRadius: 3,
                px: 2,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              Profile
            </Button>
          </Box>
        )}
      </Toolbar>
      
      {/* Mobile Menu */}
      {mobileDrawer}
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            minWidth: 280,
            maxWidth: 400,
          }
        }}
      >
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification, index) => (
              <MenuItem 
                key={index}
                component={RouterLink}
                to={notification.type === 'match' 
                  ? '/matches' 
                  : `/chat/${notification.matchId}`
                }
                onClick={handleNotificationClose}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                {notification.type === 'match' ? (
                  <FavoriteIcon color="error" sx={{ fontSize: 20 }} />
                ) : (
                  <ChatIcon color="primary" sx={{ fontSize: 20 }} />
                )}
                <Typography variant="body2">
                  {notification.message}
                </Typography>
              </MenuItem>
            ))}
            <MenuItem 
              onClick={clearNotifications}
              sx={{ 
                py: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                color: 'error.main',
                justifyContent: 'center',
              }}
            >
              <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
              Clear all
            </MenuItem>
          </>
        ) : (
          <MenuItem 
            onClick={handleNotificationClose}
            sx={{ 
              py: 1.5,
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <NotificationsIcon sx={{ mr: 1, fontSize: 18, opacity: 0.5 }} />
            No new notifications
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
};

export default Navbar;