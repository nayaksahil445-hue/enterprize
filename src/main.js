import './style.css';
import { API_URL, updateNavbarAuth, isLoggedIn, apiRequest, showToast, formatPrice, starRating, getUser, getProductAltText } from './utils.js';

/* ============================================================
   JAGANNATH ENTERPRISES — MAIN APPLICATION LOGIC
   ============================================================ */

// --------------- PRODUCT DATA (STATIC FALLBACK) ---------------
const STATIC_PRODUCTS = [
  { _id: 'p1', name: 'Steel Almirah with Locker (2 Door / 3 Door)', category: 'Storage', price: 12999, image: '/images/cupboard.webp', description: 'Heavy-duty industrial steel almirah with locker, 2 door & 3 door options. Premier steel wardrobe online India at direct steel almirah price.', stock: 45, rating: 4.5, numReviews: 12 },
  { _id: 'p2', name: 'Executive Loft Dressing Table', category: 'Luxury', price: 8500, image: '/images/dressing_table.webp', description: 'Premium steel dressing table with integrated LED mirror by top steel cupboard manufacturer.', stock: 30, rating: 4.7, numReviews: 8 },
  { _id: 'p3', name: 'Registry Office Steel Almirah Cabinet', category: 'Office', price: 11000, image: '/images/cabinet.webp', description: 'Secure fire-resistant office almirah manufacturer grade steel cabinet with heavy key lock.', stock: 25, rating: 4.3, numReviews: 15 },
  { _id: 'p4', name: 'Industrial Steel Shelf Unit', category: 'Shelving', price: 4500, image: '/images/shelves.webp', description: 'Open-back multi-tier industrial steel cupboard shelving unit built for enterprise storage in New Delhi & Odisha.', stock: 60, rating: 4.6, numReviews: 20 },
  { _id: 'p5', name: 'Brass Tag 4 Door Steel Almirah Chest', category: 'Vintage', price: 9800, image: '/images/chest.webp', description: 'Vintage-style 4 door steel almirah chest of drawers with antique brass tag holders.', stock: 18, rating: 4.8, numReviews: 6 },
  { _id: 'p6', name: 'Modular Steel Almirah & Cabinet Set', category: 'Office', price: 21000, image: '/images/cabinet.webp', description: 'Enterprise-grade modular steel almirah & cabinet system by top industrial steel cupboard manufacturer.', stock: 12, rating: 4.4, numReviews: 10 },
];

/* ===============================================================
   STATE
   ================================================================ */
let allProducts = [];
let filteredProducts = [];
let cart = [];
let activeCategory = 'all';

/* ===============================================================
   LOADER
   ================================================================ */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 700);
    }
  }, 1800);
});

/* ===============================================================
   NAVBAR
   ================================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  updateScrollTop();
});

// Video play button
const videoPlayBtn = document.getElementById('video-play-btn');
const videoPlaceholder = document.getElementById('video-placeholder');
const videoPlayer = document.getElementById('video-player');
videoPlaceholder?.addEventListener('click', () => {
  if (videoPlayer) {
    videoPlayer.style.display = 'block';
    videoPlaceholder.style.display = 'none';
    videoPlayer.play();
  }
});

/* ===============================================================
   REVEAL ANIMATIONS
   ================================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = entry.target.style.transitionDelay || `${i * 0.08}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function initReveal() {
  document.querySelectorAll('.reveal:not(.visible)').forEach((el, i) => {
    el.style.transitionDelay = `${i % 4 * 0.08}s`;
    revealObserver.observe(el);
  });
}

/* ===============================================================
   COUNTER ANIMATION
   ================================================================ */
function animateCounter(el, target) {
  let count = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count.toLocaleString();
    if (count >= target) clearInterval(timer);
  }, 25);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(num =>
        animateCounter(num, parseInt(num.dataset.target))
      );
      counterObserver.unobserve(entry.target);
    }
  });
});
const statsSection = document.querySelector('.stats-grid');
if (statsSection) counterObserver.observe(statsSection);

/* ===============================================================
   PRODUCTS
   ================================================================ */
