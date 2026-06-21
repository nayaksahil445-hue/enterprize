import { apiRequest, formatPrice, formatDate, showToast, updateNavbarAuth, isLoggedIn, starRating } from './utils.js';

if (!isLoggedIn()) { window.location.href = '/auth.html'; }
updateNavbarAuth();

const params = new URLSearchParams(window.location.search);
const orderId = params.get('id');

if (!orderId) {
  document.getElementById('tracking-content').innerHTML = `
    <div style="text-align:center;padding:4rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
      <h2 style="font-family:var(--font-display);letter-spacing:2px;margin-bottom:0.5rem;">No Order ID</h2>
      <p style="color:var(--text-muted);margin-bottom:2rem;">Please access this page from your orders dashboard.</p>
      <a href="/dashboard.html" class="btn btn-gold">View My Orders</a>
    </div>
  `;
} else {
  loadOrder();
}

async function loadOrder() {
  try {
    const order = await apiRequest(`/orders/${orderId}`);
    renderOrder(order);
  } catch {
    document.getElementById('tracking-content').innerHTML = `
      <div style="text-align:center;padding:4rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">😕</div>
        <h2 style="font-family:var(--font-display);letter-spacing:2px;margin-bottom:0.5rem;">Order Not Found</h2>
        <p style="color:var(--text-muted);margin-bottom:2rem;">We couldn't find this order.</p>
        <a href="/dashboard.html" class="btn btn-gold">View My Orders</a>
      </div>
    `;
  }
}

