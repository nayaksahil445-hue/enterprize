import { apiRequest, formatPrice, formatDateShort, showToast, isLoggedIn } from './utils.js';

/* ============================================================
   JAGANNATH ENTERPRISES — CONVERSATIONAL CHATBOT WIDGET
   ============================================================ */

// Chat State Machine
const ChatState = {
  IDLE: 'IDLE',
  GREETING: 'GREETING',
  SELECT_ORDER: 'SELECT_ORDER',
  SELECT_REASON: 'SELECT_REASON',
  CUSTOM_REASON: 'CUSTOM_REASON',
  ADDITIONAL_FEEDBACK: 'ADDITIONAL_FEEDBACK',
  CONFIRMATION_SUMMARY: 'CONFIRMATION_SUMMARY',
  CANCELLING: 'CANCELLING',
  SUCCESS: 'SUCCESS',
  SUPPORT: 'SUPPORT'
};

class Chatbot {
  constructor() {
    this.state = ChatState.IDLE;
    this.isOpen = false;
    this.activeOrders = [];
    this.selectedOrder = null;
    this.cancellationReason = '';
    this.customReason = '';
    this.additionalFeedback = '';
    
    this.injectStyles();
    this.renderWidget();
    this.initEventListeners();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
  }

  renderWidget() {
    // 1. Create Trigger Button
    const trigger = document.createElement('button');
    trigger.id = 'je-chat-trigger';
    trigger.className = 'je-chat-trigger';
    trigger.setAttribute('aria-label', 'Open Chat Support');
    trigger.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    document.body.appendChild(trigger);

    // 2. Create Chat Window
    const windowEl = document.createElement('div');
    windowEl.id = 'je-chat-window';
    windowEl.className = 'je-chat-window';
    windowEl.innerHTML = `
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
    `;
    document.body.appendChild(windowEl);
  }

