import{a as e,c as t,d as n,i as r,n as i,o as a,p as o,r as s}from"./utils-CR0nv3qr.js";/* empty css              */t()||(window.location.href=`/auth.html`);var c=a();o(),document.getElementById(`dash-avatar`).textContent=(c?.name||`U`)[0].toUpperCase(),document.getElementById(`dash-name`).textContent=`Welcome, ${c?.name||`User`}`,document.getElementById(`dash-email`).textContent=c?.email||``,document.querySelectorAll(`.dash-tab`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`.dash-tab`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.dash-pane`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),document.getElementById(`pane-${e.dataset.pane}`).classList.add(`active`)})});var l=window.location.hash.replace(`#`,``);if(l){let e=document.querySelector(`.dash-tab[data-pane="${l}"]`);e&&e.click()}async function u(){try{let t=await i(`/orders/my`),n=document.getElementById(`orders-content`);if(!t||!t.length){n.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 style="font-family:var(--font-display);font-size:1.5rem;letter-spacing:2px;margin-bottom:0.5rem;">No Orders Yet</h3>
          <p style="color:var(--text-muted);margin-bottom:2rem;">Start shopping to see your orders here!</p>
          <a href="/#products" class="btn btn-gold">Browse Products</a>
        </div>
      `;return}n.innerHTML=t.map(t=>{let n=t.orderStatus.replace(/ /g,``);return`
        <div class="dash-card">
          <div class="order-card-header">
            <div>
              <span class="order-number">#${t.orderNumber}</span>
              <span class="order-date" style="margin-left:1rem;">${s(t.createdAt)}</span>
            </div>
            <span class="status-pill pill-${n}">${t.orderStatus}</span>
          </div>
          <div class="order-card-items">
            ${(t.items||[]).map(e=>`
              <div class="order-card-item">
                ${e.image?`<img src="${e.image}" onerror="this.outerHTML='🪑'">`:`🪑`}
                <span>${e.productName} × ${e.qty}</span>
              </div>
            `).join(``)}
          </div>
          <div class="order-card-footer">
            <div class="order-total">${e(t.totalAmount)}</div>
            <div style="display:flex;gap:0.75rem;">
              <a href="/tracking.html?id=${t._id}" class="track-btn">Track Order →</a>
            </div>
          </div>
        </div>
      `}).join(``)}catch{document.getElementById(`orders-content`).innerHTML=`<p style="color:var(--text-dim);padding:2rem;">Failed to load orders. Is the server running?</p>`}}async function d(){try{let e=await i(`/auth/profile`);document.getElementById(`profile-content`).innerHTML=`
      <div class="dash-card" style="max-width:550px;">
        <div style="font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;margin-bottom:1.5rem;">Edit Profile</div>
        <form class="profile-form" id="profile-form">
          <div class="pf-group">
            <label>Full Name</label>
            <input type="text" id="pf-name" value="${e.name||``}" />
          </div>
          <div class="pf-group">
            <label>Email (cannot change)</label>
            <input type="email" value="${e.email||``}" disabled style="opacity:0.5;" />
          </div>
          <div class="pf-group">
            <label>Phone</label>
            <input type="tel" id="pf-phone" value="${e.phone||``}" placeholder="+91 XXXXX XXXXX" />
          </div>
          <button type="submit" class="btn btn-gold" style="margin-top:0.5rem;">Update Profile</button>
        </form>
        <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border-subtle);">
          <div style="font-size:0.78rem;color:var(--text-dim);">
            Account created: ${r(e.createdAt)}<br>
            Role: <span style="color:var(--gold);font-weight:600;">${e.role}</span>
          </div>
        </div>
      </div>
    `,document.getElementById(`profile-form`).addEventListener(`submit`,async e=>{e.preventDefault();try{await i(`/auth/profile`,{method:`PUT`,body:JSON.stringify({name:document.getElementById(`pf-name`).value,phone:document.getElementById(`pf-phone`).value})}),n(`Profile updated!`,`success`);let e=a();e.name=document.getElementById(`pf-name`).value,e.phone=document.getElementById(`pf-phone`).value,localStorage.setItem(`je_user`,JSON.stringify(e)),o()}catch(e){n(e.message||`Update failed`,`error`)}})}catch{document.getElementById(`profile-content`).innerHTML=`<p style="color:var(--text-dim);">Failed to load profile.</p>`}}async function f(){try{let e=(await i(`/auth/profile`)).addresses||[],t=document.getElementById(`addresses-content`);t.innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-bottom:2rem;">
        ${e.map(e=>`
          <div class="address-card ${e.isDefault?`default`:``}">
            ${e.isDefault?`<div class="address-default-badge">DEFAULT</div>`:``}
            <div style="font-weight:700;margin-bottom:0.3rem;">${e.fullName} <span style="color:var(--gold);font-size:0.75rem;">(${e.label})</span></div>
            <div style="color:var(--text-muted);font-size:0.85rem;line-height:1.6;">
              ${e.street}<br>${e.city}, ${e.state} - ${e.pincode}<br>📞 ${e.phone}
            </div>
            <button style="margin-top:0.75rem;background:none;border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.35rem 0.75rem;border-radius:6px;font-size:0.72rem;cursor:pointer;font-weight:600;" onclick="deleteAddress('${e._id}')">Remove</button>
          </div>
        `).join(``)}
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
    `,document.getElementById(`add-address-form`).addEventListener(`submit`,async e=>{e.preventDefault();try{await i(`/auth/address`,{method:`POST`,body:JSON.stringify({fullName:document.getElementById(`new-addr-name`).value,phone:document.getElementById(`new-addr-phone`).value,street:document.getElementById(`new-addr-street`).value,city:document.getElementById(`new-addr-city`).value,state:document.getElementById(`new-addr-state`).value,pincode:document.getElementById(`new-addr-pincode`).value,label:document.getElementById(`new-addr-label`).value||`Home`,isDefault:document.getElementById(`new-addr-default`).checked})}),n(`Address added!`,`success`),f()}catch(e){n(e.message||`Failed to add address`,`error`)}}),window.deleteAddress=async function(e){if(confirm(`Remove this address?`))try{await i(`/auth/address/${e}`,{method:`DELETE`}),n(`Address removed`,`info`),f()}catch{n(`Failed to remove`,`error`)}}}catch{document.getElementById(`addresses-content`).innerHTML=`<p style="color:var(--text-dim);">Failed to load addresses.</p>`}}async function p(){try{let t=(await i(`/auth/profile`)).wishlist||[],r=document.getElementById(`wishlist-content`);if(!t.length){r.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">❤️</div>
          <h3 style="font-family:var(--font-display);font-size:1.5rem;letter-spacing:2px;margin-bottom:0.5rem;">Wishlist Empty</h3>
          <p style="color:var(--text-muted);margin-bottom:2rem;">Save products you love for later!</p>
          <a href="/#products" class="btn btn-gold">Browse Products</a>
        </div>
      `;return}r.innerHTML=`
      <div class="wishlist-grid">
        ${t.map(t=>`
          <div class="dash-card" style="padding:0;overflow:hidden;cursor:pointer;" onclick="window.location.href='/product.html?id=${t._id}'">
            <div style="height:180px;background:var(--dark-4);display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${t.image?`<img src="${t.image}" style="max-width:90%;max-height:90%;object-fit:contain;" onerror="this.outerHTML='<div style=font-size:3rem>🪑</div>'">`:`<div style="font-size:3rem;">🪑</div>`}
            </div>
            <div style="padding:1.25rem;">
              <div style="font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-family:var(--font-head);font-weight:700;">${t.category}</div>
              <div style="font-weight:700;margin:0.3rem 0;">${t.name}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
                <span style="font-family:var(--font-display);font-size:1.3rem;color:var(--gold-light);">${e(t.price)}</span>
                <button style="background:none;border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.75rem;cursor:pointer;" onclick="event.stopPropagation();removeWishlist('${t._id}')">✕</button>
              </div>
            </div>
          </div>
        `).join(``)}
      </div>
    `,window.removeWishlist=async function(e){try{await i(`/auth/wishlist/${e}`,{method:`POST`}),n(`Removed from wishlist`,`info`),p()}catch{n(`Failed`,`error`)}}}catch{document.getElementById(`wishlist-content`).innerHTML=`<p style="color:var(--text-dim);">Failed to load wishlist.</p>`}}u(),d(),f(),p();