import React, { useState, useEffect, useCallback } from 'react';
import DeleteUndoToast from "../components/DeleteUndoToast";
import toast from 'react-hot-toast';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

const CATEGORIES = ['Pieces', 'Cartoon', 'Bag', 'Bosta', 'Pata'];

function CategoryTag({ cat }) {

  const commonProps = {
    style: {
      transition: 'transform 0.12s ease',
      cursor: 'pointer',
      display: 'inline-flex',

      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      willChange: 'transform, filter',
    },

    onMouseDown: (e) => {
      e.currentTarget.style.transform = 'scale(0.95)';
    },

    onMouseUp: (e) => {
      e.currentTarget.style.transform = 'scale(1)';
    },

    onMouseLeave: (e) => {
      e.currentTarget.style.transform = 'scale(1)';
    },

    onTouchStart: (e) => {
      e.currentTarget.style.transform = 'scale(0.95)';
    },

    onTouchEnd: (e) => {
      e.currentTarget.style.transform = 'scale(1)';
    },
  };

  if (cat === 'Cartoon') {
    return (
      <span className="tag tag-purple" {...commonProps}>
        📦 Cartoon
      </span>
    );
  }

  if (cat === 'Bag') {
    return (
      <span className="tag tag-green" {...commonProps}>
        👜 Bag
      </span>
    );
  }

  if (cat === 'Bosta') {
    return (
      <span className="tag tag-orange" {...commonProps}>
        🧺 Bosta
      </span>
    );
  }

  if (cat === 'Pata') {
    return (
      <span className="tag tag-cyan" {...commonProps}>
        🔗 Pata
      </span>
    );
  }

  return (
    <span className="tag tag-blue" {...commonProps}>
      🔢 Pieces
    </span>
  );
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
                  {new Date(h.created_at).toLocaleString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}                </div>
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
    if (saving) return;

    if (!form.name.trim()) {
      setError('Product name required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.createProduct(warehouseId, {
        ...form,
        quantity: parseFloat(form.quantity) || 0
      });

      onAdd();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Product" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Product'}</button></>}>
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
  const getLocalDateTime = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [transactionDate, setTransactionDate] = useState(
    getLocalDateTime()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) { setError('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const updated = await api.transact(product.id, {
        type,
        amount: qty,
        note,
        created_at: new Date(transactionDate).toISOString()
      }); onDone(updated);
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
          New total:{" "}
          <strong
            style={{
              color:
                type === 'in'
                  ? 'var(--green)'
                  : parseFloat(product.quantity) - parseFloat(amount) < 0
                    ? 'var(--red)'
                    : 'var(--amber)',
            }}
          >
            {type === 'in'
              ? (parseFloat(product.quantity) + parseFloat(amount)).toFixed(1)
              : (parseFloat(product.quantity) - parseFloat(amount)).toFixed(1)}
          </strong>{" "}
          {product.category}
        </div>
      )}
      <div className="input-group">
        <label className="input-label">
          Transaction Date & Time
        </label>

        <input
          type="datetime-local"
          className="input"
          value={transactionDate}
          max={getLocalDateTime()}
          onChange={(e) => setTransactionDate(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Note (optional)</label>

        <input
          className="input"
          placeholder="e.g. Received from supplier"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
function DateHistoryModal({ warehouse, onClose }) {
  const today = new Date();

  const localDate =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [date, setDate] = useState(localDate);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const loadHistory = async () => {
    setLoading(true);

    try {
      const data = await api.getHistoryByDate(warehouse.id, date);
      setHistory(data.history || []);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);
  const filteredHistory = history.filter(h => (h.product_name || '').toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal
      title="Date History"
      onClose={onClose}
    >
      <div className="input-group">
        <label className="input-label">Select Date</label>

        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label className="input-label">Search Product</label>

        <input
          className="input"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={loadHistory}
        style={{
          width: '100%',
          marginBottom: 16
        }}
      >
        Check History
      </button>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 30
        }}>
          <span className="spinner" />
        </div>
      ) : history.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--text3)',
          padding: '20px 0'
        }}>
          No history found
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {filteredHistory.map((h, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14
              }}
            >
              <div style={{
                fontWeight: 700,
                marginBottom: 6
              }}>
                {h.product_name}
              </div>

              <div style={{
                color:
                  h.type === 'in'
                    ? 'var(--green)'
                    : 'var(--red)',
                fontWeight: 600
              }}>
                {h.type === 'in' ? '+' : '-'}
                {h.amount}
              </div>
              {h.note && (
                <div style={{
                  fontSize: 12,
                  color: 'var(--text2)',
                  marginTop: 4
                }}>
                  📝 {h.note}
                </div>
              )}

              <div style={{
                fontSize: 12,
                color: 'var(--text3)',
                marginTop: 4
              }}>
                {new Date(h.created_at).toLocaleString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
export default function ProductsPage({ warehouse, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = React.useRef(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDateHistory, setShowDateHistory] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [undoSeconds, setUndoSeconds] = useState(8);
  const [transact, setTransact] = useState(null); // { product, type }
  const anyModalOpen = showAdd || showDateHistory || historyProduct || editProduct || transact || deleteProduct;

  useEffect(() => {
    const handlePopState = () => {
      if (anyModalOpen) {
        setShowAdd(false);
        setShowDateHistory(false);
        setHistoryProduct(null);
        setEditProduct(null);
        setTransact(null);
      } else {
        onBack();
      }
    };
    window.addEventListener('popstate', handlePopState);

    if (anyModalOpen) {
      window.history.pushState({ modal: true }, '');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [anyModalOpen, onBack]);

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
  const handleAdd = async () => {

    setShowAdd(false);

    setTimeout(async () => {

      try {

        const latestProducts = await api.getProducts(warehouse.id);

        const newestProduct = latestProducts[0];

        const animatedProduct = {
          ...newestProduct,
          animate: true
        };

        setProducts([
          animatedProduct,
          ...latestProducts.slice(1)
        ]);

        setTimeout(() => {

          setProducts(prev =>
            prev.map(p => ({
              ...p,
              animate: false
            }))
          );

        }, 500);

        toast.success('Product added!');

      } catch (e) {

        toast.error('Failed to refresh products');

      }

    }, 400);

  };

  const handleEdit = (updated) => { setProducts(p => p.map(x => x.id === updated.id ? updated : x)); setEditProduct(null); toast.success('Product updated!'); };
  const handleTransact = (updated) => {

    setProducts(p =>
      p.map(x =>
        x.id === updated.id
          ? { ...updated, animate: true }
          : { ...x, animate: false }
      )
    );

    setTimeout(() => {

      setProducts(p =>
        p.map(x => ({
          ...x,
          animate: false
        }))
      );

    }, 500);

    setTransact(null);

    toast.success(
      transact?.type === 'in'
        ? 'Stock added!'
        : 'Stock removed!'
    );
  };
  const handleDelete = async (product) => {

    try {

      await api.deleteProduct(product.id);

      setProducts(p =>
        p.filter(x => x.id !== product.id)
      );

      toast(
        (t) => (
          <DeleteUndoToast
            t={t}
            name={product.name}
            onUndo={async () => {
              try {
                await api.restoreProduct(product.id);
                await load();

                toast.dismiss(t.id);
                toast.success("Product restored");
              } catch (e) {
                toast.error("Cannot restore. Product name already exists.");
              }
            }}
          />
        ),
        {
          duration: 9500,

          style: {
            background: "rgba(17, 24, 39, 0.78)",

            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",

            border: "1px solid rgba(255,255,255,0.06)",

            boxShadow:
              "0 8px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.03)",

            color: "white",

            padding: "10px 16px",

            borderRadius: "18px",
          },
        }
      );

    } catch (e) {

      toast.error(e.message);

    }
  };

  const totalByCategory = (cat) =>
    products
      .filter(p => p.category === cat)
      .reduce((s, p) => s + parseFloat(p.quantity || 0), 0);

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

            { label: 'Total Pata', value: totalByCategory('Pata'), icon: '🔗', color: '#06b6d4' },

          ].map(s => (

            <div
              key={s.label}

              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'transform 0.15s ease, filter 0.15s ease',
                cursor: 'pointer',

                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                willChange: 'transform, filter',
              }}

              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.985)';
                e.currentTarget.style.filter = 'brightness(0.92)';
              }}

              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}

              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}

              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.985)';
                e.currentTarget.style.filter = 'brightness(0.92)';
              }}

              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Add */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowDateHistory(true)}
          style={{
            width: '100%',
            marginBottom: 12,
            justifyContent: 'center'
          }}
        >
          📅 Check History
        </button>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>

            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
              }}
            >
              🔍
            </span>

            <input
              ref={searchRef}
              className="input"
              style={{
                paddingLeft: 36,
                paddingRight: search ? 40 : 12,
              }}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {search && (
              <button
                onClick={() => {

                  setSearch('');

                  searchRef.current?.focus();

                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  fontSize: 15,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.85,
                  transition: '0.2s',
                }}
              >
                ✕
              </button>
            )}

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
            <img
              src="/favicon.png"
              alt="StockFlow"
              style={{
                width: 64,
                height: 64,
                opacity: 0.5,
                borderRadius: 18,
                objectFit: 'cover',
                marginBottom: 10,
              }}
            />
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
                onDelete={() => setDeleteProduct(product)} />
            ))}
          </div>
        )}
      </div>
      {showDateHistory && (
        <DateHistoryModal
          warehouse={warehouse}
          onClose={() => setShowDateHistory(false)}
        />
      )}
      {showAdd && <AddProductModal warehouseId={warehouse.id} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {historyProduct && <HistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={handleEdit} />}
      {transact && <TransactModal product={transact.product} type={transact.type} onClose={() => setTransact(null)} onDone={handleTransact} />}
      {/* Delete Product Modal */}
      {deleteProduct && (
        <Modal
          title="Delete Product"
          onClose={() => setDeleteProduct(null)}

          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteProduct(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-red"
                onClick={async () => {

                  await handleDelete(deleteProduct);

                  setDeleteProduct(null);

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
              📦 {deleteProduct.name}
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

function ProductRow({ product, onIn, onOut, onHistory, onEdit, onDelete }) {

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={product.animate ? "product-enter" : ""}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, border-color 0.15s ease, filter 0.15s ease',
        cursor: 'pointer',

        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}

      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.985)';
        e.currentTarget.style.filter = 'brightness(0.92)';
      }}

      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}

      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}

      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.985)';
        e.currentTarget.style.filter = 'brightness(0.92)';
      }}

      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      {/* Main row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Name & category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              fontFamily: 'var(--font-head)',

              overflow: expanded ? 'visible' : 'hidden',

              textOverflow: expanded
                ? 'clip'
                : 'ellipsis',

              whiteSpace: expanded
                ? 'normal'
                : 'nowrap',

              transition: 'all 0.25s ease',
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </div>
          <div style={{ marginTop: 4 }}><CategoryTag cat={product.category} /></div>
        </div>

        {/* Quantity */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            className={product.animate ? "quantity-pop" : ""} style={{
              fontFamily: 'var(--font-head)',
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1,
              color:
                product.quantity === 0
                  ? 'var(--red)'
                  : product.quantity < 10
                    ? 'var(--amber)'
                    : 'var(--text)',
            }}
          >
            {product.quantity}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {product.category}
          </div>
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
      <div
        style={{
          maxHeight: expanded ? '180px' : '0px',
          opacity: expanded ? 1 : 0,

          overflow: 'hidden',

          transform: expanded
            ? 'translateY(0)'
            : 'translateY(-8px)',

          transition:
            'max-height 0.35s ease, opacity 0.25s ease, transform 0.25s ease',

          willChange: 'max-height, opacity, transform',
        }}
      >
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '10px 16px',

            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',

            background: 'rgba(0,0,0,0.15)',
          }}
        >
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
      </div>

    </div>
  );
}
