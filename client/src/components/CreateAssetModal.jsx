import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CreateAssetModal({ open, onClose, onAssetCreated }) {
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    lat: '',
    lng: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);

      if (
        !formData.name ||
        !formData.type ||
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        throw new Error('Todos los campos son requeridos');
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error(
          'Lat debe estar entre -90 y 90, y Lng entre -180 y 180',
        );
      }

      const response = await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          lat,
          lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el activo');
      }

      setFormData({ name: '', type: '', lat: '', lng: '' });
      onAssetCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', type: '', lat: '', lng: '' });
    setError('');
    onClose();
    // Evitar warning de focus retenido en contenedores aria-hidden
    requestAnimationFrame(() => document.activeElement?.blur());
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      disableRestoreFocus
    >
      <DialogTitle>Crear Nuevo Activo</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label='Nombre del Activo'
          name='name'
          value={formData.name}
          onChange={handleChange}
          margin='normal'
          autoFocus
        />
        <FormControl fullWidth margin='normal'>
          <InputLabel>Tipo</InputLabel>
          <Select
            name='type'
            value={formData.type}
            onChange={handleChange}
            label='Tipo'
          >
            <MenuItem value='Pozo'>Pozo</MenuItem>
            <MenuItem value='Motor'>Motor</MenuItem>
            <MenuItem value='Transformador'>Transformador</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label='Latitud'
          name='lat'
          type='number'
          value={formData.lat}
          onChange={handleChange}
          margin='normal'
          inputProps={{ step: '0.0001' }}
        />
        <TextField
          fullWidth
          label='Longitud'
          name='lng'
          type='number'
          value={formData.lng}
          onChange={handleChange}
          margin='normal'
          inputProps={{ step: '0.0001' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? 'Creando...' : 'Crear Activo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