function renderOrder(order) {
  document.getElementById('tracking-subtitle').textContent = `Order #${order.orderNumber}`;
  document.title = `Order #${order.orderNumber} | Jagannath Enterprises`;

  const allStatuses = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIdx = allStatuses.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';
  
  const statusClass = order.orderStatus.replace(/ /g, '');

  document.getElementById('tracking-content').innerHTML = `
    <div class="tracking-card">
      <div class="order-info-grid">
        <div class="order-info-item">
          <div class="order-info-label">Order Number</div>
          <div class="order-info-value gold">${order.orderNumber}</div>
        </div>
        <div class="order-info-item">
          <div class="order-info-label">Order Date</div>
          <div class="order-info-value">${formatDate(order.createdAt)}</div>
        </div>
        <div class="order-info-item">
          <div class="order-info-label">Status</div>
          <div class="order-info-value"><span class="status-badge status-${statusClass}">${order.orderStatus}</span></div>
        </div>
        <div class="order-info-item">
          <div class="order-info-label">Total Amount</div>
          <div class="order-info-value gold" style="font-family:var(--font-display);font-size:1.5rem;">${formatPrice(order.totalAmount)}</div>
        </div>
      </div>

      ${order.estimatedDelivery && !isCancelled && order.orderStatus !== 'Delivered' ? `
        <div style="background:rgba(201,162,39,0.05);border:1px solid var(--border);border-radius:8px;padding:1rem 1.25rem;margin-bottom:2rem;display:flex;align-items:center;gap:0.75rem;">
          <span style="font-size:1.5rem;">🚚</span>
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);">Estimated Delivery</div>
            <div style="font-weight:700;color:var(--gold);">${new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      ` : ''}

      <div style="font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:1.5rem;">Tracking Timeline</div>

      <div class="timeline">
        ${isCancelled ? `
          ${(order.trackingHistory || []).map((t, i) => `
            <div class="timeline-item ${t.status === 'Cancelled' ? 'cancelled' : 'completed'}">
              <div class="timeline-dot">${t.status === 'Cancelled' ? '✕' : '✓'}</div>
              <div class="timeline-status">${t.status}</div>
              <div class="timeline-msg">${t.message || ''}</div>
              <div class="timeline-time">${formatDate(t.timestamp)}</div>
            </div>
          `).join('')}
        ` : `
          ${allStatuses.map((s, i) => {
            const historyItem = order.trackingHistory?.find(t => t.status === s);
            const isCompleted = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isFuture = i > currentIdx;
            return `
              <div class="timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                <div class="timeline-dot">${isCompleted ? '✓' : (isCurrent ? '●' : '')}</div>
                <div class="timeline-status" style="${isFuture ? 'color:var(--text-dim);' : ''}">${s}</div>
                <div class="timeline-msg">${historyItem ? historyItem.message : (isFuture ? 'Pending' : '')}</div>
                ${historyItem ? `<div class="timeline-time">${formatDate(historyItem.timestamp)}</div>` : ''}
              </div>
            `;
          }).join('')}
        `}
      </div>

      <!-- Shipping & Payment Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--border-subtle);">
        <div>
          <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:0.75rem;">Shipping Address</div>
          <div style="color:var(--text-muted);font-size:0.88rem;line-height:1.7;">
            <strong style="color:var(--text);">${order.shippingAddress?.fullName || 'N/A'}</strong><br>
            ${order.shippingAddress?.street || ''}<br>
            ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
            📞 ${order.shippingAddress?.phone || ''}
          </div>
        </div>
        <div>
          <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:0.75rem;">Payment</div>
          <div style="color:var(--text-muted);font-size:0.88rem;line-height:1.7;">
            <strong style="color:var(--text);">${order.paymentMethod || 'N/A'}</strong><br>
            Status: <span style="color:${order.paymentStatus === 'Paid' ? '#22c55e' : '#f59e0b'};font-weight:600;">${order.paymentStatus}</span><br>
            ${order.couponCode ? `Coupon: <span style="color:var(--gold);">${order.couponCode}</span> (-${formatPrice(order.discount)})` : ''}
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div class="order-items-list">
        <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:0.75rem;">Items Ordered</div>
        ${(order.items || []).map(i => `
          <div class="order-item-row">
            <div class="order-item-thumb">${i.image ? `<img src="${i.image}">` : '🪑'}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:0.88rem;">${i.productName}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${i.category || ''} | Qty: ${i.qty}</div>
            </div>
            <div style="font-family:var(--font-display);font-size:1.2rem;color:var(--gold-light);">${formatPrice(i.price * i.qty)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Price Summary -->
      <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-subtle);">
        <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.88rem;color:var(--text-muted);">
          <span>Subtotal</span><span>${formatPrice(order.subtotal)}</span>
        </div>
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.88rem;color:#22c55e;"><span>Discount</span><span>-${formatPrice(order.discount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.88rem;color:var(--text-muted);">
          <span>Shipping</span><span>${order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:0.75rem 0 0;margin-top:0.5rem;border-top:1px solid var(--border-subtle);">
          <span style="font-weight:700;">Total</span>
          <span style="font-family:var(--font-display);font-size:1.8rem;color:var(--gold-light);">${formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      ${order.orderStatus === 'Delivered' ? `
        <button class="review-btn" onclick="document.getElementById('review-form').classList.toggle('visible')">
          ⭐ Rate & Review This Order
        </button>
        <div class="review-form" id="review-form">
          <div style="font-weight:700;margin-bottom:1rem;">Write a Review</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.5rem;">Select a product to review:</div>
          <select id="review-product" style="width:100%;padding:0.7rem;background:var(--dark-3);border:1px solid var(--border-subtle);color:var(--text);border-radius:6px;margin-bottom:1rem;">
            ${order.items.map(i => `<option value="${i.product?._id || i.product}">${i.productName}</option>`).join('')}
          </select>
          <div class="star-select" id="star-select">
            ${[1,2,3,4,5].map(n => `<span data-val="${n}" onclick="selectStar(${n})">★</span>`).join('')}
          </div>
          <input type="text" id="review-title" placeholder="Review title (optional)" style="width:100%;padding:0.7rem;background:var(--dark-3);border:1px solid var(--border-subtle);color:var(--text);border-radius:6px;margin-bottom:0.75rem;outline:none;">
          <textarea id="review-comment" rows="3" placeholder="Share your experience..." style="width:100%;padding:0.7rem;background:var(--dark-3);border:1px solid var(--border-subtle);color:var(--text);border-radius:6px;resize:vertical;outline:none;margin-bottom:1rem;"></textarea>
          <button class="review-btn" id="submit-review-btn" onclick="submitReview()">Submit Review ✓</button>
        </div>
      ` : ''}
    </div>
  `;
}

let selectedRating = 5;
window.selectStar = function(val) {
  selectedRating = val;
  document.querySelectorAll('#star-select span').forEach((s, i) => {
    s.classList.toggle('filled', i < val);
  });
};
// Default stars
setTimeout(() => window.selectStar?.(5), 100);

window.submitReview = async function() {
  const productId = document.getElementById('review-product')?.value;
  const title = document.getElementById('review-title')?.value;
  const comment = document.getElementById('review-comment')?.value;

  if (!productId) { showToast('Select a product', 'warning'); return; }

  try {
    await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({ product: productId, rating: selectedRating, title, comment })
    });
    showToast('Review submitted! Thank you!', 'success');
    document.getElementById('review-form').innerHTML = '<p style="color:#22c55e;font-weight:700;padding:1rem;">✓ Review submitted successfully!</p>';
  } catch (err) {
    showToast(err.message || 'Failed to submit review', 'error');
  }
};
