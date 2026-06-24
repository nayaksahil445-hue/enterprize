/* ============================================================
   JAGANNATH ENTERPRISES — SHARED UTILITIES
   ============================================================ */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Auth Helpers ───
export function getToken() {
  return localStorage.getItem('je_token');
}

export function getUser() {
  const data = localStorage.getItem('je_user');
  return data ? JSON.parse(data) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

export function saveAuth(token, user) {
  localStorage.setItem('je_token', token);
  localStorage.setItem('je_user', JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem('je_token');
  localStorage.removeItem('je_user');
  localStorage.removeItem('je_cart');
  window.location.href = '/';
}

// ─── API Request Wrapper ───
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  };

  // Remove headers from spread to avoid duplication
  delete config.headers; 
  
  const finalConfig = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, finalConfig);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        // Token expired
        logout();
        return null;
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// ─── Toast Notification System ───
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed; top: 1.5rem; right: 1.5rem; z-index: 99999;
      display: flex; flex-direction: column; gap: 0.75rem;
      pointer-events: none; max-width: 420px;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'success', duration = 3500) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const colors = {
    success: 'linear-gradient(135deg, #16a34a, #22c55e)',
    error: 'linear-gradient(135deg, #dc2626, #ef4444)',
    warning: 'linear-gradient(135deg, #d97706, #f59e0b)',
    info: 'linear-gradient(135deg, #2563eb, #3b82f6)'
  };

  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: #fff; padding: 1rem 1.5rem; border-radius: 12px;
    font-size: 0.9rem; font-weight: 600; display: flex; align-items: center;
    gap: 0.75rem; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    pointer-events: auto; cursor: pointer;
    animation: toastSlideIn 0.35s ease;
    font-family: 'Inter', 'Montserrat', sans-serif;
  `;
  toast.innerHTML = `<span style="font-size:1.2rem">${icons[type] || icons.info}</span> ${message}`;
  
  toast.addEventListener('click', () => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  });
  
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// Inject toast animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ─── Formatting Helpers ───
export function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateShort(dateStr);
}

// ─── Auth-Aware Navbar Update ───
export function updateNavbarAuth() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const user = getUser();
  const existingAuth = document.getElementById('nav-auth-area');
  if (existingAuth) existingAuth.remove();

  const authArea = document.createElement('div');
  authArea.id = 'nav-auth-area';
  authArea.style.cssText = 'display:flex; align-items:center; gap:0.8rem;';

  if (user) {
    const initial = (user.name || 'U')[0].toUpperCase();
    authArea.innerHTML = `
      <div class="nav-user-menu" style="position:relative;">
        <button id="nav-user-btn" style="
          width:36px; height:36px; border-radius:50%;
          background: linear-gradient(135deg, var(--gold-dark), var(--gold-light));
          color:#000; border:none; cursor:pointer;
          font-family:var(--font-head); font-weight:800; font-size:0.85rem;
          display:flex; align-items:center; justify-content:center;
          transition: var(--transition);
        ">${initial}</button>
        <div id="nav-user-dropdown" style="
          display:none; position:absolute; right:0; top:calc(100% + 8px);
          background:rgba(20,20,20,0.97); backdrop-filter:blur(20px);
          border:1px solid rgba(201,162,39,0.2); border-radius:12px;
          min-width:220px; padding:0.5rem 0; z-index:1000;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        ">
          <div style="padding:1rem 1.25rem; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:700; color:#fff; font-size:0.9rem;">${user.name}</div>
            <div style="color:var(--text-muted); font-size:0.75rem;">${user.email}</div>
          </div>
          <a href="/dashboard.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:var(--text-muted);font-size:0.82rem;font-weight:500;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.background='rgba(201,162,39,0.05)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='none'">📋 My Orders</a>
          <a href="/dashboard.html#wishlist" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:var(--text-muted);font-size:0.82rem;font-weight:500;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.background='rgba(201,162,39,0.05)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='none'">❤️ Wishlist</a>
          ${user.role === 'admin' ? `<a href="/admin.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:var(--text-muted);font-size:0.82rem;font-weight:500;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.background='rgba(201,162,39,0.05)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='none'">⚙️ Admin Panel</a>` : ''}
          <div style="border-top:1px solid rgba(255,255,255,0.06); margin-top:0.25rem; padding-top:0.25rem;">
            <button id="nav-logout-btn" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:#ef4444;font-size:0.82rem;font-weight:500;background:none;border:none;cursor:pointer;width:100%;text-align:left;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.05)'" onmouseout="this.style.background='none'">🚪 Logout</button>
          </div>
        </div>
      </div>
    `;
  } else {
    authArea.innerHTML = `
      <a href="/auth.html" style="
        padding:0.55rem 1.2rem; border:1px solid var(--border);
        color:var(--gold); font-size:0.72rem; font-weight:600;
        letter-spacing:1.5px; text-transform:uppercase;
        border-radius:var(--radius); transition:var(--transition);
        font-family:var(--font-head);
      " onmouseover="this.style.background='rgba(201,162,39,0.08)';this.style.borderColor='var(--gold)'" onmouseout="this.style.background='none';this.style.borderColor='var(--border)'">Login</a>
    `;
  }

  // Insert before hamburger
  const hamburger = navRight.querySelector('.hamburger');
  if (hamburger) {
    navRight.insertBefore(authArea, hamburger);
  } else {
    navRight.appendChild(authArea);
  }

  // Dropdown toggle
  const userBtn = document.getElementById('nav-user-btn');
  const dropdown = document.getElementById('nav-user-dropdown');
  if (userBtn && dropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  }

  // Logout
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

// ─── Debounce ───
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Star Rating HTML ───
export function starRating(rating, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) {
      html += '<span style="color:var(--gold);">★</span>';
    } else if (i - 0.5 <= rating) {
      html += '<span style="color:var(--gold);">★</span>';
    } else {
      html += '<span style="color:var(--text-dim);">★</span>';
    }
  }
  return html;
}
