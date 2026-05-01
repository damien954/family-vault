import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './store/auth.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import Layout from './components/layout/Layout.jsx';
import LoginPage      from './pages/LoginPage.jsx';
import DashboardPage  from './pages/DashboardPage.jsx';
import InventoryPage  from './pages/InventoryPage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import LocationsPage  from './pages/LocationsPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import UsersPage      from './pages/UsersPage.jsx';
import ProfilePage    from './pages/ProfilePage.jsx';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index                element={<DashboardPage />} />
                <Route path="inventory"     element={<InventoryPage />} />
                <Route path="inventory/:id" element={<ItemDetailPage />} />
                <Route path="locations"     element={<LocationsPage />} />
                <Route path="categories"    element={<CategoriesPage />} />
                <Route path="profile"       element={<ProfilePage />} />
                <Route path="users" element={
                  <PrivateRoute adminOnly><UsersPage /></PrivateRoute>
                } />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
