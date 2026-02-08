import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutAsync } from '../redux/authSlice';
import { toggleTheme } from '../redux/themeSlice';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Map from '../components/Map';
import UsersTable from '../components/UsersTable';
import AssetsTable from '../components/AssetsTable';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const userRole = user?.role;

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const HEADER_HEIGHT = 76;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 12,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 2, md: 3 },
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 0 },
          minHeight: { md: HEADER_HEIGHT },
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(120deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52))'
              : 'linear-gradient(120deg, rgba(30,41,59,0.78), rgba(30,41,59,0.52))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 25px 70px rgba(15,23,42,0.18)'
              : '0 25px 70px rgba(0,0,0,0.5)',
        }}
      >
        <Typography
          variant='h5'
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.01em',
            textShadow:
              theme.palette.mode === 'light'
                ? '0 6px 18px rgba(255,255,255,0.65)'
                : 'none',
            mb: { xs: 1, md: 0 },
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          Decimetrix - Mapeo de Activos
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            ml: { xs: 0, md: 2 },
            width: { xs: '100%', md: 'auto' },
            minHeight: 52,
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 52,
            },
            '& .MuiTabs-flexContainer': {
              justifyContent: { xs: 'center', md: 'flex-start' },
            },
            '& .Mui-selected': { color: 'text.primary' },
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
          {userRole === 'admin' && <Tab label='Usuarios' />}
        </Tabs>

        <Box
          sx={{
            ml: { xs: 0, md: 'auto' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'flex-end' },
            gap: 2,
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <IconButton
            sx={{ ml: 1, borderRadius: '50%' }}
            onClick={() => dispatch(toggleTheme())}
            color='inherit'
          >
            {theme.palette.mode === 'dark' ? (
              <LightModeIcon />
            ) : (
              <DarkModeIcon />
            )}
          </IconButton>
          <Avatar
            sx={{
              bgcolor: userRole === 'admin' ? '#d4a017' : '#1565c0',
              width: 40,
              height: 40,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {userRole === 'admin' ? <EngineeringIcon /> : <PersonIcon />}
          </Avatar>
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 1.5,
              backgroundColor: userRole === 'admin' ? '#fef3c7' : '#e3f2fd',
              color: userRole === 'admin' ? '#d4a017' : '#1565c0',
              fontWeight: 600,
              border: '1px solid',
              borderColor: userRole === 'admin' ? '#fde68a' : '#bbdefb',
              textTransform: 'capitalize',
            }}
          >
            {userRole}
          </Box>
          <Button
            variant='contained'
            color='error'
            onClick={handleLogout}
            sx={{
              boxShadow: '0 10px 24px rgba(239,68,68,0.35)',
              borderRadius: 1.5,
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: tabValue !== 0 ? { xs: 2, md: 3 } : 0,
        }}
      >
        {tabValue === 0 && (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Map />
          </Box>
        )}
        {(tabValue === 1 || tabValue === 2) && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {tabValue === 1 && <AssetsTable />}
            {userRole === 'admin' && tabValue === 2 && <UsersTable />}
          </Box>
        )}
      </Box>
    </Box>
  );
}
