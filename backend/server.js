require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'stockflowsecret';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No token',
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expiry BIGINT
`);

  await query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      warehouse_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Pieces',
      quantity NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      quantity_after NUMERIC NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ PostgreSQL connected');
}

// AUTH

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields required',
      });
    }

    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already exists',
      });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const inserted = await query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email.toLowerCase(), hashed]
    );

    const user = inserted.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      token,
      user,
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({
        error: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: '30d',
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});

app.get('/api/auth/profile', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json(result.rows[0]);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const expiry = Date.now() + 1000 * 60 * 15;

    await query(
      `UPDATE users
       SET reset_token = $1,
           reset_token_expiry = $2
       WHERE id = $3`,
      [token, expiry, user.id]
    );

    const resetLink =
      `${process.env.CLIENT_URL}/reset-password/${token}`;


    console.log('EMAIL:', process.env.BREVO_EMAIL);
    console.log(
      process.env.BREVO_SMTP_KEY
        ? 'SMTP KEY FOUND'
        : 'SMTP KEY MISSING'
    );
    await transporter.sendMail({
      from: process.env.BREVO_EMAIL, to: user.email,
      subject: 'StockFlow Password Reset',
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Reset Your Password</h2>

          <p>
            You requested a password reset for your StockFlow account.
          </p>

          <a
            href="${resetLink}"
            style="
              display:inline-block;
              padding:12px 18px;
              background:#4f8ef7;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Reset Password
          </a>

          <p style="margin-top:20px;">
            This link expires in 15 minutes.
          </p>
        </div>
      `,
    });
    res.json({
      success: true,
      message: 'Password reset email sent',
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Missing fields',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
    }

    const result = await query(
      `SELECT * FROM users
       WHERE reset_token = $1`,
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        error: 'Invalid reset token',
      });
    }

    if (Date.now() > user.reset_token_expiry) {
      return res.status(400).json({
        error: 'Reset token expired',
      });
    }

    const hashed = bcrypt.hashSync(password, 10);

    await query(
      `UPDATE users
       SET password = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE id = $2`,
      [hashed, user.id]
    );

    res.json({
      success: true,
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// WAREHOUSES

app.get('/api/warehouses', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM warehouses WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/warehouses', auth, async (req, res) => {
  try {
    const { name } = req.body;

    const inserted = await query(
      `INSERT INTO warehouses (user_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, name]
    );

    res.json(inserted.rows[0]);

  } catch (e) {
    if (e.message.includes('unique_user_warehouse')) {
      return res.status(400).json({
        error: 'Warehouse name already exists.',
      });
    }

    res.status(500).json({
      error: e.message,
    });
  }
});

// PRODUCTS

app.get('/api/warehouses/:whId/products', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM products
       WHERE warehouse_id = $1
       ORDER BY created_at DESC`,
      [req.params.whId]
    );

    res.json(result.rows);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/warehouses/:whId/products', auth, async (req, res) => {
  try {
    const { name, category, quantity } = req.body;

    const inserted = await query(
      `INSERT INTO products
       (warehouse_id, name, category, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.params.whId,
        name,
        category || 'Pieces',
        quantity || 0,
      ]
    );

    res.json(inserted.rows[0]);

  } catch (e) {
    if (e.message.includes('unique_warehouse_product')) {
      return res.status(400).json({
        error: 'Product already exists in this warehouse.',
      });
    }

    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/products/:id/transaction', auth, async (req, res) => {
  try {
    const { type, amount, note } = req.body;

    const productResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    const product = productResult.rows[0];

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    const qty = parseFloat(amount);

    let newQty = parseFloat(product.quantity);
    if (type === 'in') {
      newQty += qty;
    } else {
      if (product.quantity < qty) {
        return res.status(400).json({
          error: 'Insufficient stock',
        });
      }

      newQty -= qty;
    }

    await query(
      'UPDATE products SET quantity = $1 WHERE id = $2',
      [newQty, req.params.id]
    );

    await query(
      `INSERT INTO transactions
       (product_id, type, amount, quantity_after, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.params.id,
        type,
        qty,
        newQty,
        note || null,
      ]
    );

    const updated = await query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    res.json(updated.rows[0]);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});
app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { name, category } = req.body;

    const updated = await query(
      `UPDATE products
       SET name = $1,
           category = $2
       WHERE id = $3
       RETURNING *`,
      [
        name,
        category,
        req.params.id
      ]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    res.json(updated.rows[0]);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});
app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await query(
      'DELETE FROM transactions WHERE product_id = $1',
      [req.params.id]
    );

    await query(
      'DELETE FROM products WHERE id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});
app.delete('/api/warehouses/:id', auth, async (req, res) => {
  try {
    const products = await query(
      'SELECT id FROM products WHERE warehouse_id = $1',
      [req.params.id]
    );

    for (const product of products.rows) {
      await query(
        'DELETE FROM transactions WHERE product_id = $1',
        [product.id]
      );
    }

    await query(
      'DELETE FROM products WHERE warehouse_id = $1',
      [req.params.id]
    );

    await query(
      'DELETE FROM warehouses WHERE id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});
app.put('/api/user/name', auth, async (req, res) => {
  try {
    const { name } = req.body;

    const updated = await query(
      `UPDATE users
       SET name = $1
       WHERE id = $2
       RETURNING id, name, email`,
      [name, req.user.id]
    );

    res.json(updated.rows[0]);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.put('/api/user/email', auth, async (req, res) => {
  try {
    const { email, currentPassword } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const isMatch = bcrypt.compareSync(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: 'Current password is incorrect',
      });
    }
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email.toLowerCase(), req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already in use',
      });
    }

    const updated = await query(
      `UPDATE users
       SET email = $1
       WHERE id = $2
       RETURNING id, name, email`,
      [email.toLowerCase(), req.user.id]);

    res.json(updated.rows[0]);

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.put('/api/user/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const isMatch = bcrypt.compareSync(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: 'Current password is incorrect',
      });
    }

    const hashed = bcrypt.hashSync(
      newPassword,
      10
    );

    await query(
      `UPDATE users
       SET password = $1
       WHERE id = $2`,
      [hashed, req.user.id]
    );

    res.json({
      success: true,
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});
app.get('/api/products/:id/history', auth, async (req, res) => {
  try {
    const history = await query(
      `SELECT * FROM transactions
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      history: history.rows,
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});
app.get('/api/history-by-date', auth, async (req, res) => {
  try {
    const { date } = req.query;

    const result = await query(
      `
      SELECT
        products.id AS product_id,
        products.name AS product_name,
        products.category,
        transactions.type,
        transactions.amount,
        transactions.note,
        transactions.quantity_after,
        transactions.created_at
      FROM transactions
      JOIN products
        ON products.id = transactions.product_id
      JOIN warehouses
        ON warehouses.id = products.warehouse_id
      WHERE warehouses.user_id = $1
AND warehouses.id = $2
AND DATE(transactions.created_at) = $3
      ORDER BY transactions.created_at DESC
      `,
      [req.user.id, req.query.warehouseId, date]);

    res.json({
      history: result.rows,
    });

  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.get('/', (req, res) => {
  res.send('StockFlow Backend Running');
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ StockFlow backend running');
      console.log(`📡 Port: ${PORT}`);
      console.log('');
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });