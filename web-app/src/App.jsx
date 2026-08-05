import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';

// Admin pages
import Login from './pages/Login';
import Overview from './pages/Overview';
import Requests from './pages/Requests';
import Orders from './pages/Orders';
import Rooms from './pages/Rooms';
import Menu from './pages/Menu';
import Analytics from './pages/Analytics';

// Guest pages
import RoomHome from './pages/RoomHome';
import RoomServicePage from './pages/RoomServicePage';
import IssuePage from './pages/IssuePage';
import OrderFoodPage from './pages/OrderFoodPage';
import Confirmation from './pages/Confirmation';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ===== Guest-facing QR flow ===== */}
      <Route path="/r/:token" element={<RoomHome />} />
      <Route path="/r/:token/service" element={<RoomServicePage />} />
      <Route path="/r/:token/issue" element={<IssuePage />} />
      <Route path="/r/:token/order" element={<OrderFoodPage />} />
      <Route path="/r/:token/confirmation" element={<Confirmation />} />

      {/* ===== Staff / admin dashboard ===== */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="requests" element={<Requests />} />
        <Route path="orders" element={<Orders />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="menu" element={<Menu />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Default: send root visits to the staff login/dashboard */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
