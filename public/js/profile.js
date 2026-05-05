// ─── PROFILE MODULE ───────────────────────────────────────────────────────────
// Handles: emergency profile display/edit, settings
// Used by: user.html

function renderEP() {
  if (!window.USER) return;
  const ep = USER.emergencyProfile || {};

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };
  const setInput = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  // Display values
  set('ep_blood',    ep.bloodGroup);
  set('ep_cond',     ep.primaryCondition);
  set('ep_cond2',    ep.secondaryCondition);
  set('ep_allergy',  ep.allergies);
  set('ep_meds',     ep.medications);
  set('ep_ecname',   ep.emergencyContactName);
  set('ep_ecphone',  ep.emergencyContactPhone);
  set('ep_ec2name',  ep.secondaryContactName);
  set('ep_ec2phone', ep.secondaryContactPhone);
  set('ep_surgery',  ep.surgicalHistory);
  set('ep_notes',    ep.additionalNotes);

  // Editable inputs
  setInput('upd_blood',    ep.bloodGroup);
  setInput('upd_cond',     ep.primaryCondition);
  setInput('upd_cond2',    ep.secondaryCondition);
  setInput('upd_allergy',  ep.allergies);
  setInput('upd_meds',     ep.medications);
  setInput('upd_ecname',   ep.emergencyContactName);
  setInput('upd_ecphone',  ep.emergencyContactPhone);
  setInput('upd_ec2name',  ep.secondaryContactName);
  setInput('upd_ec2phone', ep.secondaryContactPhone);
  setInput('upd_surgery',  ep.surgicalHistory);
  setInput('upd_notes',    ep.additionalNotes);
}

async function saveEmergencyProfile() {
  const body = {
    bloodGroup:            document.getElementById('upd_blood')?.value,
    primaryCondition:      document.getElementById('upd_cond')?.value,
    secondaryCondition:    document.getElementById('upd_cond2')?.value,
    allergies:             document.getElementById('upd_allergy')?.value.trim(),
    medications:           document.getElementById('upd_meds')?.value.trim(),
    emergencyContactName:  document.getElementById('upd_ecname')?.value.trim(),
    emergencyContactPhone: document.getElementById('upd_ecphone')?.value.trim(),
    secondaryContactName:  document.getElementById('upd_ec2name')?.value.trim(),
    secondaryContactPhone: document.getElementById('upd_ec2phone')?.value.trim(),
    surgicalHistory:       document.getElementById('upd_surgery')?.value.trim(),
    additionalNotes:       document.getElementById('upd_notes')?.value.trim()
  };
  setBusy('saveEPBtn', true);
  try {
    const d = await api('PUT', '/api/auth/patient/emergency-profile', body);
    // Update local user object
    window.USER.emergencyProfile = d.emergencyProfile;
    localStorage.setItem('mq_user', JSON.stringify(window.USER));
    renderEP();
    showSaveSuccess('EP saved successfully ✓');
  } catch (e) {
    showError('updError', e.message);
  }
  finally { setBusy('saveEPBtn', false, 'Save Changes'); }
}

function showSaveSuccess(msg) {
  const el = document.getElementById('saveSuccess');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}
