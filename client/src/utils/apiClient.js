// API client with token handling and refresh flow.
import { API_URL } from '../config';

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiFetch(url, options = {}) {
  const makeRequest = () =>
    fetch(`${API_URL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });

  let response = await makeRequest();

  if (response.status === 401) {
    try {
      await refreshAccessToken();
      response = await makeRequest();
    } catch {
      clearAccessToken();
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
  }

  return response;
}
