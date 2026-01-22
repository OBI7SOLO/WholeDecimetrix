import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import useSocket from '../hooks/useSocket';
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
  Typography,
  Snackbar,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function UsersTable() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (!socket) return;

    socket.on('new-user', (user) => {
      setUsers((prev) => {
        if (prev.find((u) => u._id === user._id)) return prev;
        return [...prev, user];
      });
      setToast({
        open: true,
        message: `Usuario creado: ${user.email}`,
        severity: 'success',
      });
    });

    socket.on('user-updated', (updatedUser) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)),
      );
      setToast({
        open: true,
        message: `Usuario actualizado: ${updatedUser.email}`,
        severity: 'info',
      });
    });

    socket.on('user-deleted', ({ id }) => {
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setToast({
        open: true,
        message: 'Usuario eliminado',
        severity: 'warning',
      });
    });

    return () => {
      socket.off('new-user');
      socket.off('user-updated');
      socket.off('user-deleted');
    };
  }, [socket]);

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  // Estados para el diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

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

      const savedUser = await response.json();
      setUsers((prev) => {
        if (isNew) return [...prev, savedUser];
        return prev.map((u) => (u._id === savedUser._id ? savedUser : u));
      });

      setToast({
        open: true,
        message: isNew
          ? `Usuario creado: ${savedUser.email}`
          : `Usuario actualizado: ${savedUser.email}`,
        severity: isNew ? 'success' : 'info',
      });

      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo eliminar el usuario');
      // La actualización se maneja por websocket
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setToast({
        open: true,
        message: 'Usuario eliminado',
        severity: 'warning',
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity='error'>{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
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
                        user.role === 'admin' ? '#fff8e1' : '#e3f2fd',
                      color: user.role === 'admin' ? '#f57f17' : '#1565c0',
                      fontWeight: 'bold',
                      border: `1px solid ${
                        user.role === 'admin' ? '#ffecb3' : '#bbdefb'
                      }`,
                      textTransform: 'capitalize',
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
                      onClick={() => confirmDelete(user)}
                      sx={{ borderRadius: 2 }}
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

      {/* Dialogo de eliminación (Popup Centrado) */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 4,
            width: '100%',
            maxWidth: '400px',
            p: 1,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          ¿Estás seguro?
        </DialogTitle>
        <DialogContent>
          <Typography textAlign='center' color='text.secondary'>
            ¿Quieres eliminar el usuario <strong>{userToDelete?.email}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
          <Button
            onClick={cancelDelete}
            variant='outlined'
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant='contained'
            color='error'
            sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth='sm'
        PaperProps={{
          sx: { borderRadius: 4, p: 2 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selected?._id ? 'Editar usuario' : 'Crear usuario'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label='Email'
              value={selected?.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={selected?.role || ''}
                label='Rol'
                onChange={(e) => handleChange('role', e.target.value)}
                sx={{ borderRadius: 2 }}
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
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeModal}
            variant='outlined'
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant='contained'
            disabled={saving}
            sx={{ borderRadius: 2, boxShadow: 'none' }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  <Snackbar
    open={toast.open}
    autoHideDuration={4000}
    onClose={() => setToast({ ...toast, open: false })}
  >
    <Alert
      onClose={() => setToast({ ...toast, open: false })}
      severity={toast.severity}
      sx={{ width: '100%' }}
    >
      {toast.message}
    </Alert>
  </Snackbar>;
}
