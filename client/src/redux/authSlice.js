import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config';
import { setAccessToken, clearAccessToken } from '../utils/apiClient';

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return rejectWithValue(data.message || 'Error de autenticación');
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.user;
  },
);

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
  clearAccessToken();
});

let pendingRefresh = null;

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      if (!pendingRefresh) {
        pendingRefresh = fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        }).then(async (res) => {
          if (!res.ok) throw new Error('No session');
          const data = await res.json();
          setAccessToken(data.accessToken);
          return data.user;
        });
      }
      return await pendingRefresh;
    } catch {
      return rejectWithValue('No session');
    } finally {
      pendingRefresh = null;
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    initializing: true,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initializing = false;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.initializing = false;
      });
  },
});

export default authSlice.reducer;
