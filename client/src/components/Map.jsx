import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSWR from 'swr';
import { Box, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import CreateAssetModal from './CreateAssetModal';
import useSocket from '../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Fallback para evitar token undefined
if (!MAPBOX_TOKEN) {
  console.warn('Mapbox token no definido, usando fallback público');
}
mapboxgl.accessToken =
  MAPBOX_TOKEN ||
  // Token público de ejemplo de Mapbox (sin restricciones de dominio)
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.-PK5Dwa9eCEi0aYawslZNg';

// Exponer para debugging en consola
if (typeof window !== 'undefined') {
  window.mapboxgl = mapboxgl;
}

const fetcher = async (url) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Error fetching assets');
  return response.json();
};

const getMarkerColor = (type) => {
  const colors = {
    Pozo: '#FF0000',
    Motor: '#00FF00',
    Transformador: '#0000FF',
  };
  return colors[type] || '#808080';
};

const isValidLngLat = (lng, lat) =>
  Number.isFinite(lng) &&
  Number.isFinite(lat) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const { token } = useSelector((state) => state.auth);
  const [openModal, setOpenModal] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [mapError, setMapError] = useState('');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const socket = useSocket();

  const {
    data: assets,
    isLoading,
    mutate,
  } = useSWR(token ? `${API_URL}/assets` : null, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('new-asset', (asset) => {
      setToast({
        open: true,
        message: `Nuevo activo creado: ${asset.name}`,
        severity: 'success',
      });
      // Refrescar la lista de activos
      mutate();
    });

    return () => {
      socket.off('new-asset');
    };
  }, [socket, mutate]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Validar soporte WebGL
    if (!mapboxgl.supported()) {
      setMapError('Tu navegador no soporta WebGL requerido por Mapbox.');
      return;
    }

    try {
      console.log('Init map with container', mapContainer.current);
      // Arrancamos con OSM para asegurar fondo; luego intentamos Mapbox
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: OSM_FALLBACK_STYLE,
        center: [-74.006, 40.7128],
        zoom: 12,
      });

      let fallbackTimer;

      map.current.on('load', () => {
        console.log('Map load event (OSM baseline)');
        map.current?.resize();

        // Intentar cargar estilo de Mapbox; si falla, se queda en OSM
        map.current?.setStyle(MAP_STYLE);

        fallbackTimer = setTimeout(() => {
          if (map.current && !map.current.isStyleLoaded()) {
            console.warn('Mapbox style no cargó a tiempo, usando OSM fallback');
            map.current.setStyle(OSM_FALLBACK_STYLE);
          }
        }, 4000);
      });

      map.current.on('styledata', () => {
        // Se dispara en cada cambio de estilo; útil para depurar
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error', e.error || e);
        setMapError('No se pudo cargar el mapa (token o red). Revisa consola.');
      });

      map.current.on('style.load', () => {
        console.log('Style loaded');
        if (fallbackTimer) clearTimeout(fallbackTimer);
      });
    } catch (err) {
      console.error('Error inicializando Mapbox', err);
      setMapError('No se pudo inicializar Mapbox.');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !assets) return;

    // Limpiar marcadores anteriores
    markers.forEach((marker) => marker.remove());

    // Filtrar activos válidos
    const validAssets = assets.filter((a) =>
      isValidLngLat(Number(a.lng), Number(a.lat))
    );

    if (validAssets.length !== assets.length) {
      console.warn('Activos inválidos filtrados (lat/lng fuera de rango)');
    }

    // Crear nuevos marcadores
    const newMarkers = validAssets.map((asset) => {
      const el = document.createElement('div');
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = getMarkerColor(asset.type);
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([Number(asset.lng), Number(asset.lat)])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${asset.name}</strong><br>Tipo: ${asset.type}`
          )
        )
        .addTo(map.current);

      return marker;
    });

    setMarkers(newMarkers);
  }, [assets]);

  const handleAddAsset = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleAssetCreated = () => {
    mutate(); // Refrescar los activos
    setOpenModal(false);
  };

  return (
    <Box
      sx={{ position: 'relative', width: '100%', height: '100%' }}
      id='map-wrapper'
    >
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#dfe3f0',
          minHeight: '400px',
        }}
        id='map-container'
      />
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.5)',
            zIndex: 5,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Button
        variant='contained'
        color='primary'
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          borderRadius: '50%',
          minWidth: 60,
          height: 60,
          fontSize: 32,
        }}
        onClick={handleAddAsset}
      >
        +
      </Button>
      <CreateAssetModal
        open={openModal}
        onClose={handleCloseModal}
        onAssetCreated={handleAssetCreated}
      />
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {mapError && (
        <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity='error' sx={{ width: '100%' }}>
            {mapError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
