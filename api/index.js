/**
 * geminiscan-portal / api/index.js
 * --------------------------------
 * Official Google Gemini Pro AI 24-Hour Non-Expiring Activation Gateway
 * Domain: geminiscan.vercel.app
 * 
 * Features:
 * 1. Automatic 24-Hour Non-Expiring Link Engine (Refreshes Google vouchers on-demand)
 * 2. Self-Contained Stateless Zero-Database Payload Recovery (Zero data loss on Vercel)
 * 3. Real-Time Link Status Verification (/api/link-status)
 * 4. Real-Time Link Refresh (/refreshLink & /api/refreshLink)
 * 5. Privacy Protection (100% masked phone numbers)
 * 6. High-Speed Direct Activation (/go/:id)
 */

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_USERNAME = process.env.BOT_USERNAME || 'Geminiplusss_robot';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Anti-cache and CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// -------------------------------------------------------------
// In-Memory & File Store
// -------------------------------------------------------------
const linkStore = new Map();
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
// Helper: Request Fresh Google Voucher from Jio OTT API
// -------------------------------------------------------------
function queryJioFreshLink(cookiesObj) {
  return new Promise((resolve) => {
    if (!cookiesObj || typeof cookiesObj !== 'object' || Object.keys(cookiesObj).length === 0) {
      return resolve(null);
    }

    const cookieHeader = Object.entries(cookiesObj)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const options = {
      hostname: 'www.jio.com',
      port: 443,
      path: '/api/jio-ott-service/ott/subscription/google-ai',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.jio.com',
        'Referer': 'https://www.jio.com/selfcare/googleai/?header=no&type=Z0241&source=JIO',
        'Cookie': cookieHeader
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawUrl = json.redirectionURL || '';
          const match = rawUrl.match(/(https:\/\/serviceactivation\.google\.com\/subscription\/new\/[A-Za-z0-9_\-+=]{40,})/);
          if (match) {
            console.log('[JioRefresh] Successfully retrieved fresh Google voucher:', match[1].slice(0, 75) + '...');
            return resolve(match[1]);
          }
          console.warn('[JioRefresh] No redirectionURL in Jio response:', json);
          resolve(null);
        } catch (e) {
          console.warn('[JioRefresh] JSON parse error:', e.message);
          resolve(null);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn('[JioRefresh] Request timed out');
      resolve(null);
    });

    req.on('error', (e) => {
      console.warn('[JioRefresh] HTTPS error:', e.message);
      resolve(null);
    });

    req.end();
  });
}

// -------------------------------------------------------------
// Helper: Extract & Decode Record (Handles Memory + Stateless URL Data)
// -------------------------------------------------------------
function extractRecord(req) {
  const queryId = (req.query?.id || req.body?.id || req.query?.shortId || req.body?.shortId || '').trim();
  const rawData = (req.query?.d || req.body?.d || req.query?.data || req.body?.data || '').trim();

  // 1. Try decoding stateless payload if provided in query or body
  if (rawData) {
    try {
      // Decode standard base64 or URL-safe base64
      let b64 = rawData.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      if (parsed && (parsed.token || parsed.t)) {
        const rec = {
          shortId: parsed.id || parsed.shortId || queryId || 'gm_live',
          token: parsed.token || parsed.t || '',
          mobile: parsed.mobile || parsed.m || 'Hidden',
          cookies: parsed.cookies || parsed.c || null,
          createdAt: parsed.createdAt || parsed.ts || new Date().toISOString(),
          status: parsed.status || 'active',
          usedAt: parsed.usedAt || null,
          accessCount: parsed.accessCount || 0
        };
        // Cache in memory for fast subsequent calls
        if (rec.shortId) linkStore.set(rec.shortId, rec);
        return rec;
      }
    } catch (e) {
      console.warn('[ExtractRecord] Failed to decode payload:', e.message);
    }
  }

  // 2. Lookup in store by ID
  if (queryId) {
    const fromStore = linkStore.get(queryId);
    if (fromStore) return fromStore;
  }

  // 3. Fallback: Check if query contains direct token
  const directToken = (req.query?.token || req.body?.token || req.query?.t || '').trim();
  if (directToken && directToken.startsWith('AQCP') && directToken.length > 40) {
    return {
      shortId: queryId || 'gm_direct',
      token: directToken,
      mobile: (req.query?.m || req.body?.mobile || 'Hidden').trim(),
      cookies: req.body?.cookies || null,
      createdAt: new Date().toISOString(),
      status: 'active',
      usedAt: null,
      accessCount: 0
    };
  }

  return null;
}

