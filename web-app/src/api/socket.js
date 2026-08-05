import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket(handlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    if (handlers.onNewRequest) socket.on('new_request', handlers.onNewRequest);
    if (handlers.onRequestUpdated) socket.on('request_updated', handlers.onRequestUpdated);
    if (handlers.onNewOrder) socket.on('new_order', handlers.onNewOrder);
    if (handlers.onOrderUpdated) socket.on('order_updated', handlers.onOrderUpdated);

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef;
}
