// ─── AUTH MODULE ──────────────────────────────────────────────────────────────
// Handles: tab switching, patient login, patient signup, logout
// Used by: user.html

function switchTab(t) {
  document.querySelectorAll('.auth-tab').forEach((el, i) =>
    el.classList.toggle('active', i === (t === 'login' ? 0 : 1)));
  document.getElementById('loginForm').classList.toggle('hidden', t !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', t !== 'signup');
}

async function handleLogin() {
  const email = document.getElementById('l_email').value.trim();
  const pass  = document.getElementById('l_pass').value;
  if (!email || !pass) return showError('loginError', 'Email and password are required.');
  setBusy('loginBtn', true);
  try {
    const d = await api('POST', '/api/auth/patient/login', { email, password: pass }, true);
    saveSession(d.token, d.user);
    enterDashboard();
  } catch (e) { showError('loginError', e.message); }
  finally { setBusy('loginBtn', false, 'Sign In →'); }
}

async function handleSignup() {
  const body = {
    firstName:            document.getElementById('s_first').value.trim(),
    lastName:             document.getElementById('s_last').value.trim(),
    email:                document.getElementById('s_email').value.trim(),
    password:             document.getElementById('s_pass').value,
    phone:                document.getElementById('s_phone').value.trim(),
    dateOfBirth:          document.getElementById('s_dob').value,
    bloodGroup:           document.getElementById('s_blood').value,
    primaryCondition:     document.getElementById('s_cond').value,
    allergies:            document.getElementById('s_allergy').value.trim(),
    medications:          document.getElementById('s_meds').value.trim(),
    emergencyContactName: document.getElementById('s_ecname').value.trim(),
    emergencyContactPhone:document.getElementById('s_ecphone').value.trim(),
    additionalNotes:      document.getElementById('s_notes').value.trim()
  };
  if (!body.firstName || !body.lastName || !body.email || !body.password || !body.phone)
    return showError('signupError', 'First name, last name, email, phone and password are required.');
  setBusy('signupBtn', true);
  try {
    const d = await api('POST', '/api/auth/patient/register', body, true);
    saveSession(d.token, d.user);
    enterDashboard();
  } catch (e) { showError('signupError', e.message); }
  finally { setBusy('signupBtn', false, 'Create Account & Enter →'); }
}

function saveSession(token, user) {
  localStorage.setItem('mq_token', token);
  localStorage.setItem('mq_user', JSON.stringify(user));
  window.TOKEN = token;
  window.USER  = user;
}

function clearSession() {
  localStorage.removeItem('mq_token');
  localStorage.removeItem('mq_user');
  window.TOKEN = null;
  window.USER  = null;
}

function logout() {
  clearSession();
  document.getElementById('dashboard').style.display  = 'none';
  document.getElementById('authScreen').style.display = 'block';
}

// ─── BOOT: restore session on page load ───────────────────────────────────────
(function boot() {
  const t = localStorage.getItem('mq_token');
  const u = localStorage.getItem('mq_user');
  if (t && u) {
    try {
      window.TOKEN = t;
      window.USER  = JSON.parse(u);
      enterDashboard();
      return;
    } catch (_) {}
  }
  document.getElementById('authScreen').style.display = 'block';
})();
