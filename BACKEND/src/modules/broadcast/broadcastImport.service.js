import * as XLSX from 'xlsx';

const phoneColumns = ['phone', 'nomor', 'nomor_hp', 'no_hp', 'whatsapp', 'wa'];
const nameColumns = ['name', 'nama', 'nama_lengkap'];

const normalizeKey = (key) => String(key || '').trim().toLowerCase().replace(/\s+/g, '_');

export const normalizeIndonesianPhone = (value) => {
  let phone = String(value || '').trim();
  phone = phone.replace(/[^\d+]/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  if (!phone.startsWith('62') && phone.startsWith('8')) phone = `62${phone}`;
  if (!/^62\d{8,15}$/.test(phone)) return null;
  return phone;
};

const pickValue = (row, candidates) => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeKey(key), value]);
  const found = normalizedEntries.find(([key]) => candidates.includes(key));
  return found?.[1] ?? '';
};

export const parseExcelContacts = (file) => {
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const seen = new Set();
  const contacts = [];
  const invalid = [];
  let totalRows = 0;
  let duplicates = 0;

  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    rows.forEach((row, index) => {
      totalRows += 1;
      const rawPhone = pickValue(row, phoneColumns);
      const phone = normalizeIndonesianPhone(rawPhone);
      if (!phone) {
        invalid.push({
          row: index + 2,
          phone: String(rawPhone || ''),
          reason: 'Invalid phone number',
        });
        return;
      }

      if (seen.has(phone)) {
        duplicates += 1;
        return;
      }

      seen.add(phone);
      contacts.push({
        name: String(pickValue(row, nameColumns) || '').trim() || null,
        phone,
      });
    });
  });

  return {
    totalRows,
    validRows: contacts.length,
    invalidRows: invalid.length,
    duplicates,
    contacts,
    invalid,
  };
};

export default {
  parseExcelContacts,
  normalizeIndonesianPhone,
};
