import { apiRequest, formatPrice, showToast, updateNavbarAuth, isLoggedIn, getUser } from './utils.js';

const API_URL = 'http://localhost:5000/api';

// Redirect if not logged in
if (!isLoggedIn()) {
  window.location.href = '/auth.html';
}

updateNavbarAuth();

let cartData = { items: [] };
let currentStep = 1;
let selectedAddress = null;
let selectedPayment = 'UPI';
let appliedCoupon = null;
let discount = 0;

// ─── Load Cart ───
async function loadCart() {
  try {
    // Sync local guest cart to server if any exists
    const localCart = JSON.parse(localStorage.getItem('je_cart') || '[]');
    if (localCart.length > 0) {
      for (const item of localCart) {
        try {
          await apiRequest('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId: item._id, qty: item.qty || 1 })
          });
        } catch (e) {
          console.error('Failed to sync guest item during checkout:', item._id, e);
        }
      }
      // Clear guest cart once synced
      localStorage.removeItem('je_cart');
    }

    // Fetch the latest cart from the server (source of truth)
    cartData = await apiRequest('/cart');
    if (!cartData || !cartData.items || !cartData.items.length) {
      showToast('Your cart is empty', 'warning');
      setTimeout(() => window.location.href = '/', 1500);
      return;
    }

    // Update the logged-in cache so that home/product pages are in sync
    const mapped = cartData.items.map(item => ({
      ...item.product,
      qty: item.qty
    }));
    localStorage.setItem('je_cart_cache', JSON.stringify(mapped));

    renderCartReview();
    updateSummary();
  } catch (err) {
    showToast('Failed to load cart', 'error');
  }
}

function renderCartReview() {
  const container = document.getElementById('cart-review-items');
  container.innerHTML = cartData.items.map(item => {
    const p = item.product;
    return `
      <div style="display:flex;gap:1rem;align-items:center;padding:1rem;background:var(--dark-4);border-radius:8px;margin-bottom:0.75rem;border:1px solid var(--border-subtle);">
        <div style="width:70px;height:70px;background:var(--dark-2);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;" onerror="this.outerHTML='🪑'">` : '🪑'}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.2rem;">${p.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${p.category} | Qty: ${item.qty}</div>
          ${p.stock < item.qty ? `<div style="color:#ef4444;font-size:0.75rem;font-weight:600;">⚠ Only ${p.stock} in stock</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-display);font-size:1.3rem;color:var(--gold-light);">${formatPrice(p.price * item.qty)}</div>
          <div style="font-size:0.75rem;color:var(--text-dim);">${formatPrice(p.price)} × ${item.qty}</div>
        </div>
        <button style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1.1rem;padding:0.5rem;" onclick="removeItem('${p._id}')" title="Remove">✕</button>
      </div>
    `;
  }).join('');
}

window.removeItem = async function(productId) {
  try {
    cartData = await apiRequest(`/cart/remove/${productId}`, { method: 'DELETE' });
    if (!cartData.items.length) {
      // Clear the local cache since cart is now empty
      localStorage.removeItem('je_cart_cache');
      showToast('Cart is now empty', 'info');
      setTimeout(() => window.location.href = '/', 1000);
      return;
    }

    // Update the logged-in cache
    const mapped = cartData.items.map(item => ({
      ...item.product,
      qty: item.qty
    }));
    localStorage.setItem('je_cart_cache', JSON.stringify(mapped));

    renderCartReview();
    updateSummary();
    showToast('Item removed', 'info');
  } catch { showToast('Failed to remove item', 'error'); }
};

