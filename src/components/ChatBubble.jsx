import React from 'react'

export default function ChatBubble({ message, isMine, onImageClick }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  })

  const status = () => {
    if (!isMine) return null
    if (message.seen) return <span style={s.status}>Seen ✓✓</span>
    if (message.delivered) return <span style={s.status}>Delivered ✓✓</span>
    return <span style={s.status}>Sent ✓</span>
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      marginBottom: 2,
      padding: '0 4px'
    }}>
      <div style={{
        ...s.bubble,
        ...(isMine ? s.mine : s.theirs),
        maxWidth: '78%'
      }}>
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
    </div>
  )
}

const s = {
  bubble: {
    padding: '9px 13px',
    borderRadius: 20,
    wordBreak: 'break-word',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
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
  status: { fontSize: 10, color: 'rgba(255,255,255,0.4)' }
}