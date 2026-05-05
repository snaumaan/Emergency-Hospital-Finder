// ─── APPOINTMENTS MODULE ──────────────────────────────────────────────────────
// Handles: loading and displaying patient's appointments
// Used by: user.html

async function loadMyAppointments() {
  const el = document.getElementById('apptList');
  if (!el) return;
  el.innerHTML = '<div class="spinner">Loading appointments…</div>';
  try {
    const d = await api('GET', '/api/appointments/my');
    const appts = d.appointments || [];
    if (appts.length === 0) {
      el.innerHTML = '<div class="empty">No appointments yet.<br><a href="#" onclick="showPage(\'finder\')" style="color:var(--red);">Book your first →</a></div>';
      return;
    }
    el.innerHTML = appts.map(a => appointmentRow(a)).join('');
  } catch (e) {
    el.innerHTML = '<div class="empty">Could not load appointments: ' + e.message + '</div>';
  }
}

function appointmentRow(a) {
  const statusColor = {
    pending:   'var(--amber)',
    confirmed: 'var(--green)',
    completed: 'var(--gray)',
    cancelled: 'var(--gray)'
  };
  const statusBg = {
    pending:   'rgba(245,158,11,0.1)',
    confirmed: 'rgba(16,185,129,0.1)',
    completed: 'rgba(107,114,128,0.1)',
    cancelled: 'rgba(107,114,128,0.1)'
  };
  const sc  = statusColor[a.status] || 'var(--gray)';
  const sbg = statusBg[a.status]    || 'rgba(107,114,128,0.1)';
  const hospName = a.hospital ? (a.hospital.name || '—') : '—';
  const hospArea = a.hospital && a.hospital.address ? a.hospital.address.area || '' : '';

  return `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:12px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
      <div>
        <div style="font-family:Syne,sans-serif;font-size:18px;font-weight:800;color:var(--red);letter-spacing:-0.5px;">${a.token}</div>
        <div style="font-size:13px;font-weight:500;color:var(--white);margin-top:2px;">${hospName}</div>
        <div style="font-size:12px;color:rgba(250,247,242,0.4);">📍 ${hospArea}</div>
      </div>
      <div style="background:${sbg};border:1px solid ${sc};padding:4px 12px;border-radius:100px;font-size:12px;font-weight:500;color:${sc};text-transform:capitalize;">${a.status}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
      <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;">
        <div style="font-size:10px;color:rgba(250,247,242,0.3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Department</div>
        <div style="font-size:13px;font-weight:500;color:var(--cream);">${a.department}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;">
        <div style="font-size:10px;color:rgba(250,247,242,0.3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Date</div>
        <div style="font-size:13px;font-weight:500;color:var(--cream);">${formatDate(a.preferredDate)}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;">
        <div style="font-size:10px;color:rgba(250,247,242,0.3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Queue</div>
        <div style="font-size:13px;font-weight:500;color:var(--cream);">#${a.queuePosition || '—'}</div>
      </div>
    </div>
    ${a.status === 'confirmed' ? `
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:6px;padding:10px;font-size:12px;color:rgba(250,247,242,0.5);">
      ✅ Confirmed · Est. wait: <strong style="color:var(--green);">${a.estimatedWaitMinutes || 0} min</strong>
      ${a.hospital && a.hospital.phone ? ' · 📞 ' + a.hospital.phone : ''}
    </div>` : ''}
    ${a.status === 'cancelled' && a.cancelReason ? `
    <div style="background:rgba(107,114,128,0.06);border:1px solid rgba(107,114,128,0.15);border-radius:6px;padding:10px;font-size:12px;color:rgba(250,247,242,0.4);">
      ❌ Cancelled: ${a.cancelReason}
    </div>` : ''}
  </div>`;
}
