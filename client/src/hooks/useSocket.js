// Socket hook that manages connection and auth token.
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { getAccessToken } from '../utils/apiClient';

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
}