// ─── Summary ───
function updateSummary() {
  const items = cartData.items || [];
  const subtotal = items.reduce((a, i) => a + (i.product.price * i.qty), 0);
  const shipping = subtotal >= 5000 ? 0 : 299;
  const total = subtotal - discount + shipping;

  document.getElementById('summary-items').innerHTML = items.map(i => `
    <div class="summary-product">
      <div class="summary-thumb">${i.product.image ? `<img src="${i.product.image}" alt="${i.product.name}">` : '🪑'}</div>
      <div><div class="summary-pname">${i.product.name}</div><div class="summary-pdetail">${formatPrice(i.product.price)} × ${i.qty}</div></div>
    </div>
  `).join('');

  document.getElementById('summary-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('summary-discount').textContent = discount > 0 ? `-${formatPrice(discount)}` : '-₹0';
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  document.getElementById('summary-total').textContent = formatPrice(total);
}

// ─── Steps Navigation ───
function goToStep(step) {
  currentStep = step;
  document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${step}`).classList.add('active');

  document.querySelectorAll('.step').forEach(s => {
    const sNum = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (sNum < step) s.classList.add('completed');
    if (sNum === step) s.classList.add('active');
  });
}

document.getElementById('step1-next')?.addEventListener('click', () => goToStep(2));
document.getElementById('step2-back')?.addEventListener('click', () => goToStep(1));
document.getElementById('step3-back')?.addEventListener('click', () => goToStep(2));

// ─── Saved Addresses ───
async function loadAddresses() {
  try {
    const user = await apiRequest('/auth/profile');
    if (user.addresses && user.addresses.length) {
      const container = document.getElementById('saved-addresses');
      container.innerHTML = `
        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.75rem;">Select a saved address:</div>
          ${user.addresses.map((a, i) => `
            <div class="payment-option ${a.isDefault ? 'selected' : ''}" style="margin-bottom:0.5rem;cursor:pointer;" data-addr-idx="${i}" onclick="selectSavedAddress(${i})">
              <div class="payment-radio"></div>
              <div>
                <div style="font-weight:700;font-size:0.88rem;">${a.fullName} <span style="font-size:0.7rem;color:var(--gold);background:rgba(201,162,39,0.1);padding:0.15rem 0.5rem;border-radius:4px;margin-left:0.5rem;">${a.label}</span></div>
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">${a.street}, ${a.city}, ${a.state} - ${a.pincode} | ${a.phone}</div>
              </div>
            </div>
          `).join('')}
          <div style="text-align:center;color:var(--text-dim);font-size:0.78rem;margin:1rem 0;">— or enter a new address below —</div>
        </div>
      `;

      // Auto-fill default address
      const dflt = user.addresses.find(a => a.isDefault) || user.addresses[0];
      fillAddress(dflt);

      window.selectSavedAddress = function(idx) {
        const addr = user.addresses[idx];
        fillAddress(addr);
        document.querySelectorAll('[data-addr-idx]').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-addr-idx="${idx}"]`)?.classList.add('selected');
      };
    }
  } catch { /* ignore */ }
}

function fillAddress(a) {
  if (!a) return;
  document.getElementById('addr-name').value = a.fullName || '';
  document.getElementById('addr-phone').value = a.phone || '';
  document.getElementById('addr-street').value = a.street || '';
  document.getElementById('addr-city').value = a.city || '';
  document.getElementById('addr-state').value = a.state || '';
  document.getElementById('addr-pincode').value = a.pincode || '';
}

// Address form submit
document.getElementById('address-form').addEventListener('submit', (e) => {
  e.preventDefault();
  selectedAddress = {
    fullName: document.getElementById('addr-name').value,
    phone: document.getElementById('addr-phone').value,
    street: document.getElementById('addr-street').value,
    city: document.getElementById('addr-city').value,
    state: document.getElementById('addr-state').value,
    pincode: document.getElementById('addr-pincode').value,
  };
  goToStep(3);
});

// ─── Payment Selection ───
document.querySelectorAll('.payment-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input[type="radio"]').checked = true;
    selectedPayment = opt.dataset.method;
  });
});

// ─── Coupon ───
document.getElementById('apply-coupon-btn')?.addEventListener('click', async () => {
  const code = document.getElementById('coupon-input').value.trim();
  if (!code) { showToast('Enter a coupon code', 'warning'); return; }

  const subtotal = cartData.items.reduce((a, i) => a + (i.product.price * i.qty), 0);

  try {
    const data = await apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount: subtotal })
    });

    appliedCoupon = data;
    discount = data.discount;
    document.getElementById('coupon-input').value = '';
    document.getElementById('coupon-status').innerHTML = `
      <div class="coupon-applied">
        <span>✓ ${data.code} applied — ${formatPrice(data.discount)} off!</span>
        <button class="coupon-remove" onclick="removeCoupon()">✕</button>
      </div>
    `;
    updateSummary();
    showToast(`Coupon applied! ${formatPrice(data.discount)} discount`, 'success');
  } catch (err) {
    showToast(err.message || 'Invalid coupon', 'error');
  }
});

