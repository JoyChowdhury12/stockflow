# 📦 StockFlow — Warehouse Management App

A full-stack warehouse inventory management system with a mobile-first dark UI.

## Features
- 🔐 User authentication (login / register)
- 🏭 Create & manage multiple warehouses
- 📦 Add products with name, category (Pieces / Cartoon), and quantity
- 🔍 Search products by name or category
- ↑↓ Stock In / Out with live quantity calculation
- 📋 Full transaction history per product
- ✏️ Edit product name and category
- 🗑 Delete products and warehouses
- 👤 Profile management (change name, email, password)
- 💾 All data saved to SQLite (persistent)

---

## Setup & Run

### Prerequisites
- Node.js v16+ installed
- npm

### Step 1 — Install dependencies

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Step 2 — Start the backend

```bash
cd backend
node server.js
# Server runs on http://localhost:5000
```

### Step 3 — Start the frontend (development)

```bash
cd frontend
npm start
# Opens http://localhost:3000
```

The frontend proxies API requests to `localhost:5000` automatically.

---

## Production Deployment

### Build the frontend

```bash
cd frontend
npm run build
```

This creates a `frontend/build/` folder with static files.

### Serve frontend from backend (optional)

Add this to `backend/server.js` before `app.listen`:

```javascript
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
```

Then just run `node backend/server.js` and visit `http://yourserver:5000`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend port |
| `JWT_SECRET` | `warehouse_secret_key_2024` | JWT signing secret — **change this in production!** |

---

## Project Structure

```
stockflow/
├── backend/
│   ├── server.js        # Express API + SQLite
│   ├── warehouse.db     # Auto-created SQLite database
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api.js              # API client
    │   ├── App.js              # Root + routing
    │   ├── index.css           # Global styles
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── Modal.js
    │   │   └── Toast.js
    │   └── pages/
    │       ├── AuthPage.js
    │       ├── WarehousesPage.js
    │       └── ProductsPage.js
    └── package.json
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/warehouses` | List warehouses |
| POST | `/api/warehouses` | Create warehouse |
| PUT | `/api/warehouses/:id` | Rename warehouse |
| DELETE | `/api/warehouses/:id` | Delete warehouse |
| GET | `/api/warehouses/:id/products` | List products |
| POST | `/api/warehouses/:id/products` | Add product |
| PUT | `/api/products/:id` | Edit product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/:id/transaction` | Stock in/out |
| GET | `/api/products/:id/history` | Transaction history |
