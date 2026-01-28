import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  TablePagination,
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5001');

export default function AssetsTable() {
  const dispatch = useDispatch();
  const { token, userRole } = useSelector((state) => state.auth);
  const [assets, setAssets] = useState([]);
  const socket = useSocket(); // Agregado

  // Estado para notificaciones
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'info' | 'warning' | 'error'
  });

  const userId = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  }, [token]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  // Estados para tabla (paginación, orden, búsqueda)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc'); // 'asc' or 'desc'

  // Estados para el diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  // Manejo de websockets
  useEffect(() => {
    if (!socket) return;

    socket.on('new-asset', (asset) => {
      setAssets((prev) => {
        if (prev.find((a) => a._id === asset._id)) return prev;
        return [asset, ...prev];
      });
      setToast({
        open: true,
        message: `Nuevo activo creado: ${asset.name}`,
        severity: 'success',
      });
    });

    socket.on('asset-updated', (updatedAsset) => {
      setAssets((prev) =>
        prev.map((a) => (a._id === updatedAsset._id ? updatedAsset : a)),
      );
      setToast({
        open: true,
        message: `Activo actualizado: ${updatedAsset.name}`,
        severity: 'info',
      });
    });

    socket.on('asset-deleted', ({ id }) => {
      setAssets((prev) => prev.filter((a) => a._id !== id));
      setToast({
        open: true,
        message: 'Activo eliminado',
        severity: 'warning',
      });
    });

    return () => {
      socket.off('new-asset');
      socket.off('asset-updated');
      socket.off('asset-deleted');
    };
  }, [socket]);

  const loadAssets = useMemo(
    () =>
      async function fetchAssets() {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/assets`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 401 || response.status === 403) {
            dispatch(logout());
            throw new Error('Sesión expirada');
          }

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
          comments: selected.comments || '',
        }),
      });

      if (!response.ok) throw new Error('No se pudo actualizar el activo');

      const updatedAsset = await response.json();
      setAssets((prev) =>
        prev.map((a) => (a._id === updatedAsset._id ? updatedAsset : a)),
      );

      // Si el socket demora, mostramos feedback inmediato de todas formas
      setToast({
        open: true,
        message: `Activo actualizado: ${updatedAsset.name}`,
        severity: 'info',
      });

      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (asset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/${assetToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo eliminar el activo');

      // Actualizamos UI inmediatamente
      setAssets((prev) => prev.filter((a) => a._id !== assetToDelete._id));
      setToast({
        open: true,
        message: 'Activo eliminado',
        severity: 'warning',
      });

      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleAssets = useMemo(() => {
    const filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.comments &&
          asset.comments.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    return filtered.sort((a, b) => {
      let valueA = a[orderBy] || '';
      let valueB = b[orderBy] || '';

      // Extracción segura para ordenamiento
      if (orderBy === 'createdBy') {
        valueA =
          typeof a.createdBy === 'object'
            ? a.createdBy?.email || ''
            : String(a.createdBy || '');
        valueB =
          typeof b.createdBy === 'object'
            ? b.createdBy?.email || ''
            : String(b.createdBy || '');
      }

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueB < valueA) {
        return order === 'asc' ? 1 : -1;
      }
      if (valueB > valueA) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }, [assets, searchTerm, orderBy, order]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity='error'>{error}</Alert>;

  const formatCoord = (value) =>
    Number.isFinite(value) ? Number(value).toFixed(5) : '-';

  const formatCreator = (createdBy) => {
    if (!createdBy) return '—';
    if (createdBy.email) return createdBy.email;
    return `…${String(createdBy).slice(-6)}`;
  };

  const getTypeStyle = (type) => {
    const styles = {
      Pozo: {
        backgroundColor: '#fce4ec',
        color: '#c2185b',
      },
      Motor: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
      },
      Transformador: {
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
      },
    };
    return (
      styles[type] || {
        backgroundColor: '#f5f5f5',
        color: '#616161',
      }
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1040, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems='center'
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          Activos registrados
        </Typography>
        <TextField
          size='small'
          placeholder='Buscar activo...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon color='disabled' />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, backgroundColor: 'white' },
          }}
          sx={{ width: { xs: '100%', sm: 250 } }}
        />
      </Stack>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
          overflowX: 'auto',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              {[
                { id: 'name', label: 'Nombre' },
                { id: 'type', label: 'Tipo' },
                { id: 'lat', label: 'Latitud' },
                { id: 'lng', label: 'Longitud' },
                { id: 'createdBy', label: 'Creado por' },
                { id: 'comments', label: 'Comentarios' },
              ].map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sx={{ fontWeight: 'bold' }}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleAssets
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((asset) => {
                const creatorId = asset.createdBy?._id || asset.createdBy;
                const isOwner =
                  userRole === 'admin' || String(creatorId) === String(userId);

                return (
                  <TableRow key={asset._id} hover>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          ...getTypeStyle(asset.type),
                        }}
                      >
                        {asset.type}
                      </span>
                    </TableCell>
                    <TableCell>{formatCoord(asset.lat)}</TableCell>
                    <TableCell>{formatCoord(asset.lng)}</TableCell>
                    <TableCell>{formatCreator(asset.createdBy)}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {asset.comments || 'Sin comentarios'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Stack
                        direction='row'
                        spacing={1}
                        justifyContent='flex-end'
                      >
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => openEdit(asset)}
                          disabled={!isOwner}
                        >
                          Editar
                        </Button>
                        <Button
                          size='small'
                          variant='outlined'
                          color='error'
                          onClick={() => confirmDelete(asset)}
                          disabled={!isOwner}
                          sx={{ borderRadius: 2 }}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={visibleAssets.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage='Filas por página'
      />

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
            ¿Quieres eliminar el activo <strong>{assetToDelete?.name}</strong>?
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
        <DialogTitle sx={{ fontWeight: 'bold' }}>Editar activo</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label='Nombre'
              value={selected?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <TextField
              select
              label='Tipo'
              value={selected?.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              fullWidth
              InputProps={{ sx: { borderRadius: 2 } }}
              SelectProps={{ native: true }}
            >
              <option value='Pozo'>Pozo</option>
              <option value='Motor'>Motor</option>
              <option value='Transformador'>Transformador</option>
            </TextField>
            <Stack direction='row' spacing={2}>
              <TextField
                label='Latitud'
                value={selected?.lat ?? ''}
                onChange={(e) => handleChange('lat', e.target.value)}
                fullWidth
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                label='Longitud'
                value={selected?.lng ?? ''}
                onChange={(e) => handleChange('lng', e.target.value)}
                fullWidth
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Stack>
            <TextField
              label='Comentarios'
              value={selected?.comments || ''}
              onChange={(e) => handleChange('comments', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder='Añade comentarios sobre este activo...'
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
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

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
      </Snackbar>
    </Box>
  );
}
