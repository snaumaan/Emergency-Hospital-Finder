// ─── HOSPITAL BEDS & DEPARTMENTS MODULE ──────────────────────────────────────
// Handles: bed management, department CRUD
// Used by: hospital.html

// ─── BEDS ─────────────────────────────────────────────────────────────────────

async function loadBeds() {
  if (!window.HOSPITAL) return;
  const el = document.getElementById('bedsGrid');
  if (!el) return;

  try {
    const d = await api('GET', '/api/auth/hospital/me');
    const beds = (d.hospital && d.hospital.beds) || HOSPITAL.beds || [];
    renderBeds(beds);
  } catch (e) {
    renderBeds(HOSPITAL.beds || []);
  }
}

function renderBeds(beds) {
  const el = document.getElementById('bedsGrid');
  if (!el) return;

  const bedInfo = {
    general:   { label: 'General Beds',    icon: '🛏️', color: 'var(--blue)'  },
    icu:       { label: 'ICU Beds',         icon: '💉', color: 'var(--amber)' },
    emergency: { label: 'Emergency Beds',   icon: '🚨', color: 'var(--red)'   }
  };

  el.innerHTML = beds.map(b => {
    const info = bedInfo[b.type] || { label: b.type, icon: '🛏️', color: 'var(--gray)' };
    const pct  = b.total > 0 ? Math.round((b.available / b.total) * 100) : 0;
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="font-size:24px;">${info.icon}</div>
        <div>
          <div style="font-family:Syne,sans-serif;font-size:15px;font-weight:600;color:var(--white);">${info.label}</div>
          <div style="font-size:12px;color:rgba(250,247,242,0.35);">${b.available} of ${b.total} available</div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:6px;margin-bottom:16px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${info.color};border-radius:4px;transition:width .4s;"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:Syne,sans-serif;font-size:32px;font-weight:800;color:${info.color};">${b.available}</span>
        <div style="display:flex;gap:8px;">
          <button class="btn-sm" onclick="adjustBed('${b.type}', -1)">−</button>
          <button class="btn-sm red" onclick="adjustBed('${b.type}', 1)">+</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function adjustBed(bedType, delta) {
  try {
    const d = await api('PUT', '/api/hospitals/beds/update', { bedType, delta });
    // Update local hospital object
    if (window.HOSPITAL) {
      window.HOSPITAL.beds = d.beds;
      localStorage.setItem('mq_hosp', JSON.stringify(window.HOSPITAL));
    }
    renderBeds(d.beds);
    loadHospStats();
  } catch (e) {
    alert('Failed to update beds: ' + e.message);
  }
}

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

function renderDepartments() {
  const el = document.getElementById('deptGrid');
  if (!el || !window.HOSPITAL) return;
  const depts = HOSPITAL.departments || [];

  if (depts.length === 0) {
    el.innerHTML = '<div class="empty">No departments added yet.</div>';
    return;
  }

  el.innerHTML = depts.map(d => `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:24px;">${d.icon || '🏥'}</div>
        <div>
          <div style="font-family:Syne,sans-serif;font-size:14px;font-weight:600;color:var(--white);">${d.name}</div>
          <div style="font-size:12px;color:rgba(250,247,242,0.35);">${d.headDoctor || '—'} · ${d.doctorCount || 0} doctors</div>
        </div>
      </div>
      <button class="btn-sm" onclick="deleteDepartment('${d._id}')" style="color:var(--red);border-color:rgba(232,25,44,0.2);">Remove</button>
    </div>
  `).join('');
}

async function addDepartment() {
  const name       = document.getElementById('newDeptName')?.value.trim();
  const icon       = document.getElementById('newDeptIcon')?.value.trim() || '🏥';
  const headDoctor = document.getElementById('newDeptHead')?.value.trim();
  const doctorCount= parseInt(document.getElementById('newDeptCount')?.value) || 1;

  if (!name) return showError('deptError', 'Department name is required.');
  setBusy('addDeptBtn', true);
  try {
    const d = await api('POST', '/api/hospitals/departments/add', { name, icon, headDoctor, doctorCount });
    window.HOSPITAL.departments = d.departments;
    localStorage.setItem('mq_hosp', JSON.stringify(window.HOSPITAL));
    renderDepartments();
    // Clear form
    ['newDeptName','newDeptIcon','newDeptHead','newDeptCount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  } catch (e) { showError('deptError', e.message); }
  finally { setBusy('addDeptBtn', false, '+ Add Department'); }
}

async function deleteDepartment(deptId) {
  if (!confirm('Remove this department?')) return;
  try {
    const d = await api('DELETE', '/api/hospitals/departments/' + deptId);
    window.HOSPITAL.departments = d.departments;
    localStorage.setItem('mq_hosp', JSON.stringify(window.HOSPITAL));
    renderDepartments();
  } catch (e) {
    alert('Failed to remove department: ' + e.message);
  }
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

function renderAnalytics() {
  const el = document.getElementById('analyticsContent');
  if (!el || !window.HOSPITAL) return;
  const depts = HOSPITAL.departments || [];
  const beds  = HOSPITAL.beds || [];

  const totalBeds = beds.reduce((s, b) => s + b.total, 0);
  const availBeds = beds.reduce((s, b) => s + b.available, 0);
  const occRate   = totalBeds > 0 ? Math.round(((totalBeds - availBeds) / totalBeds) * 100) : 0;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;">
        <div style="font-size:12px;color:rgba(250,247,242,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bed Occupancy Rate</div>
        <div style="font-family:Syne,sans-serif;font-size:42px;font-weight:800;color:var(--white);">${occRate}<span style="font-size:20px;">%</span></div>
        <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:6px;margin-top:12px;overflow:hidden;">
          <div style="width:${occRate}%;height:100%;background:${occRate > 80 ? 'var(--red)' : occRate > 60 ? 'var(--amber)' : 'var(--green)'};border-radius:4px;"></div>
        </div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;">
        <div style="font-size:12px;color:rgba(250,247,242,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Total Departments</div>
        <div style="font-family:Syne,sans-serif;font-size:42px;font-weight:800;color:var(--blue);">${depts.length}</div>
        <div style="font-size:12px;color:rgba(250,247,242,0.35);margin-top:12px;">${depts.map(d => d.name).join(', ') || 'None added'}</div>
      </div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;">
      <div style="font-family:Syne,sans-serif;font-size:14px;font-weight:600;color:var(--white);margin-bottom:14px;">Bed Breakdown</div>
      ${beds.map(b => {
        const pct = b.total > 0 ? Math.round((b.available / b.total) * 100) : 0;
        return `<div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span style="color:rgba(250,247,242,0.5);text-transform:capitalize;">${b.type}</span>
            <span style="color:var(--cream);">${b.available} / ${b.total} available</span>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:5px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:var(--green);border-radius:4px;"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
