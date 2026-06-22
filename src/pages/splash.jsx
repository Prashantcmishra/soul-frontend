import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Splash() {
  const navigate = useNavigate();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(token ? '/chat' : '/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.logo}>🌙</div>
      <h1 style={styles.name}>Soul</h1>
      <p style={styles.sub}>just the two of us</p>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d0d0d',
    gap: 12
  },
  logo: {
    fontSize: 64,
    animation: 'pulse 2s infinite'
  },
  name: {
    fontSize: 48,
    fontWeight: 300,
    letterSpacing: 8,
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  sub: {
    fontSize: 13,
    color: '#444',
    letterSpacing: 3
  }
};