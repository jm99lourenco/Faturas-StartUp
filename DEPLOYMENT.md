# JLDA APP — Deployment Guide

## Prerequisites

- A [Supabase](https://supabase.com) project (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A [GitHub](https://github.com) account

---

## 1. Supabase Setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run the entire contents of `supabase_schema.sql`
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Go to **Authentication → URL Configuration** and add your production URL to **Redirect URLs**:
   ```
   https://your-domain.vercel.app/**
   ```

## 2. Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
# (already has a template — just fill in the values)

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: JLDA APP MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jlda-app.git
git push -u origin main
```

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your GitHub repo
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**
5. Your app will be live at `https://your-project.vercel.app`

## 5. Post-Deployment

- Update Supabase **Redirect URLs** with your Vercel domain
- Test the full auth flow (sign up → onboarding → dashboard)
- Verify RLS is working (users can only see their own data)

---

## Environment Variables Reference

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
