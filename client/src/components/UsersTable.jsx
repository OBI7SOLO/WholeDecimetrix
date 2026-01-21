import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function UsersTable() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadUsers = useMemo(
    () =>
      async function fetchUsers() {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 401 || response.status === 403) {
            dispatch(logout());
            throw new Error('Sesión expirada');
          }

          if (!response.ok) {
            throw new Error('Error obteniendo usuarios');
          }

          const data = await response.json();
          setUsers(data);
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
    [],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEdit = (user) => {
    setSelected({ ...user });
    setModalOpen(true);
  };

  const openCreate = () => {
    setSelected({ email: '', role: 'operator', password: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const handleChange = (field, value) => {
    setSelected((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isNew = !selected._id;
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew
        ? `${API_URL}/users`
        : `${API_URL}/users/${selected._id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: selected.email,
          role: selected.role,
          ...(selected.password && { password: selected.password }),
        }),
      });

      if (!response.ok)
        throw new Error(
          isNew ? 'Error creando usuario' : 'No se pudo actualizar el usuario',
        );

      await loadUsers();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('¿Eliminar este usuario?');
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo eliminar el usuario');
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity='error'>{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant='contained' onClick={openCreate}>
          Crear Usuario
        </Button>
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        user.role === 'admin' ? '#ffebee' : '#e3f2fd',
                      color: user.role === 'admin' ? '#c62828' : '#1565c0',
                      fontWeight: 'bold',
                    }}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => openEdit(user)}
                    >
                      Editar
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      color='error'
                      onClick={() => handleDelete(user._id)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth='sm'>
        <DialogTitle>
          {selected?._id ? 'Editar usuario' : 'Crear usuario'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Email'
              value={selected?.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={selected?.role || ''}
                label='Rol'
                onChange={(e) => handleChange('role', e.target.value)}
              >
                <MenuItem value='operator'>Operario</MenuItem>
                <MenuItem value='admin'>Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={
                selected?._id
                  ? 'Contraseña (dejar vacío para no cambiar)'
                  : 'Contraseña'
              }
              type='password'
              value={selected?.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleSave} variant='contained' disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
