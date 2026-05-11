import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const CATEGORIES = ['Pieces', 'Cartoon', 'Bag', 'Bosta'];

function CategoryTag({ cat }) {
  if (cat === 'Cartoon') {
    return <span className="tag tag-purple">📦 Cartoon</span>;
  }

  if (cat === 'Bag') {
    return <span className="tag tag-green">👜 Bag</span>;
  }
  if (cat === 'Bosta') {
    return <span className="tag tag-orange">🧺 Bosta</span>;
  }

  return <span className="tag tag-blue">🔢 Pieces</span>;
}

function HistoryModal({ product, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHistory(product.id).then(setData).finally(() => setLoading(false));
  }, [product.id]);

  return (
    <Modal title={`History — ${product.name}`} onClose={onClose}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><span className="spinner" /></div>
      ) : data?.history?.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '30px 0' }}>No transactions yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {data?.history?.map((h, i) => (
            <div key={h.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 0', borderBottom: i < data.history.length - 1 ? '1px solid var(--border)' : 'none',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: h.type === 'in' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${h.type === 'in' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {h.type === 'in' ? '↑' : '↓'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: h.type === 'in' ? 'var(--green)' : 'var(--red)' }}>
                    {h.type === 'in' ? '+' : '-'}{h.amount}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                    {h.note || (h.type === 'in' ? 'Stock In' : 'Stock Out')}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>→ {h.quantity_after}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function EditProductModal({ product, onClose, onSave }) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Name required'); return; }
    setSaving(true);
    try {
      const updated = await api.updateProduct(product.id, { name: name.trim(), category });
      onSave(updated);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal title="Edit Product" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
      <div className="input-group">
        <label className="input-label">Product Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
      </div>
      <div className="input-group">
        <label className="input-label">Category</label>
        <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}

function AddProductModal({ warehouseId, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', category: 'Pieces', quantity: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name.trim()) { setError('Product name required'); return; }
    setSaving(true);
    try {
      const product = await api.createProduct(warehouseId, { ...form, quantity: parseFloat(form.quantity) || 0 });
      onAdd(product);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal title="Add Product" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Product'}</button></>}>
      <div className="input-group">
        <label className="input-label">Product Name</label>
        <input className="input" autoFocus placeholder="e.g. Red Shirt L" value={form.name} onChange={set('name')} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
      </div>
      <div className="input-group">
        <label className="input-label">Category</label>
        <select className="input" value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Initial Quantity (optional)</label>
        <input className="input" type="number" step="0.01" min="0" placeholder="0" value={form.quantity} onChange={set('quantity')} />
      </div>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}

function TransactModal({ product, type, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) { setError('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const updated = await api.transact(product.id, { type, amount: qty, note });
      onDone(updated);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal
      title={type === 'in' ? `Stock In — ${product.name}` : `Stock Out — ${product.name}`}
      onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${type === 'in' ? 'btn-green' : 'btn-red'}`} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : type === 'in' ? '↑ Add Stock' : '↓ Remove Stock'}
        </button></>}
    >
      <div style={{
        background: type === 'in' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${type === 'in' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 10, padding: '12px 16px', marginBottom: 4,
      }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>Current Stock</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800 }}>{product.quantity} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>{product.category}</span></div>
      </div>
      <div className="input-group">
        <label className="input-label">Amount to {type === 'in' ? 'Add' : 'Remove'}</label>
        <input className="input" type="number" step="0.01" min="0" autoFocus placeholder="Enter quantity"
          value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
      </div>
      {amount && parseFloat(amount) > 0 && (
        <div style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 2px' }}>
          New total: <strong style={{ color: type === 'in' ? 'var(--green)' : product.quantity - parseFloat(amount) < 0 ? 'var(--red)' : 'var(--amber)' }}>
            {type === 'in' ? product.quantity + parseFloat(amount) : product.quantity - parseFloat(amount)}
          </strong> {product.category}
        </div>
      )}
      <div className="input-group">
        <label className="input-label">Note (optional)</label>
        <input className="input" placeholder="e.g. Received from supplier" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}

export default function ProductsPage({ warehouse, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [transact, setTransact] = useState(null); // { product, type }
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await api.getProducts(warehouse.id)); } catch { }
    setLoading(false);
  }, [warehouse.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    ((p?.name || "").toLowerCase()).includes((search || "").toLowerCase()) ||
    ((p?.category || "").toLowerCase()).includes((search || "").toLowerCase())
  );
  const handleAdd = async () => { setShowAdd(false); await load(); toast('Product added!', 'success'); };
  const handleEdit = (updated) => { setProducts(p => p.map(x => x.id === updated.id ? updated : x)); setEditProduct(null); toast('Product updated!', 'success'); };
  const handleTransact = (updated) => { setProducts(p => p.map(x => x.id === updated.id ? updated : x)); setTransact(null); toast(transact?.type === 'in' ? 'Stock added!' : 'Stock removed!', 'success'); };
  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    } try { await api.deleteProduct(product.id); setProducts(p => p.filter(x => x.id !== product.id)); toast('Deleted', 'info'); }
    catch (e) { toast(e.message, 'error'); }
  };

  const totalByCategory = (cat) => products.filter(p => p.category === cat).reduce((s, p) => s + p.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar warehouseName={warehouse.name} onBack={onBack} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Summary cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 20
        }}>
          {[
            { label: 'Total Pieces', value: totalByCategory('Pieces'), icon: '🔢', color: 'var(--accent)' },

            { label: 'Total Cartoons', value: totalByCategory('Cartoon'), icon: '📦', color: '#a78bfa' },

            { label: 'Total Bags', value: totalByCategory('Bag'), icon: '👜', color: '#22c55e' },

            { label: 'Total Bosta', value: totalByCategory('Bosta'), icon: '🧺', color: '#f97316' },

          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Add */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search products..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>+</span>
            <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>Add</span>
          </button>
        </div>

        {/* Product count */}
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
          {search ? `${filtered.length} of ${products.length}` : products.length} product{products.length !== 1 ? 's' : ''}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><span className="spinner spinner-lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48, opacity: 0.4 }}>📦</span>
            {search ? <p>No products matching "{search}"</p> : <><p>No products yet</p><small>Add your first product to get started</small><button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>Add Product</button></>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(product => (
              <ProductRow key={product.id} product={product}
                onIn={() => setTransact({ product, type: 'in' })}
                onOut={() => setTransact({ product, type: 'out' })}
                onHistory={() => setHistoryProduct(product)}
                onEdit={() => setEditProduct(product)}
                onDelete={() => handleDelete(product)}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddProductModal warehouseId={warehouse.id} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {historyProduct && <HistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={handleEdit} />}
      {transact && <TransactModal product={transact.product} type={transact.type} onClose={() => setTransact(null)} onDone={handleTransact} />}
    </div>
  );
}

function ProductRow({ product, onIn, onOut, onHistory, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      {/* Main row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Name & category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-head)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
          <div style={{ marginTop: 4 }}><CategoryTag cat={product.category} /></div>
        </div>

        {/* Quantity */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, lineHeight: 1,
            color: product.quantity === 0 ? 'var(--red)' : product.quantity < 10 ? 'var(--amber)' : 'var(--text)',
          }}>{product.quantity}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{product.category}</div>
        </div>

        {/* In / Out */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-green btn-sm" onClick={onIn} title="Stock In">↑ In</button>
          <button className="btn btn-red btn-sm" onClick={onOut} title="Stock Out">↓ Out</button>
        </div>

        {/* More actions toggle */}
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setExpanded(p => !p)} title="More">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)', padding: '10px 16px',
          display: 'flex', gap: 8, flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <button className="btn btn-secondary btn-sm" onClick={onHistory}>
            📋 History
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            ✏️ Edit
          </button>
          <button className="btn btn-red btn-sm" onClick={onDelete}>
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}
