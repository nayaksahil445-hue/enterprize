import './pwa-setup.js';
import { API_URL, saveAuth, getUser, showToast } from './utils.js';

// Redirect if already logged in
const user = getUser();
if (user) {
  window.location.href = user.role === 'admin' ? '/admin' : '/';
}

// ─── Tab Switching ───
const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    // Clear messages
    document.querySelectorAll('.auth-msg').forEach(m => { m.style.display = 'none'; m.textContent = ''; });
  });
});

// ─── Password Strength ───
const pwInput = document.getElementById('reg-password');
const pwBar = document.getElementById('pw-bar');

pwInput?.addEventListener('input', () => {
  const val = pwInput.value;
  let strength = 0;
  if (val.length >= 6) strength++;
  if (val.length >= 8) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;

  const pct = (strength / 5) * 100;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  pwBar.style.width = `${pct}%`;
  pwBar.style.background = colors[Math.min(strength - 1, 4)] || '#ef4444';
});

// ─── Show Message ───
function showMsg(id, text, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `auth-msg ${type}`;
  el.style.display = 'block';
}

// ─── Login ───
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-submit');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  btn.disabled = true;
  btn.textContent = 'Signing In...';

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg('login-msg', data.message || 'Login failed');
      btn.disabled = false;
      btn.textContent = 'Sign In →';
      return;
    }

    saveAuth(data.token, data.user);
    showMsg('login-msg', '✓ Login successful! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = data.user.role === 'admin' ? '/admin' : '/';
    }, 800);
  } catch (err) {
    showMsg('login-msg', 'Server not reachable. Check if backend is running.');
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
});

// ─── Register ───
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('register-submit');
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (password !== confirm) {
    showMsg('register-msg', 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showMsg('register-msg', 'Password must be at least 6 characters');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating Account...';

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg('register-msg', data.message || 'Registration failed');
      btn.disabled = false;
      btn.textContent = 'Create Account →';
      return;
    }

    saveAuth(data.token, data.user);
    showMsg('register-msg', '✓ Account created! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  } catch (err) {
    showMsg('register-msg', 'Server not reachable. Check if backend is running.');
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
});

// Check URL params for tab
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tab') === 'register') {
  document.getElementById('tab-register').click();
}