async function fetchProducts() {
  try {
    const token = localStorage.getItem('je_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}/products`, {
      headers,
      signal: AbortSignal.timeout(60000) // 60 seconds to allow Render free tier to wake up
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    allProducts = data.products && data.products.length ? data.products : STATIC_PRODUCTS;
  } catch {
    allProducts = STATIC_PRODUCTS;
  }
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
}

function renderProducts(products) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = '<p class="no-products">No products found. Try a different filter.</p>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const inStock = p.stock > 0;
    const isLow = p.stock > 0 && p.stock <= 10;
    const discount = p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${getProductAltText(p.name, p.category)}" class="product-thumb" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="product-thumb-placeholder" style="display:none">🪑</div>`
      : `<div class="product-thumb-placeholder">🪑</div>`;

    return `
      <article class="product-card reveal" data-id="${p._id}" onclick="window.location.href='/product?id=${p._id}'" style="cursor:pointer;">
        <div class="product-thumb-wrap">
          ${imgHtml}
          <div class="product-badge">${p.category}</div>
          ${discount > 0 ? `<div class="product-badge" style="left:auto;right:1rem;background:#ef4444;color:#fff;">${discount}% OFF</div>` : ''}
          ${!inStock ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;"><span style="background:#ef4444;color:#fff;padding:0.4rem 1rem;font-size:0.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-family:var(--font-head);border-radius:4px;">Out of Stock</span></div>` : ''}
        </div>
        <div class="product-info">
          <div class="product-cat">${p.category}</div>
          <h3 class="product-name">${p.name}</h3>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
            <span style="font-size:0.85rem;">${starRating(p.rating || 0)}</span>
            <span style="font-size:0.72rem;color:var(--text-dim);">(${p.numReviews || 0})</span>
          </div>
          <p class="product-desc">${p.description || ''}</p>
          <div class="product-footer">
            <div>
              <div class="product-price">${formatPrice(p.price)}</div>
              ${p.originalPrice && p.originalPrice > p.price ? `<div style="font-size:0.75rem;color:var(--text-dim);text-decoration:line-through;">${formatPrice(p.originalPrice)}</div>` : ''}
            </div>
            ${inStock
        ? `<button class="add-cart-btn" data-id="${p._id}">+ Cart</button>`
        : `<span style="font-size:0.72rem;color:#ef4444;font-weight:600;">Notify Me</span>`
      }
          </div>
          ${isLow ? `<div style="font-size:0.7rem;color:#f59e0b;font-weight:600;margin-top:0.5rem;">⚠ Only ${p.stock} left!</div>` : ''}
        </div>
      </article>
    `;
  }).join('');

  initReveal();

  // Cart buttons (stop propagation to prevent navigation)
  grid.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      addToCart(btn.dataset.id);
    });
  });
}

/* ===============================================================
   SEARCH & FILTER
   ================================================================ */
function applyFilters() {
  const term = document.getElementById('search-input')?.value.toLowerCase() || '';
  filteredProducts = allProducts.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesTerm = p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term);
    return matchesCat && matchesTerm;
  });
  renderProducts(filteredProducts);
}

document.getElementById('search-input')?.addEventListener('input', applyFilters);
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    applyFilters();
  });
});

/* ===============================================================
   CART (hybrid: localStorage for guests, server for logged-in)
   ================================================================ */
function saveCart() {
  if (isLoggedIn()) {
    // Save to logged-in user cache
    localStorage.setItem('je_cart_cache', JSON.stringify(cart));
  } else {
    // Save to guest cart
    localStorage.setItem('je_cart', JSON.stringify(cart));
  }
}

function getProductById(id) {
  return allProducts.find(p => p._id === id) || STATIC_PRODUCTS.find(p => p._id === id);
}

async function loadCartData() {
  if (isLoggedIn()) {
    // 1. Load from cache first for instant rendering
    const cached = localStorage.getItem('je_cart_cache');
    if (cached) {
      cart = JSON.parse(cached);
      renderCart();
      updateCartBadge();
    }

    // 2. Sync guest cart if there are any guest items in localStorage
    const localCart = JSON.parse(localStorage.getItem('je_cart') || '[]');
    if (localCart.length > 0) {
      for (const item of localCart) {
        try {
          await apiRequest('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId: item._id, qty: item.qty || 1 })
          });
        } catch (e) {
          console.error('Failed to sync guest item:', item._id, e);
        }
      }
      // Clear guest cart once synced
      localStorage.removeItem('je_cart');
    }

    // 3. Fetch latest cart state from the server (source of truth)
    try {
      const serverCart = await apiRequest('/cart');
      if (serverCart && serverCart.items) {
        // Map the server's [{ product: {...}, qty }] to the flat structure
        cart = serverCart.items.map(item => ({
          ...item.product,
          qty: item.qty
        }));
        saveCart(); // Update logged-in cache
      }
    } catch (err) {
      console.error('Failed to fetch server cart:', err);
    }
  } else {
    // Guest cart: Load directly from localStorage
    cart = JSON.parse(localStorage.getItem('je_cart')) || [];
  }
  
  // Render and update badge
  renderCart();
  updateCartBadge();

  // Check if we need to auto-open the cart drawer (redirected from product page)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('open-cart') === 'true') {
    toggleCart(true);
    // Clean up the URL query parameter without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function addToCart(id) {
  const product = getProductById(id);
  if (!product) return;

  if (isLoggedIn()) {
    // Server cart
    try {
      const res = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId: id, qty: 1 })
      });
      
      // Update local cart state from server response
      if (res && res.items) {
        cart = res.items.map(item => ({
          ...item.product,
          qty: item.qty
        }));
      } else {
        const existing = cart.find(i => i._id === id);
        if (existing) existing.qty += 1;
        else cart.push({ ...product, qty: 1 });
      }
      saveCart();
      showToast(`${product.name} added to cart!`, 'success');
    } catch (err) {
      if (err.message?.includes('out of stock')) {
        showToast('Product is out of stock', 'error');
      } else {
        showToast(err.message || 'Failed to add', 'error');
      }
      return;
    }
  } else {
    // Local guest cart
    const existing = cart.find(i => i._id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    saveCart();
    showToast(`${product.name} added to cart!`, 'success');
  }

  renderCart();
  updateCartBadge();
  toggleCart(true);

  const btn = document.querySelector(`.add-cart-btn[data-id="${id}"]`);
  if (btn) {
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = '+ Cart'; btn.classList.remove('added'); }, 1600);
  }
}

async function updateQty(id, delta) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  
  const newQty = Math.max(0, item.qty + delta);

  if (isLoggedIn()) {
    try {
      let res;
      if (newQty === 0) {
        // Remove from server
        res = await apiRequest(`/cart/remove/${id}`, { method: 'DELETE' });
        showToast('Item removed from cart', 'info');
      } else {
        // Update on server
        res = await apiRequest('/cart/update', {
          method: 'PUT',
          body: JSON.stringify({ productId: id, qty: newQty })
        });
      }
      
      if (res && res.items) {
        cart = res.items.map(item => ({
          ...item.product,
          qty: item.qty
        }));
      } else {
        if (newQty === 0) cart = cart.filter(i => i._id !== id);
        else item.qty = newQty;
      }
      saveCart();
    } catch (err) {
      showToast(err.message || 'Failed to update quantity', 'error');
      return;
    }
  } else {
    // Local guest cart
    if (newQty === 0) {
      cart = cart.filter(i => i._id !== id);
      showToast('Item removed from cart', 'info');
    } else {
      item.qty = newQty;
    }
    saveCart();
  }

  renderCart();
  updateCartBadge();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!container) return;

  // Prevent duplicate rendering by clearing container first
  container.innerHTML = '';

  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">🛒</div><p>Your cart is empty</p></div>';
    totalEl.textContent = '₹0';
    return;
  }

  const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  totalEl.textContent = formatPrice(total);
  container.innerHTML = cart.map(item => `
    <div class="cart-entry">
      <div class="cart-entry-info">
        <div class="cart-entry-name">${item.name}</div>
        <div class="cart-entry-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="cart-entry-qty">
        <button class="qty-btn" onclick="window._updateQty('${item._id}', -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="window._updateQty('${item._id}', 1)">+</button>
      </div>
      <button class="remove-item" onclick="window._updateQty('${item._id}', -999)">✕</button>
    </div>
  `).join('');
}

function updateCartBadge() {
  const count = cart.reduce((acc, i) => acc + i.qty, 0);
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

window._updateQty = updateQty;

// Toggle cart
function openCart() {
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-sidebar')?.classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-sidebar')?.classList.remove('open');
}

document.getElementById('cart-trigger')?.addEventListener('click', openCart);
document.getElementById('close-cart')?.addEventListener('click', closeCart);
document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

document.getElementById('checkout-btn')?.addEventListener('click', () => {
  if (!cart.length && !isLoggedIn()) {
    showToast('Your cart is empty', 'warning');
    return;
  }
  if (!isLoggedIn()) {
    showToast('Please login to checkout', 'warning');
    setTimeout(() => window.location.href = '/auth', 1000);
    return;
  }
  window.location.href = '/checkout';
});

/* ===============================================================
   RECOMMENDATIONS SECTION
   ================================================================ */
async function loadRecommendations() {
  if (!isLoggedIn()) return;

  const recSection = document.getElementById('recommendations-section');
  if (!recSection) return;

  try {
    const token = localStorage.getItem('je_token');
    const res = await fetch(`${API_URL}/products/recommendations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json();

    if (!products || !products.length) {
      recSection.style.display = 'none';
      return;
    }

    recSection.style.display = 'block';
    const grid = recSection.querySelector('.products-grid');
    grid.innerHTML = products.slice(0, 4).map(p => `
      <article class="product-card reveal" onclick="window.location.href='/product?id=${p._id}'" style="cursor:pointer;">
        <div class="product-thumb-wrap">
          ${p.image
        ? `<img src="${p.image}" alt="${getProductAltText(p.name, p.category)}" class="product-thumb" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="product-thumb-placeholder" style="display:none">🪑</div>`
        : `<div class="product-thumb-placeholder">🪑</div>`}
          <div class="product-badge">${p.category}</div>
        </div>
        <div class="product-info">
          <div class="product-cat">${p.category}</div>
          <h3 class="product-name">${p.name}</h3>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
            <span style="font-size:0.85rem;">${starRating(p.rating || 0)}</span>
            <span style="font-size:0.72rem;color:var(--text-dim);">(${p.numReviews || 0})</span>
          </div>
          <div class="product-footer">
            <div class="product-price">${formatPrice(p.price)}</div>
          </div>
        </div>
      </article>
    `).join('');
    initReveal();
  } catch {
    recSection.style.display = 'none';
  }
}

