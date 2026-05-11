const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'warehouse_secret_key_2024';
const DB_PATH = path.join(__dirname, 'warehouse.db');

app.use(cors());
app.use(express.json());

let db;
let SQL;

function saveDb() {
  try {
    const data = db.export();
    const buf = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buf);
  } catch (e) {
    console.error('Save error:', e.message);
  }
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const res = db.exec('SELECT last_insert_rowid() as id');
  const id = res[0]?.values[0][0];
  return { lastInsertRowid: id };
}

function get(sql, params = []) {
  try {
    const res = db.exec(sql, params);
    if (!res.length || !res[0].values.length) return undefined;
    const cols = res[0].columns;
    return Object.fromEntries(cols.map((c, i) => [c, res[0].values[0][i]]));
  } catch (e) {
    console.error('DB get error:', e.message);
    return undefined;
  }
}

function all(sql, params = []) {
  try {
    const res = db.exec(sql, params);
    if (!res.length) return [];
    const cols = res[0].columns;
    return res[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
  } catch (e) {
    console.error('DB all error:', e.message);
    return [];
  }
}

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields required'
      });
    }

    const existing = get(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existing) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    run(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase(), hashed, now]
    );

    const insertedUser = get(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    const token = jwt.sign(
      {
        id: insertedUser.id,
        email: insertedUser.email
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: insertedUser
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });
    const user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/profile', auth, (req, res) => {
  try {
    res.json(get('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/auth/profile', auth, (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (email && email.toLowerCase() !== user.email) {
      const existing = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }
    if (newPassword) {
      if (!currentPassword || !bcrypt.compareSync(currentPassword, user.password))
        return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const newName = name || user.name;
    const newEmail = email ? email.toLowerCase() : user.email;
    const newPass = newPassword ? bcrypt.hashSync(newPassword, 10) : user.password;
    run('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [newName, newEmail, newPass, req.user.id]);
    res.json(get('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// ── WAREHOUSES ────────────────────────────────────────────────
app.get('/api/warehouses', auth, (req, res) => {
  try {
    res.json(all('SELECT * FROM warehouses WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/warehouses', auth, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = run('INSERT INTO warehouses (user_id, name, created_at) VALUES (?, ?, ?)', [req.user.id, name, new Date().toISOString()]);
    res.json(get('SELECT * FROM warehouses WHERE id = ?', [result.lastInsertRowid]));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put('/api/warehouses/:id', auth, (req, res) => {
  try {
    const { name } = req.body;
    const wh = get('SELECT * FROM warehouses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!wh) return res.status(404).json({ error: 'Warehouse not found' });
    run('UPDATE warehouses SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ ...wh, name });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.delete('/api/warehouses/:id', auth, (req, res) => {
  try {
    const wh = get('SELECT * FROM warehouses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!wh) return res.status(404).json({ error: 'Warehouse not found' });
    const products = all('SELECT id FROM products WHERE warehouse_id = ?', [req.params.id]);
    products.forEach(p => run('DELETE FROM transactions WHERE product_id = ?', [p.id]));
    run('DELETE FROM products WHERE warehouse_id = ?', [req.params.id]);
    run('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// ── PRODUCTS ──────────────────────────────────────────────────
app.get('/api/warehouses/:whId/products', auth, (req, res) => {
  try {
    const wh = get('SELECT * FROM warehouses WHERE id = ? AND user_id = ?', [req.params.whId, req.user.id]);
    if (!wh) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(all('SELECT * FROM products WHERE warehouse_id = ? ORDER BY created_at DESC', [req.params.whId]));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post('/api/warehouses/:whId/products', auth, (req, res) => {
  try {
    const { name, category, quantity } = req.body;
    const wh = get('SELECT * FROM warehouses WHERE id = ? AND user_id = ?', [req.params.whId, req.user.id]);
    if (!wh) return res.status(404).json({ error: 'Warehouse not found' });
    if (!name) return res.status(400).json({ error: 'Product name required' });
    const qty = parseInt(quantity) || 0;
    const now = new Date().toISOString();
    const result = run(
      'INSERT INTO products (warehouse_id, name, category, quantity, created_at) VALUES (?, ?, ?, ?, ?)',
      [req.params.whId, name, category || 'Pieces', qty, now]
    );
    if (qty > 0) {
      run('INSERT INTO transactions (product_id, type, amount, quantity_after, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [result.lastInsertRowid, 'in', qty, qty, 'Initial stock', now]);
    }
    const product = get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    res.json(product);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', auth, (req, res) => {
  try {
    const { name, category } = req.body;
    const product = get('SELECT p.* FROM products p JOIN warehouses w ON p.warehouse_id = w.id WHERE p.id = ? AND w.user_id = ?', [req.params.id, req.user.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    run('UPDATE products SET name = ?, category = ? WHERE id = ?', [name || product.name, category || product.category, req.params.id]);
    res.json(get('SELECT * FROM products WHERE id = ?', [req.params.id]));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', auth, (req, res) => {
  try {
    const product = get('SELECT p.* FROM products p JOIN warehouses w ON p.warehouse_id = w.id WHERE p.id = ? AND w.user_id = ?', [req.params.id, req.user.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    run('DELETE FROM transactions WHERE product_id = ?', [req.params.id]);
    run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post('/api/products/:id/transaction', auth, (req, res) => {
  try {
    const { type, amount, note } = req.body;
    if (!['in', 'out'].includes(type)) return res.status(400).json({ error: 'Type must be in or out' });
    const qty = parseInt(amount);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    const product = get('SELECT p.* FROM products p JOIN warehouses w ON p.warehouse_id = w.id WHERE p.id = ? AND w.user_id = ?', [req.params.id, req.user.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (type === 'out' && product.quantity < qty) return res.status(400).json({ error: 'Insufficient stock' });
    const newQty = type === 'in' ? product.quantity + qty : product.quantity - qty;
    run('UPDATE products SET quantity = ? WHERE id = ?', [newQty, req.params.id]);
    run('INSERT INTO transactions (product_id, type, amount, quantity_after, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, type, qty, newQty, note || null, new Date().toISOString()]);
    res.json(get('SELECT * FROM products WHERE id = ?', [req.params.id]));
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:id/history', auth, (req, res) => {
  try {
    const product = get('SELECT p.* FROM products p JOIN warehouses w ON p.warehouse_id = w.id WHERE p.id = ? AND w.user_id = ?', [req.params.id, req.user.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const history = all('SELECT * FROM transactions WHERE product_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ product, history });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// ── START ─────────────────────────────────────────────────────
function startServer() {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ✅ StockFlow backend is running!');
    console.log(`  📡 http://localhost:${PORT}`);
    console.log('');
  });
}

initSqlJs().then(SQLLib => {
  SQL = SQLLib;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('🆕 Created new database');
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pieces',
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  saveDb();
  startServer();
}).catch(err => {
  console.error('❌ Failed to init database:', err);
  process.exit(1);
});
