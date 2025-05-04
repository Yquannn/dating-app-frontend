import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  Container, Paper, TextField, Button, Typography, Box, CircularProgress,
  Avatar, Divider, IconButton, Badge
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Initialize socket connection
  useEffect(() => {
// Chat.js
const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
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
  
  // Join chat room and set up event listeners
  useEffect(() => {
    if (!socket || !matchId || !userId) return;
    
    console.log('Joining chat room:', matchId);
    socket.emit('join_chat', { chatId: matchId, userId });
    
    // Set up message listener
    const messageListener = (message) => {
      console.log('New message received:', message);
      setMessages((prevMessages) => {
        // Check if message already exists to prevent duplicates
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
    
    // Set up typing listener
    const typingListener = (typingUserId) => {
      if (typingUserId !== userId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };
    
    socket.on('receive_message', messageListener);
    socket.on('user_typing', typingListener);
    
    // Load match info and previous messages
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
  
  // Handle typing event with debounce
  const handleTyping = () => {
    if (!socket || !matchId) return;
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    socket.emit('typing', { chatId: matchId, userId });
    
    const timeout = setTimeout(() => {
      // You can emit a 'stop_typing' event here if needed
    }, 1000);
    
    setTypingTimeout(timeout);
  };
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    // Only scroll if user is already at the bottom or is sender of last message
    const shouldScroll = messagesEndRef.current && (
      messages.length > 0 && 
      messages[messages.length - 1].sender === userId
    );
    
    if (shouldScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userId]);
  
  // Group messages by date
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
  
  // Handle sending a message
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
    
    // Optimistically add message to UI
    const optimisticMessage = { ...messageData, _id: `temp-${Date.now()}` };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    // Send to socket for real-time delivery
    socket.emit('send_message', messageData);
    
    // Save to database
    try {
      const response = await axios.post('/api/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Replace optimistic message with saved message
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticMessage._id ? response.data : msg
        )
      );
    } catch (error) {
      console.error('Error saving message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      alert('Failed to send message. Please try again.');
    }
  };
  
  // Format time to display
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if message is from the same sender as previous
  const isSequentialMessage = (message, index) => {
    if (index === 0) return false;
    
    const prevMessage = messages[index - 1];
    return message.sender === prevMessage.sender && 
           new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 60000; // 1 minute
  };
  
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  const groupedMessages = groupMessagesByDate();
  
  return (
    <Container maxWidth="md" sx={{ px: { xs: 0, sm: 2 } }}>
      <Paper 
        elevation={3} 
        sx={{ 
          height: '85vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: { xs: 0, sm: 2 },
          overflow: 'hidden'
        }}
      >
        {/* Chat Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'primary.main',
          color: 'white'
        }}>
          <IconButton 
            color="inherit" 
            sx={{ mr: 1 }}
            onClick={() => navigate('/matches')}
          >
            <ArrowBackIcon />
          </IconButton>
          
          {matchInfo && (
            <>
              <Avatar 
                src={matchInfo.partner?.photos?.[0] || ''} 
                alt={matchInfo.partnerName}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" noWrap>
                  {matchInfo.partnerName}
                </Typography>
                {isTyping && (
                  <Typography variant="caption" color="inherit">
                    Typing...
                  </Typography>
                )}
              </Box>
              <IconButton color="inherit">
                <MoreVertIcon />
              </IconButton>
            </>
          )}
        </Box>
        
        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          backgroundColor: '#f5f5f5'
        }}>
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <Box key={date}>
              {/* Date Divider */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                my: 2
              }}>
                <Divider sx={{ flexGrow: 1 }} />
                <Typography variant="caption" sx={{ mx: 2, color: 'text.secondary' }}>
                  {new Date(date).toLocaleDateString(undefined, { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Divider sx={{ flexGrow: 1 }} />
              </Box>
              
              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isMine = message.sender === userId;
                const isSequential = isSequentialMessage(message, messages.indexOf(message));
                
                return (
                  <Box 
                    key={message._id || `temp-${index}`} 
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
                        maxWidth: '75%'
                      }}
                    >
                      {!isMine && !isSequential && (
                        <Avatar 
                          src={matchInfo?.partner?.photos?.[0] || ''} 
                          alt={matchInfo?.partnerName}
                          sx={{ width: 28, height: 28, mr: 1 }}
                        />
                      )}
                      
                      {!isMine && isSequential && (
                        <Box sx={{ width: 28, mr: 1 }} /> // Spacer for alignment
                      )}
                      
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2,
                          borderTopRightRadius: isMine && !isSequential ? 0 : 2,
                          borderTopLeftRadius: !isMine && !isSequential ? 0 : 2,
                          ml: isMine ? 'auto' : 0,
                          backgroundColor: isMine ? 'primary.main' : 'white',
                          color: isMine ? 'white' : 'inherit',
                          boxShadow: 1
                        }}
                      >
                        <Typography variant="body1">{message.text}</Typography>
                      </Paper>
                    </Box>
                    
                    {/* Time stamp */}
                    {!isSequential && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ mt: 0.5, mx: isMine ? 0 : 4 }}
                      >
                        {formatMessageTime(message.createdAt)}
                      </Typography>
                    )}
                  </Box>
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
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'white'
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
                borderRadius: 5
              }
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;