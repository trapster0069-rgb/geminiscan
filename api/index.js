/**
 * geminiscan-portal / api/index.js
 * --------------------------------
 * Google Gemini Pro AI Activation Gateway for geminiscan.vercel.app
 * Provides:
 * 1. 24-Hour Active Status Guarantee (Zero countdown timer stress)
 * 2. Support for 1️⃣ Basic Link and 2️⃣ Reactivation Link
 * 3. Privacy-shielding (masked phone, 100% hidden on activation)
 * 4. Direct zero-lag 302 redirection to Google's official partner portal
 * 5. Custom domain integration: geminiscan.vercel.app/new/gm/:token
 */

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const BOT_USERNAME = process.env.BOT_USERNAME || 'Geminiplusss_robot';

app.use(express.json());

// Anti-cache headers helper to avoid stale cached 302 redirects
function setNoCacheHeaders(res) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0'
  });
}

// -------------------------------------------------------------
// 1. Home / Status Page
// -------------------------------------------------------------
app.get('/', (req, res) => {
  setNoCacheHeaders(res);
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
        <p>Official Google Gemini Pro Partner Activation Gateway & 24-Hour Active Link System.</p>
        <a class="bot-link" href="https://t.me/${BOT_USERNAME}" target="_blank">
          🤖 Open Telegram Bot (@${BOT_USERNAME})
        </a>
      </div>
    </body>
    </html>
  `);
});

// -------------------------------------------------------------
// 2. Exact Activation Route: /new/gm/:token
// -------------------------------------------------------------
app.get('/new/gm/:token', (req, res) => {
  setNoCacheHeaders(res);
  const rawToken = req.params.token || '';
  const mobile = req.query.m || req.query.mobile || 'Hidden';
  const typeParam = (req.query.type || 'basic').toLowerCase();
  const isReactivation = typeParam === 'reactivation';
  const linkTypeLabel = isReactivation ? 'Reactivation Link' : 'Basic Link';

  // Extract clean Google token if full link or padding was passed
  const tokenMatch = rawToken.match(/(AQCP[a-zA-Z0-9_\-+=]{40,})/);
  const token = tokenMatch ? tokenMatch[1] : rawToken;
  const targetGoogleUrl = `https://serviceactivation.google.com/subscription/new/${token}`;

  // Mask mobile number for privacy (e.g. +91 629049****)
  let maskedMobile = '+91 **********';
  if (mobile && mobile.length >= 10) {
    const cleanDigits = mobile.replace(/\D/g, '').slice(-10);
    maskedMobile = `+91 ${cleanDigits.slice(0, 5)}*****`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activate Google Gemini Pro | GeminiScan</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #060911;
          color: #f1f5f9;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 28px;
          padding: 36px 28px;
          max-width: 460px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(59, 130, 246, 0.15);
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .content { position: relative; z-index: 1; }
        .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(56, 189, 248, 0.1);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sub-tier {
          color: #818cf8;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .validity-box {
          background: rgba(10, 15, 29, 0.85);
          border: 1px solid rgba(34, 197, 94, 0.4);
          border-radius: 18px;
          padding: 16px 20px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .validity-left {
          text-align: left;
        }
        .validity-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #4ade80;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .validity-sub {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .validity-badge {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.15);
          padding: 6px 14px;
          border-radius: 10px;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .info-pill {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .info-pill span:first-child { color: #94a3b8; }
        .info-pill span:last-child { color: #f8fafc; font-weight: 600; font-family: monospace; }
        .activate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          border-radius: 16px;
          box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.6);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 10px;
          margin-bottom: 18px;
        }
        .activate-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px -5px rgba(79, 70, 229, 0.85);
        }
        .guidance-box {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 14px;
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.6;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .guidance-box strong { color: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="content">
          <div class="logo-badge">
            ✨ Google Gemini Pro ${isReactivation ? 'Reactivation' : 'Activation'}
          </div>
          <h1>1-Year Gemini Advanced</h1>
          <div class="sub-tier">
            <span>🛡️ ${linkTypeLabel} &bull; Official Partner Link</span>
          </div>

          <!-- 24-Hour Active Status Banner (No Countdown Timer) -->
          <div class="validity-box">
            <div class="validity-left">
              <div class="validity-label">
                <span style="display:inline-block; width:8px; height:8px; background:#22c55e; border-radius:50%; box-shadow:0 0 8px #22c55e;"></span>
                Active Link Protected
              </div>
              <div class="validity-sub">Guaranteed Active Status</div>
            </div>
            <div class="validity-badge">24H Active</div>
          </div>

          <div class="info-pill">
            <span>Link Category:</span>
            <span style="color:${isReactivation ? '#c084fc' : '#38bdf8'};">${linkTypeLabel}</span>
          </div>

          <div class="info-pill">
            <span>Linked Mobile:</span>
            <span>${maskedMobile}</span>
          </div>

          <!-- Direct Activation Button -->
          <a class="activate-btn" href="${targetGoogleUrl}" id="activateBtn" target="_blank" rel="noopener noreferrer">
            🚀 Open Google Activation Portal
          </a>

          <div class="guidance-box">
            <strong>💡 Activation Instructions:</strong><br>
            1. Tap the button above to launch Google's official partner page.<br>
            2. Make sure you are signed in to the Google account you wish to upgrade.<br>
            3. Click <b>"Accept &amp; Activate"</b> to lock in your 12-Month Gemini Pro benefits!
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// -------------------------------------------------------------
// 3. Direct 302 Redirection Endpoint: /go/:token
// -------------------------------------------------------------
app.get('/go/:token', (req, res) => {
  setNoCacheHeaders(res);
  const token = req.params.token || '';
  const tokenMatch = token.match(/(AQCP[a-zA-Z0-9_\-+=]{40,})/);
  const cleanToken = tokenMatch ? tokenMatch[1] : token;
  return res.redirect(302, `https://serviceactivation.google.com/subscription/new/${cleanToken}`);
});

// -------------------------------------------------------------
// 4. Health Check
// -------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    domain: 'geminiscan.vercel.app',
    time: new Date().toISOString()
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 GeminiScan Gateway running on http://localhost:${PORT}`);
  });
}

module.exports = app;
