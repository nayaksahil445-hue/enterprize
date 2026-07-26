import './pwa-setup.js';
import { API_URL, saveAuth, getUser, showToast } from './utils.js';

// Redirect if already logged in
const user = getUser();
if (user) {
  window.location.href = user.role === 'admin' ? '/admin' : '/';
}

// ─── View & Tab Switching ───
const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

function showForm(formId) {
  forms.forEach(f => f.classList.remove('active'));
  document.getElementById(formId)?.classList.add('active');
  document.querySelectorAll('.auth-msg').forEach(m => { m.style.display = 'none'; m.textContent = ''; });
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    showForm(`${tab.dataset.tab}-form`);
  });
});

// Forgot Password Navigation
document.getElementById('link-forgot-pw')?.addEventListener('click', (e) => {
  e.preventDefault();
  tabs.forEach(t => t.classList.remove('active'));
  const loginEmail = document.getElementById('login-email').value;
  if (loginEmail) {
    document.getElementById('forgot-email').value = loginEmail;
  }
  showForm('forgot-form');
});

document.querySelectorAll('.back-to-login').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    tabs.forEach(t => t.classList.remove('active'));
    document.getElementById('tab-login')?.classList.add('active');
    showForm('login-form');
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

// ─── Forgot Password Step 1 (Send OTP) ───
async function handleSendOtp(email) {
  const btn = document.getElementById('forgot-submit');
  btn.disabled = true;
  btn.textContent = 'Sending OTP...';

  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg('forgot-msg', data.message || 'Failed to send OTP');
      btn.disabled = false;
      btn.textContent = 'Send OTP Code →';
      return false;
    }

    showMsg('forgot-msg', '✓ OTP sent successfully to email!', 'success');
    document.getElementById('reset-email').value = email;

    setTimeout(() => {
      showForm('reset-form');
      btn.disabled = false;
      btn.textContent = 'Send OTP Code →';
    }, 1000);

    return true;
  } catch (err) {
    showMsg('forgot-msg', 'Server waking up or unreachable. Please wait 10s & tap Send again.');
    btn.disabled = false;
    btn.textContent = 'Send OTP Code →';
    return false;
  }
}

document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  await handleSendOtp(email);
});

document.getElementById('resend-otp-btn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reset-email').value.trim();
  if (email) {
    const resendBtn = e.target;
    resendBtn.textContent = 'Resending...';
    resendBtn.style.pointerEvents = 'none';
    await handleSendOtp(email);
    resendBtn.textContent = 'Resend OTP';
    resendBtn.style.pointerEvents = 'auto';
  }
});

// ─── Forgot Password Step 2 (Reset Password) ───
document.getElementById('reset-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('reset-submit');
  const email = document.getElementById('reset-email').value.trim();
  const otp = document.getElementById('reset-otp').value.trim();
  const newPassword = document.getElementById('reset-new-password').value;
  const confirmNewPassword = document.getElementById('reset-confirm-password').value;

  if (newPassword !== confirmNewPassword) {
    showMsg('reset-msg', 'Passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    showMsg('reset-msg', 'Password must be at least 6 characters');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Updating Password...';

  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg('reset-msg', data.message || 'Password reset failed');
      btn.disabled = false;
      btn.textContent = 'Update Password →';
      return;
    }

    showMsg('reset-msg', '✓ Password changed successfully! Redirecting to Login...', 'success');

    setTimeout(() => {
      tabs.forEach(t => t.classList.remove('active'));
      document.getElementById('tab-login')?.classList.add('active');
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = '';
      showForm('login-form');
      showMsg('login-msg', '✓ Password reset! Please login with your new password.', 'success');
      btn.disabled = false;
      btn.textContent = 'Update Password →';
    }, 1500);
  } catch (err) {
    showMsg('reset-msg', 'Server not reachable. Check if backend is running.');
    btn.disabled = false;
    btn.textContent = 'Update Password →';
  }
});

