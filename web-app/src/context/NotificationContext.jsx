import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const NotificationContext = createContext(null);

// Plays a short two-tone chime using the Web Audio API - no external sound
// file needed, so there's nothing extra to host or upload.
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.25);
    });
  } catch {
    // Some browsers block audio until the user interacts with the page first -
    // safe to just skip the sound in that case, the visual badge still updates.
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    const addNotification = (type, payload) => {
      const item = {
        id: `${type}-${payload.id || payload._id}-${Date.now()}`,
        type, // 'room_service' | 'issue' | 'order'
        roomNumber: payload.roomNumber,
        guestName: payload.guestName,
        message: type === 'order' ? `${payload.items?.length || 0} item order` : payload.message,
        priority: payload.priority,
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [item, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
      playChime();
    };

    socket.on('new_request', (payload) => addNotification(payload.type, payload));
    socket.on('new_order', (payload) => addNotification('order', payload));

    return () => socket.disconnect();
  }, []);

  const markAllRead = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}