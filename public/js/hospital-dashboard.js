// ─── HOSPITAL DASHBOARD MODULE ────────────────────────────────────────────────
// Handles: navigation, overview stats, ER toggle
// Used by: hospital.html

const HOSP_PAGE_TITLES = {
  overview:     'Overview',
  appointments: 'Appointment Requests',
  queue:        'Token Queue',
  beds:         'Bed Management',
  departments:  'Departments',
  analytics:    'Analytics'
};

function showHospPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  document.getElementById('pageTitleBar').textContent = HOSP_PAGE_TITLES[id] || id;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  if (id === 'appointments') loadAppointments();
  if (id === 'queue')        loadQueue();
  if (id === 'beds')         loadBeds();
  if (id === 'departments')  renderDepartments();
  if (id === 'analytics')    { loadAppointments(); renderAnalytics(); }
}

function enterHospDashboard() {
  document.getElementById('hAuthScreen').style.display = 'none';
  document.getElementById('hDashboard').style.display  = 'block';
  populateHospUI();
  loadHospStats();
}

function populateHospUI() {
  if (!window.HOSPITAL) return;
  const el = (id) => document.getElementById(id);
  if (el('hospSidebarName')) el('hospSidebarName').textContent = HOSPITAL.name;
  if (el('hospTopbarName'))  el('hospTopbarName').textContent  = HOSPITAL.name;
  if (el('hospType'))        el('hospType').textContent        = HOSPITAL.hospitalType || '';

  // ER toggle
  const erToggle = el('erToggle');
  if (erToggle) {
    erToggle.checked = HOSPITAL.erStatus;
    erToggle.addEventListener('change', toggleER);
  }
}

async function loadHospStats() {
  try {
    const d = await api('GET', '/api/hospitals/dashboard/stats');
    const s = d.stats || {};
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statToday',     s.todayCount     || 0);
    set('statPending',   s.pendingCount   || 0);
    set('statBeds',      s.availableBeds  || 0);
    set('statTotalBeds', s.totalBeds      || 0);
    set('statER',        s.erStatus ? 'Open' : 'Closed');
    const erEl = document.getElementById('statER');
    if (erEl) erEl.style.color = s.erStatus ? 'var(--green)' : 'var(--gray)';
  } catch (e) {
    console.error('Stats error:', e.message);
  }
}

async function toggleER() {
  const toggle = document.getElementById('erToggle');
  try {
    const d = await api('PUT', '/api/auth/hospital/er-status', { erStatus: toggle.checked });
    window.HOSPITAL.erStatus = d.erStatus;
    localStorage.setItem('mq_hosp', JSON.stringify(window.HOSPITAL));
    loadHospStats();
  } catch (e) {
    toggle.checked = !toggle.checked; // revert
    alert('Failed to update ER status: ' + e.message);
  }
}
