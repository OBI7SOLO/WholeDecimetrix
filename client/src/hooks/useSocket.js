import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(API_URL, {
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
