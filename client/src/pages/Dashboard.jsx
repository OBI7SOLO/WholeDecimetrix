import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { Box, Button, Typography } from '@mui/material';
import Map from '../components/Map';

export default function Dashboard() {
  const { userRole } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const HEADER_HEIGHT = 64;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6fb' }}>
      <Box
        sx={{
          height: HEADER_HEIGHT,
          backgroundColor: 'white',
          boxShadow: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
        }}
      >
        <Typography variant='h5'>Decimetrix - Mapeo de Activos</Typography>
        <Box>
          <Typography variant='body1' sx={{ display: 'inline', mr: 2 }}>
            Rol: <strong>{userRole}</strong>
          </Typography>
          <Button variant='contained' color='error' onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        <Map />
      </Box>
    </Box>
  );
}
