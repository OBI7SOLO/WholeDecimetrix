import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSWR from 'swr';
import { Box, Button, CircularProgress } from '@mui/material';
import CreateAssetModal from './CreateAssetModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const { token } = useSelector((state) => state.auth);
  const [openModal, setOpenModal] = useState(false);
  const [markers, setMarkers] = useState([]);

  const {
    data: assets,
    isLoading,
    mutate,
  } = useSWR(token ? `${API_URL}/assets` : null, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.006, 40.7128],
      zoom: 12,
    });

    return () => map.current.remove();
  }, []);

  useEffect(() => {
    if (!map.current || !assets) return;

    // Limpiar marcadores anteriores
    markers.forEach((marker) => marker.remove());

    // Crear nuevos marcadores
    const newMarkers = assets.map((asset) => {
      const el = document.createElement('div');
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = getMarkerColor(asset.type);
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([asset.lng, asset.lat])
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

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
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
    </Box>
  );
}
