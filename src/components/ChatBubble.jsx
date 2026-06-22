import React from 'react';

export default function ChatBubble({ message, isMine }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const status = () => {
    if (!isMine) return null;
    if (message.seen)      return <span style={styles.status}>Seen ✓✓</span>;
    if (message.delivered) return <span style={styles.status}>Delivered ✓✓</span>;
    return <span style={styles.status}>Sent ✓</span>;
  };

  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{ ...styles.bubble, ...(isMine ? styles.mine : styles.theirs) }}>
        <p style={styles.text}>{message.text}</p>
        <div style={styles.meta}>
          <span style={styles.time}>{time}</span>
          {status()}
        </div>
      </div>
    </div>
  );
}

const styles = {
  bubble: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: 16,
    wordBreak: 'break-word'
  },
  mine: {
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    borderBottomRightRadius: 4
  },
  theirs: {
    background: '#1e1e1e',
    borderBottomLeftRadius: 4
  },
  text: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#fff'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    justifyContent: 'flex-end'
  },
  time: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)'
  },
  status: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)'
  }
};