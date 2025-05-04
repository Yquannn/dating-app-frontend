import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  Container, Paper, TextField, Button, Typography, Box, CircularProgress,
  Avatar, Divider, IconButton, Badge, Fade, Grow, Menu, MenuItem, 
  ListItemIcon, ListItemText, Chip, useTheme, useMediaQuery,
  Snackbar, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PhotoIcon from '@mui/icons-material/Photo';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const { matchId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [showNotificationMessage, setShowNotificationMessage] = useState(false);
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          subscribeUserToPush();
        }
      });
    }
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('https://dating-app-backend-hpju.onrender.com', {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', newSocket.id);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Subscribe to push notifications
  const subscribeUserToPush = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const publicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with your VAPID public key
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        
        // Send subscription to server
        const token = localStorage.getItem('token');
        await axios.post('/api/push/subscribe', {
          subscription,
          userId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Push notification subscription successful');
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
      }
    }
  };
  
  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
  
  // Show push notification
  const showPushNotification = (message) => {
    if (notificationPermission === 'granted' && matchInfo) {
      const notificationOptions = {
        body: message.text,
        icon: '/logo192.png', // Replace with your PWA icon
        badge: '/badge.png', // Small badge icon
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: message._id,
          chatId: matchId
        },
        actions: [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/reply-icon.png'
          },
          {
            action: 'view',
            title: 'View',
            icon: '/view-icon.png'
          }
        ]
      };
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(
            `New message from ${matchInfo.partnerName}`,
            notificationOptions
          );
        });
      } else {
        new Notification(
          `New message from ${matchInfo.partnerName}`,
          notificationOptions
        );
      }
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        subscribeUserToPush();
        setShowNotificationMessage(true);
      }
    }
  };
  
  // Join chat room and set up event listeners
  useEffect(() => {
    if (!socket || !matchId || !userId) return;
    
    console.log('Joining chat room:', matchId);
    socket.emit('join_chat', { chatId: matchId, userId });
    
    // Set up message listener
    const messageListener = (message) => {
      console.log('New message received:', message);
      
      // Check if chat is not active/in focus
      if (document.hidden && message.sender !== userId) {
        showPushNotification(message);
      }
      
      setMessages((prevMessages) => {
        const exists = prevMessages.some(
          m => m._id === message._id || 
              (m.sender === message.sender && 
               m.text === message.text && 
               new Date(m.createdAt).getTime() === new Date(message.createdAt).getTime())
        );
        
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
    };
    
    const typingListener = (typingUserId) => {
      if (typingUserId !== userId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };
    
    socket.on('receive_message', messageListener);
    socket.on('user_typing', typingListener);
    
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No auth token found');
          setLoading(false);
          return;
        }
        
        const [matchRes, messagesRes] = await Promise.all([
          axios.get(`/api/matches/${matchId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/api/messages/${matchId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setMatchInfo(matchRes.data);
        setMessages(messagesRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      socket.off('receive_message', messageListener);
      socket.off('user_typing', typingListener);
    };
  }, [socket, matchId, userId]);
  
  const handleTyping = () => {
    if (!socket || !matchId) return;
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    socket.emit('typing', { chatId: matchId, userId });
    
    const timeout = setTimeout(() => {}, 1000);
    
    setTypingTimeout(timeout);
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      const shouldScroll = messages.length > 0 && 
        messages[messages.length - 1].sender === userId;
    
      if (shouldScroll) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, userId]);
  
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket || !matchId) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No auth token found');
      return;
    }
    
    const messageData = {
      chatId: matchId,
      sender: userId,
      text: newMessage,
      createdAt: new Date()
    };
    
    const optimisticMessage = { ...messageData, _id: `temp-${Date.now()}` };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    socket.emit('send_message', messageData);
    
    try {
      const response = await axios.post('/api/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticMessage._id ? response.data : msg
        )
      );
    } catch (error) {
      console.error('Error saving message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      alert('Failed to send message. Please try again.');
    }
  };
  
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const isSequentialMessage = (message, index) => {
    if (index === 0) return false;
    
    const prevMessage = messages[index - 1];
    return message.sender === prevMessage.sender && 
           new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 60000;
  };
  
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 4,
        mt: 4
      }}>
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Container>
    );
  }
  
  const groupedMessages = groupMessagesByDate();
  
  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        px: { xs: 0, sm: 2 },
        pb: { xs: 2, sm: 4 },
        pt: { xs: 0, sm: 4 }
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          height: { xs: '100vh', sm: '85vh' }, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: { xs: 0, sm: 6 },
          overflow: 'hidden',
          background: 'white',
          boxShadow: { xs: 'none', sm: '0 24px 38px -12px rgba(0,0,0,0.1)' }
        }}
      >
        {/* Chat Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: { xs: 1.5, sm: 2 }, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(255,107,107,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20,
              opacity: 0.1,
              transform: 'rotate(30deg)'
            }}
          >
            <Typography variant="h1" sx={{ fontSize: '150px' }}>💌</Typography>
          </Box>
          
          <IconButton 
            color="inherit" 
            sx={{ mr: { xs: 1, sm: 2 } }}
            onClick={() => navigate('/matches')}
          >
            <ArrowBackIcon />
          </IconButton>
          
          {matchInfo && (
            <>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={matchInfo.partner?.photos?.[0] || ''} 
                  alt={matchInfo.partnerName}
                  sx={{ 
                    width: { xs: 40, sm: 48 }, 
                    height: { xs: 40, sm: 48 }, 
                    mr: { xs: 1.5, sm: 2 },
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                {matchInfo.partner?.isOnline && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 2, 
                      right: { xs: 12, sm: 16 },
                      width: { xs: 12, sm: 14 }, 
                      height: { xs: 12, sm: 14 }, 
                      borderRadius: '50%',
                      background: '#4CAF50',
                      border: '2px solid white'
                    }} 
                  />
                )}
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  noWrap
                  sx={{ fontWeight: 'bold' }}
                >
                  {matchInfo.partnerName}
                </Typography>
                {isTyping && (
                  <Typography 
                    variant="caption" 
                    color="inherit"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 0.5,
                      opacity: 0.9
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        gap: 0.5 
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 4, 
                          height: 4, 
                          borderRadius: '50%', 
                          bgcolor: 'white',
                          animation: 'bounce 1.4s ease infinite',
                          '@keyframes bounce': {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-4px)' }
                          }
                        }} 
                      />
                      <Box 
                        sx={{ 
                          width: 4, 
                          height: 4, 
                          borderRadius: '50%', 
                          bgcolor: 'white',
                          animation: 'bounce 1.4s ease infinite 0.2s',
                        }} 
                      />
                      <Box 
                        sx={{ 
                          width: 4, 
                          height: 4, 
                          borderRadius: '50%', 
                          bgcolor: 'white',
                          animation: 'bounce 1.4s ease infinite 0.4s',
                        }} 
                      />
                    </Box>
                    Typing...
                  </Typography>
                )}
              </Box>
              
              <IconButton 
                color="inherit"
                onClick={handleMenuOpen}
              >
                <MoreVertIcon />
              </IconButton>
              
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    minWidth: 180
                  }
                }}
              >
                {notificationPermission !== 'granted' && (
                  <MenuItem onClick={() => {
                    handleMenuClose();
                    requestNotificationPermission();
                  }}>
                    <ListItemIcon>
                      <NotificationsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Enable Notifications</ListItemText>
                  </MenuItem>
                )}
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <DoNotDisturbIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Block</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete Chat</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        
        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: { xs: 1.5, sm: 2 },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#999',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#666',
          },
        }}>
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <Box key={date}>
              {/* Date Divider */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                my: { xs: 1.5, sm: 2 }
              }}>
                <Divider sx={{ flexGrow: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
                <Chip 
                  label={new Date(date).toLocaleDateString(undefined, { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  size="small"
                  sx={{ 
                    mx: 1,
                    backgroundColor: 'white',
                    color: 'text.secondary',
                    fontWeight: 'medium'
                  }}
                />
                <Divider sx={{ flexGrow: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
              </Box>
              
              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isMine = message.sender === userId;
                const isSequential = isSequentialMessage(message, messages.indexOf(message));
                
                return (
                  <Grow
                    in={true}
                    timeout={(messages.indexOf(message) + 1) * 100}
                    key={message._id || `temp-${index}`}
                  >
                    <Box 
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        mb: isSequential ? 0.5 : 2
                      }}
                    >
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'flex-end',
                          maxWidth: '80%'
                        }}
                      >
                        {!isMine && !isSequential && (
                          <Avatar 
                            src={matchInfo?.partner?.photos?.[0] || ''} 
                            alt={matchInfo?.partnerName}
                            sx={{ width: 24, height: 24, mr: 1 }}
                          />
                        )}
                        
                        {!isMine && isSequential && (
                          <Box sx={{ width: 24, mr: 1 }} />
                        )}
                        
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: { xs: 1.5, sm: 2 }, 
                            borderRadius: 3,
                            borderTopRightRadius: isMine && isSequential ? 3 : 0,
                            borderTopLeftRadius: !isMine && isSequential ? 3 : 0,
                            ml: isMine ? 'auto' : 0,
                            background: isMine 
                              ? 'linear-gradient(45deg, #FF6B6B, #4ECDC4)' 
                              : 'white',
                            color: isMine ? 'white' : 'inherit',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              width: 0,
                              height: 0,
                              ...(isMine && !isSequential && {
                                bottom: 0,
                                right: -8,
                                borderLeft: '8px solid transparent',
                                borderTop: '8px solid',
                                borderTopColor: '#4ECDC4'
                              }),
                              ...(!isMine && !isSequential && {
                                bottom: 0,
                                left: -8,
                                borderRight: '8px solid transparent',
                                borderTop: '8px solid white'
                              })
                            }
                          }}
                        >
                          <Typography 
                            variant="body1"
                            sx={{ 
                              lineHeight: 1.5,
                              wordBreak: 'break-word'
                            }}
                          >
                            {message.text}
                          </Typography>
                        </Paper>
                      </Box>
                      
                      {/* Time stamp and status */}
                      {!isSequential && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5, 
                            mx: isMine ? 0 : 3 
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                          >
                            {formatMessageTime(message.createdAt)}
                          </Typography>
                          {isMine && (
                            <CheckIcon 
                              sx={{ 
                                fontSize: 14, 
                                color: 'success.main' 
                              }} 
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grow>
                );
              })}
            </Box>
          ))}
          
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Message Input */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: { xs: 1.5, sm: 2 },
          gap: 1,
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'white',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.05)'
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            size="small"
            multiline
            maxRows={4}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 5,
                backgroundColor: '#f5f7fa',
                '&:hover': {
                  backgroundColor: '#f0f2f5',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                }
              }
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'action.disabledBackground',
                color: 'action.disabled'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
      
      {/* Notification permission snackbar */}
      <Snackbar
        open={showNotificationMessage}
        autoHideDuration={6000}
        onClose={() => setShowNotificationMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowNotificationMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Notifications enabled! You'll receive alerts for new messages.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Chat;