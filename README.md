# LiveScoreFree - Static SEO Live Scores App

LiveScoreFree is a static web app with clean route URLs, auto-updating scoreboards, and legal-safe pages for search engine indexing.

## Main Features

- Auto-updating scoreboard every 30 seconds
- Multi-source free live API stack (ESPN + TheSportsDB fallback)
- Auto league pages with sub-routes:
  - `/league/{leagueKey}`
  - `/league/{leagueKey}/live`
  - `/league/{leagueKey}/upcoming`
  - `/league/{leagueKey}/schedule`
  - `/league/{leagueKey}/results`
  - `/league/{leagueKey}/history`
  - `/league/{leagueKey}/teams`
  - `/league/{leagueKey}/players`
- Live Now, Trending Matches, Today's Matches, Top Leagues
- Automatic match pages:
  - `/football/live/{slug}`
  - `/cricket/live/{slug}`
  - `/basketball/live/{slug}`
  - `/tennis/live/{slug}`
- Automatic final-result pages:
  - `/football/results/{slug}`
  - `/cricket/results/{slug}`
  - `/basketball/results/{slug}`
  - `/tennis/results/{slug}`
- Match detail includes:
  - live score
  - tabbed match center: Summary, Stats, Lineups, Table, H2H, Analysis, Preview, Events
  - commentary
  - detailed team/player info (position, jersey, profile details when available)
  - standings/table view (free API + local fallback snapshot)
  - H2H and team-form blocks from stored final matches
  - prediction/analysis cards from free stat feeds
  - stats bars
  - timeline animation
  - realtime source update feed (match page refresh every 15s)
- Pinned leagues + countries style side panel on Live page
- Live Match Center auto-fills all current live events
- Revenue-ready layout:
  - advertiser placeholders (homepage, league, match, history, trending pages)
  - dedicated `/advertise` page with ad options and contact
  - trust signal blocks (projected users, countries, indexed pages)
- Match favorite/save button (local storage)
- Global page sharing tools (native share, copy, WhatsApp, Telegram, X, Facebook)
- Language controls: English default + auto-detect target + Google Translate button
- Stadium-style image theme with auto-changing route-aware backgrounds
- Sport-aware auto background scenes (football/cricket/basketball/tennis and others)
- Sport image banners on sport pages, top leagues cards, and match center info blocks
- Custom background upload (image file) with Auto/Custom background mode toggle
- Header refresh countdown: `Last updated ... | Next refresh in ...`
- Results and history flow: `LIVE -> RESULTS -> HISTORY`
- Day/night auto theme by local time, with manual override
- Donation goal progress UI (`$54 / $120` baseline) with Ko-fi CTA

## Legal + Google Safety Pages

- `/privacy-policy`
- `/terms-of-service`
- `/data-sources`
- `/dmca-policy`
- `/donate`
- `/advertise`
- `/feedback`

## Files

- `index.html` - app shell
- `styles.css` - full styling + theme system
- `app.js` - router, data loading, match generation, SEO updates
- `sw.js` - service worker caching
- `manifest.json` - PWA manifest
- `robots.txt` - crawl rules
- `sitemap.xml` - sitemap
- `_redirects` - Netlify SPA rewrite
- `vercel.json` - Vercel rewrite
- `404.html` - static fallback route bridge

## Deployment

### GitHub Pages

- GitHub Pages deployment is now wired through `.github/workflows/deploy-github-pages.yml`.
- Every push to `main` deploys the site automatically.
- `.nojekyll` is included so static assets are published as-is.

One-time setup:

1. Create an empty GitHub repository.
2. Run `powershell -ExecutionPolicy Bypass -File .\scripts\connect-github.ps1 -RepoUrl https://github.com/YOUR-USER/YOUR-REPO.git`
3. Run `git push -u origin main`
4. In GitHub, enable Pages and set the source to `GitHub Actions`.

Daily publish flow:

- `powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 -Message "site update"`
- or use standard git: `git add -A && git commit -m "site update" && git push`

The first HTTPS push uses Git Credential Manager for sign-in, and later `git push` runs normally.

### Netlify

- Upload all files.
- `_redirects` is already included.

### Vercel

- Upload all files.
- `vercel.json` rewrite is already included.

### Any static host

- Upload all files as-is.
- Ensure SPA rewrite to `index.html` is enabled for clean-path routing.

## Data Sources

- ESPN Scoreboard API (primary live feed)
- ESPN Summary API (match detail for commentary, stats, lineups)
- TheSportsDB `eventsday.php` (free realtime fallback feed)
- TheSportsDB detail endpoints:
  - `lookupevent.php`
  - `lookupeventstats.php`
  - `lookuptimeline.php`
  - `lookuplineup.php`

## Notes

- Dynamic match pages are generated from live feed events.
- Direct indexing of dynamic slugs requires rewrite support (already included for Netlify/Vercel).
- No paid key is required for current realtime setup.

## Needed Things For Realtime

- Keep `app.js` refresh interval active (`REFRESH_INTERVAL_MS = 30000`).
- Host on HTTPS so service worker and cache refresh work correctly.
- Keep SPA rewrite enabled (`_redirects` or `vercel.json`) so clean match URLs resolve.
- Do not block outbound requests to:
  - `https://site.api.espn.com`
  - `https://www.thesportsdb.com`

