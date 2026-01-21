import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { Box, Button, Typography, Tabs, Tab, Avatar } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import Map from '../components/Map';
import UsersTable from '../components/UsersTable';
import AssetsTable from '../components/AssetsTable';

export default function Dashboard() {
  const { userRole } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const HEADER_HEIGHT = 76;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6fb' }}>
      <Box
        sx={{
          height: HEADER_HEIGHT,
          position: 'sticky',
          top: 0,
          zIndex: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          px: 3,
          background:
            'linear-gradient(120deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 25px 70px rgba(15,23,42,0.18)',
        }}
      >
        <Typography
          variant='h5'
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.01em',
            textShadow: '0 6px 18px rgba(255,255,255,0.65)',
          }}
        >
          Decimetrix - Mapeo de Activos
        </Typography>

        {userRole === 'admin' && (
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              ml: 2,
              minHeight: 52,
              '& .MuiTab-root': {
                color: '#334155',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 52,
              },
              '& .Mui-selected': { color: '#0f172a' },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 999,
                background:
                  'linear-gradient(90deg, rgba(14,165,233,0.9), rgba(99,102,241,0.9))',
                boxShadow: '0 6px 18px rgba(99,102,241,0.35)',
              },
            }}
          >
            <Tab label='Mapa de Activos' />
            <Tab label='Activos' />
            <Tab label='Usuarios' />
          </Tabs>
        )}

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: userRole === 'admin' ? '#0ea5e9' : '#64748b',
              width: 40,
              height: 40,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {userRole === 'admin' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
          </Avatar>
          <Typography variant='body1' sx={{ color: '#0f172a' }}>
            Rol: <strong>{userRole}</strong>
          </Typography>
          <Button
            variant='contained'
            color='error'
            onClick={handleLogout}
            sx={{ boxShadow: '0 10px 24px rgba(239,68,68,0.35)' }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          p: userRole === 'admin' && tabValue !== 0 ? 3 : 0,
        }}
      >
        {tabValue === 0 && <Map />}
        {userRole === 'admin' && tabValue === 1 && <AssetsTable />}
        {userRole === 'admin' && tabValue === 2 && <UsersTable />}
      </Box>
    </Box>
  );
}
