// ─── API HELPER ───────────────────────────────────────────────────────────────
const BASE = '';

async function api(method, path, body, noAuth) {
  const headers = { 'Content-Type': 'application/json' };
  if (!noAuth) {
    // Use correct token based on page
    const isHospital = window.location.pathname.includes('hospital');
    const token = isHospital
      ? localStorage.getItem('mq_hosp_token')
      : localStorage.getItem('mq_token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const res  = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
  if (msg) setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

function setBusy(id, busy, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = busy;
  if (!busy && label) btn.textContent = label;
  if (busy) btn.textContent = 'Please wait…';
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