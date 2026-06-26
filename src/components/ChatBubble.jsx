import React, { useState } from 'react'
import api from '../services/api'
import { getSocket } from '../socket/socket'

export default function ChatBubble({ message, isMine, onImageClick, onDeleteMe, onDeleteEveryone }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  if (message.deletedForEveryone) {
    return (
      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2, padding: '0 4px' }}>
        <div style={{ ...s.bubble, background: 'transparent', border: '1px solid #2a2a2a' }}>
          <p style={{ ...s.text, color: '#555', fontStyle: 'italic', fontSize: 13 }}>
            🚫 Message deleted
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2, padding: '0 4px' }}>
      <div style={{ position: 'relative', maxWidth: '78%' }}>

        {/* Long press / tap menu trigger */}
        <div
          style={{ ...s.bubble, ...(isMine ? s.mine : s.theirs) }}
          onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true) }}
          onTouchStart={() => {
            const t = setTimeout(() => setMenuOpen(true), 500)
            window._touchTimer = t
          }}
          onTouchEnd={() => clearTimeout(window._touchTimer)}
          onTouchMove={() => clearTimeout(window._touchTimer)}
        >
          {message.type === 'image' && message.image ? (
            <img
              src={message.image}
              alt="shared"
              style={s.image}
              onClick={() => onImageClick && onImageClick(message.image)}
            />
          ) : (
            <p style={s.text}>{message.text}</p>
          )}
          <div style={s.meta}>
            <span style={s.time}>{time}</span>
            {status()}
          </div>
        </div>

        {/* Delete menu */}
        {menuOpen && (
          <>
            <div style={s.menuOverlay} onClick={() => setMenuOpen(false)} />
            <div style={{ ...s.menu, ...(isMine ? { right: 0 } : { left: 0 }) }}>
              <button style={s.menuItem} onClick={handleDeleteMe} disabled={deleting}>
                🗑️ Delete for me
              </button>
              {isMine && (
                <button style={{ ...s.menuItem, color: '#ff4d6d' }} onClick={handleDeleteEveryone} disabled={deleting}>
                  ❌ Delete for everyone
                </button>
              )}
              <button style={{ ...s.menuItem, color: '#666' }} onClick={() => setMenuOpen(false)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  bubble: {
    padding: '9px 13px',
    borderRadius: 20,
    wordBreak: 'break-word',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    cursor: 'default',
    userSelect: 'none'
  },
  mine: {
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    borderBottomRightRadius: 5
  },
  theirs: {
    background: '#1e1e2e',
    borderBottomLeftRadius: 5
  },
  text: { fontSize: 15, lineHeight: 1.5, color: '#fff', margin: 0 },
  image: { width: '100%', maxWidth: 220, height: 'auto', borderRadius: 12, cursor: 'pointer', display: 'block' },
  meta: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  status: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  menuOverlay: {
    position: 'fixed', inset: 0, zIndex: 100
  },
  menu: {
    position: 'absolute',
    bottom: '110%',
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 14,
    padding: '6px',
    zIndex: 200,
    minWidth: 180,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
  },
  menuItem: {
    display: 'block',
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#f0f0f0',
    padding: '10px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    borderRadius: 10,
    fontFamily: 'inherit'
  }
}