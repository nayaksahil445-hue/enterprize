(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={IDLE:`IDLE`,GREETING:`GREETING`,SELECT_ORDER:`SELECT_ORDER`,SELECT_REASON:`SELECT_REASON`,CUSTOM_REASON:`CUSTOM_REASON`,ADDITIONAL_FEEDBACK:`ADDITIONAL_FEEDBACK`,CONFIRMATION_SUMMARY:`CONFIRMATION_SUMMARY`,CANCELLING:`CANCELLING`,SUCCESS:`SUCCESS`,SUPPORT:`SUPPORT`},t=class{constructor(){this.state=e.IDLE,this.isOpen=!1,this.activeOrders=[],this.selectedOrder=null,this.cancellationReason=``,this.customReason=``,this.additionalFeedback=``,this.injectStyles(),this.renderWidget(),this.initEventListeners()}injectStyles(){let e=document.createElement(`style`);e.textContent=`
      /* Chatbot Trigger Button */
      .je-chat-trigger {
        position: fixed;
        bottom: 5.5rem;
        right: 2rem;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--gold-dark), var(--gold-light));
        border: none;
        box-shadow: 0 4px 16px rgba(201, 162, 39, 0.4);
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
      }
      .je-chat-trigger:hover {
        transform: scale(1.1) translateY(-2px);
        box-shadow: 0 8px 24px rgba(201, 162, 39, 0.6);
      }
      .je-chat-trigger svg {
        color: #000;
        width: 26px;
        height: 26px;
        transition: var(--transition);
      }

      /* Chat Window Container */
      .je-chat-window {
        position: fixed;
        bottom: 9.5rem;
        right: 2rem;
        width: 380px;
        height: 520px;
        max-height: 80vh;
        max-width: 90vw;
        background: rgba(13, 13, 13, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: var(--shadow-dark), 0 10px 40px rgba(201, 162, 39, 0.05);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(30px);
        opacity: 0;
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .je-chat-window.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      /* Chat Header */
      .je-chat-header {
        background: rgba(20, 20, 20, 0.97);
        padding: 1.1rem 1.25rem;
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .je-chat-header-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .je-chat-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(201, 162, 39, 0.1);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }
      .je-chat-title {
        font-family: var(--font-head);
        font-weight: 700;
        font-size: 0.9rem;
        color: #fff;
      }
      .je-chat-status {
        font-size: 0.7rem;
        color: #22c55e;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .je-chat-status::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #22c55e;
      }
      .je-chat-close {
        background: none;
        border: none;
        color: var(--text-dim);
        cursor: pointer;
        font-size: 1.2rem;
        transition: var(--transition);
      }
      .je-chat-close:hover {
        color: #ef4444;
      }

      /* Chat Messages Body */
      .je-chat-messages {
        flex: 1;
        padding: 1.25rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        scroll-behavior: smooth;
      }

      /* Message Bubbles */
      .je-msg {
        display: flex;
        gap: 0.75rem;
        max-width: 85%;
        animation: chatFadeIn 0.3s ease forwards;
      }
      .je-msg.bot {
        align-self: flex-start;
      }
      .je-msg.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .je-msg-bubble {
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font-size: 0.85rem;
        line-height: 1.5;
      }
      .je-msg.bot .je-msg-bubble {
        background: var(--dark-4);
        color: var(--text);
        border: 1px solid var(--border-subtle);
        border-top-left-radius: 2px;
      }
      .je-msg.user .je-msg-bubble {
        background: rgba(201, 162, 39, 0.12);
        color: var(--gold-light);
        border: 1px solid rgba(201, 162, 39, 0.3);
        border-top-right-radius: 2px;
      }

      /* Quick Reply Chips */
      .je-chat-options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.25rem 0 0.5rem 2.75rem;
        animation: chatFadeIn 0.4s ease forwards;
      }
      .je-chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border-subtle);
        color: var(--text-muted);
        padding: 0.45rem 0.9rem;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
      }
      .je-chip:hover {
        border-color: var(--gold);
        color: var(--gold-light);
        background: rgba(201, 162, 39, 0.05);
      }

      /* Chat Input Footer */
      .je-chat-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--border-subtle);
        background: rgba(20, 20, 20, 0.6);
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .je-chat-input {
        flex: 1;
        background: var(--dark-4);
        border: 1px solid var(--border-subtle);
        color: var(--text);
        padding: 0.6rem 1rem;
        border-radius: 24px;
        font-size: 0.85rem;
        outline: none;
        transition: var(--transition);
      }
      .je-chat-input:focus {
        border-color: var(--gold);
      }
      .je-chat-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--gold);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
      }
      .je-chat-send:hover {
        background: var(--gold-light);
        transform: scale(1.05);
      }
      .je-chat-send svg {
        color: #000;
        width: 16px;
        height: 16px;
      }

      /* Custom Cards / Forms in Chat */
      .je-chat-card {
        background: var(--dark-3);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        padding: 0.75rem;
        margin-top: 0.5rem;
        width: 100%;
        box-sizing: border-box;
      }
      .je-order-item-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
      .je-chat-btn {
        width: 100%;
        padding: 0.55rem;
        border-radius: 6px;
        font-family: var(--font-head);
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        border: none;
        margin-top: 0.5rem;
        transition: var(--transition);
      }
      .je-chat-btn-primary {
        background: var(--gold);
        color: #000;
      }
      .je-chat-btn-primary:hover {
        background: var(--gold-light);
      }
      .je-chat-btn-secondary {
        background: var(--dark-4);
        color: var(--text-muted);
        border: 1px solid var(--border-subtle);
      }
      .je-chat-btn-secondary:hover {
        border-color: var(--gold);
        color: var(--gold-light);
      }

      .je-chat-textarea {
        width: 100%;
        background: var(--dark-4);
        border: 1px solid var(--border-subtle);
        color: var(--text);
        padding: 0.5rem;
        border-radius: 6px;
        font-size: 0.8rem;
        resize: none;
        outline: none;
        box-sizing: border-box;
        font-family: var(--font-body);
        margin-top: 0.5rem;
      }
      .je-chat-textarea:focus {
        border-color: var(--gold);
      }

      @keyframes chatFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,document.head.appendChild(e)}renderWidget(){let e=document.createElement(`button`);e.id=`je-chat-trigger`,e.className=`je-chat-trigger`,e.setAttribute(`aria-label`,`Open Chat Support`),e.innerHTML=`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `,document.body.appendChild(e);let t=document.createElement(`div`);t.id=`je-chat-window`,t.className=`je-chat-window`,t.innerHTML=`
      <div class="je-chat-header">
        <div class="je-chat-header-info">
          <div class="je-chat-avatar">🛋️</div>
          <div>
            <div class="je-chat-title">JE Assistant</div>
            <div class="je-chat-status">Online</div>
          </div>
        </div>
        <button class="je-chat-close" id="je-chat-close" title="Close Chat">✕</button>
      </div>
      <div class="je-chat-messages" id="je-chat-messages"></div>
      <div class="je-chat-footer">
        <input type="text" class="je-chat-input" id="je-chat-input" placeholder="Type a message..." autocomplete="off">
        <button class="je-chat-send" id="je-chat-send" title="Send Message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `,document.body.appendChild(t)}initEventListeners(){let e=document.getElementById(`je-chat-trigger`),t=document.getElementById(`je-chat-close`),n=document.getElementById(`je-chat-send`),r=document.getElementById(`je-chat-input`);e?.addEventListener(`click`,()=>this.toggleChat()),t?.addEventListener(`click`,()=>this.toggleChat(!1)),n?.addEventListener(`click`,()=>this.handleUserInput()),r?.addEventListener(`keydown`,e=>{e.key===`Enter`&&this.handleUserInput()})}toggleChat(t=!this.isOpen){this.isOpen=t,document.getElementById(`je-chat-window`)?.classList.toggle(`open`,t),t&&this.state===e.IDLE&&this.startConversation()}startConversation(){this.clearMessages(),this.state=e.GREETING,this.addBotMessage(`Hello! Welcome to Jagannath Enterprises. How can I help you today?`),this.showQuickOptions([{text:`Cancel an Order`,action:()=>this.handleCancelOrderOption()},{text:`Track an Order`,action:()=>this.handleTrackOrderOption()},{text:`Contact Support`,action:()=>this.handleContactSupportOption()}])}clearMessages(){let e=document.getElementById(`je-chat-messages`);e&&(e.innerHTML=``)}addBotMessage(e){let t=document.getElementById(`je-chat-messages`);if(!t)return;let n=document.createElement(`div`);n.className=`je-msg bot`,n.innerHTML=`
      <div class="je-chat-avatar" style="width:30px; height:30px; font-size:1rem;">🤖</div>
      <div class="je-msg-bubble">${e}</div>
    `,t.appendChild(n),this.scrollToBottom()}addUserMessage(e){let t=document.getElementById(`je-chat-messages`);if(!t)return;let n=document.createElement(`div`);n.className=`je-msg user`,n.innerHTML=`
      <div class="je-msg-bubble">${e}</div>
    `,t.appendChild(n),this.scrollToBottom()}showQuickOptions(e){let t=document.getElementById(`je-chat-messages`);if(!t)return;let n=document.createElement(`div`);n.className=`je-chat-options`,e.forEach(e=>{let t=document.createElement(`button`);t.className=`je-chip`,t.textContent=e.text,t.addEventListener(`click`,()=>{n.remove(),this.addUserMessage(e.text),e.action()}),n.appendChild(t)}),t.appendChild(n),this.scrollToBottom()}scrollToBottom(){let e=document.getElementById(`je-chat-messages`);e&&setTimeout(()=>{e.scrollTop=e.scrollHeight},50)}handleUserInput(){let t=document.getElementById(`je-chat-input`),n=t.value.trim();if(!n)return;t.value=``,this.addUserMessage(n);let r=n.toLowerCase();r.includes(`cancel`)&&r.includes(`order`)?this.handleCancelOrderOption():r.includes(`track`)||r.includes(`status`)?this.handleTrackOrderOption():r.includes(`support`)||r.includes(`help`)||r.includes(`contact`)?this.handleContactSupportOption():this.state===e.CUSTOM_REASON?(this.customReason=n,this.askAdditionalFeedback()):this.state===e.ADDITIONAL_FEEDBACK?(this.additionalFeedback=n,this.showConfirmationSummary()):(this.addBotMessage(`I didn't quite catch that. Would you like to select one of these options?`),this.showQuickOptions([{text:`Cancel an Order`,action:()=>this.handleCancelOrderOption()},{text:`Track an Order`,action:()=>this.handleTrackOrderOption()},{text:`Contact Support`,action:()=>this.handleContactSupportOption()}]))}handleTrackOrderOption(){this.state=e.SUPPORT,this.addBotMessage(`To track your order in real-time, you can visit our dedicated Tracking page by clicking below.`);let t=document.getElementById(`je-chat-messages`),n=document.createElement(`div`);n.className=`je-chat-card`,n.innerHTML=`
      <button class="je-chat-btn je-chat-btn-primary" onclick="window.location.href='/dashboard.html'">Go to My Dashboard</button>
      <button class="je-chat-btn je-chat-btn-secondary" id="je-chat-back-btn">Main Menu</button>
    `,n.querySelector(`#je-chat-back-btn`)?.addEventListener(`click`,()=>{n.remove(),this.startConversation()}),t?.appendChild(n),this.scrollToBottom()}handleContactSupportOption(){this.state=e.SUPPORT,this.addBotMessage(`You can contact our support team at:
📞 Phone: +91 98100 XXXXX
✉️ Email: support@jagannathenterprises.com
Hours: 10:00 AM - 7:00 PM (Mon-Sat)`);let t=document.getElementById(`je-chat-messages`),n=document.createElement(`div`);n.className=`je-chat-card`,n.innerHTML=`
      <button class="je-chat-btn je-chat-btn-secondary" id="je-chat-back-btn">Main Menu</button>
    `,n.querySelector(`#je-chat-back-btn`)?.addEventListener(`click`,()=>{n.remove(),this.startConversation()}),t?.appendChild(n),this.scrollToBottom()}async handleCancelOrderOption(){if(!a()){this.addBotMessage(`Please log in to your account first to view and cancel your orders.`),this.showQuickOptions([{text:`Sign In Now`,action:()=>window.location.href=`/auth.html`},{text:`Main Menu`,action:()=>this.startConversation()}]);return}this.addBotMessage(`Fetching your active orders. Please wait...`),this.state=e.SELECT_ORDER;try{if(this.activeOrders=(await l(`/orders/my`)||[]).filter(e=>e.orderStatus===`Placed`||e.orderStatus===`Confirmed`),this.activeOrders.length===0){this.addBotMessage(`You do not have any active orders that can be cancelled. Shipped or Delivered orders cannot be cancelled via chat.`),this.showQuickOptions([{text:`Main Menu`,action:()=>this.startConversation()}]);return}this.addBotMessage(`Which order would you like to cancel?`);let e=document.getElementById(`je-chat-messages`);this.activeOrders.forEach(t=>{let n=document.createElement(`div`);n.className=`je-chat-card`,n.style.cursor=`pointer`,n.style.transition=`var(--transition)`,n.innerHTML=`
          <div style="font-weight:700; font-size:0.82rem; color:var(--gold);">Order #${t.orderNumber}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">Placed: ${h(t.createdAt)}</div>
          <div style="font-size:0.78rem; font-weight:700; color:#fff; margin-top:0.3rem;">Total: ${p(t.totalAmount)}</div>
          <div style="display:flex; flex-direction:column; gap:0.2rem; margin-top:0.4rem;">
            ${(t.items||[]).map(e=>`<div class="je-order-item-row"><span>${e.qty}x ${e.productName}</span></div>`).join(``)}
          </div>
        `,n.addEventListener(`mouseover`,()=>n.style.borderColor=`var(--gold)`),n.addEventListener(`mouseout`,()=>n.style.borderColor=`var(--border-subtle)`),n.addEventListener(`click`,()=>{document.querySelectorAll(`.je-chat-card`).forEach(e=>e.remove()),this.selectedOrder=t,this.addUserMessage(`Cancel Order #${t.orderNumber}`),this.askCancellationReason()}),e?.appendChild(n)}),this.scrollToBottom()}catch(e){console.error(e),this.addBotMessage(`Failed to load your orders. Please try again later.`),this.showQuickOptions([{text:`Main Menu`,action:()=>this.startConversation()}])}}askCancellationReason(){this.state=e.SELECT_REASON,this.addBotMessage(`Sure. May I know why you want to cancel your order?`),this.showQuickOptions([{text:`Ordered by mistake`,action:()=>this.handleSelectedReason(`Ordered by mistake`)},{text:`Found a better price elsewhere`,action:()=>this.handleSelectedReason(`Found a better price elsewhere`)},{text:`Delivery is taking too long`,action:()=>this.handleSelectedReason(`Delivery is taking too long`)},{text:`Want to change product`,action:()=>this.handleSelectedReason(`Want to change product`)},{text:`Payment issue`,action:()=>this.handleSelectedReason(`Payment issue`)},{text:`Shipping address is incorrect`,action:()=>this.handleSelectedReason(`Shipping address is incorrect`)},{text:`Product no longer needed`,action:()=>this.handleSelectedReason(`Product no longer needed`)},{text:`Other (custom reason)`,action:()=>this.handleOtherReasonOption()}])}handleSelectedReason(e){this.cancellationReason=e,this.customReason=``,this.askAdditionalFeedback()}handleOtherReasonOption(){this.state=e.CUSTOM_REASON,this.cancellationReason=`Other`,this.addBotMessage(`Please type the reason why you want to cancel this order in the input box below:`)}askAdditionalFeedback(){this.state=e.ADDITIONAL_FEEDBACK,this.addBotMessage(`Thank you for your feedback. Would you like to share any additional feedback to help us improve?`);let t=document.getElementById(`je-chat-messages`),n=document.createElement(`div`);n.className=`je-chat-card`,n.innerHTML=`
      <textarea class="je-chat-textarea" id="je-feedback-text" rows="3" placeholder="Type additional feedback here (optional)..."></textarea>
      <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
        <button class="je-chat-btn je-chat-btn-secondary" id="je-feedback-skip" style="flex:1;">Skip</button>
        <button class="je-chat-btn je-chat-btn-primary" id="je-feedback-submit" style="flex:1;">Submit</button>
      </div>
    `,n.querySelector(`#je-feedback-skip`)?.addEventListener(`click`,()=>{n.remove(),this.additionalFeedback=``,this.addUserMessage(`Skip Feedback`),this.showConfirmationSummary()}),n.querySelector(`#je-feedback-submit`)?.addEventListener(`click`,()=>{let e=n.querySelector(`#je-feedback-text`).value.trim();n.remove(),this.additionalFeedback=e,this.addUserMessage(e?`Feedback: ${e}`:`Skip Feedback`),this.showConfirmationSummary()}),t?.appendChild(n),this.scrollToBottom()}showConfirmationSummary(){this.state=e.CONFIRMATION_SUMMARY,this.addBotMessage(`Thank you. Are you sure you want to cancel this order? Please review the summary below:`);let t=document.getElementById(`je-chat-messages`),n=document.createElement(`div`);n.className=`je-chat-card`;let r=(this.selectedOrder.items||[]).map(e=>`${e.qty}x ${e.productName}`).join(`, `),i=this.cancellationReason===`Other`?`Other (${this.customReason})`:this.cancellationReason;n.innerHTML=`
      <div style="font-size:0.75rem; color:var(--text-muted); display:grid; gap:0.35rem;">
        <div><strong>Order ID:</strong> #${this.selectedOrder.orderNumber}</div>
        <div><strong>Product(s):</strong> ${r}</div>
        <div><strong>Reason:</strong> ${i}</div>
        <div><strong>Feedback:</strong> ${this.additionalFeedback||`None`}</div>
      </div>
      <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
        <button class="je-chat-btn je-chat-btn-secondary" id="je-cancel-back" style="flex:1;">Go Back</button>
        <button class="je-chat-btn je-chat-btn-primary" id="je-cancel-confirm" style="flex:1; background:#ef4444; color:#fff;">Confirm Cancellation</button>
      </div>
    `,n.querySelector(`#je-cancel-back`)?.addEventListener(`click`,()=>{n.remove(),this.addUserMessage(`Go Back`),this.askCancellationReason()}),n.querySelector(`#je-cancel-confirm`)?.addEventListener(`click`,()=>{n.remove(),this.addUserMessage(`Confirm Cancellation`),this.executeCancellation()}),t?.appendChild(n),this.scrollToBottom()}async executeCancellation(){this.state=e.CANCELLING,this.addBotMessage(`Processing your cancellation request. Please hold on...`);try{let t={reason:this.cancellationReason===`Other`?`Other`:this.cancellationReason,customReason:this.customReason,feedback:this.additionalFeedback};if(await l(`/orders/${this.selectedOrder._id}/cancel`,{method:`PATCH`,body:JSON.stringify(t)})){this.state=e.SUCCESS,this.addBotMessage(`Your order has been cancelled successfully. We appreciate your feedback.`);let n={orderId:this.selectedOrder._id,orderNumber:this.selectedOrder.orderNumber,userId:this.selectedOrder.user,cancelledAt:new Date().toISOString(),reason:t.reason,customReason:t.customReason,feedback:t.feedback,orderStatus:`Cancelled`,items:this.selectedOrder.items};if(localStorage.setItem(`je_cancel_record_${this.selectedOrder._id}`,JSON.stringify(n)),window.location.pathname.includes(`dashboard.html`)){let e=document.querySelector(`[data-pane="orders"]`);e&&e.click()}window.location.pathname.includes(`tracking.html`)&&window.location.reload();let r=document.getElementById(`je-chat-messages`),i=document.createElement(`div`);i.className=`je-chat-card`,i.innerHTML=`
          <button class="je-chat-btn je-chat-btn-primary" id="je-reorder-btn">Reorder Items</button>
          <button class="je-chat-btn je-chat-btn-secondary" onclick="window.location.href='/'">Continue Shopping</button>
          <button class="je-chat-btn je-chat-btn-secondary" id="je-contact-support-btn">Contact Support</button>
        `,i.querySelector(`#je-reorder-btn`)?.addEventListener(`click`,()=>{this.reorderItems()}),i.querySelector(`#je-contact-support-btn`)?.addEventListener(`click`,()=>{i.remove(),this.handleContactSupportOption()}),r?.appendChild(i),this.scrollToBottom()}}catch(e){console.error(e),this.addBotMessage(`Cancellation failed: ${e.message||`Server error`}`),this.showQuickOptions([{text:`Retry Cancellation`,action:()=>this.showConfirmationSummary()},{text:`Main Menu`,action:()=>this.startConversation()}])}}async reorderItems(){this.addBotMessage(`Adding items from the cancelled order back to your cart...`);try{for(let e of this.selectedOrder.items)await l(`/cart/add`,{method:`POST`,body:JSON.stringify({productId:e.product,qty:e.qty})});f(`Items added to cart!`,`success`),this.addBotMessage(`All items have been added to your cart. Would you like to proceed to checkout?`),this.showQuickOptions([{text:`Checkout Now`,action:()=>window.location.href=`/checkout.html`},{text:`View Cart Drawer`,action:()=>{window.location.href=`/?open-cart=true`}},{text:`Main Menu`,action:()=>this.startConversation()}])}catch{f(`Failed to reorder items`,`error`),this.addBotMessage(`Some items could not be added to your cart. They might be out of stock.`),this.showQuickOptions([{text:`Main Menu`,action:()=>this.startConversation()}])}}};window.addEventListener(`DOMContentLoaded`,()=>{window.location.pathname.includes(`admin.html`)||(window.jeChatbot=new t)});var n=`https://jaganath-backend.onrender.com/api`;function r(){return localStorage.getItem(`je_token`)}function i(){let e=localStorage.getItem(`je_user`);return e?JSON.parse(e):null}function a(){return!!r()}function o(){let e=i();return e&&e.role===`admin`}function s(e,t){localStorage.setItem(`je_token`,e),localStorage.setItem(`je_user`,JSON.stringify(t))}function c(){localStorage.removeItem(`je_token`),localStorage.removeItem(`je_user`),localStorage.removeItem(`je_cart`),window.location.href=`/`}async function l(e,t={}){let i=r(),a={headers:{"Content-Type":`application/json`,...i?{Authorization:`Bearer ${i}`}:{},...t.headers},...t};delete a.headers;let o={...t,headers:{"Content-Type":`application/json`,...i?{Authorization:`Bearer ${i}`}:{},...t.headers||{}}};try{let t=await fetch(`${n}${e}`,o),r=await t.json();if(!t.ok){if(t.status===401)return c(),null;throw Error(r.message||`Request failed`)}return r}catch(t){throw console.error(`API Error [${e}]:`,t),t}}var u=null;function d(){return u||(u=document.createElement(`div`),u.id=`toast-container`,u.style.cssText=`
      position: fixed; top: 1.5rem; right: 1.5rem; z-index: 99999;
      display: flex; flex-direction: column; gap: 0.75rem;
      pointer-events: none; max-width: 420px;
    `,document.body.appendChild(u)),u}function f(e,t=`success`,n=3500){let r=d(),i=document.createElement(`div`),a={success:`✓`,error:`✕`,warning:`⚠`,info:`ℹ`},o={success:`linear-gradient(135deg, #16a34a, #22c55e)`,error:`linear-gradient(135deg, #dc2626, #ef4444)`,warning:`linear-gradient(135deg, #d97706, #f59e0b)`,info:`linear-gradient(135deg, #2563eb, #3b82f6)`};i.style.cssText=`
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
  `,document.head.appendChild(e)}function p(e){return`₹`+Number(e||0).toLocaleString(`en-IN`)}function m(e){return new Date(e).toLocaleString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`})}function h(e){return new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}function g(){let e=document.querySelector(`.nav-right`);if(!e)return;let t=i(),n=document.getElementById(`nav-auth-area`);n&&n.remove();let r=document.createElement(`div`);r.id=`nav-auth-area`,r.style.cssText=`display:flex; align-items:center; gap:0.8rem;`,t?r.innerHTML=`
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
    `:r.innerHTML=`
      <a href="/auth.html" style="
        padding:0.55rem 1.2rem; border:1px solid var(--border);
        color:var(--gold); font-size:0.72rem; font-weight:600;
        letter-spacing:1.5px; text-transform:uppercase;
        border-radius:var(--radius); transition:var(--transition);
        font-family:var(--font-head);
      " onmouseover="this.style.background='rgba(201,162,39,0.08)';this.style.borderColor='var(--gold)'" onmouseout="this.style.background='none';this.style.borderColor='var(--border)'">Login</a>
    `;let a=e.querySelector(`.hamburger`);a?e.insertBefore(r,a):e.appendChild(r);let o=document.getElementById(`nav-user-btn`),s=document.getElementById(`nav-user-dropdown`);o&&s&&(o.addEventListener(`click`,e=>{e.stopPropagation(),s.style.display=s.style.display===`none`?`block`:`none`}),document.addEventListener(`click`,()=>{s.style.display=`none`}));let l=document.getElementById(`nav-logout-btn`);l&&l.addEventListener(`click`,c);let u=document.getElementById(`hamburger`),d=document.querySelector(`.nav-links`);if(u&&d){let e=document.getElementById(`nav-overlay`);e||(e=document.createElement(`div`),e.id=`nav-overlay`,e.className=`nav-overlay`,document.body.appendChild(e));let t=t=>{t?.stopPropagation();let n=d.classList.toggle(`open`);u.classList.toggle(`active`),e.classList.toggle(`open`),document.getElementById(`navbar`)?.classList.toggle(`menu-open`,n),document.body.style.overflow=n?`hidden`:``},n=()=>{d.classList.remove(`open`),u.classList.remove(`active`),e.classList.remove(`open`),document.getElementById(`navbar`)?.classList.remove(`menu-open`),document.body.style.overflow=``},r=u.cloneNode(!0);u.parentNode.replaceChild(r,u),r.addEventListener(`click`,t),e.addEventListener(`click`,n),d.querySelectorAll(`.nav-link`).forEach(e=>{e.addEventListener(`click`,n)});let i=d.querySelector(`.nav-back-btn`)||document.getElementById(`nav-back-btn`);i&&i.addEventListener(`click`,n)}}function _(e,t=5){let n=``;for(let r=1;r<=t;r++)r<=Math.floor(e)||r-.5<=e?n+=`<span style="color:var(--gold);">★</span>`:n+=`<span style="color:var(--text-dim);">★</span>`;return n}export{p as a,a as c,f as d,_ as f,h as i,c as l,l as n,i as o,g as p,m as r,o as s,n as t,s as u};