// -------------------------------------------------------------
// 1. Save Link API (Called by Telegram Bot)
// -------------------------------------------------------------
app.post('/api/save-link', (req, res) => {
  const { shortId, token, mobile, cookies, type } = req.body;
  if (!shortId || !token) {
    return res.status(400).json({ success: false, error: 'shortId and token are required' });
  }

  const cleanShortId = shortId.trim();
  const cleanToken = token.trim();
  const record = {
    shortId: cleanShortId,
    token: cleanToken,
    mobile: mobile || 'Hidden',
    cookies: cookies || null,
    type: (type || 'basic').toLowerCase(),
    status: 'active',
    createdAt: new Date().toISOString(),
    usedAt: null,
    accessCount: 0
  };

  linkStore.set(cleanShortId, record);
  linkStore.set(cleanToken, record);
  persistStore();

  console.log(`[SaveLink] Saved link ${cleanShortId} (hasCookies: ${Boolean(cookies)})`);

  return res.json({
    success: true,
    shortId: cleanShortId,
    url: `https://geminiscan.vercel.app/?id=${cleanShortId}`
  });
});

// -------------------------------------------------------------
// 2. Real-Time Link Status Check API: /api/link-status
// -------------------------------------------------------------
app.get('/api/link-status', (req, res) => {
  const record = extractRecord(req);

  if (!record) {
    return res.json({
      success: false,
      found: false,
      status: 'not_found',
      message: 'Link record not found in system.'
    });
  }

  const createdTime = new Date(record.createdAt).getTime();
  const now = Date.now();
  const ageMs = now - createdTime;
  const isFresh = ageMs <= 25 * 60 * 1000; // 25-minute fresh window
  const isExpired = ageMs > 24 * 60 * 60 * 1000; // 24-hour total window

  if (record.status !== 'used' && isExpired) {
    record.status = 'expired';
    persistStore();
  }

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
    status: record.status,
    mobile: maskedMobile,
    isFresh: isFresh,
    canRefresh: Boolean(record.cookies),
    createdAt: record.createdAt,
    usedAt: record.usedAt,
    accessCount: record.accessCount || 0
  });
});

// -------------------------------------------------------------
// 3. 100% Real Voucher Refresh API: /refreshLink & /api/refreshLink
//    Matches activationservice.services architecture exactly!
// -------------------------------------------------------------
async function handleRefreshLink(req, res) {
  const record = extractRecord(req);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Link not found for refresh. Please check the ID or contact support.'
    });
  }

  // 1. If we have Jio session cookies, query Jio for a 100% brand new Google voucher!
  if (record.cookies) {
    const freshGoogleUrl = await queryJioFreshLink(record.cookies);
    if (freshGoogleUrl) {
      const tokenMatch = freshGoogleUrl.match(/\/new\/([A-Za-z0-9_\-+=]{40,})/);
      if (tokenMatch) {
        record.token = tokenMatch[1];
      }
      record.createdAt = new Date().toISOString();
      record.status = 'active';
      record.accessCount = (record.accessCount || 0) + 1;
      persistStore();

      return res.json({
        success: true,
        link: freshGoogleUrl,
        token: record.token,
        status: 'active',
        refreshed: true,
        updatedAt: Math.floor(Date.now() / 1000)
      });
    }
  }

  // 2. Fallback: Return current active token
  if (record.token) {
    const targetUrl = `https://serviceactivation.google.com/subscription/new/${record.token}`;
    return res.json({
      success: true,
      link: targetUrl,
      token: record.token,
      status: record.status || 'active',
      refreshed: false,
      updatedAt: Math.floor(new Date(record.createdAt).getTime() / 1000)
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Failed to refresh Google partner voucher.'
  });
}

app.post('/refreshLink', handleRefreshLink);
app.post('/api/refreshLink', handleRefreshLink);
app.get('/refreshLink', handleRefreshLink);
app.get('/api/refreshLink', handleRefreshLink);

// -------------------------------------------------------------
// 4. Mark Used API
// -------------------------------------------------------------
app.post('/api/mark-used', (req, res) => {
  const record = extractRecord(req);
  if (record) {
    record.status = 'used';
    record.usedAt = new Date().toISOString();
    record.accessCount = (record.accessCount || 0) + 1;
    persistStore();
    return res.json({ success: true, status: 'used', usedAt: record.usedAt });
  }
  return res.json({ success: false, message: 'Link not found to mark used.' });
});

// -------------------------------------------------------------
// 5. Direct 302 Fast Gateway: /go/:id
// -------------------------------------------------------------
app.get('/go/:id', async (req, res) => {
  const record = extractRecord(req);
  if (!record) {
    return res.redirect(302, `https://t.me/${BOT_USERNAME}`);
  }

  // Check if link is older than 25 minutes and can be refreshed
  const ageMs = Date.now() - new Date(record.createdAt).getTime();
  if (ageMs > 25 * 60 * 1000 && record.cookies) {
    const freshGoogleUrl = await queryJioFreshLink(record.cookies);
    if (freshGoogleUrl) {
      return res.redirect(302, freshGoogleUrl);
    }
  }

  return res.redirect(302, `https://serviceactivation.google.com/subscription/new/${record.token}`);
});

// -------------------------------------------------------------
// 6. Health & Status
// -------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gateway: 'geminiscan.vercel.app',
    linksCount: linkStore.size,
    time: new Date().toISOString()
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 GeminiScan Gateway running on http://localhost:${PORT}`);
  });
}

module.exports = app;
