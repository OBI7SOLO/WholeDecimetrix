import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import ProtectedRoute from './components/ProtectedRoute';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;
