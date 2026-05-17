import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useToast } from './Toast';
import Modal from './Modal';

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  );
}

export default function Navbar({ warehouseName, onBack }) {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'name' | 'email' | 'password'
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openModal = (type) => { setModal(type); setForm({}); setError(''); setMenuOpen(false); };
  const closeModal = () => { setModal(null); setForm({}); setError(''); };

  const handleSave = () => {
    setConfirmOpen(true);
  };

  const handleConfirmedSave = async () => {
    setError(''); setLoading(true);
    try {
      let body = {};
      if (modal === 'name') {
        if (!form.name?.trim()) { setError('Name cannot be empty'); setLoading(false); return; }
        body = { name: form.name };
      } else if (modal === 'email') {
        if (!form.email?.trim() || !form.currentPassword) {
          setError('Fill all fields');
          setLoading(false);
          return;
        }

        if (
          !form.email.includes('@') ||
          !form.email.includes('.')
        ) {
          setError('Enter a valid email');
          setLoading(false);
          return;
        }

        body = {
          email: form.email,
          currentPassword: form.currentPassword,
        };
      } else if (modal === 'password') {
        if (!form.currentPassword || !form.newPassword) { setError('Fill all fields'); setLoading(false); return; }
        if (form.newPassword.length < 6) { setError('New password must be 6+ characters'); setLoading(false); return; }
        body = { currentPassword: form.currentPassword, newPassword: form.newPassword };
      }
      let updated;

      if (modal === 'name') {
        updated = await api.changeName(form.name);
      } else if (modal === 'email') {
        updated = await api.changeEmail(
          form.email,
          form.currentPassword
        );
      } else if (modal === 'password') {
        updated = await api.changePassword(
          form.currentPassword,
          form.newPassword
        );
      }

      if (modal !== 'password') {
        updateUser(updated);
      }

      toast('Profile updated!', 'success');
      closeModal();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 16px',
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button
              onClick={onBack}
              className="premium-back-btn"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <div>
            {onBack ? (
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{warehouseName}</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src="/favicon.png"
                  alt="StockFlow"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    objectFit: 'cover',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>StockFlow</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Profile */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button onClick={() => setMenuOpen(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 10, padding: '4px 10px 4px 4px', cursor: 'pointer',
            transition: 'background 0.15s',
          }}>
            <Avatar name={user?.name} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 4l4 4 4-4" stroke="var(--text2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)', minWidth: 200, padding: '6px 0', zIndex: 100,
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{user?.email}</div>
              </div>
              {[
                { label: '✏️  Change Name', action: () => openModal('name') },
                { label: '📧  Change Email', action: () => openModal('email') },
                { label: '🔑  Change Password', action: () => openModal('password') },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)',
                  transition: 'background 0.12s',
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {item.label}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--red)', fontSize: 14, fontFamily: 'var(--font)',
                transition: 'background 0.12s',
              }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                🚪  Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      {modal === 'name' && (
        <Modal title="Change Name" onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button></>}>
          <div className="input-group">
            <label className="input-label">New Name</label>
            <input className="input" defaultValue={user?.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
          </div>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
      {modal === 'email' && (
        <Modal title="Change Email" onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button></>}>
          <div className="input-group">
            <label className="input-label">New Email</label>
            <input className="input" type="email" defaultValue={user?.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="new@email.com" />
          </div><div className="input-group">
            <label className="input-label">
              Current Password
            </label>

            <input
              className="input"
              type="password"
              onChange={e =>
                setForm(p => ({
                  ...p,
                  currentPassword: e.target.value
                }))
              }
              placeholder="••••••••"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
      {modal === 'password' && (
        <Modal title="Change Password" onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button></>}>
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input className="input" type="password" onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input className="input" type="password" onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
          </div>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}

      {confirmOpen && (
        <Modal
          title="Confirm Changes"
          onClose={() => setConfirmOpen(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setConfirmOpen(false);
                  handleConfirmedSave();
                }}
              >
                Yes, Continue
              </button>
            </>
          }
        >
          <p style={{
            color: 'var(--text2)',
            lineHeight: 1.5,
            fontSize: 14,
          }}>
            Are you sure you want to change your {modal}?
          </p>
        </Modal>
      )}
    </>
  );
}