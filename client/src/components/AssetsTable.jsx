import { useEffect, useMemo, useState } from 'react';
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
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AssetsTable() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadAssets = useMemo(
    () =>
      async function fetchAssets() {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/assets`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error('Error obteniendo activos');
          }

          const data = await response.json();
          setAssets(data);
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
    loadAssets();
  }, [loadAssets]);

  const openEdit = (asset) => {
    setSelected({ ...asset });
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
      const response = await fetch(`${API_URL}/assets/${selected._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selected.name,
          type: selected.type,
          lat: Number(selected.lat),
          lng: Number(selected.lng),
        }),
      });

      if (!response.ok) throw new Error('No se pudo actualizar el activo');
      await loadAssets();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('¿Eliminar este activo?');
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo eliminar el activo');
      setAssets((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity='error'>{error}</Alert>;

  const formatCoord = (value) =>
    Number.isFinite(value) ? Number(value).toFixed(5) : '-';

  const formatCreator = (createdBy) => {
    if (!createdBy) return '—';
    if (createdBy.email) return createdBy.email;
    return `…${String(createdBy).slice(-6)}`;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1040 }}>
      <Typography variant='h6' sx={{ mb: 2, fontWeight: 700 }}>
        Activos registrados
      </Typography>
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
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Latitud</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Longitud</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Creado por</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset._id} hover>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell>{formatCoord(asset.lat)}</TableCell>
                <TableCell>{formatCoord(asset.lng)}</TableCell>
                <TableCell>{formatCreator(asset.createdBy)}</TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <Button size='small' variant='outlined' onClick={() => openEdit(asset)}>
                      Editar
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      color='error'
                      onClick={() => handleDelete(asset._id)}
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
        <DialogTitle>Editar activo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Nombre'
              value={selected?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
            />
            <TextField
              label='Tipo'
              value={selected?.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              fullWidth
            />
            <TextField
              label='Latitud'
              value={selected?.lat ?? ''}
              onChange={(e) => handleChange('lat', e.target.value)}
              fullWidth
            />
            <TextField
              label='Longitud'
              value={selected?.lng ?? ''}
              onChange={(e) => handleChange('lng', e.target.value)}
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
