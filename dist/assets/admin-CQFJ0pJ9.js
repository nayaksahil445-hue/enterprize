import{a as e,c as t,f as n,i as r,n as i,o as a,r as o,u as s}from"./utils-iyttRNOh.js";/* empty css              */import"./pwa-setup-DtGWAku0.js";t()||(n(`Access Denied. Admins only.`,`error`),setTimeout(()=>window.location.href=`/`,1500));var c={},l=[],u=[],d=[],f=[];document.querySelectorAll(`.admin-nav-item`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.pane;t&&(document.querySelectorAll(`.admin-nav-item`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.admin-pane`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),document.getElementById(`pane-${t}`).classList.add(`active`),p(t))})});async function p(e){m(!0);try{switch(e){case`dashboard`:await h();break;case`orders`:await g();break;case`inventory`:await _();break;case`customers`:await b();break;case`enquiries`:await x();break}}catch(e){n(e.message||`Operation failed`,`error`)}finally{m(!1)}}function m(e){let t=document.getElementById(`loading-overlay`);t&&(t.style.display=e?`flex`:`none`)}async function h(){let t=await i(`/admin/dashboard`);c=t.stats,document.getElementById(`stat-revenue`).textContent=e(c.totalRevenue),document.getElementById(`stat-orders`).textContent=c.totalOrders,document.getElementById(`stat-users`).textContent=c.totalUsers,document.getElementById(`stat-stock-alert`).textContent=c.lowStockProducts;let n=document.getElementById(`recent-logs`);if(n&&(n.innerHTML=t.recentOrders.length?t.recentOrders.map(t=>`
      <div style="padding:0.75rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:0.75rem; color:var(--text-dim);">${o(t.createdAt)}</div>
        <div style="font-size:0.82rem; font-weight:700;">New Order #${t.orderNumber}</div>
        <div style="font-size:0.78rem; color:var(--gold);">${t.user?.name||`Guest`} — ${e(t.totalAmount)}</div>
      </div>
    `).join(``):`<p style="color:var(--text-dim);text-align:center;padding:1rem;">No recent orders</p>`),t.monthlyRevenue&&t.monthlyRevenue.length){let e=document.getElementById(`revenue-chart`);if(e){let n=Math.max(...t.monthlyRevenue.map(e=>e.revenue));e.innerHTML=`
        <div style="display:flex; align-items:flex-end; gap:1.5rem; height:100%; padding:2rem 1rem 1rem;">
          ${t.monthlyRevenue.map(e=>{let t=e.revenue/(n||1)*80;return`
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:0.5rem; height:100%; justify-content:flex-end;">
                <div style="font-size:0.65rem; color:var(--gold); font-weight:700;">₹${(e.revenue/1e3).toFixed(1)}k</div>
                <div style="width:100%; height:${t}%; background:linear-gradient(to top, var(--gold-dark), var(--gold)); border-radius:4px 4px 0 0; opacity:0.8; transition:all 1s ease;"></div>
                <div style="font-size:0.65rem; color:var(--text-dim); font-weight:600; text-transform:uppercase;">${e._id.split(`-`)[1]}</div>
              </div>
            `}).join(``)}
        </div>
      `}}}async function g(){let t=document.getElementById(`order-filter-status`),n=t?t.value:`all`;u=(await i(n===`all`?`/orders`:`/orders?status=${n}`)).orders;let a=document.getElementById(`orders-tbody`);a.innerHTML=u.map(t=>{let n=t.orderStatus.toLowerCase().replace(/ /g,``);return`
      <tr>
        <td style="font-family:var(--font-head); font-weight:700; color:var(--gold);">${t.orderNumber}</td>
        <td>
          <div style="font-weight:700;">${t.user?.name||`User`}</div>
          <div style="font-size:0.75rem; color:var(--text-dim);">${t.user?.email||``}</div>
        </td>
        <td><div style="font-size:0.75rem;">${r(t.createdAt)}</div></td>
        <td>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            ${(t.items||[]).map(e=>`
              <div style="font-size:0.72rem; background:rgba(255,255,255,0.05); padding:0.2rem 0.5rem; border-radius:4px;">
                <span style="color:var(--gold); font-weight:700;">${e.qty}x</span> ${e.productName}
              </div>
            `).join(``)}
          </div>
        </td>
        <td><div style="font-weight:700; color:var(--gold-light);">${e(t.totalAmount)}</div></td>
        <td>
          <span class="status-badge ${n}">${t.orderStatus}</span>
          ${t.orderStatus===`Cancelled`?`
            <div style="font-size:0.72rem; color:#ef4444; margin-top:0.4rem; max-width:185px; word-wrap:break-word; text-align:left; background:rgba(239,68,68,0.05); padding:0.4rem; border-radius:4px; border:1px solid rgba(239,68,68,0.15);">
              <strong>Reason:</strong> ${t.cancelReason===`Other`&&t.cancelCustomReason?t.cancelCustomReason:t.cancelReason||`Customer Cancelled`}
              ${t.cancelFeedback?`<br><strong>Feedback:</strong> "${t.cancelFeedback}"`:``}
            </div>
          `:``}
        </td>
        <td>
          <select style="padding:0.4rem; font-size:0.75rem; background:#1a1a1a; color:#fff; border:1px solid var(--admin-border); border-radius:4px;" 
                  onchange="window._updateOrderStatus('${t._id}', this.value)">
            ${[`Placed`,`Confirmed`,`Shipped`,`Out for Delivery`,`Delivered`,`Cancelled`].map(e=>`<option value="${e}" ${t.orderStatus===e?`selected`:``}>${e}</option>`).join(``)}
          </select>
        </td>
      </tr>
    `}).join(``)}window._updateOrderStatus=async(e,t)=>{if(confirm(`Change order status to ${t}?`))try{await i(`/orders/${e}/status`,{method:`PATCH`,body:JSON.stringify({status:t,message:`Status updated to ${t} by admin.`})}),n(`Order status updated`,`success`),g(),h()}catch(e){n(e.message,`error`)}};async function _(){l=(await i(`/products`)).products;let t=document.getElementById(`inventory-tbody`);t.innerHTML=l.map(t=>{let n=t.stock<=(t.lowStockThreshold||10),r=t.stock===0?`out`:n?`low`:`ok`;return`
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="width:40px; height:40px; background:#1a1a1a; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              ${t.image?`<img src="${t.image}" alt="${a(t.name,t.category)}" style="width:100%; height:100%; object-fit:contain;" onerror="this.outerHTML='🪑'">`:`🪑`}
            </div>
            <div>
              <div style="font-weight:700;">${t.name}</div>
              <div style="font-size:0.7rem; color:var(--text-dim);">ID: ${t._id.slice(-6)}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size:0.75rem; color:var(--gold); font-weight:700;">${t.category}</span></td>
        <td>${e(t.price)}</td>
        <td><span class="stock-pill ${r}">${t.stock} units</span></td>
        <td><span style="color:${t.isActive?`#22c55e`:`#ef4444`}; font-weight:700; font-size:0.7rem;">${t.isActive?`ACTIVE`:`INACTIVE`}</span></td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-outline" style="padding:0.4rem 0.75rem; font-size:0.7rem;" onclick="window._editProduct('${t._id}')">Edit</button>
            <button class="btn btn-outline" style="padding:0.4rem 0.75rem; font-size:0.7rem; border-color:rgba(239,68,68,0.3); color:#ef4444;" onclick="window._deleteProduct('${t._id}')">Del</button>
          </div>
        </td>
      </tr>
    `}).join(``)}var v=document.getElementById(`product-form-container`),y=document.getElementById(`product-form`);document.getElementById(`btn-add-product-modal`)?.addEventListener(`click`,()=>{y.reset(),document.getElementById(`edit-id`).value=``,document.getElementById(`product-form-title`).textContent=`ADD NEW PRODUCT`,v.style.display=`block`,v.scrollIntoView({behavior:`smooth`})}),document.getElementById(`btn-cancel-product`)?.addEventListener(`click`,()=>{v.style.display=`none`}),y?.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`edit-id`).value,r=document.getElementById(`af-specs`).value,a={};r.split(`
`).forEach(e=>{let[t,n]=e.split(`:`);t&&n&&(a[t.trim()]=n.trim())});let o={name:document.getElementById(`af-name`).value,category:document.getElementById(`af-category`).value,price:Number(document.getElementById(`af-price`).value),originalPrice:Number(document.getElementById(`af-original-price`).value)||void 0,stock:Number(document.getElementById(`af-stock`).value),image:document.getElementById(`af-image`).value,description:document.getElementById(`af-desc`).value,specifications:a};try{m(!0),await i(t?`/products/${t}`:`/products`,{method:t?`PUT`:`POST`,body:JSON.stringify(o)}),n(`Product ${t?`updated`:`added`} successfully`,`success`),v.style.display=`none`,_()}catch(e){n(e.message,`error`)}finally{m(!1)}}),window._editProduct=e=>{let t=l.find(t=>t._id===e);if(!t)return;document.getElementById(`edit-id`).value=t._id,document.getElementById(`af-name`).value=t.name,document.getElementById(`af-category`).value=t.category,document.getElementById(`af-price`).value=t.price,document.getElementById(`af-original-price`).value=t.originalPrice||``,document.getElementById(`af-stock`).value=t.stock,document.getElementById(`af-image`).value=t.image||``,document.getElementById(`af-desc`).value=t.description||``;let n=``;if(t.specifications){let e=t.specifications instanceof Map?Object.fromEntries(t.specifications):t.specifications;n=Object.entries(e).map(([e,t])=>`${e}: ${t}`).join(`
`)}document.getElementById(`af-specs`).value=n,document.getElementById(`product-form-title`).textContent=`EDIT PRODUCT DEFINITION`,v.style.display=`block`,v.scrollIntoView({behavior:`smooth`})},window._deleteProduct=async e=>{if(confirm(`Permanently decommission this product? This cannot be undone.`))try{await i(`/products/${e}`,{method:`DELETE`}),n(`Product deleted`,`info`),_()}catch(e){n(e.message,`error`)}};async function b(){d=(await i(`/admin/customers`)).customers;let t=document.getElementById(`customers-tbody`);t.innerHTML=d.map(t=>`
    <tr>
      <td><div style="font-weight:700;">${t.name}</div><div style="font-size:0.75rem; color:var(--text-dim);">Joined: ${r(t.createdAt)}</div></td>
      <td>${t.email}</td>
      <td>${t.phone||`N/A`}</td>
      <td><div style="font-weight:700; color:var(--gold-light);">${e(t.totalSpent)}</div></td>
      <td><div style="background:rgba(255,255,255,0.05); padding:0.25rem 0.5rem; border-radius:4px; display:inline-block; font-weight:700;">${t.orderCount}</div></td>
    </tr>
  `).join(``)}async function x(){f=await i(`/admin/enquiries`);let e=document.getElementById(`enquiries-tbody`);e.innerHTML=f.map(e=>`
    <tr>
      <td><div style="font-size:0.78rem;">${o(e.date)}</div></td>
      <td><div style="font-weight:700;">${e.name||`Anonymous`}</div></td>
      <td>${e.email||`N/A`}</td>
      <td style="color:var(--text-muted); font-size:0.82rem; max-width:400px; line-height:1.5;">${e.message||``}</td>
    </tr>
  `).join(``)}document.getElementById(`refresh-dash`)?.addEventListener(`click`,()=>h()),document.getElementById(`refresh-dash`)?.click(),document.getElementById(`admin-logout`)?.addEventListener(`click`,s);