window.removeCoupon = function() {
  appliedCoupon = null;
  discount = 0;
  document.getElementById('coupon-status').innerHTML = '';
  updateSummary();
  showToast('Coupon removed', 'info');
};

// ─── Place Order ───
document.getElementById('place-order-btn')?.addEventListener('click', async () => {
  if (!selectedAddress) { showToast('Please add a shipping address', 'warning'); goToStep(2); return; }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const subtotal = cartData.items.reduce((a, i) => a + (i.product.price * i.qty), 0);
  const shipping = subtotal >= 5000 ? 0 : 299;
  const total = subtotal - discount + shipping;

  try {
    // For COD or simulated payment
    if (selectedPayment === 'COD') {
      const order = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cartData.items.map(i => ({
            product: i.product._id,
            productName: i.product.name,
            category: i.product.category,
            price: i.product.price,
            qty: i.qty,
            image: i.product.image
          })),
          shippingAddress: selectedAddress,
          paymentMethod: 'COD',
          paymentStatus: 'Pending',
          subtotal,
          discount,
          couponCode: appliedCoupon?.code || '',
          shippingCost: shipping,
          totalAmount: total
        })
      });

      showSuccess(order);
    } else {
      // Create Razorpay order
      const payOrder = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: total, currency: 'INR' })
      });

      if (payOrder.simulated) {
        // Simulated payment (no Razorpay keys configured)
        const order = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify({
            items: cartData.items.map(i => ({
              product: i.product._id,
              productName: i.product.name,
              category: i.product.category,
              price: i.product.price,
              qty: i.qty,
              image: i.product.image
            })),
            shippingAddress: selectedAddress,
            paymentMethod: selectedPayment,
            paymentStatus: 'Paid',
            razorpayOrderId: payOrder.id,
            subtotal,
            discount,
            couponCode: appliedCoupon?.code || '',
            shippingCost: shipping,
            totalAmount: total
          })
        });
        showSuccess(order);
      } else {
        // Real Razorpay checkout
        const options = {
          key: payOrder.key,
          amount: payOrder.amount,
          currency: payOrder.currency,
          name: 'Jagannath Enterprises',
          description: 'Industrial Furniture Order',
          order_id: payOrder.id,
          handler: async function(response) {
            // Verify payment
            await apiRequest('/payments/verify', {
              method: 'POST',
              body: JSON.stringify(response)
            });

            const order = await apiRequest('/orders', {
              method: 'POST',
              body: JSON.stringify({
                items: cartData.items.map(i => ({
                  product: i.product._id,
                  productName: i.product.name,
                  category: i.product.category,
                  price: i.product.price,
                  qty: i.qty,
                  image: i.product.image
                })),
                shippingAddress: selectedAddress,
                paymentMethod: selectedPayment,
                paymentStatus: 'Paid',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                subtotal,
                discount,
                couponCode: appliedCoupon?.code || '',
                shippingCost: shipping,
                totalAmount: total
              })
            });
            showSuccess(order);
          },
          prefill: {
            name: selectedAddress.fullName,
            contact: selectedAddress.phone,
          },
          theme: { color: '#c9a227' }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    }
  } catch (err) {
    showToast(err.message || 'Order failed. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Place Order ✓';
  }
});

function showSuccess(order) {
  document.getElementById('order-summary').style.display = 'none';
  document.querySelectorAll('.checkout-steps .step').forEach(s => s.classList.add('completed'));
  goToStep('success');
  document.getElementById('success-order-num').textContent = `Order #${order.orderNumber}`;
  localStorage.removeItem('je_cart');
  localStorage.removeItem('je_cart_cache');
}

// ─── Init ───
loadCart();
loadAddresses();
