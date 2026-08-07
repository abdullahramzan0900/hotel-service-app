import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// ===== Guest-facing (public, no auth needed) =====
export const getRoom = (token) => api.get(`/room/${token}`).then((r) => r.data);
export const getPublicMenu = () => api.get('/menu').then((r) => r.data);
export const submitRoomService = (token, payload) => api.post(`/room/${token}/service`, payload).then((r) => r.data);
export const submitIssue = (token, payload) => api.post(`/room/${token}/issue`, payload).then((r) => r.data);
export const submitOrder = (token, payload) => api.post(`/room/${token}/order`, payload).then((r) => r.data);

// ===== Admin (JWT protected) =====
export const login = (username, password) =>
  api.post('/admin/login', { username, password }).then((r) => r.data);

export const getStats = () => api.get('/admin/stats').then((r) => r.data);
export const getAnalytics = (days = 14) => api.get('/admin/analytics', { params: { days } }).then((r) => r.data);
export const getCustomers = (params = {}) => api.get('/admin/customers', { params }).then((r) => r.data);
export const retryFailedCustomers = () => api.post('/admin/customers/retry-failed').then((r) => r.data);

export const getRequests = (params = {}) => api.get('/admin/requests', { params }).then((r) => r.data);
export const updateRequestStatus = (id, status) =>
  api.patch(`/admin/requests/${id}`, { status }).then((r) => r.data);

export const getOrders = (params = {}) => api.get('/admin/orders', { params }).then((r) => r.data);
export const approveOrder = (id) => api.patch(`/admin/orders/${id}/approve`).then((r) => r.data);
export const rejectOrder = (id, reason) => api.patch(`/admin/orders/${id}/reject`, { reason }).then((r) => r.data);

export const getRooms = () => api.get('/admin/rooms').then((r) => r.data);
export const createRoom = (roomNumber) => api.post('/admin/rooms', { roomNumber }).then((r) => r.data);
export const getRoomQr = (id) => api.get(`/admin/rooms/${id}/qrcode`).then((r) => r.data);
export const checkinRoom = (id) => api.patch(`/admin/rooms/${id}/checkin`).then((r) => r.data);
export const checkoutRoom = (id) => api.patch(`/admin/rooms/${id}/checkout`).then((r) => r.data);
export const deleteRoom = (id) => api.delete(`/admin/rooms/${id}`).then((r) => r.data);

export const getMenu = (params = {}) => api.get('/admin/menu', { params }).then((r) => r.data);
export const createMenuItem = (item) => api.post('/admin/menu', item).then((r) => r.data);
export const updateMenuItem = (id, item) => api.patch(`/admin/menu/${id}`, item).then((r) => r.data);
export const deleteMenuItem = (id) => api.delete(`/admin/menu/${id}`).then((r) => r.data);
export const uploadMenuItemImage = (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api
    .post(`/admin/menu/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};