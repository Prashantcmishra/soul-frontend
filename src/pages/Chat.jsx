import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../redux/authSlice'
import { connectSocket, getSocket, disconnectSocket } from '../socket/socket'
import ChatBubble from '../components/ChatBubble'
import api from '../services/api'

export default function Chat() {
  const { user, token } = useSelector((s) => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewImg, setPreviewImg] = useState(null)
  const [inputRows, setInputRows] = useState(1)

  const bottomRef = useRef(null)
  const typingTimer = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Fix mobile viewport height (Chrome mobile address bar issue)
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)
    return () => window.removeEventListener('resize', setVh)
  }, [])

  useEffect(() => {
    api.get('/messages/other-user').then(({ data }) => setOtherUser(data))
    loadMessages(1)
  }, [])

  useEffect(() => {
    const socket = connectSocket(token)

    socket.on('receive_message', (msg) => {
      setMessages((p) => [...p, msg])
      socket.emit('mark_seen')
    })
    socket.on('message_saved', (msg) => setMessages((p) => [...p, msg]))
    socket.on('messages_seen', () =>
      setMessages((p) => p.map((m) =>
        m.sender === user.username ? { ...m, seen: true } : m
      ))
    )
    socket.on('typing', () => setIsTyping(true))
    socket.on('stop_typing', () => setIsTyping(false))
    socket.on('user_online', () =>
      setOtherUser((p) => p ? { ...p, isOnline: true } : p)
    )
    socket.on('user_offline', ({ lastSeen }) =>
      setOtherUser((p) => p ? { ...p, isOnline: false, lastSeen } : p)
    )
    socket.emit('mark_seen')

    return () => disconnectSocket()
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (pg) => {
    setLoadingMore(true)
    try {
      const { data } = await api.get(`/messages?page=${pg}`)
      if (data.length < 30) setHasMore(false)
      setMessages((p) => pg === 1 ? data : [...data, ...p])
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleTyping = (e) => {
    setText(e.target.value)

    // Auto grow textarea up to 4 rows
    const rows = Math.min(4, e.target.value.split('\n').length)
    setInputRows(rows)

    const socket = getSocket()
    if (!socket) return
    socket.emit('typing')
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('stop_typing'), 1000)
  }

  const sendMessage = useCallback(() => {
    if (!text.trim()) return
    getSocket()?.emit('send_message', { text: text.trim() })
    setText('')
    setInputRows(1)
    getSocket()?.emit('stop_typing')
  }, [text])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB allowed.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data: savedMsg } = await api.post('/messages/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      getSocket()?.emit('new_image_message', savedMsg)
      setMessages((p) => [...p, savedMsg])
    } catch (err) {
      alert('Image upload failed. Try again.')
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleLogout = () => {
    disconnectSocket()
    dispatch(logout())
    navigate('/login')
  }

  const formatLastSeen = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const isToday = d.toDateString() === new Date().toDateString()
    return `Last seen ${isToday ? 'today' : d.toLocaleDateString()} at ${time}`
  }

  const otherName = user?.username === 'prashant' ? 'Your Girl ❤️' : 'Your Boy ❤️'
  const avatarLetter = user?.username === 'prashant' ? 'G' : 'B'
  const statusText = otherUser?.isOnline
    ? 'Online'
    : isTyping
    ? 'Typing...'
    : formatLastSeen(otherUser?.lastSeen)
  const statusColor = otherUser?.isOnline ? '#4ade80' : isTyping ? '#b5179e' : '#555'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html { height: 100%; }
        body { height: 100%; background: #0d0d0d; overflow: hidden; }
        #root { height: 100%; height: calc(var(--vh, 1vh) * 100); }
        textarea:focus { outline: none; }
        textarea { resize: none; font-family: inherit; }
        ::-webkit-scrollbar { width: 0px; }
        .msg-area { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }
      `}</style>

      <div style={s.shell}>

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.avatar}>{avatarLetter}</div>
            <div>
              <div style={s.headerName}>{otherName}</div>
              <div style={{ ...s.statusRow }}>
                {otherUser?.isOnline && (
                  <span style={{ ...s.dot, background: statusColor }} />
                )}
                {isTyping && !otherUser?.isOnline && (
                  <span style={{ ...s.dot, background: statusColor }} />
                )}
                <span style={{ ...s.statusText, color: statusColor }}>
                  {statusText}
                </span>
              </div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="msg-area" style={s.messages}>
          {hasMore && (
            <button
              style={s.loadOlder}
              onClick={() => { const n = page + 1; setPage(n); loadMessages(n) }}
              disabled={loadingMore}
            >
              {loadingMore ? '⏳' : '↑ Load older messages'}
            </button>
          )}

          {messages.map((msg, i) => (
            <ChatBubble
              key={msg._id || i}
              message={msg}
              isMine={msg.sender === user.username}
              onImageClick={(url) => setPreviewImg(url)}
            />
          ))}

          <div ref={bottomRef} style={{ height: 6 }} />
        </div>

        {/* ── Input Bar ── */}
        <div style={s.inputBar}>
          {/* Image picker */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
          <button
            style={s.iconBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <span style={{ fontSize: 18 }}>⏳</span>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </button>

          {/* Text area */}
          <div style={s.inputWrap}>
            <textarea
              ref={textareaRef}
              rows={inputRows}
              style={s.textarea}
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
            />
          </div>

          {/* Send button */}
          <button
            style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.3 }}
            onClick={sendMessage}
            disabled={!text.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        {/* ── Full Image Preview ── */}
        {previewImg && (
          <div style={s.overlay} onClick={() => setPreviewImg(null)}>
            <img
              src={previewImg}
              alt="preview"
              style={s.overlayImg}
              onClick={(e) => e.stopPropagation()}
            />
            <button style={s.overlayClose} onClick={() => setPreviewImg(null)}>
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  )
}

const s = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    height: 'calc(var(--vh, 1vh) * 100)',
    background: '#0d0d0d',
    maxWidth: 700,
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    background: '#111111',
    borderBottom: '1px solid #1c1c1c',
    flexShrink: 0,
    zIndex: 10
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
    letterSpacing: 0
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f5f5',
    letterSpacing: 0.2
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 2
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400'
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  messages: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '16px 10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  loadOlder: {
    alignSelf: 'center',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 20,
    color: '#666',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 12,
    marginBottom: 12,
    fontFamily: 'inherit'
  },

  inputBar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '10px 12px',
    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
    background: '#111111',
    borderTop: '1px solid #1c1c1c',
    flexShrink: 0
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2
  },
  inputWrap: {
    flex: 1,
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 22,
    padding: '10px 16px',
    minWidth: 0,
    display: 'flex',
    alignItems: 'center'
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#f0f0f0',
    fontSize: 15,
    lineHeight: 1.5,
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    maxHeight: 96,
    overflowY: 'auto'
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    border: 'none',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginBottom: 0
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.96)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer'
  },
  overlayImg: {
    maxWidth: '95vw',
    maxHeight: '88vh',
    objectFit: 'contain',
    borderRadius: 10
  },
  overlayClose: {
    position: 'fixed',
    top: 18,
    right: 16,
    background: '#222',
    border: 'none',
    borderRadius: '50%',
    width: 38,
    height: 38,
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit'
  }
}