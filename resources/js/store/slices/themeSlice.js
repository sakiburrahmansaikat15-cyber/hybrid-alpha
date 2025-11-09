// store/slices/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

const getInitialColor = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('colorTheme') || 'blue';
  }
  return 'blue';
};

const initialState = {
  mode: getInitialTheme(),
  color: getInitialColor(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.mode);
      }
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    setColor: (state, action) => {
      state.color = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('colorTheme', action.payload);
      }
    },
  },
});

export const { toggleTheme, setTheme, setColor } = themeSlice.actions;
export default themeSlice.reducer;