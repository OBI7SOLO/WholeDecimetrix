// MUI theme factory for light and dark modes.
import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode values
            background: {
              default: '#f5f6fb',
              paper: '#ffffff',
            },
            text: {
              primary: '#0f172a',
              secondary: '#334155',
            },
          }
        : {
            // Dark mode values
            background: {
              default: '#0f172a',
              paper: '#1e293b',
            },
            text: {
              primary: '#f8fafc',
              secondary: '#cbd5e1',
            },
          }),
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
    },
  });
