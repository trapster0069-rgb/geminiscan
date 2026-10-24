# 🌐 GeminiScan Vercel Portal (`geminiscan.vercel.app`)

A lightweight, zero-latency serverless activation gateway built for Google Gemini Pro promotional links.

## 🚀 Features
- **Branded Custom Route**: `https://geminiscan.vercel.app/new/gm/:token`
- **Live 25:00 Minute Countdown Timer**: Displays real-time ticking warning so customers activate immediately before Google's 25-minute token TTL elapses.
- **Privacy Shield**: User mobile numbers are 100% hidden and masked (`+91 629049****`).
- **Direct 302 Redirection**: `/go/:token` bypasses landing page with anti-caching headers for instant redirection to Google.
- **Expired Recovery**: If 25 minutes elapse, it guides the customer to request a fresh OTP from the Telegram bot (`@Geminiplusss_robot`).

## 📦 How to Deploy to Vercel

### Method 1: Using Vercel CLI (Fastest)
1. In this directory, run:
   ```bash
   npx vercel
   ```
2. When asked for project name, enter: `geminiscan` (to get `geminiscan.vercel.app`).
3. Deploy to production:
   ```bash
   npx vercel --prod
   ```

### Method 2: GitHub + Vercel Dashboard
1. Push this folder to your GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the repository.
4. Set Domain to `geminiscan.vercel.app`.
5. Click **Deploy**.
