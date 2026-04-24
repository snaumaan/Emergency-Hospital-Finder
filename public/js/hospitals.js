// ─── HOSPITALS MODULE ─────────────────────────────────────────────────────────
// Handles: hospital search, filtering, booking modal
// Used by: user.html

let FILTER = 'All', CURR_HOSP = null, SEARCH_TIMER = null;

function setFilter(f) {
  FILTER = f;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === f));
  loadHospitals();
}

async function loadHospitals() {
  const el = document.getElementById('hospitalGrid');
  if (!el) return;
  el.innerHTML = '<div class="spinner">Finding hospitals near you…</div>';

  let url = '/api/hospitals?limit=20';
  if (FILTER !== 'All') url += '&specialization=' + encodeURIComponent(FILTER);

  const searchEl = document.getElementById('hospSearch');
  if (searchEl && searchEl.value.trim()) url += '&search=' + encodeURIComponent(searchEl.value.trim());

  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
    url += '&lat=' + pos.coords.latitude + '&lng=' + pos.coords.longitude;
  } catch (_) { /* no GPS — show all */ }

  try {
    const d = await api('GET', url, null, true);
    const hospitals = d.hospitals || [];
    if (hospitals.length === 0) { el.innerHTML = '<div class="empty">No hospitals found.</div>'; return; }
    el.innerHTML = hospitals.map(h => hospitalCard(h)).join('');
  } catch (e) {
    el.innerHTML = '<div class="empty">Could not load hospitals: ' + e.message + '</div>';
  }
}

function hospitalCard(h) {
  const beds  = h.beds || [];
  const erBed = (beds.find(b => b.type === 'emergency') || {}).available;
  const genBed= (beds.find(b => b.type === 'general')   || {}).available;
  const icuBed= (beds.find(b => b.type === 'icu')       || {}).available;
  const dist  = h.distanceKm != null ? h.distanceKm + ' km away' : '';
  const erCol = h.erStatus ? 'var(--green)' : 'var(--gray)';

  return `<div class="hosp-card" onclick="openBooking('${h._id}')">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
      <div>
        <div style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:var(--white);margin-bottom:4px;">${h.name}</div>
        <div style="font-size:12px;color:rgba(250,247,242,0.4);">📍 ${h.address && h.address.area || ''} ${dist ? '· ' + dist : ''}</div>
      </div>
      <div style="font-size:12px;background:rgba(232,25,44,0.1);border:1px solid rgba(232,25,44,0.2);padding:4px 10px;border-radius:100px;color:var(--red-light);white-space:nowrap;">
        ${h.hospitalType || ''}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      ${(h.specializations || []).slice(0,4).map(s => `<span style="font-size:11px;background:rgba(255,255,255,0.05);border:1px solid var(--border);padding:2px 8px;border-radius:4px;color:rgba(250,247,242,0.5);">${s}</span>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
      <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:rgba(250,247,242,0.3);margin-bottom:2px;">General</div>
        <div style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:var(--white);">${erBed != null ? erBed : '—'}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:rgba(250,247,242,0.3);margin-bottom:2px;">ICU</div>
        <div style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:var(--blue);">${icuBed != null ? icuBed : '—'}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:10px;color:rgba(250,247,242,0.3);margin-bottom:2px;">ER</div>
        <div style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:var(--red);">${genBed != null ? genBed : '—'}</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:12px;color:${erCol};">● ${h.erStatus ? 'ER Open' : 'ER Closed'}</span>
      <span style="font-size:12px;color:var(--amber);">★ ${h.rating ? h.rating.toFixed(1) : '—'} (${h.ratingCount || 0})</span>
      <span style="font-size:12px;background:var(--red);color:white;padding:4px 12px;border-radius:4px;">Book →</span>
    </div>
  </div>`;
}

function debounceSearch() {
  clearTimeout(SEARCH_TIMER);
  SEARCH_TIMER = setTimeout(loadHospitals, 400);
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────

async function openBooking(hospitalId) {
  CURR_HOSP = hospitalId;
  document.getElementById('bookingModal').classList.add('open');
  document.getElementById('bookingForm').style.display = 'block';
  document.getElementById('tokenSuccess').style.display = 'none';
  showError('bookErr', '');

  // Set min date to today
  const dateEl = document.getElementById('mDate');
  if (dateEl) dateEl.min = new Date().toISOString().split('T')[0];

  try {
    const d = await api('GET', '/api/hospitals/' + hospitalId, null, true);
    const h = d.hospital;
    document.getElementById('mHospName').textContent = h.name;
    document.getElementById('mHospSub').textContent  = (h.address && h.address.area || '') + ' · ' + (h.hospitalType || '');
    const deptSel = document.getElementById('mDept');
    deptSel.innerHTML = (h.departments || [])
      .map(dep => `<option value="${dep.name}">${dep.icon || ''} ${dep.name}</option>`)
      .join('');
    if (!deptSel.options.length) deptSel.innerHTML = '<option>General</option>';
  } catch (e) {
    showError('bookErr', 'Could not load hospital details.');
  }
}

function closeModal() {
  document.getElementById('bookingModal').classList.remove('open');
  CURR_HOSP = null;
}

async function confirmBooking() {
  const dept = document.getElementById('mDept').value;
  const date = document.getElementById('mDate').value;
  const slot = document.getElementById('mSlot').value;
  const reason = document.getElementById('mReason').value.trim();

  if (!dept || !date) return showError('bookErr', 'Please select department and date.');

  setBusy('bookBtn', true);
  try {
    const d = await api('POST', '/api/appointments', {
      hospitalId: CURR_HOSP, department: dept,
      preferredDate: date, preferredTimeSlot: slot, reasonForVisit: reason
    });
    const a = d.appointment;
    document.getElementById('genToken').textContent = a.token;
    document.getElementById('genQueue').textContent = 'Queue position: #' + a.queuePosition + ' · Est. wait: ' + a.estimatedWaitMinutes + ' min';
    document.getElementById('tHosp').textContent    = a.hospital ? a.hospital.name : '—';
    document.getElementById('tDept').textContent    = a.department;
    document.getElementById('tDate').textContent    = formatDate(a.preferredDate);
    document.getElementById('bookingForm').style.display  = 'none';
    document.getElementById('tokenSuccess').style.display = 'block';
  } catch (e) { showError('bookErr', e.message); }
  finally { setBusy('bookBtn', false, 'Confirm & Get Token →'); }
}
