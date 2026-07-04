import { apiRequest, formatPrice, formatDate, formatDateShort, showToast, updateNavbarAuth, isLoggedIn, getUser, starRating } from './utils.js';

if (!isLoggedIn()) { window.location.href = '/auth.html'; }

const user = getUser();
updateNavbarAuth();

// Header
document.getElementById('dash-avatar').textContent = (user?.name || 'U')[0].toUpperCase();
document.getElementById('dash-name').textContent = `Welcome, ${user?.name || 'User'}`;
document.getElementById('dash-email').textContent = user?.email || '';

// ─── Tab Switching ───
document.querySelectorAll('.dash-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`pane-${tab.dataset.pane}`).classList.add('active');
  });
});

// Check URL hash for tab
const hash = window.location.hash.replace('#', '');
if (hash) {
  const tab = document.querySelector(`.dash-tab[data-pane="${hash}"]`);
  if (tab) tab.click();
}

// ─── Load Orders ───
async function loadOrders() {
  try {
    const orders = await apiRequest('/orders/my');
    const container = document.getElementById('orders-content');

    if (!orders || !orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 style="font-family:var(--font-display);font-size:1.5rem;letter-spacing:2px;margin-bottom:0.5rem;">No Orders Yet</h3>
          <p style="color:var(--text-muted);margin-bottom:2rem;">Start shopping to see your orders here!</p>
          <a href="/#products" class="btn btn-gold">Browse Products</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(o => {
      const statusClass = o.orderStatus.replace(/ /g, '');
      return `
        <div class="dash-card">
          <div class="order-card-header">
            <div>
              <span class="order-number">#${o.orderNumber}</span>
              <span class="order-date" style="margin-left:1rem;">${formatDate(o.createdAt)}</span>
            </div>
            <span class="status-pill pill-${statusClass}">${o.orderStatus}</span>
          </div>
          <div class="order-card-items">
            ${(o.items || []).map(i => `
              <div class="order-card-item">
                ${i.image ? `<img src="${i.image}" alt="${i.productName || 'Order item'}" onerror="this.outerHTML='🪑'">` : '🪑'}
                <span>${i.productName} × ${i.qty}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-card-footer">
            <div class="order-total">${formatPrice(o.totalAmount)}</div>
            <div style="display:flex;gap:0.75rem;">
              <a href="/tracking.html?id=${o._id}" class="track-btn">Track Order →</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    document.getElementById('orders-content').innerHTML = '<p style="color:var(--text-dim);padding:2rem;">Failed to load orders. Is the server running?</p>';
  }
}

// ─── Load Profile ───
async function loadProfile() {
  try {
    const profile = await apiRequest('/auth/profile');
    document.getElementById('profile-content').innerHTML = `
      <div class="dash-card" style="max-width:550px;">
        <div style="font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:1.5rem;">Edit Profile</div>
        <form class="profile-form" id="profile-form">
          <div class="pf-group">
            <label for="pf-name">Full Name</label>
            <input type="text" id="pf-name" value="${profile.name || ''}" />
          </div>
          <div class="pf-group">
            <label for="pf-email">Email (cannot change)</label>
            <input type="email" id="pf-email" value="${profile.email || ''}" disabled style="opacity:0.5;" />
          </div>
          <div class="pf-group">
            <label for="pf-phone">Phone</label>
            <input type="tel" id="pf-phone" value="${profile.phone || ''}" placeholder="+91 XXXXX XXXXX" />
          </div>
          <button type="submit" class="btn btn-gold" style="margin-top:0.5rem;">Update Profile</button>
        </form>
        <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border-subtle);">
          <div style="font-size:0.78rem;color:var(--text-dim);">
            Account created: ${formatDateShort(profile.createdAt)}<br>
            Role: <span style="color:var(--gold);font-weight:600;">${profile.role}</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: document.getElementById('pf-name').value,
            phone: document.getElementById('pf-phone').value,
          })
        });
        showToast('Profile updated!', 'success');
        // Update localStorage
        const u = getUser();
        u.name = document.getElementById('pf-name').value;
        u.phone = document.getElementById('pf-phone').value;
        localStorage.setItem('je_user', JSON.stringify(u));
        updateNavbarAuth();
      } catch (err) {
        showToast(err.message || 'Update failed', 'error');
      }
    });
  } catch {
    document.getElementById('profile-content').innerHTML = '<p style="color:var(--text-dim);">Failed to load profile.</p>';
  }
}

// ─── Load Addresses ───
async function loadAddresses() {
  try {
    const profile = await apiRequest('/auth/profile');
    const addresses = profile.addresses || [];
    const container = document.getElementById('addresses-content');

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-bottom:2rem;">
        ${addresses.map(a => `
          <div class="address-card ${a.isDefault ? 'default' : ''}">
            ${a.isDefault ? '<div class="address-default-badge">DEFAULT</div>' : ''}
            <div style="font-weight:700;margin-bottom:0.3rem;">${a.fullName} <span style="color:var(--gold);font-size:0.75rem;">(${a.label})</span></div>
            <div style="color:var(--text-muted);font-size:0.85rem;line-height:1.6;">
              ${a.street}<br>${a.city}, ${a.state} - ${a.pincode}<br>📞 ${a.phone}
            </div>
            <button style="margin-top:0.75rem;background:none;border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.35rem 0.75rem;border-radius:6px;font-size:0.72rem;cursor:pointer;font-weight:600;" onclick="deleteAddress('${a._id}')">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="dash-card" style="max-width:550px;">
        <div style="font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:1.5rem;">Add New Address</div>
        <form id="add-address-form" class="profile-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="pf-group"><label>Full Name *</label><input type="text" id="new-addr-name" required></div>
            <div class="pf-group"><label>Phone *</label><input type="tel" id="new-addr-phone" required></div>
          </div>
          <div class="pf-group"><label>Street Address *</label><input type="text" id="new-addr-street" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
            <div class="pf-group"><label>City *</label><input type="text" id="new-addr-city" required></div>
            <div class="pf-group"><label>State *</label><input type="text" id="new-addr-state" required></div>
            <div class="pf-group"><label>Pincode *</label><input type="text" id="new-addr-pincode" required maxlength="6"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="pf-group"><label>Label</label><input type="text" id="new-addr-label" value="Home" placeholder="Home / Office"></div>
            <div class="pf-group" style="justify-content:flex-end;">
              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                <input type="checkbox" id="new-addr-default"> Set as default
              </label>
            </div>
          </div>
          <button type="submit" class="btn btn-gold">Add Address</button>
        </form>
      </div>
    `;

    document.getElementById('add-address-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiRequest('/auth/address', {
          method: 'POST',
          body: JSON.stringify({
            fullName: document.getElementById('new-addr-name').value,
            phone: document.getElementById('new-addr-phone').value,
            street: document.getElementById('new-addr-street').value,
            city: document.getElementById('new-addr-city').value,
            state: document.getElementById('new-addr-state').value,
            pincode: document.getElementById('new-addr-pincode').value,
            label: document.getElementById('new-addr-label').value || 'Home',
            isDefault: document.getElementById('new-addr-default').checked
          })
        });
        showToast('Address added!', 'success');
        loadAddresses();
      } catch (err) {
        showToast(err.message || 'Failed to add address', 'error');
      }
    });

    window.deleteAddress = async function(id) {
      if (!confirm('Remove this address?')) return;
      try {
        await apiRequest(`/auth/address/${id}`, { method: 'DELETE' });
        showToast('Address removed', 'info');
        loadAddresses();
      } catch { showToast('Failed to remove', 'error'); }
    };
  } catch {
    document.getElementById('addresses-content').innerHTML = '<p style="color:var(--text-dim);">Failed to load addresses.</p>';
  }
}

// ─── Load Wishlist ───
async function loadWishlist() {
  try {
    const profile = await apiRequest('/auth/profile');
    const wishlist = profile.wishlist || [];
    const container = document.getElementById('wishlist-content');

    if (!wishlist.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❤️</div>
          <h3 style="font-family:var(--font-display);font-size:1.5rem;letter-spacing:2px;margin-bottom:0.5rem;">Wishlist Empty</h3>
          <p style="color:var(--text-muted);margin-bottom:2rem;">Save products you love for later!</p>
          <a href="/#products" class="btn btn-gold">Browse Products</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="wishlist-grid">
        ${wishlist.map(p => `
          <div class="dash-card" style="padding:0;overflow:hidden;cursor:pointer;" onclick="window.location.href='/product.html?id=${p._id}'">
            <div style="height:180px;background:var(--dark-4);display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${p.image ? `<img src="${p.image}" alt="${p.name}" style="max-width:90%;max-height:90%;object-fit:contain;" onerror="this.outerHTML='<div style=font-size:3rem>🪑</div>'">` : '<div style="font-size:3rem;">🪑</div>'}
            </div>
            <div style="padding:1.25rem;">
              <div style="font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;">${p.category}</div>
              <div style="font-weight:700;margin:0.3rem 0;">${p.name}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
                <span style="font-family:var(--font-display);font-size:1.3rem;color:var(--gold-light);">${formatPrice(p.price)}</span>
                <button style="background:none;border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.75rem;cursor:pointer;" onclick="event.stopPropagation();removeWishlist('${p._id}')">✕</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    window.removeWishlist = async function(id) {
      try {
        await apiRequest(`/auth/wishlist/${id}`, { method: 'POST' });
        showToast('Removed from wishlist', 'info');
        loadWishlist();
      } catch { showToast('Failed', 'error'); }
    };
  } catch {
    document.getElementById('wishlist-content').innerHTML = '<p style="color:var(--text-dim);">Failed to load wishlist.</p>';
  }
}

// ─── Init ───
loadOrders();
loadProfile();
loadAddresses();
loadWishlist();
