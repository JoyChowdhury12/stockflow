import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function WarehousesPage({ onEnter }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editWh, setEditWh] = useState(null);
  const [deleteWh, setDeleteWh] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setWarehouses(await api.getWarehouses()); } catch { }
    setLoading(false);
  };

  const openCreate = () => { setName(''); setError(''); setShowCreate(true); };
  const openEdit = (wh) => { setEditWh(wh); setName(wh.name); setError(''); };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.createWarehouse({ name: name.trim() });

      // Reload full warehouse list from backend
      await load();

      setShowCreate(false);

      toast.success('Warehouse created!');
    } catch (e) {
      setError(e.message);
    }

    setSaving(false);
  };

  const handleEdit = async () => {
    if (!name.trim()) { setError('Name required'); return; }
    setSaving(true); setError('');
    try {
      const updated = await api.updateWarehouse(editWh.id, { name: name.trim() });
      setWarehouses(p => p.map(w => w.id === editWh.id ? updated : w));
      setEditWh(null);
      toast.success('Warehouse renamed!');
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const handleDelete = async (wh) => {

    try {
      await api.deleteWarehouse(wh.id);

      setWarehouses(p =>
        p.filter(w => w.id !== wh.id)
      );

      toast(
        (t) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              minWidth: 280,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(239,68,68,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              🗑
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'white',
                }}
              >
                Deleted: {wh.name}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#aaa',
                  marginTop: 2,
                }}
              >
                You can restore it within 8 seconds
              </div>
            </div>

            <button
              onClick={async () => {

                try {

                  await api.restoreWarehouse(wh.id);

                  await load();

                  toast.dismiss(t.id);

                  toast.success('Warehouse restored');

                } catch (e) {

                  toast.error(
                    'Cannot restore. Warehouse name already exists.'
                  );

                }

              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
              }}

              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}

              style={{
                border: 'none',
                background: '#4f8ef7',
                color: 'white',
                padding: '8px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
                transition: '0.2s',
              }}
            >
              Undo
            </button>
          </div>
        ),
        {
          duration: 8000,
          style: {
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'white',
            padding: '14px 16px',
            borderRadius: '18px',
          },
        }
      );

    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>My Warehouses</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 3 }}>{warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <span className="spinner spinner-lg" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="24" width="48" height="32" rx="4" fill="var(--border)" />
              <path d="M4 24l28-16 28 16" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
              <rect x="24" y="36" width="16" height="20" rx="2" fill="var(--bg3)" />
            </svg>
            <p>No warehouses yet</p>
            <small>Create your first warehouse to get started</small>
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 8 }}>Create Warehouse</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {warehouses.map(wh => (
              <div
                key={wh.id}

                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',

                  padding: '16px 20px',
                  cursor: 'pointer',

                  transition: 'border-color 0.15s, transform 0.15s ease, filter 0.15s ease',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,

                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  willChange: 'transform, filter',
                  outline: 'none',
                }}

                onClick={() => onEnter(wh)}

                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}

                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}

                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.985)';
                  e.currentTarget.style.filter = 'brightness(0.92)';
                }}

                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}

                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.985)';
                  e.currentTarget.style.filter = 'brightness(0.92)';
                }}

                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(124,58,237,0.2))',
                    border: '1px solid rgba(79,142,247,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>🏭</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                      Created {
                        wh?.created_at
                          ? new Date(wh.created_at).toLocaleDateString()
                          : 'Recently'
                      }                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(wh)} title="Rename">✏️</button>
                  <button className="btn btn-red btn-sm btn-icon" onClick={() => setDeleteWh(wh)} title="Delete">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Warehouse" onClose={() => setShowCreate(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></>}>
          <div className="input-group">
            <label className="input-label">Warehouse Name</label>
            <input className="input" autoFocus placeholder="e.g. Main Warehouse" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}

      {/* Edit Modal */}
      {editWh && (
        <Modal title="Rename Warehouse" onClose={() => setEditWh(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setEditWh(null)}>Cancel</button><button className="btn btn-primary" onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
          <div className="input-group">
            <label className="input-label">Warehouse Name</label>
            <input className="input" autoFocus value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEdit()} />
          </div>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
      {/* Delete Modal */}
      {deleteWh && (
        <Modal
          title="Delete Warehouse"
          onClose={() => setDeleteWh(null)}

          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteWh(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-red"
                onClick={async () => {

                  await handleDelete(deleteWh);

                  setDeleteWh(null);

                }}
              >
                Delete
              </button>
            </>
          }
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 15,
                color: 'var(--text2)',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete:
            </div>

            <div
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                padding: '14px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              🏭 {deleteWh.name}
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#999',
              }}
            >
              You can undo this action for 8 seconds.
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
