// components/Layout/ThemeProvider.jsx
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const ThemeProvider = ({ children }) => {
  const { mode, color } = useSelector((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'theme-blue', 'theme-purple', 'theme-green', 'theme-red', 'theme-orange');
    
    // Add current theme classes
    root.classList.add(mode);
    root.classList.add(`theme-${color}`);
    
  }, [mode, color]);

  return children;
};

export default ThemeProvider;