import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { connectSocket, getSocket, disconnectSocket } from '../socket/socket';
import ChatBubble from '../components/ChatBubble';
import api from '../services/api';

export default function Chat() {
  const { user, token } = useSelector((s) => s.auth);
  const dispatch  = useNavigate();
  const navigate  = useNavigate();

  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping,  setIsTyping]  = useState(false);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const dispatch2   = useDispatch();

  // Load other user info
  useEffect(() => {
    api.get('/messages/other-user').then(({ data }) => setOtherUser(data));
  }, []);

  // Load initial messages
  useEffect(() => {
    loadMessages(1);
  }, []);

  // Connect socket
  useEffect(() => {
    const socket = connectSocket(token);

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      socket.emit('mark_seen');
    });

    socket.on('message_saved', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('messages_seen', () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender === user.username ? { ...m, seen: true } : m))
      );
    });

    socket.on('typing',      () => setIsTyping(true));
    socket.on('stop_typing', () => setIsTyping(false));

    socket.on('user_online', () => {
      setOtherUser((prev) => prev ? { ...prev, isOnline: true } : prev);
    });

    socket.on('user_offline', ({ lastSeen }) => {
      setOtherUser((prev) => prev ? { ...prev, isOnline: false, lastSeen } : prev);
    });

    // Mark messages as seen on load
    socket.emit('mark_seen');

    return () => disconnectSocket();
  }, [token]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (pg) => {
    setLoadingMore(true);
    const { data } = await api.get(`/messages?page=${pg}`);
    if (data.length < 30) setHasMore(false);
    setMessages((prev) => (pg === 1 ? data : [...data, ...prev]));
    setLoadingMore(false);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    loadMessages(next);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    socket.emit('typing');
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('stop_typing'), 1000);
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    getSocket().emit('send_message', { text: text.trim() });
    setText('');
    getSocket().emit('stop_typing');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    dispatch2(logout());
    navigate('/login');
  };

  const formatLastSeen = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Last seen ${isToday ? 'today' : d.toLocaleDateString()} at ${time}`;
  };

  const otherDisplayName =
    user?.username === 'prashant' ? 'Your Girl ❤️' : 'Your Boy ❤️';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerName}>{otherDisplayName}</h2>
          <p style={styles.status}>
            {otherUser?.isOnline
              ? '🟢 Online'
              : isTyping
              ? '✍️ Typing...'
              : formatLastSeen(otherUser?.lastSeen)}
          </p>
          {isTyping && <p style={styles.typing}>Typing...</p>}
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {hasMore && (
          <button onClick={loadMore} style={styles.loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load older messages'}
          </button>
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={msg._id || i}
            message={msg}
            isMine={msg.sender === user.username}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button
          style={{ ...styles.sendBtn, opacity: text.trim() ? 1 : 0.4 }}
          onClick={sendMessage}
          disabled={!text.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0d0d0d',
    maxWidth: 700,
    margin: '0 auto'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #1e1e1e',
    background: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerName: {
    fontSize: 18,
    fontWeight: 500,
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  status: {
    fontSize: 12,
    color: '#555',
    marginTop: 2
  },
  typing: {
    fontSize: 12,
    color: '#b5179e',
    marginTop: 2
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#555',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 12
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  loadMore: {
    alignSelf: 'center',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 20,
    color: '#666',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 12,
    marginBottom: 12
  },
  inputArea: {
    display: 'flex',
    gap: 10,
    padding: '14px 20px',
    borderTop: '1px solid #1e1e1e',
    background: '#111'
  },
  input: {
    flex: 1,
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 24,
    padding: '12px 18px',
    color: '#f0f0f0',
    fontSize: 14,
    outline: 'none'
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    border: 'none',
    borderRadius: '50%',
    width: 46,
    height: 46,
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};