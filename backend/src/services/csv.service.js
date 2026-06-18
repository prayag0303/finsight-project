const fs = require('fs');
const csvParser = require('csv-parser');
const logger = require('../utils/logger');

// ─── BOM stripper ──────────────────────────────────────────────────────────────

const stripBOM = (buf) => {
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return buf.slice(3);
  if (buf[0] === 0xFF && buf[1] === 0xFE) return Buffer.from(buf.slice(2).toString('utf16le'));
  if (buf[0] === 0xFE && buf[1] === 0xFF) {
    const raw = buf.slice(2);
    const swapped = Buffer.allocUnsafe(raw.length);
    for (let i = 0; i < raw.length; i += 2) { swapped[i] = raw[i + 1]; swapped[i + 1] = raw[i]; }
    return Buffer.from(swapped.toString('utf16le'));
  }
  return buf;
};

// ─── Format detection ──────────────────────────────────────────────────────────
// Normalise headers to lowercase for detection only; row keys keep original case.

const FORMATS = {
  FORMAT_D:  'FORMAT_D',   // FinSight demo datasets: transaction_id + merchant + expected_category
  FORMAT_C:  'FORMAT_C',   // Amount + Transaction Type (single amount column)
  FORMAT_AB: 'FORMAT_AB',  // debit + credit columns (most demo files)
  HDFC: 'HDFC',
  ICICI: 'ICICI',
  SBI: 'SBI',
  AXIS: 'AXIS',
  KOTAK: 'KOTAK',
  GENERIC: 'GENERIC',
};

const detectFormat = (headers) => {
  const h = headers.map((s) => s.toLowerCase().trim());
  const has = (t) => h.some((c) => c.includes(t));
  const is  = (t) => h.some((c) => c === t);

  // Format D: FinSight demo datasets with transaction_id + merchant + expected_category
  // Must check before Format C since Format D also has amount + type columns
  if (is('expected_category') && is('merchant') && is('transaction_id')) return FORMATS.FORMAT_D;

  // Format C: single amount + transaction type column
  if (is('amount') && (is('transaction type') || is('type'))) return FORMATS.FORMAT_C;

  // Format A/B: separate debit and credit columns
  if (is('debit') && is('credit')) return FORMATS.FORMAT_AB;

  // Bank-specific formats
  if (has('withdrawal amt') || has('deposit amt')) return FORMATS.HDFC;
  if (has('withdrawal amount (inr)') || has('deposit amount (inr)') || has('transaction remarks')) return FORMATS.ICICI;
  if ((is('txn date') || is('value date')) && has('debit') && has('credit')) return FORMATS.SBI;
  if ((is('particulars') || has('particulars')) && (is('tran date') || is('transaction date'))) return FORMATS.AXIS;
  if ((is('dt') || is('transaction date')) && (is('dr') || is('cr'))) return FORMATS.KOTAK;

  return FORMATS.GENERIC;
};

// ─── Date parser ───────────────────────────────────────────────────────────────

const parseDate = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();

  // DD-MM-YYYY  (Format A, B)
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-');
    return new Date(`${y}-${m}-${d}`);
  }
  // DD/MM/YYYY  (HDFC, KOTAK)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  // YYYY-MM-DD or YYYY-MM-DD HH:MM:SS  (Format C)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.substring(0, 10));
  // DD MMM YYYY  (SBI)
  if (/^\d{1,2}\s+\w{3}\s+\d{4}$/.test(s)) return new Date(s);

  const p = new Date(s);
  return isNaN(p) ? null : p;
};

// ─── Merchant extractor ────────────────────────────────────────────────────────