  initEventListeners() {
    const trigger = document.getElementById('je-chat-trigger');
    const closeBtn = document.getElementById('je-chat-close');
    const sendBtn = document.getElementById('je-chat-send');
    const input = document.getElementById('je-chat-input');

    trigger?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.toggleChat(false));
    sendBtn?.addEventListener('click', () => this.handleUserInput());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleUserInput();
    });
  }

  toggleChat(show = !this.isOpen) {
    this.isOpen = show;
    const windowEl = document.getElementById('je-chat-window');
    windowEl?.classList.toggle('open', show);

    if (show && this.state === ChatState.IDLE) {
      this.startConversation();
    }
  }

  startConversation() {
    this.clearMessages();
    this.state = ChatState.GREETING;
    this.addBotMessage("Hello! Welcome to Jagannath Enterprises. How can I help you today?");
    this.showQuickOptions([
      { text: "Cancel an Order", action: () => this.handleCancelOrderOption() },
      { text: "Track an Order", action: () => this.handleTrackOrderOption() },
      { text: "Contact Support", action: () => this.handleContactSupportOption() }
    ]);
  }

  clearMessages() {
    const container = document.getElementById('je-chat-messages');
    if (container) container.innerHTML = '';
  }

  addBotMessage(text) {
    const container = document.getElementById('je-chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = 'je-msg bot';
    msg.innerHTML = `
      <div class="je-chat-avatar" style="width:30px; height:30px; font-size:1rem;">🤖</div>
      <div class="je-msg-bubble">${text}</div>
    `;
    container.appendChild(msg);
    this.scrollToBottom();
  }

  addUserMessage(text) {
    const container = document.getElementById('je-chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = 'je-msg user';
    msg.innerHTML = `
      <div class="je-msg-bubble">${text}</div>
    `;
    container.appendChild(msg);
    this.scrollToBottom();
  }

  showQuickOptions(options) {
    const container = document.getElementById('je-chat-messages');
    if (!container) return;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'je-chat-options';
    options.forEach(opt => {
      const chip = document.createElement('button');
      chip.className = 'je-chip';
      chip.textContent = opt.text;
      chip.addEventListener('click', () => {
        // Remove option container to prevent clicking multiple times
        optionsDiv.remove();
        this.addUserMessage(opt.text);
        opt.action();
      });
      optionsDiv.appendChild(chip);
    });

    container.appendChild(optionsDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const container = document.getElementById('je-chat-messages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  handleUserInput() {
    const input = document.getElementById('je-chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.addUserMessage(text);

    // Conversational text matching
    const normalized = text.toLowerCase();
    if (normalized.includes('cancel') && normalized.includes('order')) {
      this.handleCancelOrderOption();
    } else if (normalized.includes('track') || normalized.includes('status')) {
      this.handleTrackOrderOption();
    } else if (normalized.includes('support') || normalized.includes('help') || normalized.includes('contact')) {
      this.handleContactSupportOption();
    } else if (this.state === ChatState.CUSTOM_REASON) {
      this.customReason = text;
      this.askAdditionalFeedback();
    } else if (this.state === ChatState.ADDITIONAL_FEEDBACK) {
      this.additionalFeedback = text;
      this.showConfirmationSummary();
    } else {
      this.addBotMessage("I didn't quite catch that. Would you like to select one of these options?");
      this.showQuickOptions([
        { text: "Cancel an Order", action: () => this.handleCancelOrderOption() },
        { text: "Track an Order", action: () => this.handleTrackOrderOption() },
        { text: "Contact Support", action: () => this.handleContactSupportOption() }
      ]);
    }
  }

  /* ============================================================
     OPTION HANDLERS
     ============================================================ */

  handleTrackOrderOption() {
    this.state = ChatState.SUPPORT;
    this.addBotMessage("To track your order in real-time, you can visit our dedicated Tracking page by clicking below.");
    const container = document.getElementById('je-chat-messages');
    
    const card = document.createElement('div');
    card.className = 'je-chat-card';
    card.innerHTML = `
      <button class="je-chat-btn je-chat-btn-primary" onclick="window.location.href='/dashboard'">Go to My Dashboard</button>
      <button class="je-chat-btn je-chat-btn-secondary" id="je-chat-back-btn">Main Menu</button>
    `;
    card.querySelector('#je-chat-back-btn')?.addEventListener('click', () => {
      card.remove();
      this.startConversation();
    });
    container?.appendChild(card);
    this.scrollToBottom();
  }

  handleContactSupportOption() {
    this.state = ChatState.SUPPORT;
    this.addBotMessage("You can contact our support team at:\n📞 Phone: +91 98100 XXXXX\n✉️ Email: support@jagannathenterprises.com\nHours: 10:00 AM - 7:00 PM (Mon-Sat)");
    
    const container = document.getElementById('je-chat-messages');
    const card = document.createElement('div');
    card.className = 'je-chat-card';
    card.innerHTML = `
      <button class="je-chat-btn je-chat-btn-secondary" id="je-chat-back-btn">Main Menu</button>
    `;
    card.querySelector('#je-chat-back-btn')?.addEventListener('click', () => {
      card.remove();
      this.startConversation();
    });
    container?.appendChild(card);
    this.scrollToBottom();
  }

  /* ============================================================
     ORDER CANCELLATION FLOW (CONVERSATIONAL)
     ============================================================ */

  async handleCancelOrderOption() {
    if (!isLoggedIn()) {
      this.addBotMessage("Please log in to your account first to view and cancel your orders.");
      this.showQuickOptions([
        { text: "Sign In Now", action: () => window.location.href = '/auth' },
        { text: "Main Menu", action: () => this.startConversation() }
      ]);
      return;
    }

    this.addBotMessage("Fetching your active orders. Please wait...");
    this.state = ChatState.SELECT_ORDER;

    try {
      const orders = await apiRequest('/orders/my');
      // Filter for active orders (Placed or Confirmed)
      this.activeOrders = (orders || []).filter(o => 
        o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed'
      );

      if (this.activeOrders.length === 0) {
        this.addBotMessage("You do not have any active orders that can be cancelled. Shipped or Delivered orders cannot be cancelled via chat.");
        this.showQuickOptions([
          { text: "Main Menu", action: () => this.startConversation() }
        ]);
        return;
      }

      this.addBotMessage("Which order would you like to cancel?");
      
      const container = document.getElementById('je-chat-messages');
      this.activeOrders.forEach(o => {
        const card = document.createElement('div');
        card.className = 'je-chat-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'var(--transition)';
        card.innerHTML = `
          <div style="font-weight:700; font-size:0.82rem; color:var(--gold);">Order #${o.orderNumber}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">Placed: ${formatDateShort(o.createdAt)}</div>
          <div style="font-size:0.78rem; font-weight:700; color:#fff; margin-top:0.3rem;">Total: ${formatPrice(o.totalAmount)}</div>
          <div style="display:flex; flex-direction:column; gap:0.2rem; margin-top:0.4rem;">
            ${(o.items || []).map(i => `<div class="je-order-item-row"><span>${i.qty}x ${i.productName}</span></div>`).join('')}
          </div>
        `;
        
        card.addEventListener('mouseover', () => card.style.borderColor = 'var(--gold)');
        card.addEventListener('mouseout', () => card.style.borderColor = 'var(--border-subtle)');
        card.addEventListener('click', () => {
          // Remove all order cards in this turn
          document.querySelectorAll('.je-chat-card').forEach(c => c.remove());
          this.selectedOrder = o;
          this.addUserMessage(`Cancel Order #${o.orderNumber}`);
          this.askCancellationReason();
        });
        container?.appendChild(card);
      });
      this.scrollToBottom();

    } catch (err) {
      console.error(err);
      this.addBotMessage("Failed to load your orders. Please try again later.");
      this.showQuickOptions([{ text: "Main Menu", action: () => this.startConversation() }]);
    }
  }

  askCancellationReason() {
    this.state = ChatState.SELECT_REASON;
    this.addBotMessage("Sure. May I know why you want to cancel your order?");
    
    this.showQuickOptions([
      { text: "Ordered by mistake", action: () => this.handleSelectedReason("Ordered by mistake") },
      { text: "Found a better price elsewhere", action: () => this.handleSelectedReason("Found a better price elsewhere") },
      { text: "Delivery is taking too long", action: () => this.handleSelectedReason("Delivery is taking too long") },
      { text: "Want to change product", action: () => this.handleSelectedReason("Want to change product") },
      { text: "Payment issue", action: () => this.handleSelectedReason("Payment issue") },
      { text: "Shipping address is incorrect", action: () => this.handleSelectedReason("Shipping address is incorrect") },
      { text: "Product no longer needed", action: () => this.handleSelectedReason("Product no longer needed") },
      { text: "Other (custom reason)", action: () => this.handleOtherReasonOption() }
    ]);
  }

  handleSelectedReason(reason) {
    this.cancellationReason = reason;
    this.customReason = '';
    this.askAdditionalFeedback();
  }

  handleOtherReasonOption() {
    this.state = ChatState.CUSTOM_REASON;
    this.cancellationReason = 'Other';
    this.addBotMessage("Please type the reason why you want to cancel this order in the input box below:");
  }

  askAdditionalFeedback() {
    this.state = ChatState.ADDITIONAL_FEEDBACK;
    this.addBotMessage("Thank you for your feedback. Would you like to share any additional feedback to help us improve?");

    const container = document.getElementById('je-chat-messages');
    const card = document.createElement('div');
    card.className = 'je-chat-card';
    card.innerHTML = `
      <textarea class="je-chat-textarea" id="je-feedback-text" rows="3" placeholder="Type additional feedback here (optional)..."></textarea>
      <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
        <button class="je-chat-btn je-chat-btn-secondary" id="je-feedback-skip" style="flex:1;">Skip</button>
        <button class="je-chat-btn je-chat-btn-primary" id="je-feedback-submit" style="flex:1;">Submit</button>
      </div>
    `;

    card.querySelector('#je-feedback-skip')?.addEventListener('click', () => {
      card.remove();
      this.additionalFeedback = '';
      this.addUserMessage("Skip Feedback");
      this.showConfirmationSummary();
    });

    card.querySelector('#je-feedback-submit')?.addEventListener('click', () => {
      const text = card.querySelector('#je-feedback-text').value.trim();
      card.remove();
      this.additionalFeedback = text;
      this.addUserMessage(text ? `Feedback: ${text}` : "Skip Feedback");
      this.showConfirmationSummary();
    });

    container?.appendChild(card);
    this.scrollToBottom();
  }

  showConfirmationSummary() {
    this.state = ChatState.CONFIRMATION_SUMMARY;
    this.addBotMessage("Thank you. Are you sure you want to cancel this order? Please review the summary below:");

    const container = document.getElementById('je-chat-messages');
    const card = document.createElement('div');
    card.className = 'je-chat-card';
    
    const itemsText = (this.selectedOrder.items || []).map(i => `${i.qty}x ${i.productName}`).join(', ');
    const reasonText = this.cancellationReason === 'Other' ? `Other (${this.customReason})` : this.cancellationReason;

    card.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-muted); display:grid; gap:0.35rem;">
        <div><strong>Order ID:</strong> #${this.selectedOrder.orderNumber}</div>
        <div><strong>Product(s):</strong> ${itemsText}</div>
        <div><strong>Reason:</strong> ${reasonText}</div>
        <div><strong>Feedback:</strong> ${this.additionalFeedback || 'None'}</div>
      </div>
      <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
        <button class="je-chat-btn je-chat-btn-secondary" id="je-cancel-back" style="flex:1;">Go Back</button>
        <button class="je-chat-btn je-chat-btn-primary" id="je-cancel-confirm" style="flex:1; background:#ef4444; color:#fff;">Confirm Cancellation</button>
      </div>
    `;

    card.querySelector('#je-cancel-back')?.addEventListener('click', () => {
      card.remove();
      this.addUserMessage("Go Back");
      this.askCancellationReason();
    });

    card.querySelector('#je-cancel-confirm')?.addEventListener('click', () => {
      card.remove();
      this.addUserMessage("Confirm Cancellation");
      this.executeCancellation();
    });

    container?.appendChild(card);
    this.scrollToBottom();
  }

  async executeCancellation() {
    this.state = ChatState.CANCELLING;
    this.addBotMessage("Processing your cancellation request. Please hold on...");

    try {
      const body = {
        reason: this.cancellationReason === 'Other' ? 'Other' : this.cancellationReason,
        customReason: this.customReason,
        feedback: this.additionalFeedback
      };

      const updatedOrder = await apiRequest(`/orders/${this.selectedOrder._id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });

      if (updatedOrder) {
        this.state = ChatState.SUCCESS;
        this.addBotMessage("Your order has been cancelled successfully. We appreciate your feedback.");
        
        // Save to localStorage for client-side audit
        const cancelRecord = {
          orderId: this.selectedOrder._id,
          orderNumber: this.selectedOrder.orderNumber,
          userId: this.selectedOrder.user,
          cancelledAt: new Date().toISOString(),
          reason: body.reason,
          customReason: body.customReason,
          feedback: body.feedback,
          orderStatus: 'Cancelled',
          items: this.selectedOrder.items
        };
        localStorage.setItem(`je_cancel_record_${this.selectedOrder._id}`, JSON.stringify(cancelRecord));

        // Trigger dashboard update if the user is on the dashboard page
        if (window.location.pathname.includes('dashboard')) {
          const tabOrdersBtn = document.querySelector('[data-pane="orders"]');
          if (tabOrdersBtn) tabOrdersBtn.click(); // Re-trigger tab click to reload order list
        }
        
        // Trigger tracking update if the user is on the tracking page
        if (window.location.pathname.includes('tracking')) {
          window.location.reload();
        }

        const container = document.getElementById('je-chat-messages');
        const card = document.createElement('div');
        card.className = 'je-chat-card';
        card.innerHTML = `
          <button class="je-chat-btn je-chat-btn-primary" id="je-reorder-btn">Reorder Items</button>
          <button class="je-chat-btn je-chat-btn-secondary" onclick="window.location.href='/'">Continue Shopping</button>
          <button class="je-chat-btn je-chat-btn-secondary" id="je-contact-support-btn">Contact Support</button>
        `;

        card.querySelector('#je-reorder-btn')?.addEventListener('click', () => {
          this.reorderItems();
        });

        card.querySelector('#je-contact-support-btn')?.addEventListener('click', () => {
          card.remove();
          this.handleContactSupportOption();
        });

        container?.appendChild(card);
        this.scrollToBottom();
      }
    } catch (err) {
      console.error(err);
      this.addBotMessage(`Cancellation failed: ${err.message || 'Server error'}`);
      this.showQuickOptions([
        { text: "Retry Cancellation", action: () => this.showConfirmationSummary() },
        { text: "Main Menu", action: () => this.startConversation() }
      ]);
    }
  }

  async reorderItems() {
    this.addBotMessage("Adding items from the cancelled order back to your cart...");
    try {
      for (const item of this.selectedOrder.items) {
        await apiRequest('/cart/add', {
          method: 'POST',
          body: JSON.stringify({ productId: item.product, qty: item.qty })
        });
      }
      showToast('Items added to cart!', 'success');
      this.addBotMessage("All items have been added to your cart. Would you like to proceed to checkout?");
      
      this.showQuickOptions([
        { text: "Checkout Now", action: () => window.location.href = '/checkout' },
        { text: "View Cart Drawer", action: () => {
          window.location.href = '/?open-cart=true';
        }},
        { text: "Main Menu", action: () => this.startConversation() }
      ]);
    } catch (err) {
      showToast('Failed to reorder items', 'error');
      this.addBotMessage("Some items could not be added to your cart. They might be out of stock.");
      this.showQuickOptions([{ text: "Main Menu", action: () => this.startConversation() }]);
    }
  }
}

// Instantiate Chatbot on load
window.addEventListener('DOMContentLoaded', () => {
  // Only initialize on customer-facing pages (ignore admin.html)
  if (!window.location.pathname.includes('admin')) {
    window.jeChatbot = new Chatbot();
  }
});
