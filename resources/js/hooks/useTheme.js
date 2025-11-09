// hooks/useTheme.js
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, setTheme, setColor } from '../store/slices/themeSlice';

export const useTheme = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);

  return {
    theme: theme.mode,
    color: theme.color,
    toggleTheme: () => dispatch(toggleTheme()),
    setTheme: (mode) => dispatch(setTheme(mode)),
    setColor: (color) => dispatch(setColor(color)),
  };
};