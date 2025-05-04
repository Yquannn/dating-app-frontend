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
  const [registrationAvailable, setRegistrationAvailable] = useState(false);
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messageText = newMessage.trim();

  
  // Check notification permission and service worker
  useEffect(() => {
    // Check if service worker is available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setRegistrationAvailable(true);
        console.log('Service Worker ready:', registration.scope);
      }).catch((error) => {
        console.error('Service Worker error:', error);
      });
    }

    // Check notification permission
    if ('Notification' in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        subscribeUserToPush();
      }
    }
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    const initSocket = () => {
      // Ensure token is available
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const newSocket = io('https://dating-app-backend-hpju.onrender.com', {
        transports: ['websocket', 'polling'], // Add polling as fallback
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token: token // Add authentication token
        }
      });
      
      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        // Emit join_chat immediately after connection
        if (matchId && userId) {
          newSocket.emit('join_chat', { chatId: matchId, userId });
        }
      });
      
      newSocket.on('connect_error', (error) => {
      });
      
      newSocket.on('disconnect', (reason) => {
        // Attempt immediate reconnection for certain disconnect reasons
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });
      
      setSocket(newSocket);
    };

    initSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Empty dependency array - initialize once

  // In your Chat component
useEffect(() => {
  const setupNotifications = async () => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notifications not supported');
      return;
    }
    
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeUserToPush();
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };
  
  setupNotifications();
}, []); // Run once on component mount
  
  // Subscribe to push notifications
  const subscribeUserToPush = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const publicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY // Replace with your VAPID public key
        
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
  
  // Show push notification with sender's profile as icon
  const showPushNotification = (message) => {
    if (notificationPermission === 'granted' && matchInfo) {
      // Get the sender's profile photo (partner's photo for received messages)
      const senderPhoto = matchInfo.partner?.photos?.[0] || '/logo192.png';
      
      const notificationOptions = {
        body: message.text,
        icon: senderPhoto, // Use sender's profile photo as icon
        badge: '/badge.png', // Small badge icon
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: message._id,
          chatId: matchId,
          messageId: message._id
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
  
  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User came back to the tab, mark messages as read if needed
        console.log('User is back, marking messages as read');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Join chat room and set up event listeners
  useEffect(() => {
    if (!socket || !matchId || !userId) return;
    
    console.log('Setting up socket event listeners');
    console.log('Current socket:', socket.id);
    console.log('MatchId:', matchId, 'UserId:', userId);
    
    // Set up message listener
    const messageListener = (message) => {
      console.log('📨 New message received:', message);
      console.log('Message ID:', message._id, 'Sender:', message.sender);
      
      setMessages((prevMessages) => {
        console.log('Current messages:', prevMessages.length);
        
        // Ensure every message has a unique ID
        const messageId = message._id || message.id || `socket-${Date.now()}-${message.sender}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a message with guaranteed ID
        const messageWithId = {
          ...message,
          _id: messageId
        };
        
        // Check for duplicate messages more carefully
        const isDuplicate = prevMessages.some(m => {
          // Check by ID if both messages have IDs
          if (m._id && messageWithId._id) {
            return m._id === messageWithId._id;
          }
          
          // Also check by content and timestamp for messages without ID
          const timeDiff = Math.abs(
            new Date(m.createdAt) - new Date(messageWithId.createdAt)
          );
          
          return (
            m.sender === messageWithId.sender &&
            m.text === messageWithId.text &&
            timeDiff < 1000 // Within 1 second
          );
        });
        
        if (isDuplicate) {
          console.log('Message already exists, skipping...');
          return prevMessages;
        }
        
        console.log('Adding new message with ID:', messageId);
        
        // Only show notification for messages from others when tab is not in focus
        // Move notification logic outside the setMessages callback to ensure it runs
        setTimeout(() => {
          if (message.sender !== userId && 
              document.hidden && 
              notificationPermission === 'granted' && 
              matchInfo) {
            console.log('Showing push notification for message from:', matchInfo.partnerName);
            showPushNotification(messageWithId);
          }
        }, 0);
        
        return [...prevMessages, messageWithId];
      });
    };

    
  const typingListener = (data) => {
      console.log('👋 User typing:', data);
      if (data.userId !== userId) {
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
      console.log('Cleaning up socket event listeners');
      socket.off('receive_message', messageListener);
      socket.off('user_typing', typingListener);
    };
  }, [socket, matchId, userId, notificationPermission, matchInfo]);
  
  const handleTyping = () => {
    if (!socket || !matchId || !userId) return;
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (socket.connected) {
      console.log('Emitting typing event');
      socket.emit('typing', { chatId: matchId, userId });
    }
    
    const timeout = setTimeout(() => {
      // Timeout logic here if needed
    }, 1000);
    
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
    
    // Prepare message data
    setNewMessage(''); // Clear input immediately
    
    const messageData = {
      chatId: matchId,
      sender: userId,
      text: messageText,
      createdAt: new Date().toISOString()
    };
    
    // Create optimistic message with a unique temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = { ...messageData, _id: tempId };
    
    
    // Add optimistic message
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Emit through socket IMMEDIATELY
    if (socket.connected) {
   
      socket.emit('send_message', messageData);
    } else {
      console.error('Socket not connected, cannot emit message');
    }
    
    try {
      // Save to database
      const response = await axios.post('/api/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      
      // Update messages to replace temp message with real one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg._id !== tempId);
        
        // Make sure we don't add duplicate
        const alreadyExists = filtered.some(m => m._id === response.data._id);
        if (!alreadyExists) {
          return [...filtered, response.data];
        }
        return filtered;
      });
    } catch (error) {
      console.error('❌ Error saving message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
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
                sx={{ ml: 1 }}
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