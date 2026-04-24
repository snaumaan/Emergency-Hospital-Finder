// ─── DASHBOARD MODULE ─────────────────────────────────────────────────────────
// Handles: page navigation, overview stats, welcome screen
// Used by: user.html

const PAGE_TITLES = {
  overview:     'Overview',
  finder:       'Find Hospitals',
  appointments: 'My Appointments',
  ep:           'Emergency Profile',
  settings:     'Settings'
};

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  document.getElementById('pageTitleBar').textContent = PAGE_TITLES[id] || id;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Trigger page-specific loaders
  if (id === 'appointments') loadMyAppointments();
  if (id === 'ep')           renderEP();
  if (id === 'finder')       loadHospitals();
}

function enterDashboard() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('dashboard').style.display  = 'block';
  populateUI();
  loadOverview();
}

function populateUI() {
  if (!window.USER) return;
  const name  = USER.firstName + ' ' + USER.lastName;
  const blood = (USER.emergencyProfile && USER.emergencyProfile.bloodGroup) || '—';
  document.getElementById('sidebarName').textContent  = name;
  document.getElementById('topbarUser').textContent   = name;
  document.getElementById('welcomeMsg').textContent   = greeting() + ', ' + USER.firstName + ' 👋';
  document.getElementById('overviewBlood').textContent = blood;
  document.getElementById('st4').textContent           = blood;

  // Prefill settings
  const ep = USER.emergencyProfile || {};
  const setIfExists = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setIfExists('u_blood',   ep.bloodGroup);
  setIfExists('u_allergy', ep.allergies);
  setIfExists('u_meds',    ep.medications);
  setIfExists('u_ecname',  ep.emergencyContactName);
  setIfExists('u_ecphone', ep.emergencyContactPhone);
  setIfExists('u_notes',   ep.additionalNotes);
  setIfExists('u_cond',    ep.primaryCondition);
  const setName = document.getElementById('setName');
  const setEmail = document.getElementById('setEmail');
  const setPhone = document.getElementById('setPhone');
  if (setName)  setName.textContent  = name;
  if (setEmail) setEmail.textContent = USER.email;
  if (setPhone) setPhone.textContent = USER.phone || '—';
}

async function loadOverview() {
  try {
    const d = await api('GET', '/api/appointments/my');
    const appts = d.appointments || [];
    const upcoming = appts.filter(a => ['pending','confirmed'].includes(a.status));
    const active   = upcoming[0];
    document.getElementById('st1').textContent  = appts.length;
    document.getElementById('st1s').textContent = appts.length === 1 ? '1 total' : appts.length + ' total';
    document.getElementById('st2').textContent  = upcoming.length;
    document.getElementById('st3').textContent  = active ? active.token : '—';
    document.getElementById('st3s').textContent = active ? active.department : 'No active token';

    const el = document.getElementById('overviewAppts');
    if (!el) return;
    if (appts.length === 0) { el.innerHTML = '<div class="empty">No appointments yet. <a href="#" onclick="showPage(\'finder\')" style="color:var(--red)">Book your first →</a></div>'; return; }
    el.innerHTML = appts.slice(0, 3).map(a => apptCard(a)).join('');
  } catch (e) {
    const el = document.getElementById('overviewAppts');
    if (el) el.innerHTML = '<div class="empty">Could not load appointments.</div>';
  }
}

function apptCard(a) {
  const statusColor = { pending:'var(--amber)', confirmed:'var(--green)', completed:'var(--gray)', cancelled:'var(--gray)' };
  const sc = statusColor[a.status] || 'var(--gray)';
  const hospName = a.hospital ? (a.hospital.name || '—') : '—';
  return `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div style="font-family:Syne,sans-serif;font-size:15px;font-weight:600;color:var(--white);margin-bottom:3px;">${a.token}</div>
      <div style="font-size:12px;color:rgba(250,247,242,0.4);">${hospName} · ${a.department} · ${formatDate(a.preferredDate)}</div>
    </div>
    <div style="font-size:12px;font-weight:500;color:${sc};text-transform:capitalize;">${a.status}</div>
  </div>`;
}
