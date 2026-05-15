const BASE = 'https://stockflow-20tm.onrender.com';

function getToken() {
  return localStorage.getItem('wh_token');
}

async function request(path, options = {}) {
  const token = getToken();

  try {
    const res = await fetch(`${BASE}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error(
        text.includes('Proxy error')
          ? 'Backend server is not running. Start backend on port 5000.'
          : 'Invalid server response received.'
      );
    }

    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to backend server.');
    }

    throw error;
  }
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  getProfile: () => request('/auth/profile'),
  changeName: (name) =>
    request('/user/name', {
      method: 'PUT',
      body: { name },
    }),

  changeEmail: (email) =>
    request('/user/email', {
      method: 'PUT',
      body: { email },
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/user/password', {
      method: 'PUT',
      body: {
        currentPassword,
        newPassword,
      },
    }),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body }),

  getWarehouses: () => request('/warehouses'),
  createWarehouse: (body) => request('/warehouses', { method: 'POST', body }),
  updateWarehouse: (id, body) => request(`/warehouses/${id}`, { method: 'PUT', body }),
  deleteWarehouse: (id) => request(`/warehouses/${id}`, { method: 'DELETE' }),

  getProducts: (whId) => request(`/warehouses/${whId}/products`),
  createProduct: (whId, body) => request(`/warehouses/${whId}/products`, { method: 'POST', body }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  transact: (id, body) => request(`/products/${id}/transaction`, { method: 'POST', body }),
  getHistory: (id) => request(`/products/${id}/history`),
  getHistoryByDate: (warehouseId, date) =>
    request(
      `/history-by-date?warehouseId=${warehouseId}&date=${date}`
    ),
};
