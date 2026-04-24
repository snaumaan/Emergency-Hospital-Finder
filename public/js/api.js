// ─── API HELPER ───────────────────────────────────────────────────────────────
// Shared across user.js and hospital.js
// Usage: await api('GET', '/api/hospitals')

const BASE = '';  // Same origin. Change to 'http://localhost:5000' if running separately.

async function api(method, path, body, noAuth) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = localStorage.getItem('mq_token') || localStorage.getItem('mq_hosp_token');
  if (!noAuth && token) headers['Authorization'] = 'Bearer ' + token;
  const res  = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 5000);
}

function setBusy(id, busy, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? 'Please wait…' : (label || btn.textContent);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
