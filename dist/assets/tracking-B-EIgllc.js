import{a as e,f as t,l as n,m as r,n as i,o as a,r as o}from"./utils-iyttRNOh.js";/* empty css              */import"./pwa-setup-DtGWAku0.js";n()||(window.location.href=`/auth`),r();var s=new URLSearchParams(window.location.search).get(`id`);s?c():document.getElementById(`tracking-content`).innerHTML=`
    <div style="text-align:center;padding:4rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
      <h2 style="font-family:var(--font-display);letter-spacing:2px;margin-bottom:0.5rem;">No Order ID</h2>
      <p style="color:var(--text-muted);margin-bottom:2rem;">Please access this page from your orders dashboard.</p>
      <a href="/dashboard" class="btn btn-gold">View My Orders</a>
    </div>
  `;async function c(){try{l(await i(`/orders/${s}`))}catch{document.getElementById(`tracking-content`).innerHTML=`
      <div style="text-align:center;padding:4rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">😕</div>
        <h2 style="font-family:var(--font-display);letter-spacing:2px;margin-bottom:0.5rem;">Order Not Found</h2>
        <p style="color:var(--text-muted);margin-bottom:2rem;">We couldn't find this order.</p>
        <a href="/dashboard" class="btn btn-gold">View My Orders</a>
      </div>
    `}}function l(t){document.getElementById(`tracking-subtitle`).textContent=`Order #${t.orderNumber}`,document.title=`Order #${t.orderNumber} | Jagannath Enterprises`;let n=[`Placed`,`Confirmed`,`Shipped`,`Out for Delivery`,`Delivered`],r=n.indexOf(t.orderStatus),i=t.orderStatus===`Cancelled`,s=t.orderStatus.replace(/ /g,``);document.getElementById(`tracking-content`).innerHTML=`
    <div class="tracking-card">
      <div class="order-info-grid">
        <div class="order-info-item">
          <div class="order-info-label">Order Number</div>
          <div class="order-info-value gold">${t.orderNumber}</div>
        </div>
        <div class="order-info-item">
          <div class="order-info-label">Order Date</div>
          <div class="order-info-value">${o(t.createdAt)}</div>
        </div>
        <div class="order-info-item">
          <div class="order-info-label">Status</div>
          <div class="order-info-value"><span class="status-badge status-${s}">${t.orderStatus}</span></div>
        </div>
        <div class="order-info-item">
          <div class="order-info-label">Total Amount</div>
          <div class="order-info-value gold" style="font-family:var(--font-display);font-size:1.5rem;">${e(t.totalAmount)}</div>
        </div>
      </div>

      ${t.estimatedDelivery&&!i&&t.orderStatus!==`Delivered`?`
        <div style="background:rgba(201,162,39,0.05);border:1px solid var(--border);border-radius:8px;padding:1rem 1.25rem;margin-bottom:2rem;display:flex;align-items:center;gap:0.75rem;">
          <span style="font-size:1.5rem;">🚚</span>
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);">Estimated Delivery</div>
            <div style="font-weight:700;color:var(--gold);">${new Date(t.estimatedDelivery).toLocaleDateString(`en-IN`,{weekday:`long`,day:`2-digit`,month:`long`,year:`numeric`})}</div>
          </div>
        </div>
      `:``}

      <div style="font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:1.5rem;">Tracking Timeline</div>

      <div class="timeline">
        ${i?`
          ${(t.trackingHistory||[]).map((e,t)=>`
            <div class="timeline-item ${e.status===`Cancelled`?`cancelled`:`completed`}">
              <div class="timeline-dot">${e.status===`Cancelled`?`✕`:`✓`}</div>
              <div class="timeline-status">${e.status}</div>
              <div class="timeline-msg">${e.message||``}</div>
              <div class="timeline-time">${o(e.timestamp)}</div>
            </div>
          `).join(``)}
        `:`
          ${n.map((e,n)=>{let i=t.trackingHistory?.find(t=>t.status===e),a=n<r,s=n===r,c=n>r;return`
              <div class="timeline-item ${a?`completed`:``} ${s?`current`:``}">
                <div class="timeline-dot">${a?`✓`:s?`●`:``}</div>
                <div class="timeline-status" style="${c?`color:var(--text-dim);`:``}">${e}</div>
                <div class="timeline-msg">${i?i.message:c?`Pending`:``}</div>
                ${i?`<div class="timeline-time">${o(i.timestamp)}</div>`:``}
              </div>
            `}).join(``)}
        `}
      </div>

      <!-- Shipping & Payment Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--border-subtle);">
        <div>
          <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:0.75rem;">Shipping Address</div>
          <div style="color:var(--text-muted);font-size:0.88rem;line-height:1.7;">
            <strong style="color:var(--text);">${t.shippingAddress?.fullName||`N/A`}</strong><br>
            ${t.shippingAddress?.street||``}<br>
            ${t.shippingAddress?.city||``}, ${t.shippingAddress?.state||``} - ${t.shippingAddress?.pincode||``}<br>
            📞 ${t.shippingAddress?.phone||``}
          </div>
        </div>
        <div>
          <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:0.75rem;">Payment</div>
          <div style="color:var(--text-muted);font-size:0.88rem;line-height:1.7;">
            <strong style="color:var(--text);">${t.paymentMethod||`N/A`}</strong><br>
            Status: <span style="color:${t.paymentStatus===`Paid`?`#22c55e`:`#f59e0b`};font-weight:600;">${t.paymentStatus}</span><br>
            ${t.couponCode?`Coupon: <span style="color:var(--gold);">${t.couponCode}</span> (-${e(t.discount)})`:``}
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div class="order-items-list">
        <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:0.75rem;">Items Ordered</div>
        ${(t.items||[]).map(t=>`
          <div class="order-item-row">
            <div class="order-item-thumb">${t.image?`<img src="${t.image}" alt="${a(t.productName,t.category)}">`:`🪑`}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:0.88rem;">${t.productName}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${t.category||``} | Qty: ${t.qty}</div>
            </div>
            <div style="font-family:var(--font-display);font-size:1.2rem;color:var(--gold-light);">${e(t.price*t.qty)}</div>
          </div>
        `).join(``)}
      </div>

      <!-- Price Summary -->
      <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-subtle);">
        <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.88rem;color:var(--text-muted);">
          <span>Subtotal</span><span>${e(t.subtotal)}</span>
        </div>
        ${t.discount>0?`<div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.88rem;color:#22c55e;"><span>Discount</span><span>-${e(t.discount)}</span></div>`:``}
        <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.88rem;color:var(--text-muted);">
          <span>Shipping</span><span>${t.shippingCost>0?e(t.shippingCost):`Free`}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:0.75rem 0 0;margin-top:0.5rem;border-top:1px solid var(--border-subtle);">
          <span style="font-weight:700;">Total</span>
          <span style="font-family:var(--font-display);font-size:1.8rem;color:var(--gold-light);">${e(t.totalAmount)}</span>
        </div>
      </div>

      ${t.orderStatus===`Delivered`?`
        <button class="review-btn" onclick="document.getElementById('review-form').classList.toggle('visible')">
          ⭐ Rate & Review This Order
        </button>
        <div class="review-form" id="review-form">
          <div style="font-weight:700;margin-bottom:1rem;">Write a Review</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.5rem;">Select a product to review:</div>
          <select id="review-product" style="width:100%;padding:0.7rem;background:var(--dark-3);border:1px solid var(--border-subtle);color:var(--text);border-radius:6px;margin-bottom:1rem;">
            ${t.items.map(e=>`<option value="${e.product?._id||e.product}">${e.productName}</option>`).join(``)}
          </select>
          <div class="star-select" id="star-select">
            ${[1,2,3,4,5].map(e=>`<span data-val="${e}" onclick="selectStar(${e})">★</span>`).join(``)}
          </div>
          <input type="text" id="review-title" placeholder="Review title (optional)" style="width:100%;padding:0.7rem;background:var(--dark-3);border:1px solid var(--border-subtle);color:var(--text);border-radius:6px;margin-bottom:0.75rem;outline:none;">
          <textarea id="review-comment" rows="3" placeholder="Share your experience..." style="width:100%;padding:0.7rem;background:var(--dark-3);border:1px solid var(--border-subtle);color:var(--text);border-radius:6px;resize:vertical;outline:none;margin-bottom:1rem;"></textarea>
          <button class="review-btn" id="submit-review-btn" onclick="submitReview()">Submit Review ✓</button>
        </div>
      `:``}
    </div>
  `}var u=5;window.selectStar=function(e){u=e,document.querySelectorAll(`#star-select span`).forEach((t,n)=>{t.classList.toggle(`filled`,n<e)})},setTimeout(()=>window.selectStar?.(5),100),window.submitReview=async function(){let e=document.getElementById(`review-product`)?.value,n=document.getElementById(`review-title`)?.value,r=document.getElementById(`review-comment`)?.value;if(!e){t(`Select a product`,`warning`);return}try{await i(`/reviews`,{method:`POST`,body:JSON.stringify({product:e,rating:u,title:n,comment:r})}),t(`Review submitted! Thank you!`,`success`),document.getElementById(`review-form`).innerHTML=`<p style="color:#22c55e;font-weight:700;padding:1rem;">✓ Review submitted successfully!</p>`}catch(e){t(e.message||`Failed to submit review`,`error`)}};