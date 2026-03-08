# 🌼 Daisy — Your AI Memory Weaver
> A personal AI companion that remembers you, grows with you, and maps your inner world as a living constellation.

---

## 📋 Table of Contents
1. [What is Daisy?](#what-is-daisy)
2. [Complete Setup Guide](#complete-setup-guide)
3. [Going Live](#going-live)
4. [Custom Domain](#custom-domain)
5. [Cost Breakdown](#cost-breakdown)
6. [How to Earn Money from Daisy](#how-to-earn-money)
7. [Troubleshooting](#troubleshooting)

---

## What is Daisy?

Daisy is a web app where users sign up, chat with an AI that **remembers them across every visit**, and watch their conversations turn into a **personal star constellation** — each star a memory, colored by emotion. Users can also request personal letters written by Daisy based on everything she knows about them.

**Tech stack (all free):**
- **Frontend:** React + Vite (the actual website)
- **Hosting:** Vercel (puts it live on the internet, free)
- **Database + Login:** Supabase (stores users and memories, free)
- **AI:** Anthropic Claude Haiku (the brain, ~₹0.02/conversation)

---

## Complete Setup Guide

> Total time: ~25 minutes. No coding experience needed for deployment.

---

### STEP 1 — Get the code on GitHub

1. Go to [github.com](https://github.com) and create a free account if you don't have one
2. Click the **+** icon (top right) → **New repository**
3. Name it `daisy` → make it **Public** → click **Create repository**
4. On your computer, unzip the `daisy.zip` file you downloaded
5. Open a terminal (Mac: search "Terminal" | Windows: search "Command Prompt")
6. Type these commands one by one:

```bash
cd path/to/unzipped/daisy/folder
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/daisy.git
git push -u origin main
```

> Replace YOUR_USERNAME with your actual GitHub username

Code is now on GitHub!

---

### STEP 2 — Set up Supabase (Database + Login)

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign up free
2. Click **New Project**
   - Name: `daisy`
   - Database Password: create a strong password and save it
   - Region: Singapore (closest to India with good coverage)
   - Click **Create new project** → wait ~2 minutes
3. Go to **Settings** (gear icon) → **API** → copy and save:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)
4. Go to **SQL Editor** (left sidebar) → **New query** → paste this and click **Run**:

```sql
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text default 'Wanderer',
  created_at timestamptz default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  emotion text default 'neutral',
  theme text default 'general',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table memories enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view own memories" on memories for select using (auth.uid() = user_id);
create policy "Users can insert own memories" on memories for insert with check (auth.uid() = user_id);
-- Conversation logs table
create table if not exists conversation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  messages jsonb not null default '[]',
  summary text,
  message_count int default 0,
  created_at timestamptz default now()
);

alter table conversation_logs enable row level security;

create policy "Users can view own logs"
  on conversation_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs"
  on conversation_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs"
  on conversation_logs for delete using (auth.uid() = user_id);

create policy "Users can delete own memories" on memories for delete using (auth.uid() = user_id);
```

5. You should see **"Success. No rows returned"** — worked!
6. Go to **Authentication** → **Settings** → turn OFF **Enable email confirmations** (for easier testing)

Database is ready!

---

### STEP 3 — Get Anthropic API Key (the AI brain)

1. Go to [console.anthropic.com](https://console.anthropic.com) → sign up free
2. Go to **API Keys** → **Create Key** → name it `daisy`
3. **Copy the key immediately** — starts with `sk-ant-...` — you won't see it again!
4. Go to **Billing** → add a credit/debit card → add ₹500 credit
   - This lasts months of personal use (Haiku model is extremely cheap)

API key is ready!

---

### STEP 4 — Deploy on Vercel (make it live!)

1. Go to [vercel.com](https://vercel.com) → **Sign Up with GitHub**
2. Click **Add New** → **Project** → find your `daisy` repo → **Import**
3. Before deploying, scroll to **Environment Variables** and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

4. Click **Deploy** → wait ~2 minutes

Your site is LIVE at `https://daisy-xyz.vercel.app`!

---

### STEP 5 — Connect Supabase to your live URL (critical!)

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://daisy-xyz.vercel.app`)
3. Under **Redirect URLs** add: `https://daisy-xyz.vercel.app/**`
4. Click **Save**

Login will now work on your live site!

---

## Going Live

Share your `https://daisy-xyz.vercel.app` link with anyone. It's fully live!

To see signups: Supabase → Authentication → Users
To see memories stored: Supabase → Table Editor → memories

---

## Custom Domain

Want `meetdaisy.in` instead of a Vercel URL?

1. Buy from [Porkbun](https://porkbun.com) — cheapest (₹300–800/year)
   - Good names: `meetdaisy.in`, `daisyai.fun`, `trydaisy.xyz`, `talkwith.live`
2. Vercel → your project → **Settings** → **Domains** → add your domain
3. Vercel shows DNS records → add them in Porkbun DNS settings
4. Wait 10–30 min → live on custom domain!
5. Update Supabase Site URL and Redirect URL to the new domain too.

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Vercel hosting | ₹0 (free forever) |
| Supabase DB + Auth | ₹0 (free tier: 50,000 users) |
| Anthropic Claude Haiku | ₹30–80/month (personal use) |
| Custom domain (optional) | ₹300–800/year |
| **Total running cost** | **₹30–80/month** |

₹500 Anthropic credit lasts 3–6 months of normal use.

---

## How to Earn Money

Yes, you can absolutely earn from Daisy. Here are 5 real paths:

---

### Path 1: Freemium Subscription (Most Realistic)

Give free users a limit and charge for more.

**Free tier:** 30 messages/month, no letters
**Daisy Pro — ₹99/month:** Unlimited messages + letters

Set up payments with [Razorpay](https://razorpay.com) — India's best payment gateway, free to join, 2% per transaction.

100 paying users = ₹9,900/month passively.

---

### Path 2: Lifetime Deal Launch

List on [AppSumo](https://appsumo.com) or [ProductHunt](https://producthunt.com):
- ₹999 one-time lifetime access
- AppSumo takes 30–40% cut but sends thousands of users
- 50 sales = ₹30,000+ upfront

Fastest path to first money.

---

### Path 3: Gift Subscriptions

Market Daisy as a meaningful gift — "An AI that remembers your loved one forever."
- Valentine's Day, birthdays, mental wellness gifts
- Sell 1-year gift subscriptions at ₹499
- Promote with Instagram Reels showing the constellation growing

---

### Path 4: Sell to Therapists and Coaches

Therapists can use Daisy as a between-session journaling tool for their patients.
- Charge ₹2,000–5,000/month per clinic
- 5 clinics = ₹10,000–25,000/month
- Reach mental health professionals on LinkedIn

---

### Path 5: Sponsored Wellness Partnerships

Once you have 500+ users, meditation apps, therapy platforms, and wellness brands will pay ₹5,000–15,000 per sponsored mention or integration.

---

### How to Get Your First 100 Users Free

- Post a screen recording of the constellation on Instagram Reels / YouTube Shorts — it's visually stunning
- Share on Reddit: r/selfimprovement, r/mentalhealth, r/india
- Post "built this in a weekend" on LinkedIn — developers love this
- Share in college WhatsApp groups
- Post on Twitter/X showing the star map growing in real time

---

## Troubleshooting

**"Cannot read properties of undefined"**
→ Environment variables missing. Check Vercel → Settings → Environment Variables.

**Login not working on live site**
→ Update Supabase Site URL and Redirect URL to your Vercel domain (Step 5).

**AI not responding**
→ Check Anthropic API key is correct and you have billing credit at console.anthropic.com.

**Changes not showing after editing code**
→ Push to GitHub: `git add . && git commit -m "update" && git push` — Vercel auto-deploys.

**Database errors**
→ Go to Supabase → SQL Editor and re-run the SQL from Step 2.

---

*Built with React, Supabase, Anthropic Claude, and Vercel.*
*Daisy 🌼 — Your inner world, woven into light.*
