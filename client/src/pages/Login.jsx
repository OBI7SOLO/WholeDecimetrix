import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, loginFailure } from '../redux/authSlice';
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5001');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Email o contraseña inválidos');
      }

      const data = await response.json();
      const decoded = JSON.parse(atob(data.token.split('.')[1]));

      dispatch(loginSuccess({ token: data.token, userRole: decoded.role }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      dispatch(loginFailure(err.message));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth='xs'>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            p: { xs: 3, sm: 4 },
            width: '100%',
          }}
        >
          <Typography
            variant='h4'
            sx={{
              mb: 1,
              textAlign: 'center',
              fontWeight: 700,
              color: '#667eea',
            }}
          >
            Decimetrix
          </Typography>
          <Typography
            variant='body2'
            sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}
          >
            Sistema de Gestión de Activos
          </Typography>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component='form' onSubmit={handleLogin}>
            <TextField
              fullWidth
              label='Email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin='normal'
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Contraseña'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin='normal'
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      aria-label='toggle password visibility'
                      onClick={() => setShowPassword(!showPassword)}
                      edge='end'
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant='contained'
              type='submit'
              size='large'
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
            }}
          >
            <Typography
              variant='caption'
              sx={{ display: 'block', mb: 1, fontWeight: 600 }}
            >
              Credenciales de prueba:
            </Typography>
            <Typography variant='caption' sx={{ display: 'block', mb: 0.5 }}>
              👨‍💼 Admin: admin@example.com / admin123
            </Typography>
            <Typography variant='caption' sx={{ display: 'block' }}>
              👷 Operario: operator@example.com / operator123
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
