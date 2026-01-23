import { useState, useEffect } from 'react';
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

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5001');

export default function CreateAssetModal({
  open,
  onClose,
  onAssetCreated,
  initialCoords,
}) {
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    lat: '',
    lng: '',
    comments: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialCoords) {
      setFormData((prev) => ({
        ...prev,
        lat: String(Number(initialCoords.lat).toFixed(6)),
        lng: String(Number(initialCoords.lng).toFixed(6)),
      }));
    }
  }, [open, initialCoords]);

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
          comments: formData.comments,
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
    setFormData({ name: '', type: '', lat: '', lng: '', comments: '' });
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
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem', pb: 1 }}>
        Crear Nuevo Activo
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>
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
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <FormControl fullWidth margin='normal'>
          <InputLabel>Tipo</InputLabel>
          <Select
            name='type'
            value={formData.type}
            onChange={handleChange}
            label='Tipo'
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value='Pozo'>Pozo</MenuItem>
            <MenuItem value='Motor'>Motor</MenuItem>
            <MenuItem value='Transformador'>Transformador</MenuItem>
          </Select>
        </FormControl>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <TextField
            fullWidth
            label='Latitud'
            name='lat'
            type='number'
            value={formData.lat}
            onChange={handleChange}
            margin='none'
            inputProps={{ step: '0.0001' }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            fullWidth
            label='Longitud'
            name='lng'
            type='number'
            value={formData.lng}
            onChange={handleChange}
            margin='none'
            inputProps={{ step: '0.0001' }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </div>
        <TextField
          fullWidth
          label='Comentarios'
          name='comments'
          multiline
          rows={3}
          value={formData.comments}
          onChange={handleChange}
          margin='normal'
          InputProps={{ sx: { borderRadius: 2 } }}
          sx={{ mt: 3 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          variant='outlined'
          sx={{ borderRadius: 2, px: 3 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading}
          sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
        >
          {loading ? 'Creando...' : 'Crear Activo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
