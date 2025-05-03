// client/src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import io from 'socket.io-client';
import {
  AppBar, Toolbar, Typography, Button, Badge, Menu,
  MenuItem, IconButton, Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';

const Navbar = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const userId = localStorage.getItem('userId');
  
  useEffect(() => {
    const newSocket = io('https://dating-app-backend-hpju.onrender.com');
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (socket && userId) {
      // Listen for new match notifications
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
      
      // Listen for new message notifications
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
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          DatingApp
        </Typography>
        
        <Box sx={{ display: 'flex' }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/discover" 
            startIcon={<PersonIcon />}
          >
            Discover
          </Button>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/matches" 
            startIcon={<ChatIcon />}
          >
            Matches
          </Button>
          
          <IconButton 
            color="inherit" 
            onClick={handleNotificationClick}
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleNotificationClose}
          >
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification, index) => (
                  <MenuItem 
                    key={index}
                    component={RouterLink}
                    to={notification.type === 'match' 
                      ? `/matches` 
                      : `/chat/${notification.matchId}`
                    }
                    onClick={handleNotificationClose}
                  >
                    {notification.message}
                  </MenuItem>
                ))}
                <MenuItem onClick={clearNotifications}>
                  Clear all notifications
                </MenuItem>
              </>
            ) : (
              <MenuItem onClick={handleNotificationClose}>
                No new notifications
              </MenuItem>
            )}
          </Menu>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/profile"
          >
            Profile
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;