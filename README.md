# Swasthya 🏥
**Your health records, always with you**
Patient health records, appointment booking & home services for Mahendragarh, Rewari & Narnaul.

---

## Local Development

```bash
npm install
npm start
# Opens at http://localhost:3000
```

---

## Deploy to Vercel (one-time setup)

### Step 1 — Push this repo to GitHub
```bash
git init
git add .
git commit -m "Initial commit — Swasthya V1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/swasthya-app.git
git push -u origin main
```

### Step 2 — Connect Vercel
1. Go to https://vercel.com → "Sign in with GitHub"
2. Click "Add New Project"
3. Select the `swasthya-app` repository
4. Leave all settings as default
5. Click **Deploy**
6. In ~60 seconds: `https://swasthya-app.vercel.app` ✅

Every future `git push` auto-redeploys. No manual steps.

---

## Environment Variables (for backend — Phase 3)

Create a `.env` file locally (never commit this):
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_MSG91_KEY=your_msg91_key
```

Add the same keys in Vercel → Project → Settings → Environment Variables.

---

## PWA — Install on Android

1. Open the Vercel URL in **Chrome on Android**
2. Tap the **three-dot menu** → "Add to Home Screen"
3. Tap "Add"
4. Swasthya appears on home screen like a real app ✅

---

## Project Structure

```
swasthya/
├── public/
│   ├── index.html        ← App shell, viewport, fonts
│   ├── manifest.json     ← PWA config (app name, icons, colors)
│   └── sw.js             ← Service worker (offline support)
├── src/
│   ├── App.jsx           ← Entire app (onboarding + all screens)
│   └── index.js          ← React entry point
├── .github/workflows/
│   └── deploy.yml        ← Auto-deploy on git push
├── vercel.json           ← Vercel routing config
└── package.json
```

---

## Tech Stack
- **React 18** — UI
- **Vercel** — Hosting (free)
- **Supabase** — Database + Auth + Storage (Phase 3)
- **MSG91** — Indian SMS OTP (Phase 3)
