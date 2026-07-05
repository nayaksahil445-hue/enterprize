import './pwa-setup.js';
import { apiRequest, formatPrice, formatDate, formatDateShort, showToast, isAdmin, logout } from './utils.js';

/* ============================================================
   JAGANNATH ENTERPRISES — ADMIN CORE LOGIC
   ============================================================ */

// Redirect if not admin
if (!isAdmin()) {
  showToast('Access Denied. Admins only.', 'error');
  setTimeout(() => window.location.href = '/', 1500);
}

// ─── State Management ───
let currentPane = 'dashboard';
let stats = {};
let products = [];
let orders = [];
let customers = [];
let enquiries = [];

// ─── Pane Switching ───
document.querySelectorAll('.admin-nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const pane = btn.dataset.pane;
    if (!pane) return;
    
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`pane-${pane}`).classList.add('active');
    
    currentPane = pane;
    loadPaneData(pane);
  });
});

async function loadPaneData(pane) {
  setLoading(true);
  try {
    switch(pane) {
      case 'dashboard': await loadDashboard(); break;
      case 'orders': await loadOrders(); break;
      case 'inventory': await loadInventory(); break;
      case 'customers': await loadCustomers(); break;
      case 'enquiries': await loadEnquiries(); break;
    }
  } catch (err) {
    showToast(err.message || 'Operation failed', 'error');
  } finally {
    setLoading(false);
  }
}

function setLoading(val) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = val ? 'flex' : 'none';
}

