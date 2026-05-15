import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import WarehousesPage from './pages/WarehousesPage';
import ProductsPage from './pages/ProductsPage';

import './index.css';

function AppInner() {
  const { user, loading } = useAuth();

  const [warehouse, setWarehouse] = useState(() => {
    const saved = localStorage.getItem('selectedWarehouse');
    return saved ? JSON.parse(saved) : null;
  });

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src="/favicon.png"
            alt="StockFlow"
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              marginBottom: 16,
            }}
          />
          <div className="modern-loader"></div>
        </div>
      </div>
    );

  if (!user) return <AuthPage />;

  if (warehouse)
    return (
      <ProductsPage
        warehouse={warehouse}
        onBack={() => {
          localStorage.removeItem('selectedWarehouse');
          setWarehouse(null);
        }}
      />
    );

  return (
    <WarehousesPage
      onEnter={(wh) => {
        window.history.pushState({ warehouse: true }, '', `/warehouse/${wh.id}`);
        localStorage.setItem('selectedWarehouse', JSON.stringify(wh));

        setWarehouse(wh);
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
          }}
        >
          <div style={{ flex: 1 }}>
            <Routes>

              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />

              <Route
                path="/reset-password/:token"
                element={<ResetPasswordPage />}
              />

              <Route
                path="*"
                element={<AppInner />}
              />

            </Routes>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '14px',
              color: '#777',
              fontSize: '13px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            © 2026 StockFlow — Developed by Joy Chowdhury
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}