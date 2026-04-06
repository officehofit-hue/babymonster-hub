# BABYMONSTER Hub — Daily Updates Fan Site

A fan-made website that automatically aggregates the latest news and updates about **BABYMONSTER** from multiple platforms including YouTube, Instagram, X/Twitter, TikTok, Weverse, and news articles.

## Features

- **Daily Auto-Updates** — GitHub Actions fetches the latest news every day at 09:00 Israel time
- **Multi-Source Aggregation** — YouTube videos, Google News articles, and more
- **Member Profiles** — Individual profiles for all 7 members
- **Source Badges** — Every update shows where the content came from
- **News Filters** — Filter by platform (YouTube, Instagram, X, TikTok, etc.)
- **Gallery** — Filterable media gallery by member
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Clean Design** — White background with black and red accents

## Deployment to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it: `babymonster-hub` (or any name you like)
3. Make it **Public**
4. Click **Create repository**

### Step 2: Push This Code

```bash
cd babymonster-site
git init
git add .
git commit -m "Initial commit — BABYMONSTER Hub"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/babymonster-hub.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/babymonster-hub/`

### Step 4: Enable GitHub Actions

1. Go to your repo → **Actions** tab
2. You should see the "Daily BABYMONSTER News Update" workflow
3. Click **Enable** if prompted
4. You can also click **Run workflow** to trigger it manually

## How the Auto-Update Works

1. Every day at 06:00 UTC, GitHub Actions runs `scripts/fetch_news.py`
2. The script fetches content from YouTube RSS and Google News RSS
3. Results are saved to `data/news.json`
4. Changes are auto-committed and pushed
5. GitHub Pages rebuilds the site with fresh content

## Project Structure

```
babymonster-site/
├── index.html              # Main page
├── css/style.css           # Stylesheet
├── js/script.js            # Frontend logic
├── data/news.json          # News data (auto-updated daily)
├── scripts/fetch_news.py   # News fetcher script
├── .github/workflows/
│   └── daily-update.yml    # GitHub Actions workflow
└── README.md               # This file
```

## Disclaimer

This is a fan-made website and is **not affiliated** with YG Entertainment or BABYMONSTER. All content belongs to their respective owners.