// ─── Dashboard ───
async function loadDashboard() {
  const data = await apiRequest('/admin/dashboard');
  stats = data.stats;
  
  document.getElementById('stat-revenue').textContent = formatPrice(stats.totalRevenue);
  document.getElementById('stat-orders').textContent = stats.totalOrders;
  document.getElementById('stat-users').textContent = stats.totalUsers;
  document.getElementById('stat-stock-alert').textContent = stats.lowStockProducts;

  // Recent logs
  const logsEl = document.getElementById('recent-logs');
  if (logsEl) {
    logsEl.innerHTML = data.recentOrders.length ? data.recentOrders.map(o => `
      <div style="padding:0.75rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:0.75rem; color:var(--text-dim);">${formatDate(o.createdAt)}</div>
        <div style="font-size:0.82rem; font-weight:700;">New Order #${o.orderNumber}</div>
        <div style="font-size:0.78rem; color:var(--gold);">${o.user?.name || 'Guest'} — ${formatPrice(o.totalAmount)}</div>
      </div>
    `).join('') : '<p style="color:var(--text-dim);text-align:center;padding:1rem;">No recent orders</p>';
  }

  // Simple Chart Visualization Logic
  if (data.monthlyRevenue && data.monthlyRevenue.length) {
    const chart = document.getElementById('revenue-chart');
    if (chart) {
      const maxRev = Math.max(...data.monthlyRevenue.map(m => m.revenue));
      chart.innerHTML = `
        <div style="display:flex; align-items:flex-end; gap:1.5rem; height:100%; padding:2rem 1rem 1rem;">
          ${data.monthlyRevenue.map(m => {
            const height = (m.revenue / (maxRev || 1)) * 80;
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:0.5rem; height:100%; justify-content:flex-end;">
                <div style="font-size:0.65rem; color:var(--gold); font-weight:700;">₹${(m.revenue/1000).toFixed(1)}k</div>
                <div style="width:100%; height:${height}%; background:linear-gradient(to top, var(--gold-dark), var(--gold)); border-radius:4px 4px 0 0; opacity:0.8; transition:all 1s ease;"></div>
                <div style="font-size:0.65rem; color:var(--text-dim); font-weight:600; text-transform:uppercase;">${m._id.split('-')[1]}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }
}

// ─── Orders ───
async function loadOrders() {
  const statusFilter = document.getElementById('order-filter-status');
  const status = statusFilter ? statusFilter.value : 'all';
  const url = status === 'all' ? '/orders' : `/orders?status=${status}`;
  const data = await apiRequest(url);
  orders = data.orders;
  
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = orders.map(o => {
    const s = o.orderStatus.toLowerCase().replace(/ /g, '');
    return `
      <tr>
        <td style="font-family:var(--font-head); font-weight:700; color:var(--gold);">${o.orderNumber}</td>
        <td>
          <div style="font-weight:700;">${o.user?.name || 'User'}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">${o.user?.email || ''}</div>
        </td>
        <td><div style="font-size:0.75rem;">${formatDateShort(o.createdAt)}</div></td>
        <td>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            ${(o.items || []).map(item => `
              <div style="font-size:0.72rem; background:rgba(255,255,255,0.05); padding:0.2rem 0.5rem; border-radius:4px;">
                <span style="color:var(--gold); font-weight:700;">${item.qty}x</span> ${item.productName}
              </div>
            `).join('')}
          </div>
        </td>
        <td><div style="font-weight:700; color:var(--gold-light);">${formatPrice(o.totalAmount)}</div></td>
        <td>
          <span class="status-badge ${s}">${o.orderStatus}</span>
          ${o.orderStatus === 'Cancelled' ? `
            <div style="font-size:0.72rem; color:#ef4444; margin-top:0.4rem; max-width:185px; word-wrap:break-word; text-align:left; background:rgba(239,68,68,0.05); padding:0.4rem; border-radius:4px; border:1px solid rgba(239,68,68,0.15);">
              <strong>Reason:</strong> ${o.cancelReason === 'Other' && o.cancelCustomReason ? o.cancelCustomReason : (o.cancelReason || 'Customer Cancelled')}
              ${o.cancelFeedback ? `<br><strong>Feedback:</strong> "${o.cancelFeedback}"` : ''}
            </div>
          ` : ''}
        </td>
        <td>
          <select style="padding:0.4rem; font-size:0.75rem; background:#1a1a1a; color:#fff; border:1px solid var(--admin-border); border-radius:4px;" 
                  onchange="window._updateOrderStatus('${o._id}', this.value)">
            ${['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(opt => 
              `<option value="${opt}" ${o.orderStatus === opt ? 'selected' : ''}>${opt}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

window._updateOrderStatus = async (id, status) => {
  if (!confirm(`Change order status to ${status}?`)) return;
  try {
    await apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, message: `Status updated to ${status} by admin.` })
    });
    showToast('Order status updated', 'success');
    loadOrders();
    loadDashboard(); 
  } catch (err) { showToast(err.message, 'error'); }
};

// ─── Inventory ───
async function loadInventory() {
  const data = await apiRequest('/products');
  products = data.products;
  
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = products.map(p => {
    const isLow = p.stock <= (p.lowStockThreshold || 10);
    const isOut = p.stock === 0;
    const stockClass = isOut ? 'out' : (isLow ? 'low' : 'ok');
    
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="width:40px; height:40px; background:#1a1a1a; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:contain;" onerror="this.outerHTML='🪑'">` : '🪑'}
            </div>
            <div>
              <div style="font-weight:700;">${p.name}</div>
              <div style="font-size:0.7rem; color:var(--text-dim);">ID: ${p._id.slice(-6)}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size:0.75rem; color:var(--gold); font-weight:700;">${p.category}</span></td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="stock-pill ${stockClass}">${p.stock} units</span></td>
        <td><span style="color:${p.isActive ? '#22c55e' : '#ef4444'}; font-weight:700; font-size:0.7rem;">${p.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-outline" style="padding:0.4rem 0.75rem; font-size:0.7rem;" onclick="window._editProduct('${p._id}')">Edit</button>
            <button class="btn btn-outline" style="padding:0.4rem 0.75rem; font-size:0.7rem; border-color:rgba(239,68,68,0.3); color:#ef4444;" onclick="window._deleteProduct('${p._id}')">Del</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── Product Management ───
const productFormContainer = document.getElementById('product-form-container');
const productForm = document.getElementById('product-form');

document.getElementById('btn-add-product-modal')?.addEventListener('click', () => {
  productForm.reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('product-form-title').textContent = 'ADD NEW PRODUCT';
  productFormContainer.style.display = 'block';
  productFormContainer.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btn-cancel-product')?.addEventListener('click', () => {
  productFormContainer.style.display = 'none';
});

productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  
  // Parse specs
  const specsText = document.getElementById('af-specs').value;
  const specifications = {};
  specsText.split('\n').forEach(line => {
    const [k, v] = line.split(':');
    if (k && v) specifications[k.trim()] = v.trim();
  });

  const body = {
    name: document.getElementById('af-name').value,
    category: document.getElementById('af-category').value,
    price: Number(document.getElementById('af-price').value),
    originalPrice: Number(document.getElementById('af-original-price').value) || undefined,
    stock: Number(document.getElementById('af-stock').value),
    image: document.getElementById('af-image').value,
    description: document.getElementById('af-desc').value,
    specifications
  };

  try {
    setLoading(true);
    const url = id ? `/products/${id}` : '/products';
    const method = id ? 'PUT' : 'POST';
    
    await apiRequest(url, { method, body: JSON.stringify(body) });
    showToast(`Product ${id ? 'updated' : 'added'} successfully`, 'success');
    
    productFormContainer.style.display = 'none';
    loadInventory();
  } catch (err) { showToast(err.message, 'error'); }
  finally { setLoading(false); }
});

window._editProduct = (id) => {
  const p = products.find(prod => prod._id === id);
  if (!p) return;
  
  document.getElementById('edit-id').value = p._id;
  document.getElementById('af-name').value = p.name;
  document.getElementById('af-category').value = p.category;
  document.getElementById('af-price').value = p.price;
  document.getElementById('af-original-price').value = p.originalPrice || '';
  document.getElementById('af-stock').value = p.stock;
  document.getElementById('af-image').value = p.image || '';
  document.getElementById('af-desc').value = p.description || '';
  
  // Specs back to text
  let specsText = '';
  if (p.specifications) {
     const specs = p.specifications instanceof Map ? Object.fromEntries(p.specifications) : p.specifications;
     specsText = Object.entries(specs).map(([k,v]) => `${k}: ${v}`).join('\n');
  }
  document.getElementById('af-specs').value = specsText;
  
  document.getElementById('product-form-title').textContent = 'EDIT PRODUCT DEFINITION';
  productFormContainer.style.display = 'block';
  productFormContainer.scrollIntoView({ behavior: 'smooth' });
};

window._deleteProduct = async (id) => {
  if (!confirm('Permanently decommission this product? This cannot be undone.')) return;
  try {
    await apiRequest(`/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted', 'info');
    loadInventory();
  } catch (err) { showToast(err.message, 'error'); }
};

// ─── Customers ───
async function loadCustomers() {
  const data = await apiRequest('/admin/customers');
  customers = data.customers;
  
  const tbody = document.getElementById('customers-tbody');
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><div style="font-weight:700;">${c.name}</div><div style="font-size:0.75rem; color:var(--text-dim);">Joined: ${formatDateShort(c.createdAt)}</div></td>
      <td>${c.email}</td>
      <td>${c.phone || 'N/A'}</td>
      <td><div style="font-weight:700; color:var(--gold-light);">${formatPrice(c.totalSpent)}</div></td>
      <td><div style="background:rgba(255,255,255,0.05); padding:0.25rem 0.5rem; border-radius:4px; display:inline-block; font-weight:700;">${c.orderCount}</div></td>
    </tr>
  `).join('');
}

// ─── Enquiries ───
async function loadEnquiries() {
  const data = await apiRequest('/admin/enquiries');
  enquiries = data;
  
  const tbody = document.getElementById('enquiries-tbody');
  tbody.innerHTML = enquiries.map(e => `
    <tr>
      <td><div style="font-size:0.78rem;">${formatDate(e.date)}</div></td>
      <td><div style="font-weight:700;">${e.name || 'Anonymous'}</div></td>
      <td>${e.email || 'N/A'}</td>
      <td style="color:var(--text-muted); font-size:0.82rem; max-width:400px; line-height:1.5;">${e.message || ''}</td>
    </tr>
  `).join('');
}

// ─── Dash Refresh ───
document.getElementById('refresh-dash')?.addEventListener('click', () => loadDashboard());
document.getElementById('refresh-dash')?.click(); 

// Logout
document.getElementById('admin-logout')?.addEventListener('click', logout);