const extractMerchant = (description) => {
  if (!description) return null;
  let m = description.toUpperCase().trim();
  m = m
    .replace(/^(UPI[\/\-]?|NEFT[\/\-]?|IMPS[\/\-]?|RTGS[\/\-]?|POS[\/\-]?|ATM[\/\-]?|NACH[\/\-]?|ACH[\/\-]?)/i, '')
    .replace(/^(BY\s+|TO\s+|FROM\s+)/i, '');
  m = m.split(/[\/\-@#_|]/)[0].trim();
  m = m.replace(/\s+\d{5,}.*$/, '').replace(/\s+(REF|TXN|ORDER|ID|NO|NUM|#)\s*\w+$/i, '').trim();
  return m.substring(0, 50) || null;
};

// ─── Category mapper (Format C pre-labelled categories → FinSight enum) ────────

const FINSIGHT_CATEGORIES = new Set([
  'Food', 'Groceries', 'Shopping', 'Entertainment', 'Travel',
  'Healthcare', 'Education', 'Investment', 'EMI', 'Utilities',
  'Salary', 'Transfer', 'Others',
]);

const CSV_CATEGORY_MAP = {
  'restaurants': 'Food',      'fast food': 'Food',       'food & dining': 'Food',
  'coffee shops': 'Food',     'alcohol & bars': 'Food',  'dining': 'Food',
  'groceries': 'Groceries',
  'shopping': 'Shopping',     'electronics & software': 'Shopping',
  'movies & dvds': 'Entertainment', 'television': 'Entertainment',
  'entertainment': 'Entertainment', 'music': 'Entertainment',
  'utilities': 'Utilities',   'mobile phone': 'Utilities', 'internet': 'Utilities',
  'gas & fuel': 'Travel',     'travel': 'Travel',        'airline': 'Travel',
  'mortgage & rent': 'EMI',   'loan': 'EMI',
  'paycheck': 'Salary',       'income': 'Salary',
  'credit card payment': 'Transfer', 'transfer': 'Transfer',
  'healthcare': 'Healthcare', 'haircut': 'Healthcare',   'medical': 'Healthcare',
  'education': 'Education',
  'home improvement': 'Others', 'auto insurance': 'Others',
};

const mapCsvCategory = (cat) => {
  if (!cat) return null;
  if (FINSIGHT_CATEGORIES.has(cat)) return cat;
  return CSV_CATEGORY_MAP[cat.toLowerCase().trim()] || null;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const pick = (row, ...keys) => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

const parseMoney = (raw) => parseFloat((raw || '0').toString().replace(/,/g, '')) || 0;

// ─── Row normalizers ───────────────────────────────────────────────────────────

const normalizers = {

  // Format D: transaction_id,date,amount,merchant,description,type,expected_category
  // FinSight demo/training datasets — pre-classified, skip AI pipeline entirely
  FORMAT_D: (row) => {
    const amount = Math.abs(parseFloat(pick(row, 'amount', 'Amount') || 0));
    if (!amount || amount <= 0) return null;

    const typeRaw = pick(row, 'type', 'Type').toLowerCase().trim();
    const type = typeRaw === 'credit' ? 'CREDIT' : 'DEBIT';

    return {
      date: parseDate(pick(row, 'date', 'Date')),
      description: pick(row, 'description', 'Description'),
      merchant: pick(row, 'merchant', 'Merchant') || null,
      amount,
      type,
      category: pick(row, 'expected_category'),
      confidence: 1.0,
      skipPipeline: true,
    };
  },

  // Format A: date,description,debit,credit,balance,isSuspicious  (DD-MM-YYYY, lowercase)
  // Format B: Date,Description,Debit,Credit,isSuspicious           (DD-MM-YYYY, Title Case)
  FORMAT_AB: (row) => {
    const debit  = parseMoney(pick(row, 'debit',  'Debit'));
    const credit = parseMoney(pick(row, 'credit', 'Credit'));
    const amount = debit || credit;
    if (!amount || amount <= 0) return null;

    const desc = pick(row, 'description', 'Description');
    return {
      amount,
      description: desc,
      merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'date', 'Date')),
      type: credit > 0 ? 'CREDIT' : 'DEBIT',
    };
  },

  // Format C: Date,Description,Amount,Transaction Type,Category,Account Name,Month (YYYY-MM-DD HH:MM:SS)
  FORMAT_C: (row) => {
    const amount = parseMoney(pick(row, 'Amount', 'amount'));
    if (!amount || amount <= 0) return null;

    const typeRaw = pick(row, 'Transaction Type', 'transaction type', 'Type', 'type').toLowerCase();
    const type = typeRaw.includes('credit') ? 'CREDIT' : 'DEBIT';

    const desc = pick(row, 'Description', 'description');
    const rawCategory = pick(row, 'Category', 'category');
    const category = mapCsvCategory(rawCategory); // null means: let AI decide

    return {
      amount,
      description: desc,
      merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'Date', 'date')),
      type,
      category, // may be null
    };
  },

  HDFC: (row) => {
    const debit  = parseMoney(pick(row, 'Withdrawal Amt.', 'Withdrawal Amt', 'Debit', 'Debit Amount'));
    const credit = parseMoney(pick(row, 'Deposit Amt.',    'Deposit Amt',   'Credit', 'Credit Amount'));
    const amount = debit || credit;
    if (!amount || amount <= 0) return null;
    const desc = pick(row, 'Narration', 'Description', 'Transaction Remarks');
    return {
      amount, description: desc, merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'Date', 'Txn Date', 'Transaction Date')),
      type: credit > 0 ? 'CREDIT' : 'DEBIT',
    };
  },

  SBI: (row) => {
    const debit  = parseMoney(pick(row, 'Debit', 'Withdrawal Amount'));
    const credit = parseMoney(pick(row, 'Credit', 'Deposit Amount'));
    const amount = debit || credit;
    if (!amount || amount <= 0) return null;
    const desc = pick(row, 'Description', 'Particulars', 'Narration');
    return {
      amount, description: desc, merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'Txn Date', 'Value Date')),
      type: credit > 0 ? 'CREDIT' : 'DEBIT',
    };
  },

  ICICI: (row) => {
    const debit  = parseMoney(pick(row, 'Withdrawal Amount (INR)', 'Debit'));
    const credit = parseMoney(pick(row, 'Deposit Amount (INR)',    'Credit'));
    let amount = debit || credit;
    let type   = credit > 0 ? 'CREDIT' : 'DEBIT';
    if (!amount) {
      amount = parseMoney(pick(row, 'Amount (INR)', 'Amount'));
      type = pick(row, 'Dr/Cr').toLowerCase().startsWith('cr') ? 'CREDIT' : 'DEBIT';
    }
    if (!amount || amount <= 0) return null;
    const desc = pick(row, 'Transaction Remarks', 'Description');
    return {
      amount, description: desc, merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'Transaction Date', 'Date')),
      type,
    };
  },

  AXIS: (row) => {
    const debit  = parseMoney(pick(row, 'Debit', 'DR', 'Dr'));
    const credit = parseMoney(pick(row, 'Credit', 'CR', 'Cr'));
    const amount = debit || credit;
    if (!amount || amount <= 0) return null;
    const desc = pick(row, 'Particulars', 'PARTICULARS', 'Transaction Remarks', 'Description');
    return {
      amount, description: desc, merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'Transaction Date', 'Tran Date')),
      type: credit > 0 ? 'CREDIT' : 'DEBIT',
    };
  },

  KOTAK: (row) => {
    const debit  = parseMoney(pick(row, 'Debit', 'Dr'));
    const credit = parseMoney(pick(row, 'Credit', 'Cr'));
    let amount = debit || credit;
    let type   = credit > 0 ? 'CREDIT' : 'DEBIT';
    if (!amount) {
      amount = parseMoney(pick(row, 'Amount'));
      type = pick(row, 'Type').toLowerCase().includes('credit') ? 'CREDIT' : 'DEBIT';
    }
    if (!amount || amount <= 0) return null;
    const desc = pick(row, 'Description', 'Particulars', 'Narration');
    return {
      amount, description: desc, merchant: extractMerchant(desc),
      date: parseDate(pick(row, 'Transaction Date', 'Dt')),
      type,
    };
  },

  GENERIC: (row) => {
    const keys = Object.keys(row);
    // Try debit/credit first (catches any bank CSV with those columns)
    const debitKey  = keys.find((k) => /^debit$/i.test(k));
    const creditKey = keys.find((k) => /^credit$/i.test(k));
    if (debitKey && creditKey) {
      const debit  = parseMoney(row[debitKey]);
      const credit = parseMoney(row[creditKey]);
      const amount = debit || credit;
      if (amount > 0) {
        const descKey = keys.find((k) => /desc|narration|particulars|remarks/i.test(k));
        const dateKey = keys.find((k) => /date/i.test(k));
        const desc = (row[descKey] || '').trim();
        return {
          amount, description: desc, merchant: extractMerchant(desc),
          date: parseDate(row[dateKey]),
          type: credit > 0 ? 'CREDIT' : 'DEBIT',
        };
      }
    }
    // Fallback: single amount column
    const amountKey = keys.find((k) => /^amount$|^amt$/i.test(k));
    const descKey   = keys.find((k) => /desc|narration|particulars|remarks/i.test(k));
    const dateKey   = keys.find((k) => /date/i.test(k));
    const typeKey   = keys.find((k) => /^type$|dr.?cr/i.test(k));
    const amount = parseMoney(row[amountKey]);
    if (!amount || amount <= 0) return null;
    const typeVal = (row[typeKey] || '').toLowerCase();
    const type = typeVal.includes('cr') || typeVal.includes('credit') ? 'CREDIT' : 'DEBIT';
    const desc = (row[descKey] || '').trim();
    return {
      amount, description: desc, merchant: extractMerchant(desc),
      date: parseDate(row[dateKey]), type,
    };
  },
};

// ─── Main parser ───────────────────────────────────────────────────────────────

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const raw     = fs.readFileSync(filePath);
      const cleaned = stripBOM(raw);
      if (cleaned.length !== raw.length) fs.writeFileSync(filePath, cleaned);
    } catch (e) {
      logger.warn(`BOM strip failed: ${e.message}`);
    }

    const rows = [];
    let format = null;

    fs.createReadStream(filePath)
      .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
      .on('headers', (hdrs) => {
        format = detectFormat(hdrs);
        logger.info(`CSV format detected: ${format} | headers: ${hdrs.join(', ')}`);
      })
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const normalizer = normalizers[format] || normalizers.GENERIC;
        const normalized = rows
          .map((row) => { try { return normalizer(row); } catch { return null; } })
          .filter((r) => r && r.amount > 0 && r.date && !isNaN(r.date));

        resolve({ rows: normalized, bankFormat: format, total: normalized.length });
      })
      .on('error', reject);
  });
};

const deleteFile = (filePath) => {
  try { fs.unlinkSync(filePath); }
  catch { logger.warn(`Could not delete temp file: ${filePath}`); }
};

module.exports = { parseCSV, deleteFile, extractMerchant };
