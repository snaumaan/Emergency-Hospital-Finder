const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function saveToJson(filename, record) {
  const filePath = path.join(DATA_DIR, filename);
  let existing = [];
  if (fs.existsSync(filePath)) {
    try { existing = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch (_) {}
  }
  if (!Array.isArray(existing)) existing = [];
  existing.push({ ...record, savedAt: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`📁  data/${filename} — ${existing.length} records`);
}

module.exports = saveToJson;
