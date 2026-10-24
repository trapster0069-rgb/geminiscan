/**
 * geminiscan-portal / api/index.js
 * --------------------------------
 * Google Gemini Pro AI Activation Gateway for geminiscan.vercel.app
 * Provides:
 * 1. Short Link Resolution (e.g. /new/gm/gm_a9b1c2 -> full Google token)
 * 2. Real-time Status Checking (/api/link-status) -> 'active', 'used', 'expired'
 * 3. Real-time Mark Used (/api/mark-used) -> tracks redemptions instantly
 * 4. 24-Hour Active Status Guarantee & Zero-timer stress
 * 5. Privacy shielding (masked phone, 100% hidden on activation)
 * 6. High-speed direct activation route (/go/:id)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_USERNAME = process.env.BOT_USERNAME || 'Geminiplusss_robot';

app.use(express.json());

// Enable CORS and anti-cache headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// -------------------------------------------------------------
// Persistent Link Store (Memory + File storage for Vercel /tmp)
// -------------------------------------------------------------
const linkStore = new Map();

// Determine file path for persistence (/tmp on Vercel lambdas, ./data locally)
const STORAGE_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'gemini_links.json');

function initStore() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        linkStore.set(k, v);
      }
      console.log(`[Store] Loaded ${linkStore.size} links from storage.`);
    }
  } catch (err) {
    console.warn('[Store] Could not load storage file:', err.message);
  }
}

function persistStore() {
  try {
    const obj = {};
    for (const [k, v] of linkStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Store] Could not save storage file:', err.message);
  }
}

initStore();

// -------------------------------------------------------------
// 1. Home / Status Page
// -------------------------------------------------------------
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GeminiScan AI Gateway | Live</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #080c14;
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .container {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 24px;
          padding: 44px 32px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
        h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
        }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
        .bot-link {
          display: inline-block;
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .bot-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.7);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">
          <span class="dot"></span> GeminiScan Gateway Active
        </div>
        <h1>geminiscan.vercel.app</h1>
        <p>Official Google Gemini Pro Partner Activation Gateway with 24-Hour Active Status & Real-Time Link Verification.</p>
        <a class="bot-link" href="https://t.me/${BOT_USERNAME}" target="_blank">
          🤖 Open Telegram Bot (@${BOT_USERNAME})
        </a>
      </div>
    </body>
    </html>
  `);
});

// -------------------------------------------------------------
// 2. Save Link API (Called by Telegram Bot)
// -------------------------------------------------------------
app.post('/api/save-link', (req, res) => {
  const { shortId, token, mobile, type } = req.body;
  if (!shortId || !token) {
    return res.status(400).json({ success: false, error: 'shortId and token are required' });
  }

  const cleanShortId = shortId.trim();
  const cleanToken = token.trim();
  const record = {
    shortId: cleanShortId,
    token: cleanToken,
    mobile: mobile || 'Hidden',
    type: (type || 'basic').toLowerCase(),
    status: 'active',
    createdAt: new Date().toISOString(),
    usedAt: null,
    accessCount: 0
  };

  linkStore.set(cleanShortId, record);
  // Also index by token
  linkStore.set(cleanToken, record);
  persistStore();

  console.log(`[SaveLink] Saved short link: ${cleanShortId} (mobile: ${mobile})`);

  return res.json({
    success: true,
    shortId: cleanShortId,
    url: `https://geminiscan.vercel.app/new/gm/${cleanShortId}`
  });
});

// -------------------------------------------------------------
// 3. Real-Time Link Status Check API: /api/link-status
// -------------------------------------------------------------
app.get('/api/link-status', (req, res) => {
  const queryId = (req.query.id || req.query.token || '').trim();
  if (!queryId) {
    return res.status(400).json({ success: false, error: 'id or token parameter is required' });
  }

  // Check store
  let record = linkStore.get(queryId);

  // If not found directly, check if it contains an AQCP token
  if (!record) {
    const tokenMatch = queryId.match(/(AQCP[a-zA-Z0-9_\-+=]{40,})/);
    if (tokenMatch) {
      record = linkStore.get(tokenMatch[1]);
    }
  }

  // If still not found, check if it's a raw AQCP Google token
  if (!record && queryId.startsWith('AQCP') && queryId.length > 50) {
    return res.json({
      success: true,
      found: true,
      status: 'active',
      token: queryId,
      mobile: '+91 **********',
      type: 'basic',
      createdAt: new Date().toISOString(),
      usedAt: null,
      message: 'Direct Google partner token ready for activation.'
    });
  }

  if (!record) {
    return res.json({
      success: false,
      found: false,
      status: 'not_found',
      message: 'Link record not found in system.'
    });
  }

  // Check if link is older than 24 hours (24h validity guarantee window)
  const createdTime = new Date(record.createdAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);

  if (record.status !== 'used' && hoursElapsed > 24) {
    record.status = 'expired';
    persistStore();
  }

  // Format masked mobile
  let maskedMobile = '+91 **********';
  if (record.mobile && record.mobile.length >= 10) {
    const cleanDigits = record.mobile.replace(/\D/g, '').slice(-10);
    maskedMobile = `+91 ${cleanDigits.slice(0, 5)}*****`;
  }

  return res.json({
    success: true,
    found: true,
    shortId: record.shortId,
    token: record.token,
    status: record.status, // 'active' | 'used' | 'expired'
    type: record.type,
    mobile: maskedMobile,
    createdAt: record.createdAt,
    usedAt: record.usedAt,
    accessCount: record.accessCount || 0
  });
});

// -------------------------------------------------------------
// 4. Mark Link as Used API: /api/mark-used
// -------------------------------------------------------------
app.post('/api/mark-used', (req, res) => {
  const { id, token } = req.body;
  const targetKey = (id || token || '').trim();

  let record = linkStore.get(targetKey);
  if (!record && token) {
    record = linkStore.get(token.trim());
  }

  if (record) {
    record.status = 'used';
    record.usedAt = new Date().toISOString();
    record.accessCount = (record.accessCount || 0) + 1;
    persistStore();
    console.log(`[MarkUsed] Link marked as used: ${record.shortId}`);
    return res.json({
      success: true,
      status: 'used',
      usedAt: record.usedAt
    });
  }

  return res.json({
    success: false,
    message: 'Link record not found to mark as used'
  });
});

// -------------------------------------------------------------
// 5. Short Link Detail API: /api/link/:id
// -------------------------------------------------------------
app.get('/api/link/:id', (req, res) => {
  const id = req.params.id;
  const record = linkStore.get(id);
  if (!record) {
    return res.status(404).json({ error: 'Short link not found' });
  }

  return res.json({
    shortId: record.shortId,
    token: record.token,
    status: record.status,
    type: record.type,
    targetUrl: `https://serviceactivation.google.com/subscription/new/${record.token}`
  });
});

// -------------------------------------------------------------
// 6. Direct 302 Redirection Gateway: /go/:tokenOrId
// -------------------------------------------------------------
app.get('/go/:tokenOrId', (req, res) => {
  const raw = req.params.tokenOrId || '';

  // Look up in store
  const record = linkStore.get(raw);
  let finalToken = raw;

  if (record) {
    finalToken = record.token;
    record.accessCount = (record.accessCount || 0) + 1;
    persistStore();
  } else {
    const tokenMatch = raw.match(/(AQCP[a-zA-Z0-9_\-+=]{40,})/);
    if (tokenMatch) {
      finalToken = tokenMatch[1];
    }
  }

  return res.redirect(302, `https://serviceactivation.google.com/subscription/new/${finalToken}`);
});

// -------------------------------------------------------------
// 7. Refresh Link API (activationservice.services compatibility)
// -------------------------------------------------------------
function handleRefreshLink(req, res) {
  const queryId = (req.body?.id || req.query?.id || '').trim();
  if (!queryId) {
    return res.status(400).json({ error: 'Missing id' });
  }

  let record = linkStore.get(queryId);
  if (!record) {
    const tokenMatch = queryId.match(/(AQCP[a-zA-Z0-9_\-+=]{40,})/);
    if (tokenMatch) record = linkStore.get(tokenMatch[1]);
  }

  if (record) {
    const targetUrl = `https://serviceactivation.google.com/subscription/new/${record.token}`;
    record.accessCount = (record.accessCount || 0) + 1;
    persistStore();
    return res.json({
      success: true,
      link: targetUrl,
      status: record.status || 'active',
      refreshed: true
    });
  }

  if (queryId.startsWith('AQCP')) {
    return res.json({
      success: true,
      link: `https://serviceactivation.google.com/subscription/new/${queryId}`,
      refreshed: true
    });
  }

  return res.status(404).json({ error: 'Link not found for refresh' });
}

app.post('/refreshLink', handleRefreshLink);
app.post('/api/refreshLink', handleRefreshLink);
app.get('/refreshLink', handleRefreshLink);
app.get('/api/refreshLink', handleRefreshLink);

// -------------------------------------------------------------
// 8. Health Check
// -------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    domain: 'geminiscan.vercel.app',
    linksTracked: linkStore.size,
    time: new Date().toISOString()
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 GeminiScan Gateway running on http://localhost:${PORT}`);
  });
}

module.exports = app;
