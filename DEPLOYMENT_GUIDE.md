# Project Aura - Free Deployment Guide
## Stack: Koyeb (backend) + Neon (PostgreSQL) + Vercel (frontend)

Everything is already configured. Follow these steps in order.

---

## Prerequisites
- GitHub account (free)
- Your code pushed to a GitHub repository

---

## Step 1 - Push to GitHub

**IMPORTANT: Make your repository PRIVATE before pushing.**
A private repo means only you (and people you invite) can see your source code and history.

```bash
# In your project root
git init  # skip if already a git repo
git add .
git commit -m "Initial deployment setup"
# When creating the repo on github.com, set it to PRIVATE
git remote add origin https://github.com/YOUR_USERNAME/project-aura.git
git push -u origin main
```

**On GitHub.com when creating the repo:**
- Click the **Private** radio button (not Public)
- This protects your source code from being copied
- Vercel and Koyeb can still access private repos when you connect your GitHub account

---

## Step 2 - Set Up Neon PostgreSQL (Free Database)

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up free
2. Click **New Project** → name it `project-aura` → click Create
3. On the dashboard, click **Connection string** → choose **Pooled connection**
4. Copy the URL - it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Save this URL** - you'll need it in Step 3

---

## Step 3 - Deploy Backend on Koyeb

1. Go to [https://app.koyeb.com](https://app.koyeb.com) and sign up free
2. Click **Create Service** → choose **GitHub**
3. Connect your GitHub account and select your `project-aura` repo
4. Configure the service:
   - **Branch**: `main`
   - **Build**: Buildpack (auto-detected)
   - **Root directory**: `backend`
   - **Run command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
   - **Port**: `8000`
   - **Instance type**: `nano` (free, no sleep)
5. Add **Environment Variables** (click "+ Add variable" for each):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(your Neon connection string from Step 2)* |
   | `SECRET_KEY` | *(run `python -c "import secrets; print(secrets.token_hex(32))"` to generate)* |
   | `ALLOWED_ORIGINS` | *(leave blank for now - fill in after Vercel deploy in Step 5)* |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
   | `GROQ_API_KEY` | *(your Groq key - optional)* |
   | `GEMINI_API_KEY` | *(your Gemini key - optional)* |

6. Click **Deploy**
7. Wait ~3 minutes for build to complete
8. Copy your Koyeb URL - looks like: `https://project-aura-api-xxxx.koyeb.app`

---

## Step 4 - Seed the Database

After the backend is running, you need to populate the database with initial data.

The easiest way:
1. In Koyeb dashboard → your service → **Console** tab
2. Run: `python seed_database.py`

Or use the Neon SQL editor:
1. Go to [https://console.neon.tech](https://console.neon.tech) → your project → **SQL Editor**
2. The app auto-creates all tables on first startup - no manual SQL needed

---

## Step 5 - Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up free (use GitHub login)
2. Click **Add New → Project**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: *(your Koyeb URL from Step 3, e.g. `https://project-aura-api-xxxx.koyeb.app`)*
6. Click **Deploy**
7. Wait ~2 minutes - Vercel gives you a URL like: `https://project-aura-xyz.vercel.app`

---

## Step 6 - Wire CORS Back to Koyeb

1. Go back to Koyeb → your service → **Environment Variables**
2. Add/update:
   - `ALLOWED_ORIGINS` = `https://project-aura-xyz.vercel.app`
   - (replace with your actual Vercel URL)
3. Click **Redeploy**

---

## Step 7 - Test It

1. Open your Vercel URL in a browser
2. The app should look and work exactly like local
3. Login with your existing credentials (if you ran the seed)
4. Test: dashboard, patients, AI chat, alerts

---

## Default Login Credentials

Check `LOGIN_CREDENTIALS.txt` in the project root for demo accounts.

---

## Custom Domain (Optional)

- **Vercel**: Project Settings → Domains → Add your domain (free SSL included)
- **Koyeb**: Service settings → Domains → Add custom domain (free SSL included)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend 500 on startup | Check Koyeb logs - likely `DATABASE_URL` not set correctly |
| Login fails | Make sure `SECRET_KEY` is set in Koyeb env vars |
| API calls return CORS error | Make sure `ALLOWED_ORIGINS` in Koyeb matches your Vercel URL exactly (no trailing slash) |
| Frontend shows blank page | Check Vercel build logs - likely `VITE_API_URL` env var missing |
| WebSocket not connecting | WebSockets work on Koyeb nano - check browser console for the WS URL |
| ML features slow | Normal - XGBoost models load on first request, then stay cached in memory |

---

## Architecture Summary

```
User Browser
    │
    ▼
Vercel CDN (React frontend)          ← free, global CDN, instant loads
    │  HTTPS API calls
    ▼
Koyeb nano instance (FastAPI)        ← free, no sleep, Python + ML
    │  PostgreSQL connection
    ▼
Neon PostgreSQL                      ← free, serverless, persistent
```

Everything works identically to your local setup.
