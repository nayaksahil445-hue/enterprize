import { apiRequest, formatPrice, showToast, updateNavbarAuth, isLoggedIn, starRating, getUser } from './utils.js';
import './style.css';

const API_URL = 'http://localhost:5000/api';

// Get product ID from URL
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let currentProduct = null;
let qty = 1;

// ─── Init ───
updateNavbarAuth();
initializeCart();

if (!productId) {
  showError();
} else {
  loadProduct();
}

async function loadProduct() {
  try {
    const token = localStorage.getItem('je_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const res = await fetch(`${API_URL}/products/${productId}`, { headers });
    if (!res.ok) throw new Error();
    
    currentProduct = await res.json();
    renderProduct(currentProduct);
    loadReviews();
    loadRecommendations();
  } catch {
    showError();
  }
}

function showError() {
  document.getElementById('product-loading').style.display = 'none';
  document.getElementById('product-error').style.display = 'block';
  document.getElementById('recommended-section').style.display = 'none';
}

function renderProduct(p) {
  document.title = `${p.name} | Jagannath Enterprises`;
  
  // Dynamic SEO meta updates
  const inStock = p.stock > 0;
  const descText = p.description || `Buy ${p.name} at Jagannath Enterprises. Premium quality ${p.category} industrial furniture with 5-year warranty.`;
  
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', descText);
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `${p.name} | Jagannath Enterprises`);
  
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', descText);
  
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && p.image) {
    ogImage.setAttribute('content', p.image.startsWith('http') ? p.image : `https://enterprize-sand.vercel.app${p.image}`);
  }
  
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', window.location.href);

  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) canonicalLink.setAttribute('href', window.location.href);

  // Dynamic Product JSON-LD Schema
  let schemaScript = document.getElementById('product-schema');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'product-schema';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }
  
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "image": p.image ? (p.image.startsWith('http') ? p.image : `https://enterprize-sand.vercel.app${p.image}`) : "https://enterprize-sand.vercel.app/favicon.svg",
    "description": descText,
    "category": p.category,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": p.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Jagannath Enterprises"
      }
    }
  };
  
  if (p.rating && p.numReviews) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": p.rating,
      "reviewCount": p.numReviews,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  schemaScript.textContent = JSON.stringify(productSchema, null, 2);

  document.getElementById('product-loading').style.display = 'none';
  const content = document.getElementById('product-content');
  content.style.display = 'block';

  const discountPercent = p.originalPrice && p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : 0;

  const isLow = p.stock > 0 && p.stock <= (p.lowStockThreshold || 10);

  // Build specs
  let specsHtml = '';
  if (p.specifications) {
    const specs = p.specifications instanceof Map ? Object.fromEntries(p.specifications) : p.specifications;
    specsHtml = Object.entries(specs).map(([k, v]) =>
      `<div class="pd-spec-row"><span class="pd-spec-key">${k}</span><span class="pd-spec-val">${v}</span></div>`
    ).join('');
  }

  content.innerHTML = `
    <div class="pd-grid">
      <div class="pd-image-wrap">
        <div class="pd-badge-wrap">
          <span class="pd-badge">${p.category}</span>
          ${discountPercent > 0 ? `<span class="pd-badge pd-badge-discount">${discountPercent}% OFF</span>` : ''}
          ${!inStock ? `<span class="pd-badge pd-badge-oos">Out of Stock</span>` : ''}
        </div>
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" class="pd-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="product-thumb-placeholder" style="${p.image ? 'display:none;' : ''}width:100%;height:100%;">🪑</div>
      </div>

      <div class="pd-info">
        <div class="pd-category">${p.category}</div>
        <h1 class="pd-name">${p.name}</h1>

        <div class="pd-rating">
          <div class="pd-rating-stars">${starRating(p.rating || 0)}</div>
          <span class="pd-rating-text">${(p.rating || 0).toFixed(1)} (${p.numReviews || 0} reviews)</span>
          <span style="color:var(--text-dim);font-size:0.78rem;">| ${p.views || 0} views</span>
        </div>

        <div class="pd-price-row">
          <span class="pd-price">${formatPrice(p.price)}</span>
          ${p.originalPrice && p.originalPrice > p.price ? `<span class="pd-original-price">${formatPrice(p.originalPrice)}</span>` : ''}
          ${discountPercent > 0 ? `<span class="pd-discount-tag">Save ${discountPercent}%</span>` : ''}
        </div>

        <p class="pd-desc">${p.description || 'No description available.'}</p>

        <div class="pd-stock">
          <span class="pd-stock-dot ${inStock ? (isLow ? 'pd-stock-low' : 'pd-stock-in') : 'pd-stock-out'}"></span>
          ${inStock
            ? (isLow ? `<span style="color:#f59e0b;">Only ${p.stock} left — order soon!</span>` : `<span style="color:#22c55e;">In Stock (${p.stock} available)</span>`)
            : '<span style="color:#ef4444;">Currently Out of Stock</span>'
          }
        </div>

        ${inStock ? `
          <div class="pd-actions">
            <div class="pd-qty-wrap">
              <button class="pd-qty-btn" id="qty-minus">−</button>
              <input type="number" class="pd-qty-num" id="qty-input" value="1" min="1" max="${p.stock}" readonly>
              <button class="pd-qty-btn" id="qty-plus">+</button>
            </div>
            <button class="btn btn-gold" id="add-to-cart-btn" style="flex:1;">Add to Cart</button>
            <button class="btn btn-outline" id="wishlist-btn" title="Add to Wishlist" style="padding:1rem;">❤️</button>
          </div>
        ` : `
          <div style="margin-bottom:2rem;">
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.75rem;">Get notified when this product is back in stock:</p>
            <div class="notify-form">
              <input type="email" id="notify-email" placeholder="Your email address" />
              <button class="btn btn-gold" id="notify-btn">Notify Me</button>
            </div>
            <button class="btn btn-outline" id="save-later-btn" style="margin-top:1rem;width:100%;">Save for Later</button>
          </div>
        `}

        ${specsHtml ? `
          <div class="pd-specs">
            <div class="pd-specs-title">Specifications</div>
            ${specsHtml}
          </div>
        ` : ''}

        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          ${(p.tags || []).map(t => `<span style="
            padding:0.35rem 0.8rem; background:rgba(201,162,39,0.08);
            border:1px solid var(--border); color:var(--gold);
            font-size:0.72rem; font-weight:600; letter-spacing:1px;
            text-transform:uppercase; border-radius:4px; font-family:var(--font-head);
          ">${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="reviews-section" id="reviews-section">
      <div class="pd-specs-title" style="font-size:0.85rem;">Customer Reviews</div>
      <div id="reviews-container">
        <p style="color:var(--text-dim);">Loading reviews...</p>
      </div>
    </div>
  `;

  // Attach events
  attachEvents(p);
}

function attachEvents(p) {
  // Quantity controls
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    qtyInput.value = qty;
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    qty = Math.min(p.stock, qty + 1);
    qtyInput.value = qty;
  });

  // Add to cart
  document.getElementById('add-to-cart-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;

    if (isLoggedIn()) {
      try {
        btn.disabled = true;
        btn.textContent = 'Adding...';
        const res = await apiRequest('/cart/add', {
          method: 'POST',
          body: JSON.stringify({ productId: p._id, qty })
        });
        showToast(`${p.name} added to cart!`, 'success');
        
        // Update local logged-in cache
        if (res && res.items) {
          const updatedCart = res.items.map(item => ({
            ...item.product,
            qty: item.qty
          }));
          localStorage.setItem('je_cart_cache', JSON.stringify(updatedCart));
        }
        
        updateCartBadge();
        btn.textContent = '✓ Added!';
        setTimeout(() => btn.textContent = 'Add to Cart', 2000);
      } catch (err) {
        showToast(err.message || 'Failed to add to cart', 'error');
        btn.textContent = 'Add to Cart';
      } finally {
        btn.disabled = false;
      }
    } else {
      // Local guest cart
      const guestCart = JSON.parse(localStorage.getItem('je_cart') || '[]');
      const existing = guestCart.find(i => i._id === p._id);
      if (existing) {
        existing.qty += qty;
      } else {
        guestCart.push({ ...p, qty });
      }
      localStorage.setItem('je_cart', JSON.stringify(guestCart));
      showToast(`${p.name} added to cart!`, 'success');
      updateCartBadge();
      btn.textContent = '✓ Added!';
      setTimeout(() => btn.textContent = 'Add to Cart', 2000);
    }
  });

  // Wishlist
  document.getElementById('wishlist-btn')?.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('Please login first', 'warning');
      return;
    }
    try {
      const data = await apiRequest(`/auth/wishlist/${p._id}`, { method: 'POST' });
      showToast(data.message, 'success');
    } catch (err) {
      showToast('Failed to update wishlist', 'error');
    }
  });

  // Notify me
  document.getElementById('notify-btn')?.addEventListener('click', () => {
    const email = document.getElementById('notify-email').value;
    if (!email) { showToast('Enter your email', 'warning'); return; }
    showToast('You will be notified when this product is back in stock!', 'success');
  });

  // Save for later
  document.getElementById('save-later-btn')?.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('Please login first', 'warning');
      return;
    }
    try {
      await apiRequest(`/cart/save-for-later/${p._id}`, { method: 'POST' });
      showToast('Saved for later!', 'success');
    } catch (err) {
      showToast('Failed to save', 'error');
    }
  });
}

// ─── Reviews ───
async function loadReviews() {
  try {
    const res = await fetch(`${API_URL}/reviews/${productId}`);
    const data = await res.json();
    renderReviews(data);
  } catch {
    document.getElementById('reviews-container').innerHTML = '<p style="color:var(--text-dim);">Could not load reviews.</p>';
  }
}

function renderReviews(data) {
  const container = document.getElementById('reviews-container');
  if (!data.reviews || !data.reviews.length) {
    container.innerHTML = '<p style="color:var(--text-dim);padding:1rem 0;">No reviews yet. Be the first to review after purchasing!</p>';
    return;
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
      <div style="font-family:var(--font-display);font-size:3.5rem;color:var(--gold-light);">${data.avgRating}</div>
      <div>
        <div>${starRating(data.avgRating)}</div>
        <div style="color:var(--text-muted);font-size:0.85rem;margin-top:0.3rem;">${data.totalRatings} reviews</div>
      </div>
      <div style="flex:1;margin-left:2rem;">
        ${[5,4,3,2,1].map(n => {
          const pct = data.totalRatings > 0 ? (data.breakdown[n] / data.totalRatings * 100) : 0;
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;">
            <span style="font-size:0.75rem;color:var(--text-muted);width:15px;">${n}</span>
            <div style="flex:1;height:6px;background:var(--dark-4);border-radius:3px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:var(--gold);border-radius:3px;"></div>
            </div>
            <span style="font-size:0.72rem;color:var(--text-dim);width:25px;">${data.breakdown[n]}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    ${data.reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${(r.user?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <div class="review-name">${r.user?.name || 'Anonymous'}</div>
            <div class="review-date">${new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div style="margin-left:auto;">${starRating(r.rating)}</div>
        </div>
        ${r.title ? `<div style="font-weight:700;margin-bottom:0.3rem;">${r.title}</div>` : ''}
        <p class="review-comment">${r.comment || ''}</p>
      </div>
    `).join('')}
  `;
}

// ─── Recommendations ───
async function loadRecommendations() {
  try {
    const token = localStorage.getItem('je_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}/products/recommendations`, { headers });
    const products = await res.json();

    const filtered = products.filter(p => p._id !== productId).slice(0, 4);
    const grid = document.getElementById('recommended-grid');

    if (!filtered.length) {
      document.getElementById('recommended-section').style.display = 'none';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <article class="product-card" onclick="window.location.href='/product.html?id=${p._id}'" style="cursor:pointer;">
        <div class="product-thumb-wrap">
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}" class="product-thumb" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="product-thumb-placeholder" style="display:none">🪑</div>`
            : `<div class="product-thumb-placeholder">🪑</div>`}
          <div class="product-badge">${p.category}</div>
        </div>
        <div class="product-info">
          <div class="product-cat">${p.category}</div>
          <h3 class="product-name">${p.name}</h3>
          <div class="product-footer">
            <div class="product-price">${formatPrice(p.price)}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${starRating(p.rating || 0)} (${p.numReviews || 0})</div>
          </div>
        </div>
      </article>
    `).join('');
  } catch {
    document.getElementById('recommended-section').style.display = 'none';
  }
}

// ─── Cart Badge ───
function updateCartBadge() {
  const isLogged = isLoggedIn();
  const cartKey = isLogged ? 'je_cart_cache' : 'je_cart';
  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  const count = cart.reduce((a, i) => a + (i.qty || 1), 0);
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ─── Initialize Cart & Listeners ───
async function initializeCart() {
  updateCartBadge();

  // Redirect to home page and open cart drawer when clicking cart navbar button
  document.getElementById('cart-trigger')?.addEventListener('click', () => {
    window.location.href = '/?open-cart=true';
  });

  if (isLoggedIn()) {
    try {
      const serverCart = await apiRequest('/cart');
      if (serverCart && serverCart.items) {
        const mapped = serverCart.items.map(item => ({
          ...item.product,
          qty: item.qty
        }));
        localStorage.setItem('je_cart_cache', JSON.stringify(mapped));
        updateCartBadge();
      }
    } catch (err) {
      console.error('Failed to initialize cart on product page:', err);
    }
  }
}
