import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AuthPage from './pages/AuthPage';
import WarehousesPage from './pages/WarehousesPage';
import ProductsPage from './pages/ProductsPage';
import './index.css';

function AppInner() {
  const { user, loading } = useAuth();
  const [warehouse, setWarehouse] = useState(null);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
        <span className="spinner spinner-lg" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );

  if (!user) return <AuthPage />;

  if (warehouse) return (
    <ProductsPage
      warehouse={warehouse}
      onBack={() => setWarehouse(null)}
    />
  );

  return <WarehousesPage onEnter={setWarehouse} />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}
