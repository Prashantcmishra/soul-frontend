import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('soul_token');
const user  = localStorage.getItem('soul_user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: token || null,
    user: user ? JSON.parse(user) : null
  },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user  = action.payload.user;
      localStorage.setItem('soul_token', action.payload.token);
      localStorage.setItem('soul_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user  = null;
      localStorage.removeItem('soul_token');
      localStorage.removeItem('soul_user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;