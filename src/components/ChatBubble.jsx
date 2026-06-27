import React, { useState, useRef } from 'react'
import api from '../services/api'
import { getSocket } from '../socket/socket'

export default function ChatBubble({ message, isMine, onImageClick, onDeleteMe, onDeleteEveryone }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDots, setShowDots] = useState(false)
  const touchTimer = useRef(null)

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  })

  const status = () => {
    if (!isMine) return null
    if (message.seen) return <span style={s.status}>Seen ✓✓</span>
    if (message.delivered) return <span style={s.status}>Delivered ✓✓</span>
    return <span style={s.status}>Sent ✓</span>
  }

  const handleDeleteMe = async () => {
    setDeleting(true)
    try {
      await api.delete(`/messages/${message._id}/me`)
      onDeleteMe(message._id)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  const handleDeleteEveryone = async () => {
    setDeleting(true)
    try {
      await api.delete(`/messages/${message._id}/everyone`)
      getSocket()?.emit('message_deleted_everyone', { messageId: message._id })
      onDeleteEveryone(message._id)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  const openMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(true)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  // Deleted message — show placeholder
  if (message.deletedForEveryone) {
    return (
      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 4, padding: '0 8px' }}>
        <div style={{ ...s.bubble, background: 'transparent', border: '1px solid #2a2a2a', maxWidth: '78%' }}>
          <p style={{ ...s.text, color: '#555', fontStyle: 'italic', fontSize: 13, margin: 0 }}>
            🚫 Message deleted
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Invisible overlay to close menu when tapping outside */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={closeMenu}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: isMine ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 6,
          marginBottom: 4,
          padding: '0 4px'
        }}
        onMouseEnter={() => setShowDots(true)}
        onMouseLeave={() => !menuOpen && setShowDots(false)}
      >
        {/* Message bubble */}
        <div style={{ position: 'relative', maxWidth: '78%' }}>
          <div
            style={{ ...s.bubble, ...(isMine ? s.mine : s.theirs) }}
            onTouchStart={() => {
              touchTimer.current = setTimeout(() => setMenuOpen(true), 500)
            }}
            onTouchEnd={() => clearTimeout(touchTimer.current)}
            onTouchMove={() => clearTimeout(touchTimer.current)}
            onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true) }}
          >
            {message.type === 'image' && message.image ? (
              <img
                src={message.image}
                alt="shared"
                style={s.image}
                onClick={() => !menuOpen && onImageClick && onImageClick(message.image)}
              />
            ) : (
              <p style={s.text}>{message.text}</p>
            )}
            <div style={s.meta}>
              <span style={s.time}>{time}</span>
              {status()}
            </div>
          </div>

          {/* Delete dropdown menu */}
          {menuOpen && (
            <div style={{
              ...s.menu,
              ...(isMine ? { right: 0 } : { left: 0 })
            }}>
              <button
                style={s.menuItem}
                onClick={handleDeleteMe}
                disabled={deleting}
              >
                <span style={s.menuIcon}>🗑️</span>
                Delete for me
              </button>
              {isMine && (
                <button
                  style={{ ...s.menuItem, ...s.menuItemDanger }}
                  onClick={handleDeleteEveryone}
                  disabled={deleting}
                >
                  <span style={s.menuIcon}>❌</span>
                  Delete for everyone
                </button>
              )}
              <div style={s.menuDivider} />
              <button
                style={{ ...s.menuItem, color: '#666' }}
                onClick={closeMenu}
              >
                <span style={s.menuIcon}>✕</span>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* 3-dot button — always visible on mobile, hover on desktop */}
        <button
          className="dots-btn"

          style={{
            ...s.dotsBtn,
            opacity: (showDots || menuOpen) ? 1 : 0,
            // On mobile always show it
            '@media (max-width: 600px)': { opacity: 1 }
          }}
          onClick={openMenu}
          aria-label="Message options"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#666">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>
    </>
  )
}

const s = {
  bubble: {
    padding: '9px 13px',
    borderRadius: 20,
    wordBreak: 'break-word',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    cursor: 'default',
    userSelect: 'none',
    position: 'relative'
  },
  mine: {
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    borderBottomRightRadius: 5
  },
  theirs: {
    background: '#1e1e2e',
    borderBottomLeftRadius: 5
  },
  text: {
    fontSize: 15,
    lineHeight: 1.5,
    color: '#fff',
    margin: 0
  },
  image: {
    width: '100%',
    maxWidth: 220,
    height: 'auto',
    borderRadius: 12,
    cursor: 'pointer',
    display: 'block'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4
  },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  status: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  // 3-dot button
  dotsBtn: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '50%',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.15s',
    padding: 0,
    marginBottom: 4
  },

  // Dropdown menu
  menu: {
    position: 'absolute',
    bottom: '108%',
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 16,
    padding: '6px',
    zIndex: 999,
    minWidth: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#f0f0f0',
    padding: '11px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    borderRadius: 10,
    fontFamily: 'inherit',
    transition: 'background 0.1s'
  },
  menuItemDanger: {
    color: '#ff4d6d'
  },
  menuIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center'
  },
  menuDivider: {
    height: 1,
    background: '#2a2a3e',
    margin: '4px 8px'
  }
}