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
const DEFAULT_CENTER = [-73.68326960304543, 3.8930383166793945]; // Punto solicitado
const DEFAULT_ZOOM = 12;
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
    Pozo: '#E91E63', // Rosa/Magenta brillante
    Motor: '#4CAF50', // Verde profesional
    Transformador: '#2196F3', // Azul cielo
  };
  return colors[type] || '#9E9E9E'; // Gris para tipos desconocidos
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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const selectedMarker = useRef(null);
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
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      let fallbackTimer;
      let fallbackApplied = false;

      const applyFallback = () => {
        if (map.current && !fallbackApplied) {
          fallbackApplied = true;
          map.current.setStyle(OSM_FALLBACK_STYLE);
        }
      };

      fallbackTimer = setTimeout(() => {
        if (map.current && !map.current.isStyleLoaded()) {
          applyFallback();
        }
      }, 4000);

      map.current.on('load', () => {
        map.current?.resize();
      });

      // Registrar click para crear ping y abrir modal
      map.current.on('click', handleMapClick);

      map.current.on('style.load', () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
      });

      map.current.on('error', () => {
        setMapError(
          'No se pudo cargar el mapa (token o red). Aplicando mapa alterno.',
        );
        applyFallback();
      });
    } catch (err) {
      setMapError('No se pudo inicializar Mapbox.');
    }

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
        map.current.remove();
      }
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !assets) return;

    // Limpiar marcadores anteriores
    markers.forEach((marker) => marker.remove());

    // Filtrar activos válidos
    const validAssets = assets.filter((a) =>
      isValidLngLat(Number(a.lng), Number(a.lat)),
    );

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
            `<strong>${asset.name}</strong><br>Tipo: ${asset.type}`,
          ),
        )
        .addTo(map.current);

      return marker;
    });

    setMarkers(newMarkers);

    // Ajustar vista: si hay activos válidos, ajustar a sus bounds; si no, volver al default
    if (map.current) {
      if (validAssets.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validAssets.forEach((asset) => {
          bounds.extend([Number(asset.lng), Number(asset.lat)]);
        });
        map.current.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      } else {
        map.current.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
      }
    }
  }, [assets]);

  const removeSelectedPing = () => {
    try {
      if (selectedMarker.current) {
        selectedMarker.current.remove();
        selectedMarker.current = null;
      }
    } catch (err) {
      // ignore
    }
    setSelectedLocation(null);
  };

  const ensurePingStyles = () => {
    if (document.getElementById('map-ping-styles')) return;
    const style = document.createElement('style');
    style.id = 'map-ping-styles';
    style.innerHTML = `
      .map-ping { position: relative; width: 18px; height: 18px; }
      .map-ping .inner { width: 12px; height: 12px; background: #ff5252; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); }
      .map-ping .outer { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 18px; height: 18px; border-radius: 50%; background: rgba(255,82,82,0.25); animation: ping 1.4s infinite ease-out; }
      @keyframes ping { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.7 } 70% { transform: translate(-50%,-50%) scale(1.6); opacity: 0 } 100% { opacity: 0 } }
    `;
    document.head.appendChild(style);
  };

  const createPingMarker = (lng, lat) => {
    removeSelectedPing();
    ensurePingStyles();
    const el = document.createElement('div');
    el.className = 'map-ping';
    const outer = document.createElement('div');
    outer.className = 'outer';
    const inner = document.createElement('div');
    inner.className = 'inner';
    el.appendChild(outer);
    el.appendChild(inner);

    selectedMarker.current = new mapboxgl.Marker(el)
      .setLngLat([Number(lng), Number(lat)])
      .addTo(map.current);
  };

  const handleMapClick = (e) => {
    if (!e || !e.lngLat) return;
    const lng = Number(e.lngLat.lng);
    const lat = Number(e.lngLat.lat);
    if (!isValidLngLat(lng, lat)) return;
    createPingMarker(lng, lat);
    setSelectedLocation({ lng, lat });
    setOpenModal(true);
  };

  const handleAddAsset = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    removeSelectedPing();
  };

  const handleAssetCreated = () => {
    mutate(); // Refrescar los activos
    setOpenModal(false);
    removeSelectedPing();
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
        initialCoords={selectedLocation}
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
