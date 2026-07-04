import{a as e,c as t,d as n,f as r,n as i,p as a}from"./utils-B7dr3Qg0.js";/* empty css              */var o=`http://localhost:5000/api`,s=new URLSearchParams(window.location.search).get(`id`),c=null,l=1;a(),v(),s?u():d();async function u(){try{let e=localStorage.getItem(`je_token`),t=e?{Authorization:`Bearer ${e}`}:{},n=await fetch(`${o}/products/${s}`,{headers:t});if(!n.ok)throw Error();c=await n.json(),f(c),m(),g()}catch{d()}}function d(){document.getElementById(`product-loading`).style.display=`none`,document.getElementById(`product-error`).style.display=`block`,document.getElementById(`recommended-section`).style.display=`none`}function f(t){document.title=`${t.name} | Jagannath Enterprises`;let n=t.stock>0,i=t.description||`Buy ${t.name} at Jagannath Enterprises. Premium quality ${t.category} industrial furniture with 5-year warranty.`,a=document.querySelector(`meta[name="description"]`);a&&a.setAttribute(`content`,i);let o=document.querySelector(`meta[property="og:title"]`);o&&o.setAttribute(`content`,`${t.name} | Jagannath Enterprises`);let s=document.querySelector(`meta[property="og:description"]`);s&&s.setAttribute(`content`,i);let c=document.querySelector(`meta[property="og:image"]`);c&&t.image&&c.setAttribute(`content`,t.image.startsWith(`http`)?t.image:`https://jagannath-enterprises.com${t.image}`);let l=document.querySelector(`meta[property="og:url"]`);l&&l.setAttribute(`content`,window.location.href);let u=document.querySelector(`link[rel="canonical"]`);u&&u.setAttribute(`href`,window.location.href);let d=document.getElementById(`product-schema`);d||(d=document.createElement(`script`),d.id=`product-schema`,d.type=`application/ld+json`,document.head.appendChild(d));let f={"@context":`https://schema.org`,"@type":`Product`,name:t.name,image:t.image?t.image.startsWith(`http`)?t.image:`https://jagannath-enterprises.com${t.image}`:`https://jagannath-enterprises.com/favicon.svg`,description:i,category:t.category,offers:{"@type":`Offer`,url:window.location.href,priceCurrency:`INR`,price:t.price,priceValidUntil:`2027-12-31`,itemCondition:`https://schema.org/NewCondition`,availability:n?`https://schema.org/InStock`:`https://schema.org/OutOfStock`,seller:{"@type":`Organization`,name:`Jagannath Enterprises`}}};t.rating&&t.numReviews&&(f.aggregateRating={"@type":`AggregateRating`,ratingValue:t.rating,reviewCount:t.numReviews,bestRating:`5`,worstRating:`1`}),d.textContent=JSON.stringify(f,null,2),document.getElementById(`product-loading`).style.display=`none`;let m=document.getElementById(`product-content`);m.style.display=`block`;let h=t.originalPrice&&t.originalPrice>t.price?Math.round((t.originalPrice-t.price)/t.originalPrice*100):0,g=t.stock>0&&t.stock<=(t.lowStockThreshold||10),_=``;if(t.specifications){let e=t.specifications instanceof Map?Object.fromEntries(t.specifications):t.specifications;_=Object.entries(e).map(([e,t])=>`<div class="pd-spec-row"><span class="pd-spec-key">${e}</span><span class="pd-spec-val">${t}</span></div>`).join(``)}m.innerHTML=`
    <div class="pd-grid">
      <div class="pd-image-wrap">
        <div class="pd-badge-wrap">
          <span class="pd-badge">${t.category}</span>
          ${h>0?`<span class="pd-badge pd-badge-discount">${h}% OFF</span>`:``}
          ${n?``:`<span class="pd-badge pd-badge-oos">Out of Stock</span>`}
        </div>
        ${t.image?`<img src="${t.image}" alt="${t.name}" class="pd-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:``}
        <div class="product-thumb-placeholder" style="${t.image?`display:none;`:``}width:100%;height:100%;">🪑</div>
      </div>

      <div class="pd-info">
        <div class="pd-category">${t.category}</div>
        <h1 class="pd-name">${t.name}</h1>

        <div class="pd-rating">
          <div class="pd-rating-stars">${r(t.rating||0)}</div>
          <span class="pd-rating-text">${(t.rating||0).toFixed(1)} (${t.numReviews||0} reviews)</span>
          <span style="color:var(--text-dim);font-size:0.78rem;">| ${t.views||0} views</span>
        </div>

        <div class="pd-price-row">
          <span class="pd-price">${e(t.price)}</span>
          ${t.originalPrice&&t.originalPrice>t.price?`<span class="pd-original-price">${e(t.originalPrice)}</span>`:``}
          ${h>0?`<span class="pd-discount-tag">Save ${h}%</span>`:``}
        </div>

        <p class="pd-desc">${t.description||`No description available.`}</p>

        <div class="pd-stock">
          <span class="pd-stock-dot ${n?g?`pd-stock-low`:`pd-stock-in`:`pd-stock-out`}"></span>
          ${n?g?`<span style="color:#f59e0b;">Only ${t.stock} left — order soon!</span>`:`<span style="color:#22c55e;">In Stock (${t.stock} available)</span>`:`<span style="color:#ef4444;">Currently Out of Stock</span>`}
        </div>

        ${n?`
          <div class="pd-actions">
            <div class="pd-qty-wrap">
              <button class="pd-qty-btn" id="qty-minus">−</button>
              <input type="number" class="pd-qty-num" id="qty-input" value="1" min="1" max="${t.stock}" readonly>
              <button class="pd-qty-btn" id="qty-plus">+</button>
            </div>
            <button class="btn btn-gold" id="add-to-cart-btn" style="flex:1;">Add to Cart</button>
            <button class="btn btn-outline" id="wishlist-btn" title="Add to Wishlist" style="padding:1rem;">❤️</button>
          </div>
        `:`
          <div style="margin-bottom:2rem;">
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.75rem;">Get notified when this product is back in stock:</p>
            <div class="notify-form">
              <input type="email" id="notify-email" placeholder="Your email address" />
              <button class="btn btn-gold" id="notify-btn">Notify Me</button>
            </div>
            <button class="btn btn-outline" id="save-later-btn" style="margin-top:1rem;width:100%;">Save for Later</button>
          </div>
        `}

        ${_?`
          <div class="pd-specs">
            <div class="pd-specs-title">Specifications</div>
            ${_}
          </div>
        `:``}

        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          ${(t.tags||[]).map(e=>`<span style="
            padding:0.35rem 0.8rem; background:rgba(201,162,39,0.08);
            border:1px solid var(--border); color:var(--gold);
            font-size:0.72rem; font-weight:600; letter-spacing:1px;
            text-transform:uppercase; border-radius:4px; font-family:var(--font-head);
          ">${e}</span>`).join(``)}
        </div>
      </div>
    </div>

    <div class="reviews-section" id="reviews-section">
      <div class="pd-specs-title" style="font-size:0.85rem;">Customer Reviews</div>
      <div id="reviews-container">
        <p style="color:var(--text-dim);">Loading reviews...</p>
      </div>
    </div>
  `,p(t)}function p(e){let r=document.getElementById(`qty-input`);document.getElementById(`qty-minus`)?.addEventListener(`click`,()=>{l=Math.max(1,l-1),r.value=l}),document.getElementById(`qty-plus`)?.addEventListener(`click`,()=>{l=Math.min(e.stock,l+1),r.value=l}),document.getElementById(`add-to-cart-btn`)?.addEventListener(`click`,async()=>{let r=document.getElementById(`add-to-cart-btn`);if(r)if(t())try{r.disabled=!0,r.textContent=`Adding...`;let t=await i(`/cart/add`,{method:`POST`,body:JSON.stringify({productId:e._id,qty:l})});if(n(`${e.name} added to cart!`,`success`),t&&t.items){let e=t.items.map(e=>({...e.product,qty:e.qty}));localStorage.setItem(`je_cart_cache`,JSON.stringify(e))}_(),r.textContent=`✓ Added!`,setTimeout(()=>r.textContent=`Add to Cart`,2e3)}catch(e){n(e.message||`Failed to add to cart`,`error`),r.textContent=`Add to Cart`}finally{r.disabled=!1}else{let t=JSON.parse(localStorage.getItem(`je_cart`)||`[]`),i=t.find(t=>t._id===e._id);i?i.qty+=l:t.push({...e,qty:l}),localStorage.setItem(`je_cart`,JSON.stringify(t)),n(`${e.name} added to cart!`,`success`),_(),r.textContent=`✓ Added!`,setTimeout(()=>r.textContent=`Add to Cart`,2e3)}}),document.getElementById(`wishlist-btn`)?.addEventListener(`click`,async()=>{if(!t()){n(`Please login first`,`warning`);return}try{n((await i(`/auth/wishlist/${e._id}`,{method:`POST`})).message,`success`)}catch{n(`Failed to update wishlist`,`error`)}}),document.getElementById(`notify-btn`)?.addEventListener(`click`,()=>{if(!document.getElementById(`notify-email`).value){n(`Enter your email`,`warning`);return}n(`You will be notified when this product is back in stock!`,`success`)}),document.getElementById(`save-later-btn`)?.addEventListener(`click`,async()=>{if(!t()){n(`Please login first`,`warning`);return}try{await i(`/cart/save-for-later/${e._id}`,{method:`POST`}),n(`Saved for later!`,`success`)}catch{n(`Failed to save`,`error`)}})}async function m(){try{h(await(await fetch(`${o}/reviews/${s}`)).json())}catch{document.getElementById(`reviews-container`).innerHTML=`<p style="color:var(--text-dim);">Could not load reviews.</p>`}}function h(e){let t=document.getElementById(`reviews-container`);if(!e.reviews||!e.reviews.length){t.innerHTML=`<p style="color:var(--text-dim);padding:1rem 0;">No reviews yet. Be the first to review after purchasing!</p>`;return}t.innerHTML=`
    <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
      <div style="font-family:var(--font-display);font-size:3.5rem;color:var(--gold-light);">${e.avgRating}</div>
      <div>
        <div>${r(e.avgRating)}</div>
        <div style="color:var(--text-muted);font-size:0.85rem;margin-top:0.3rem;">${e.totalRatings} reviews</div>
      </div>
      <div style="flex:1;margin-left:2rem;">
        ${[5,4,3,2,1].map(t=>`<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;">
            <span style="font-size:0.75rem;color:var(--text-muted);width:15px;">${t}</span>
            <div style="flex:1;height:6px;background:var(--dark-4);border-radius:3px;overflow:hidden;">
              <div style="width:${e.totalRatings>0?e.breakdown[t]/e.totalRatings*100:0}%;height:100%;background:var(--gold);border-radius:3px;"></div>
            </div>
            <span style="font-size:0.72rem;color:var(--text-dim);width:25px;">${e.breakdown[t]}</span>
          </div>`).join(``)}
      </div>
    </div>
    ${e.reviews.map(e=>`
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${(e.user?.name||`U`)[0].toUpperCase()}</div>
          <div>
            <div class="review-name">${e.user?.name||`Anonymous`}</div>
            <div class="review-date">${new Date(e.createdAt).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}</div>
          </div>
          <div style="margin-left:auto;">${r(e.rating)}</div>
        </div>
        ${e.title?`<div style="font-weight:700;margin-bottom:0.3rem;">${e.title}</div>`:``}
        <p class="review-comment">${e.comment||``}</p>
      </div>
    `).join(``)}
  `}async function g(){try{let t=localStorage.getItem(`je_token`),n=t?{Authorization:`Bearer ${t}`}:{},i=(await(await fetch(`${o}/products/recommendations`,{headers:n})).json()).filter(e=>e._id!==s).slice(0,4),a=document.getElementById(`recommended-grid`);if(!i.length){document.getElementById(`recommended-section`).style.display=`none`;return}a.innerHTML=i.map(t=>`
      <article class="product-card" onclick="window.location.href='/product.html?id=${t._id}'" style="cursor:pointer;">
        <div class="product-thumb-wrap">
          ${t.image?`<img src="${t.image}" alt="${t.name}" class="product-thumb" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="product-thumb-placeholder" style="display:none">🪑</div>`:`<div class="product-thumb-placeholder">🪑</div>`}
          <div class="product-badge">${t.category}</div>
        </div>
        <div class="product-info">
          <div class="product-cat">${t.category}</div>
          <h3 class="product-name">${t.name}</h3>
          <div class="product-footer">
            <div class="product-price">${e(t.price)}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${r(t.rating||0)} (${t.numReviews||0})</div>
          </div>
        </div>
      </article>
    `).join(``)}catch{document.getElementById(`recommended-section`).style.display=`none`}}function _(){let e=t()?`je_cart_cache`:`je_cart`,n=JSON.parse(localStorage.getItem(e)||`[]`).reduce((e,t)=>e+(t.qty||1),0),r=document.getElementById(`cart-count`);r&&(r.textContent=n,r.style.display=n>0?`flex`:`none`)}async function v(){if(_(),document.getElementById(`cart-trigger`)?.addEventListener(`click`,()=>{window.location.href=`/?open-cart=true`}),t())try{let e=await i(`/cart`);if(e&&e.items){let t=e.items.map(e=>({...e.product,qty:e.qty}));localStorage.setItem(`je_cart_cache`,JSON.stringify(t)),_()}}catch(e){console.error(`Failed to initialize cart on product page:`,e)}}