// ─── HOSPITAL AUTH MODULE ─────────────────────────────────────────────────────
// Handles: hospital login, registration, logout, session
// Used by: hospital.html

function switchHospTab(t) {
  document.querySelectorAll('.auth-tab').forEach((el, i) =>
    el.classList.toggle('active', i === (t === 'login' ? 0 : 1)));
  document.getElementById('hLoginForm').classList.toggle('hidden', t !== 'login');
  document.getElementById('hRegForm').classList.toggle('hidden', t !== 'register');
}

async function handleHospLogin() {
  const email = document.getElementById('hl_email').value.trim();
  const pass  = document.getElementById('hl_pass').value;
  if (!email || !pass) return showError('hLoginError', 'Email and password are required.');
  setBusy('hLoginBtn', true);
  try {
    const d = await api('POST', '/api/auth/hospital/login', { email, password: pass }, true);
    saveHospSession(d.token, d.hospital);
    enterHospDashboard();
  } catch (e) { showError('hLoginError', e.message); }
  finally { setBusy('hLoginBtn', false, 'Sign In →'); }
}

async function handleHospRegister() {
  const body = {
    name:          document.getElementById('hr_name').value.trim(),
    email:         document.getElementById('hr_email').value.trim(),
    password:      document.getElementById('hr_pass').value,
    phone:         document.getElementById('hr_phone').value.trim(),
    area:          document.getElementById('hr_area').value.trim(),
    city:          document.getElementById('hr_city').value.trim(),
    pinCode:       document.getElementById('hr_pin').value.trim(),
    state:         document.getElementById('hr_state').value.trim(),
    hospitalType:  document.getElementById('hr_type').value,
    totalBeds:     parseInt(document.getElementById('hr_beds').value) || 100,
    icuBeds:       parseInt(document.getElementById('hr_icu').value)  || 20,
    emergencyBeds: parseInt(document.getElementById('hr_er').value)   || 10
  };
  if (!body.name || !body.email || !body.password || !body.phone)
    return showError('hRegError', 'Name, email, phone and password are required.');

  setBusy('hRegBtn', true);
  try {
    const d = await api('POST', '/api/auth/hospital/register', body, true);
    saveHospSession(d.token, d.hospital);
    enterHospDashboard();
  } catch (e) { showError('hRegError', e.message); }
  finally { setBusy('hRegBtn', false, 'Register Hospital →'); }
}

function saveHospSession(token, hospital) {
  localStorage.setItem('mq_hosp_token', token);
  localStorage.setItem('mq_hosp', JSON.stringify(hospital));
  window.TOKEN    = token;
  window.HOSPITAL = hospital;
}

function clearHospSession() {
  localStorage.removeItem('mq_hosp_token');
  localStorage.removeItem('mq_hosp');
  window.TOKEN    = null;
  window.HOSPITAL = null;
}

function hospLogout() {
  clearHospSession();
  document.getElementById('hDashboard').style.display  = 'none';
  document.getElementById('hAuthScreen').style.display = 'block';
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
(function hospBoot() {
  const t = localStorage.getItem('mq_hosp_token');
  const h = localStorage.getItem('mq_hosp');
  if (t && h) {
    try {
      window.TOKEN    = t;
      window.HOSPITAL = JSON.parse(h);
      enterHospDashboard();
      return;
    } catch (_) {}
  }
  document.getElementById('hAuthScreen').style.display = 'block';
})();
