import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../redux/authSlice';
import api from '../services/api';

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(setCredentials(data));
      navigate('/chat');
    } catch (err) {
  setError(`🚫 Temporarily Blocked
Reason: Dil dukha hai. 💔
Retry after a few days...`);
} finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🌙</div>
        <h1 style={styles.title}>Soul</h1>
        <p style={styles.sub}>Welcome back ❤️</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d0d0d'
  },
  card: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 20,
    padding: '48px 40px',
    width: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  logo:  { fontSize: 40 },
  title: {
    fontSize: 32,
    fontWeight: 300,
    letterSpacing: 6,
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  sub:   { fontSize: 13, color: '#555', marginBottom: 16 },
  form:  { width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#f0f0f0',
    fontSize: 14,
    outline: 'none',
    width: '100%'
  },
  button: {
    background: 'linear-gradient(135deg, #b5179e, #7209b7)',
    border: 'none',
    borderRadius: 10,
    padding: '13px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 4
  },
  error: {
  color: '#ff4d6d',
  background: 'rgba(255,77,109,0.08)',
  border: '1px solid rgba(255,77,109,0.3)',
  borderRadius: 10,
  padding: '12px 16px',
  textAlign: 'center',
  whiteSpace: 'pre-line', // <-- Important
  lineHeight: 1.6,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  margin: 0
}
};