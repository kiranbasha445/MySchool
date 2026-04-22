# MySchool — Deployment Runbook

This document explains what we built, why each decision was made, and how to
redeploy if something breaks.

---

## Architecture

```
User's Browser
      │
      ▼
  Vercel  (Frontend — React/Vite)
  https://your-app.vercel.app
      │  HTTP requests to /api/...
      ▼
  Render  (Backend — ASP.NET Core 8)
  https://myschool-api-v4sb.onrender.com
      │  SQL queries
      ▼
  Neon  (Database — PostgreSQL)
  ap-southeast-1.aws.neon.tech
```

Three separate services, each doing one job:
- **Vercel** serves the React app as static files (HTML/CSS/JS). No server needed.
- **Render** runs the .NET API server 24/7 inside a Docker container.
- **Neon** stores all data permanently (users, students, marks, attendance, etc).

---

## Why These Services (all free, no credit card)

| Service | Why we chose it |
|---|---|
| Vercel | Best free static hosting, auto-deploys on every GitHub push |
| Render | Free Docker hosting, no credit card unlike Fly.io and Koyeb |
| Neon | Free serverless PostgreSQL, always accessible, Singapore region |
| UptimeRobot | Free pinger — keeps Render awake by hitting /health every 5 min |

> **Important:** Render's free tier sleeps after 15 minutes of no traffic.
> UptimeRobot pings `/health` every 5 minutes so it never sleeps.
> See the "Keep Alive" section below to set this up.

---

## Why We Switched from SQL Server to PostgreSQL

The original app used SQL Server (Microsoft). SQL Server is heavy — it needs
a Windows-like environment and costs money to host. PostgreSQL is:
- Open source and free
- Supported by every free hosting provider
- Fully compatible with EF Core (just swap one NuGet package)

**What changed in code:**
- Removed `Microsoft.EntityFrameworkCore.SqlServer`
- Added `Npgsql.EntityFrameworkCore.PostgreSQL`
- Changed `UseSqlServer(...)` → `UseNpgsql(...)` in `Program.cs`
- Deleted old migrations, ran `dotnet ef migrations add InitialCreate` to
  regenerate them for PostgreSQL

---

## How Deployment Works

### Backend (Render)

Render watches your GitHub `main` branch. When you push code it:
1. Pulls the latest code
2. Builds the Docker image using `Dockerfile` at the repo root
3. Runs the container on port `10000`
4. Your API is live at `https://myschool-api-v4sb.onrender.com`

The `Dockerfile` is a two-stage build:
- **Stage 1 (build):** Uses the .NET SDK image to compile and publish the app
- **Stage 2 (runtime):** Uses the smaller .NET runtime image to run it

Two stages means the final Docker image is much smaller — it doesn't include
the compiler, just the compiled app.

### Frontend (Vercel)

Vercel watches your GitHub `main` branch. When you push code it:
1. Pulls the latest code from the `myschool-frontend` folder
2. Runs `npm run build` (Vite compiles React → static HTML/CSS/JS)
3. Serves those files globally via CDN

The environment variable `VITE_API_URL` tells the frontend where the backend
lives. Vite bakes this URL into the compiled JS at build time.

### Database (Neon)

Neon is always running — you don't deploy it, you just connect to it.
The connection string is passed to Render as a secret environment variable.

When the API starts up, `Program.cs` runs `db.Database.Migrate()` which
automatically creates all tables if they don't exist yet.

---

## Environment Variables

Secrets are never committed to GitHub. They live only in Render's dashboard.

| Variable | What it does |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string for Neon |
| `Jwt__Key` | Secret key used to sign JWT login tokens |
| `Bootstrap__PrincipalEmail` | Email for the auto-created Principal account |
| `Bootstrap__PrincipalPassword` | Password for the Principal account |
| `Bootstrap__PrincipalName` | Display name for the Principal account |

The `__` double underscore maps to nested JSON. For example
`Jwt__Key` maps to `{ "Jwt": { "Key": "..." } }` in appsettings.

To change a secret: go to Render dashboard → your service → Environment → edit.

---

## Keep Alive (UptimeRobot Setup)

Render's free tier sleeps after 15 minutes of no traffic. Fix this with UptimeRobot:

1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up free
2. Click **"Add New Monitor"**
3. Set:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `MySchool API`
   - URL: `https://myschool-api-v4sb.onrender.com/health`
   - Monitoring Interval: `5 minutes`
4. Click **"Create Monitor"**

UptimeRobot will now ping `/health` every 5 minutes. Render resets its sleep
timer on every request, so the service stays awake permanently.

---

## Live URLs

| | URL |
|---|---|
| **Frontend** | https://your-app.vercel.app |
| **API Base** | https://myschool-api-v4sb.onrender.com/api |
| **API Docs** | https://myschool-api-v4sb.onrender.com/swagger |
| **Health Check** | https://myschool-api-v4sb.onrender.com/health |

---

## How to Redeploy

**Code change → both services update automatically:**
```bash
git add -A
git commit -m "your message"
git push
```
Vercel and Render both listen to GitHub and auto-deploy on every push to `main`.

**Force redeploy without code change:**
- Render: Dashboard → your service → "Manual Deploy" → "Deploy latest commit"
- Vercel: Dashboard → your project → "Deployments" → "Redeploy"

**Change a secret:**
- Render: Dashboard → your service → Environment → edit value → service restarts automatically

---

## How to Check Logs (when something breaks)

- **Render logs:** Dashboard → your service → "Logs" tab — shows .NET startup
  errors, database errors, HTTP request logs
- **Vercel logs:** Dashboard → your project → "Functions" tab
- **Neon:** Dashboard → your project → "Monitoring" tab — shows query activity

---

## Local Development (your laptop)

The local setup still uses SQL Server via Docker or a local install.
Copy `MySchool.Api/appsettings.example.json` to `appsettings.json` and fill
in your local values.

Frontend proxy is configured in `vite.config.ts` — it forwards `/api` calls
to `http://localhost:5183` so you don't need `VITE_API_URL` locally.
