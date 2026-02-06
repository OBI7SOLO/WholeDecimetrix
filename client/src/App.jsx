import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ProtectedRoute from './components/ProtectedRoute';
import { Suspense, lazy, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getTheme } from './theme';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  const mode = useSelector((state) => state.theme.mode);

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense
          fallback={
            <Box
              sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path='/' element={<Navigate to='/dashboard' />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
