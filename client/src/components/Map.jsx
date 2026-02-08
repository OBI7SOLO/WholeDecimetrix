// Mapbox view with assets, clustering, and interactions.
import { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSWR from 'swr';
import {
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import TerrainIcon from '@mui/icons-material/Terrain';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CreateAssetModal from './CreateAssetModal';
import useSocket from '../hooks/useSocket';
import { API_URL } from '../config';
import { apiFetch } from '../utils/apiClient';

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

const MAP_STYLES = {
  streets: {
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
  },
  satellite: {
    light: 'mapbox://styles/mapbox/satellite-streets-v12',
    dark: 'mapbox://styles/mapbox/satellite-v9',
  },
  outdoors: {
    light: 'mapbox://styles/mapbox/outdoors-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
  },
};

const getMapStyle = (styleType, themeMode) => {
  const styles = MAP_STYLES[styleType];
  return styles[themeMode] || styles.light;
};

const DEFAULT_CENTER = [-73.68326960304543, 3.8930383166793945];
const DEFAULT_ZOOM = 12;
const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '\u00a9 OpenStreetMap contributors',
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

mapboxgl.accessToken =
  MAPBOX_TOKEN ||
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.-PK5Dwa9eCEi0aYawslZNg';

if (typeof window !== 'undefined') {
  window.mapboxgl = mapboxgl;
}

const fetcher = async (url) => {
  const response = await apiFetch(url);
  if (!response.ok) throw new Error('Error fetching assets');
  return response.json();
};

const isValidLngLat = (lng, lat) =>
  Number.isFinite(lng) &&
  Number.isFinite(lat) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

// Custom popup styles
const initializePopupStyles = () => {
  if (document.getElementById('mapbox-popup-styles')) return;
  const style = document.createElement('style');
  style.id = 'mapbox-popup-styles';
  style.innerHTML = `
    .mapboxgl-popup-content {
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      border-radius: 0 !important;
    }
    .mapboxgl-popup-tip {
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
};

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const themeMode = useSelector((state) => state.theme.mode);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const selectedMarker = useRef(null);
  const [selectMode, setSelectMode] = useState(false);
  const selectModeRef = useRef(selectMode);
  const clickListenerRef = useRef(null);
  const [currentStyle, setCurrentStyle] = useState('streets');
  const [mapError, setMapError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const hoverPopup = useRef(null);
  const themeModeRef = useRef(themeMode);
  const assetLayersRegistered = useRef(false);
  const fallbackTimerRef = useRef(null);
  const fallbackAppliedRef = useRef(false);
  const lastStyleVersionRef = useRef(-1);
  const styleLoadHandlerRef = useRef(null);
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
  } = useSWR(user ? '/assets' : null, fetcher, {
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
      mutate();
    });

    socket.on('asset-updated', (asset) => {
      setToast({
        open: true,
        message: `Activo actualizado: ${asset.name}`,
        severity: 'info',
      });
      mutate();
    });

    socket.on('asset-deleted', () => {
      setToast({
        open: true,
        message: 'Activo eliminado',
        severity: 'warning',
      });
      mutate();
    });

    return () => {
      socket.off('new-asset');
      socket.off('asset-updated');
      socket.off('asset-deleted');
    };
  }, [socket, mutate]);

  useEffect(() => {
    selectModeRef.current = selectMode;
  }, [selectMode]);

  useEffect(() => {
    themeModeRef.current = themeMode;
  }, [themeMode]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    // Trigger a repaint when theme changes
    setTimeout(() => {
      map.current?.resize();
    }, 0);
  }, [themeMode, mapLoaded]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Reset state for component mount/remount
    lastStyleVersionRef.current = -1;
    assetLayersRegistered.current = false;
    styleLoadHandlerRef.current = null;

    initializePopupStyles();

    if (!mapboxgl.supported()) {
      setMapError('Tu navegador no soporta WebGL requerido por Mapbox.');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyle(currentStyle, themeMode),
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const applyFallback = () => {
        if (map.current && !fallbackAppliedRef.current) {
          fallbackAppliedRef.current = true;
          map.current.setStyle(OSM_FALLBACK_STYLE);
        }
      };

      fallbackTimerRef.current = setTimeout(() => {
        if (map.current && !map.current.isStyleLoaded()) {
          applyFallback();
        }
      }, 5000);

      map.current.on('load', () => {
        setMapLoaded(true);
        map.current?.resize();
      });

      // Check if already loaded (can happen on remount)
      if (map.current.loaded()) {
        setMapLoaded(true);
        map.current.resize();
      }

      clickListenerRef.current = (e) => {
        if (selectModeRef.current) handleMapClick(e);
      };
      map.current.on('click', clickListenerRef.current);

      map.current.on('style.load', () => {
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError(
          'No se pudo cargar el mapa (token o red). Aplicando mapa alterno.',
        );
        applyFallback();
      });
    } catch {
      setMapError('No se pudo inicializar Mapbox.');
    }

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (map.current) {
        if (clickListenerRef.current)
          map.current.off('click', clickListenerRef.current);
        map.current.remove();
      }
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current || !assets) return;

    const sourceId = 'assets-source';
    const clusterLayerId = 'assets-clusters';
    const clusterCountLayerId = 'assets-cluster-count';
    const pointLayerId = 'assets-points';

    const validAssets = assets.filter((asset) =>
      isValidLngLat(Number(asset.lng), Number(asset.lat)),
    );

    const geojson = {
      type: 'FeatureCollection',
      features: validAssets.map((asset) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(asset.lng), Number(asset.lat)],
        },
        properties: {
          id: asset._id,
          name: asset.name,
          type: asset.type,
          comments: asset.comments || 'Sin comentarios',
          creatorEmail: asset.createdBy?.email || 'N/A',
          createdAt: asset.createdAt,
          lat: asset.lat,
          lng: asset.lng,
        },
      })),
    };

    const buildPopup = (feature, lngLat) => {
      const { name, type, comments, creatorEmail, createdAt, lat, lng } =
        feature.properties || {};

      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString('es-ES')
        : 'N/A';

      const coordinates = feature.geometry.coordinates.slice();
      while (Math.abs(lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const currentTheme = themeModeRef.current;
      const bgColor =
        currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
      const nameColor = '#1976d2';
      const typeColor = currentTheme === 'dark' ? '#ffffff' : '#000000';
      const labelColor = currentTheme === 'dark' ? '#b0b0b0' : '#666';
      const valueColor = currentTheme === 'dark' ? '#e0e0e0' : '#333';

      const popupHTML = `
        <div style="min-width: 220px; padding: 12px; background-color: ${bgColor}; border-radius: 6px; backdrop-filter: blur(8px);">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: ${nameColor};">
            ${name}
          </h3>
          <div style="font-size: 13px; line-height: 1.7;">
            <p style="margin: 4px 0;"><span style="color: ${labelColor};"><strong>Tipo:</strong></span> <span style="color: ${typeColor};">${type}</span></p>
            <p style="margin: 4px 0;"><span style="color: ${labelColor};"><strong>Latitud:</strong></span> <span style="color: ${valueColor};">${Number(lat).toFixed(5)}</span></p>
            <p style="margin: 4px 0;"><span style="color: ${labelColor};"><strong>Longitud:</strong></span> <span style="color: ${valueColor};">${Number(lng).toFixed(5)}</span></p>
            <p style="margin: 4px 0;"><span style="color: ${labelColor};"><strong>Creado por:</strong></span> <span style="color: ${valueColor};">${creatorEmail}</span></p>
            <p style="margin: 4px 0;"><span style="color: ${labelColor};"><strong>Fecha:</strong></span> <span style="color: ${valueColor};">${formattedDate}</span></p>
            <p style="margin: 4px 0;"><span style="color: ${labelColor};"><strong>Comentarios:</strong></span> <span style="color: ${valueColor};">${comments}</span></p>
          </div>
        </div>
      `;

      new mapboxgl.Popup({ maxWidth: '300px' })
        .setLngLat(coordinates)
        .setHTML(popupHTML)
        .addTo(map.current);
    };

    const handleClusterClick = (event) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(event.point, {
        layers: [clusterLayerId],
      });
      if (!features.length) return;

      const clusterId = features[0].properties.cluster_id;
      const source = map.current.getSource(sourceId);
      if (!source || typeof source.getClusterExpansionZoom !== 'function')
        return;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.current.easeTo({
          center: features[0].geometry.coordinates,
          zoom,
          duration: 400,
        });
      });
    };

    const handlePointClick = (event) => {
      if (!event.features || !event.features[0]) return;

      // Remove hover popup when clicking
      if (hoverPopup.current) {
        hoverPopup.current.remove();
        hoverPopup.current = null;
      }

      buildPopup(event.features[0], event.lngLat);
    };

    const handleMouseEnter = (event) => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      if (!event.features || !event.features[0]) return;

      const feature = event.features[0];
      const { name, type } = feature.properties || {};

      if (hoverPopup.current) {
        hoverPopup.current.remove();
      }

      const currentTheme = themeModeRef.current;
      const bgColor =
        currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
      const nameColor = '#1976d2';
      const typeColor = currentTheme === 'dark' ? '#ffffff' : '#000000';

      const hoverHTML = `
        <div style="padding: 10px; font-size: 12px; background-color: ${bgColor}; border-radius: 6px; backdrop-filter: blur(8px); min-width: 140px;">
          <strong style="color: ${nameColor};">${name || 'Sin nombre'}</strong><br/>
          <span style="font-size: 11px; color: ${typeColor};">${type || 'N/A'}</span>
        </div>
      `;

      hoverPopup.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -10],
      })
        .setLngLat(event.lngLat)
        .setHTML(hoverHTML)
        .addTo(map.current);
    };

    const handleMouseLeave = () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
      if (hoverPopup.current) {
        hoverPopup.current.remove();
        hoverPopup.current = null;
      }
    };

    const addOrUpdateSource = () => {
      if (!map.current) return;

      if (map.current.getSource(sourceId)) {
        map.current.getSource(sourceId).setData(geojson);
        return;
      }

      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterRadius: 60,
        clusterMaxZoom: 15,
      });
    };

    const addLayers = () => {
      if (!map.current) return;

      if (!map.current.getLayer(clusterLayerId)) {
        map.current.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#0ea5e9',
              10,
              '#0477bf',
              25,
              '#0f172a',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              24,
              25,
              32,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }

      if (!map.current.getLayer(clusterCountLayerId)) {
        map.current.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Inter ExtraBold', 'Roboto Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });
      }

      if (!map.current.getLayer(pointLayerId)) {
        map.current.addLayer({
          id: pointLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match',
              ['get', 'type'],
              'Pozo',
              '#000000',
              'Motor',
              '#D32F2F',
              'Transformador',
              '#FFC107',
              '#9E9E9E',
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
    };

    const registerEvents = () => {
      if (!map.current) return;
      map.current.on('click', clusterLayerId, handleClusterClick);
      map.current.on('click', pointLayerId, handlePointClick);
      map.current.on('mouseenter', pointLayerId, handleMouseEnter);
      map.current.on('mouseleave', pointLayerId, handleMouseLeave);
    };

    const unregisterEvents = () => {
      if (!map.current) return;
      map.current.off('click', clusterLayerId, handleClusterClick);
      map.current.off('click', pointLayerId, handlePointClick);
      map.current.off('mouseenter', pointLayerId, handleMouseEnter);
      map.current.off('mouseleave', pointLayerId, handleMouseLeave);
    };

    const attemptUpdateLayer = () => {
      if (!map.current || !map.current.isStyleLoaded()) {
        return;
      }
      performUpdateLayer();
    };

    const performUpdateLayer = () => {
      if (!map.current) return;

      try {
        addOrUpdateSource();
        addLayers();

        // Register events only once
        if (!assetLayersRegistered.current) {
          registerEvents();
          assetLayersRegistered.current = true;
        }

        if (validAssets.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          validAssets.forEach((asset) => {
            bounds.extend([Number(asset.lng), Number(asset.lat)]);
          });
          map.current.fitBounds(bounds, { padding: 40, maxZoom: 15 });
        } else {
          map.current.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
        }
      } catch (err) {
        console.warn('Error updating asset layers:', err);
      }
    };

    // Check if style version changed (indicates a style change event)
    if (lastStyleVersionRef.current !== styleVersion) {
      lastStyleVersionRef.current = styleVersion;
      assetLayersRegistered.current = false; // Reset event registration on style change
    }

    // Set up style.load listener (remove old one first)
    if (styleLoadHandlerRef.current && map.current) {
      try {
        map.current.off('style.load', styleLoadHandlerRef.current);
      } catch (e) {
        // ignore
      }
      styleLoadHandlerRef.current = null;
    }

    // Create new listener
    styleLoadHandlerRef.current = () => {
      performUpdateLayer();
    };

    if (map.current) {
      map.current.on('style.load', styleLoadHandlerRef.current);
    }

    // Try to update immediately if style is loaded
    if (map.current?.isStyleLoaded()) {
      attemptUpdateLayer();
    }

    return () => {
      // Clean up the listener on unmount
      if (map.current && styleLoadHandlerRef.current) {
        try {
          map.current.off('style.load', styleLoadHandlerRef.current);
        } catch (e) {
          console.warn('Error removing style.load listener:', e);
        }
        styleLoadHandlerRef.current = null;
      }
    };
  }, [assets, mapLoaded, styleVersion]);

  const removeSelectedPing = () => {
    try {
      if (selectedMarker.current) {
        selectedMarker.current.remove();
        selectedMarker.current = null;
      }
    } catch {
      // ignore
    }
    setSelectedLocation(null);
  };

  const handleStyleChange = (event, newStyle) => {
    if (newStyle !== null && newStyle !== currentStyle && map.current) {
      setCurrentStyle(newStyle);
    }
  };

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear any pending fallback timer when changing style manually
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    const newStyle = getMapStyle(currentStyle, themeMode);
    const currentMapStyleUrl = map.current.getStyle().url;
    if (currentMapStyleUrl !== newStyle) {
      // Wait for style to fully load and redraw assets
      const styleLoadHandler = () => {
        setStyleVersion((prev) => prev + 1);
      };
      map.current.once('style.load', styleLoadHandler);
      map.current.setStyle(newStyle, { diff: false });
    }
  }, [themeMode, mapLoaded, currentStyle]);

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
    setSelectMode(false);
  };

  const handleAddAsset = () => {
    setSelectMode(false);
    setOpenModal(true);
  };

  const handleSelectOnMap = () => {
    setSelectMode(true);
    setOpenModal(false);
    removeSelectedPing();
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    removeSelectedPing();
    setSelectMode(false);
  };

  const theme = useTheme();

  const handleAssetCreated = () => {
    mutate();
    setOpenModal(false);
    removeSelectedPing();
    setSelectMode(false);
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
          background: theme.palette.background.default,
          minHeight: '400px',
        }}
        id='map-container'
      />

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: '2%',
          left: '2%',
          zIndex: 1,
          borderRadius: 1.5,
          overflow: 'hidden',
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.85)'
              : 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <ToggleButtonGroup
          value={currentStyle}
          exclusive
          onChange={handleStyleChange}
          aria-label='estilo de mapa'
          size='small'
          sx={{
            '& .MuiToggleButton-root': {
              border: 'none',
              padding: '8px 12px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          <ToggleButton value='streets' aria-label='Calles'>
            <MapIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: 20 }} />
            <Box component='span' sx={{ display: { xs: 'none', sm: 'block' } }}>
              Mapa
            </Box>
          </ToggleButton>
          <ToggleButton value='satellite' aria-label='Satélite'>
            <SatelliteAltIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: 20 }} />
            <Box component='span' sx={{ display: { xs: 'none', sm: 'block' } }}>
              Satélite
            </Box>
          </ToggleButton>
          <ToggleButton value='outdoors' aria-label='Terreno'>
            <TerrainIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: 20 }} />
            <Box component='span' sx={{ display: { xs: 'none', sm: 'block' } }}>
              Terreno
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: '12%',
          left: '2%',
          zIndex: 1,
          borderRadius: '50%',
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.85)'
              : 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Button
          onClick={() =>
            map.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM })
          }
          sx={{
            minWidth: '40px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            p: 0,
            color: theme.palette.mode === 'light' ? '#475569' : '#cbd5e1',
          }}
          aria-label='Centrar mapa'
          title='Centrar mapa'
        >
          <MyLocationIcon />
        </Button>
      </Paper>

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
          bottom: '3%',
          right: '3%',
          borderRadius: '50%',
          minWidth: 60,
          height: 60,
          fontSize: 32,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
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
        onSelectOnMap={handleSelectOnMap}
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
