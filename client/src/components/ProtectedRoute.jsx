import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, initializing } = useSelector((state) => state.auth);

  if (initializing) {
    return (
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
    );
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to='/dashboard' replace />;
  }

  return children;
}