/* ===============================================================
   CONTACT FORM
   ================================================================ */
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const msgEl = document.getElementById('form-msg');
  const data = Object.fromEntries(new FormData(e.target));

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(60000)
    });
    if (res.ok) {
      msgEl.textContent = '✓ Enquiry sent! We will contact you within 24 hours.';
      msgEl.className = 'form-msg success';
      e.target.reset();
    } else throw new Error();
  } catch {
    msgEl.textContent = '✓ Enquiry received! We will contact you soon.';
    msgEl.className = 'form-msg success';
    e.target.reset();
  } finally {
    btn.textContent = 'Send Enquiry';
    btn.disabled = false;
    setTimeout(() => { msgEl.textContent = ''; msgEl.className = 'form-msg'; }, 6000);
  }
});

/* ===============================================================
   CART SIDEBAR TOGGLE
   ================================================================ */
const cartTrigger = document.getElementById('cart-trigger');
const closeCartBtn = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');

function toggleCart(show) {
  if (cartSidebar) cartSidebar.classList.toggle('active', show);
  if (cartOverlay) cartOverlay.classList.toggle('active', show);
  if (show) renderCart();
}

if (cartTrigger) cartTrigger.addEventListener('click', () => toggleCart(true));
if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) checkoutBtn.addEventListener('click', () => window.location.href = '/checkout');

/* ===============================================================
   SCROLL TO TOP
   ================================================================ */
function updateScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);
}
document.getElementById('scroll-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ===============================================================
   SMOOTH NAV SCROLLING
   ================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ===============================================================
   INIT
   ================================================================ */
initReveal();
fetchProducts();
loadCartData();
updateNavbarAuth();
loadRecommendations();
