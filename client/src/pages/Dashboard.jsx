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

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'white',
          boxShadow: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
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
      <Map />
    </Box>
  );
}
