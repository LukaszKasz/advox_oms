import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AppLayout from './components/AppLayout';
import GoodsPage from './components/GoodsPage';
import OrdersPage from './components/OrdersPage';
import SettingsPage from './components/SettingsPage';
import UsersPage from './components/UsersPage';
import SetPasswordForm from './components/SetPasswordForm';
import { tokenManager } from './api';

function ProtectedRoute({ children }) {
    return tokenManager.isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/set-password" element={<SetPasswordForm />} />
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/orders" element={<Navigate to="/orders-to-ship" replace />} />
                    <Route path="/orders-to-ship" element={<OrdersPage titleKey="sidebar.orders" />} />
                    <Route path="/orders-shipping" element={<OrdersPage titleKey="sidebar.ordersShipping" />} />
                    <Route path="/orders-delivered" element={<OrdersPage titleKey="sidebar.ordersDelivered" />} />
                    <Route path="/goods" element={<GoodsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
