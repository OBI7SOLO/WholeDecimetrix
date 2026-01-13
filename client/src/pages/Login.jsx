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
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Container maxWidth='sm'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h4' sx={{ mb: 3 }}>
          Login - Decimetrix
        </Typography>
        {error && (
          <Alert severity='error' sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component='form' onSubmit={handleLogin} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label='Email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin='normal'
            required
          />
          <TextField
            fullWidth
            label='Contraseña'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin='normal'
            required
          />
          <Button fullWidth variant='contained' type='submit' sx={{ mt: 3 }}>
            Login
          </Button>
        </Box>
        <Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
          Admin: admin@example.com / admin123
          <br />
          Operario: operator@example.com / operator123
        </Typography>
      </Box>
    </Container>
  );
}
