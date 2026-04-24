// ─── HOSPITAL APPOINTMENTS MODULE ────────────────────────────────────────────
// Handles: viewing, accepting, rejecting appointments + token queue
// Used by: hospital.html

let ALL_APPOINTMENTS = [];

async function loadAppointments(filterStatus = 'all') {
  const el = document.getElementById('apptTable');
  if (!el) return;
  el.innerHTML = '<div class="spinner">Loading appointments…</div>';
  try {
    const d = await api('GET', '/api/appointments/hospital?status=' + filterStatus);
    ALL_APPOINTMENTS = d.appointments || [];
    renderAppointmentTable(ALL_APPOINTMENTS);
  } catch (e) {
    el.innerHTML = '<div class="empty">Could not load appointments: ' + e.message + '</div>';
  }
}

function filterAppointments(status) {
  document.querySelectorAll('.appt-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.status === status));
  if (status === 'all') {
    renderAppointmentTable(ALL_APPOINTMENTS);
  } else {
    renderAppointmentTable(ALL_APPOINTMENTS.filter(a => a.status === status));
  }
}

function renderAppointmentTable(appts) {
  const el = document.getElementById('apptTable');
  if (!el) return;
  if (appts.length === 0) { el.innerHTML = '<div class="empty">No appointments found.</div>'; return; }

  el.innerHTML = `<table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="border-bottom:1px solid var(--border);">
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(250,247,242,0.35);font-weight:500;">Token</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(250,247,242,0.35);font-weight:500;">Patient</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(250,247,242,0.35);font-weight:500;">Department</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(250,247,242,0.35);font-weight:500;">Date</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(250,247,242,0.35);font-weight:500;">Status</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(250,247,242,0.35);font-weight:500;">Actions</th>
      </tr>
    </thead>
    <tbody>
      ${appts.map(a => appointmentTableRow(a)).join('')}
    </tbody>
  </table>`;
}

function appointmentTableRow(a) {
  const statusColor = { pending:'var(--amber)', confirmed:'var(--green)', completed:'var(--gray)', cancelled:'var(--gray)' };
  const sc = statusColor[a.status] || 'var(--gray)';
  const p  = a.patient || {};
  const patientName = p.firstName ? p.firstName + ' ' + p.lastName : '—';

  const actions = a.status === 'pending'
    ? `<button class="btn-sm red" onclick="updateApptStatus('${a._id}','confirmed')" style="margin-right:4px;">Accept</button>
       <button class="btn-sm" onclick="updateApptStatus('${a._id}','cancelled')" style="color:var(--red);">Reject</button>`
    : a.status === 'confirmed'
    ? `<button class="btn-sm" onclick="updateApptStatus('${a._id}','completed')">Complete</button>`
    : `<span style="font-size:12px;color:rgba(250,247,242,0.25);">—</span>`;

  return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
    <td style="padding:12px;font-family:Syne,sans-serif;font-size:13px;font-weight:600;color:var(--red-light);">${a.token}</td>
    <td style="padding:12px;">
      <div style="font-size:13px;color:var(--cream);">${patientName}</div>
      <div style="font-size:11px;color:rgba(250,247,242,0.35);">${p.phone || ''}</div>
    </td>
    <td style="padding:12px;font-size:13px;color:var(--cream);">${a.department}</td>
    <td style="padding:12px;font-size:13px;color:rgba(250,247,242,0.5);">${formatDate(a.preferredDate)}</td>
    <td style="padding:12px;"><span style="font-size:12px;font-weight:500;color:${sc};text-transform:capitalize;">${a.status}</span></td>
    <td style="padding:12px;">${actions}</td>
  </tr>`;
}

async function updateApptStatus(id, status) {
  try {
    await api('PATCH', '/api/appointments/' + id + '/status', { status });
    loadAppointments();
    loadHospStats();
  } catch (e) {
    alert('Failed to update: ' + e.message);
  }
}

// ─── TOKEN QUEUE ──────────────────────────────────────────────────────────────

async function loadQueue() {
  const el = document.getElementById('queueList');
  if (!el || !window.HOSPITAL) return;
  el.innerHTML = '<div class="spinner">Loading queue…</div>';
  try {
    const d = await api('GET', '/api/appointments/queue/' + HOSPITAL._id, null, true);
    const queue = d.queue || [];
    if (queue.length === 0) { el.innerHTML = '<div class="empty">No patients in queue.</div>'; return; }
    el.innerHTML = queue.map((a, i) => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:16px;">
        <div style="width:40px;height:40px;background:${i === 0 ? 'var(--red)' : 'rgba(255,255,255,0.06)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:Syne,sans-serif;font-weight:800;font-size:16px;color:${i === 0 ? 'white' : 'rgba(250,247,242,0.4)'};">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-family:Syne,sans-serif;font-size:14px;font-weight:700;color:var(--white);">${a.token}</div>
          <div style="font-size:12px;color:rgba(250,247,242,0.4);">${a.department} · Est. ${a.estimatedWaitMinutes || 0} min wait</div>
        </div>
        <div style="font-size:12px;font-weight:500;color:${a.status === 'confirmed' ? 'var(--green)' : 'var(--amber)'};">${a.status}</div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<div class="empty">Could not load queue.</div>';
  }
}
