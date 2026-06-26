(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`http://localhost:5000/api`;function t(){return localStorage.getItem(`je_token`)}function n(){let e=localStorage.getItem(`je_user`);return e?JSON.parse(e):null}function r(){return!!t()}function i(){let e=n();return e&&e.role===`admin`}function a(e,t){localStorage.setItem(`je_token`,e),localStorage.setItem(`je_user`,JSON.stringify(t))}function o(){localStorage.removeItem(`je_token`),localStorage.removeItem(`je_user`),localStorage.removeItem(`je_cart`),window.location.href=`/`}async function s(n,r={}){let i=t(),a={headers:{"Content-Type":`application/json`,...i?{Authorization:`Bearer ${i}`}:{},...r.headers},...r};delete a.headers;let s={...r,headers:{"Content-Type":`application/json`,...i?{Authorization:`Bearer ${i}`}:{},...r.headers||{}}};try{let t=await fetch(`${e}${n}`,s),r=await t.json();if(!t.ok){if(t.status===401)return o(),null;throw Error(r.message||`Request failed`)}return r}catch(e){throw console.error(`API Error [${n}]:`,e),e}}var c=null;function l(){return c||(c=document.createElement(`div`),c.id=`toast-container`,c.style.cssText=`
      position: fixed; top: 1.5rem; right: 1.5rem; z-index: 99999;
      display: flex; flex-direction: column; gap: 0.75rem;
      pointer-events: none; max-width: 420px;
    `,document.body.appendChild(c)),c}function u(e,t=`success`,n=3500){let r=l(),i=document.createElement(`div`),a={success:`✓`,error:`✕`,warning:`⚠`,info:`ℹ`},o={success:`linear-gradient(135deg, #16a34a, #22c55e)`,error:`linear-gradient(135deg, #dc2626, #ef4444)`,warning:`linear-gradient(135deg, #d97706, #f59e0b)`,info:`linear-gradient(135deg, #2563eb, #3b82f6)`};i.style.cssText=`
    background: ${o[t]||o.info};
    color: #fff; padding: 1rem 1.5rem; border-radius: 12px;
    font-size: 0.9rem; font-weight: 600; display: flex; align-items: center;
    gap: 0.75rem; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    pointer-events: auto; cursor: pointer;
    animation: toastSlideIn 0.35s ease;
    font-family: 'Inter', 'Montserrat', sans-serif;
  `,i.innerHTML=`<span style="font-size:1.2rem">${a[t]||a.info}</span> ${e}`,i.addEventListener(`click`,()=>{i.style.animation=`toastSlideOut 0.3s ease forwards`,setTimeout(()=>i.remove(),300)}),r.appendChild(i),setTimeout(()=>{i.parentNode&&(i.style.animation=`toastSlideOut 0.3s ease forwards`,setTimeout(()=>i.remove(),300))},n)}if(typeof document<`u`){let e=document.createElement(`style`);e.textContent=`
    @keyframes toastSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
  `,document.head.appendChild(e)}function d(e){return`₹`+Number(e||0).toLocaleString(`en-IN`)}function f(e){return new Date(e).toLocaleString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`})}function p(e){return new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}function m(){let e=document.querySelector(`.nav-right`);if(!e)return;let t=n(),r=document.getElementById(`nav-auth-area`);r&&r.remove();let i=document.createElement(`div`);i.id=`nav-auth-area`,i.style.cssText=`display:flex; align-items:center; gap:0.8rem;`,t?i.innerHTML=`
      <div class="nav-user-menu" style="position:relative;">
        <button id="nav-user-btn" style="
          width:36px; height:36px; border-radius:50%;
          background: linear-gradient(135deg, var(--gold-dark), var(--gold-light));
          color:#000; border:none; cursor:pointer;
          font-family:var(--font-head); font-weight:800; font-size:0.85rem;
          display:flex; align-items:center; justify-content:center;
          transition: var(--transition);
        ">${(t.name||`U`)[0].toUpperCase()}</button>
        <div id="nav-user-dropdown" style="
          display:none; position:absolute; right:0; top:calc(100% + 8px);
          background:rgba(20,20,20,0.97); backdrop-filter:blur(20px);
          border:1px solid rgba(201,162,39,0.2); border-radius:12px;
          min-width:220px; padding:0.5rem 0; z-index:1000;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        ">
          <div style="padding:1rem 1.25rem; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:700; color:#fff; font-size:0.9rem;">${t.name}</div>
            <div style="color:var(--text-muted); font-size:0.75rem;">${t.email}</div>
          </div>
          <a href="/dashboard.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:var(--text-muted);font-size:0.82rem;font-weight:500;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.background='rgba(201,162,39,0.05)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='none'">📋 My Orders</a>
          <a href="/dashboard.html#wishlist" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:var(--text-muted);font-size:0.82rem;font-weight:500;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.background='rgba(201,162,39,0.05)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='none'">❤️ Wishlist</a>
          ${t.role===`admin`?`<a href="/admin.html" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:var(--text-muted);font-size:0.82rem;font-weight:500;transition:all 0.2s;" onmouseover="this.style.color='var(--gold)';this.style.background='rgba(201,162,39,0.05)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='none'">⚙️ Admin Panel</a>`:``}
          <div style="border-top:1px solid rgba(255,255,255,0.06); margin-top:0.25rem; padding-top:0.25rem;">
            <button id="nav-logout-btn" style="display:flex;align-items:center;gap:0.6rem;padding:0.75rem 1.25rem;color:#ef4444;font-size:0.82rem;font-weight:500;background:none;border:none;cursor:pointer;width:100%;text-align:left;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.05)'" onmouseout="this.style.background='none'">🚪 Logout</button>
          </div>
        </div>
      </div>
    `:i.innerHTML=`
      <a href="/auth.html" style="
        padding:0.55rem 1.2rem; border:1px solid var(--border);
        color:var(--gold); font-size:0.72rem; font-weight:600;
        letter-spacing:1.5px; text-transform:uppercase;
        border-radius:var(--radius); transition:var(--transition);
        font-family:var(--font-head);
      " onmouseover="this.style.background='rgba(201,162,39,0.08)';this.style.borderColor='var(--gold)'" onmouseout="this.style.background='none';this.style.borderColor='var(--border)'">Login</a>
    `;let a=e.querySelector(`.hamburger`);a?e.insertBefore(i,a):e.appendChild(i);let s=document.getElementById(`nav-user-btn`),c=document.getElementById(`nav-user-dropdown`);s&&c&&(s.addEventListener(`click`,e=>{e.stopPropagation(),c.style.display=c.style.display===`none`?`block`:`none`}),document.addEventListener(`click`,()=>{c.style.display=`none`}));let l=document.getElementById(`nav-logout-btn`);l&&l.addEventListener(`click`,o)}function h(e,t=5){let n=``;for(let r=1;r<=t;r++)r<=Math.floor(e)||r-.5<=e?n+=`<span style="color:var(--gold);">★</span>`:n+=`<span style="color:var(--text-dim);">★</span>`;return n}export{d as a,r as c,u as d,h as f,p as i,o as l,s as n,n as o,m as p,f as r,i as s,e as t,a as u};