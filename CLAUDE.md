# CLAUDE.md — lucaszhoupw.github.io

Bilingual (EN/中文) personal academic site for Peiwen (Lucas) Zhou, served by
**GitHub Pages from `main`**. Pure static HTML/CSS/JS — **no build step, no
frameworks, no CDNs** (the sandbox network policy blocks jsDelivr/aliyun etc.;
`raw.githubusercontent.com` and `api.github.com` are reachable).

## Git workflow

- Develop on `claude/funny-dirac-bYso2`, commit there, then merge into `main`
  with `git merge --no-ff` and push both. Pages only deploys from `main`.
- The user also commits directly to `main` from the website UI (encrypted
  journal entries, photo uploads) — **always `git pull origin main` before
  merging**, and expect binary conflicts on `private/*.enc` (resolve by taking
  the newer side, usually main's).
- If a push "didn't show up" on the live site: check the latest
  **"pages build and deployment"** workflow run. Pages builds occasionally get
  `cancelled`; retrigger with an empty commit to `main`.

## Files

| File | What it is |
|---|---|
| `index.html` | Homepage (about, publications, skills, links, modals: schedule/travels/chinese/gaokao/duolingo/CV) |
| `gallery.html` | Photo feed by year; `cities.html` province/city maps; `404.html`, `sitemap.xml`, `robots.txt` |
| `site.js` | Shared JS: language toggle, modals, lightbox, schedule loader, secret entrances |
| `styles.css` | All shared styles; 3 themes via `[data-theme]` (green/red/blue) |
| `private.html` | **Hidden trading journal** (ES/NQ futures) — see below |
| `attic.html` | **Hidden schedule manager** — edits `schedule.json` (public) + `private/attic.enc` (private items) |
| `schedule.json` | Public schedule; homepage modal fetches it (auto-expires: ≤1 day past = normal, 2–6 = greyed, ≥7 = hidden) |
| `private/*.enc` | AES ciphertext only (journal.enc, attic.enc, img/*.enc). Repo is public — this is by design |
| `assets/maps/` | Generated SVGs: world/china/usa + `cities/<adcode>.svg` per province |
| `fonts/` | Self-hosted Noto Serif SC (common GB2312 subset 400/700 + full variable fallback); Latin = Georgia |

## Core conventions

- **Bilingual model**: every translatable element carries `data-en` / `data-zh`;
  `applyLang()` swaps `textContent` (or `innerHTML` when `data-html` present).
  Language is **never persisted** — every load starts in English (no flash).
- **Cache busting**: `styles.css?v=N` / `site.js?v=N` (currently **v=18**),
  map SVGs have their own `?v=`. Bump when editing those files, across ALL
  HTML pages consistently.
- **Themes**: homepage picks a random theme per session (sessionStorage
  `plz-theme`); private/attic persist a chosen theme in localStorage `plz_theme`.
- **Images**: before committing photos, resize to width 1100px, JPEG q82, and
  **strip EXIF (user photos often contain GPS — privacy!)**. Re-save via PIL
  without exif achieves this.
- **Pinyin/romanization**: NEVER trust pypinyin blindly — heteronyms bite
  (长治 Changzhi not "Zhangzhi", 朝阳 Chaoyang). Manually verify every new
  city/place name.
- **Maps**: province city maps are generated from
  `https://raw.githubusercontent.com/lyhmyd1211/GeoMapData_CN/master/province/<adcode>.json`
  (DataV-derived, China-compliant boundaries incl. Taiwan/South Tibet/SCS on
  the national map). Projection: equirectangular scaled by cos(mid-latitude),
  width 820, coordinate thinning tol≈0.6, classes
  `rg` / `rg--lived` / `rg--travel` / `rg--pass`. Regenerate the whole SVG to
  change a city's class (paths are anonymous); keep the same viewBox.

## Secret pages & crypto (do not weaken)

- Entrances: typing `ledger` anywhere → `private.html`; `attic` → `attic.html`
  (`initSecretEntrance()` in site.js, `DOORS` map).
- Crypto: PBKDF2-SHA256 **120k iterations** → AES-256-GCM. Blob layout
  `salt(16) | iv(12) | ciphertext`. One session salt per store, derived key
  cached per salt. **Passwords are never stored anywhere**; journal and attic
  use *different* passwords. First login with no .enc file sets the password.
- Writes go through the GitHub Contents API with a fine-grained PAT
  (Contents: Read/write, this repo only) kept in localStorage `plz_gh_pat`.
  Reads use raw.githubusercontent.com (no token). Commits retry on 409/422
  with sha re-fetch (`commitJournal` / `putRetry`).
- The user's trading data/password must never appear in code, commits, or
  chat. Never re-add raw uploads with GPS EXIF. Commit messages for journal
  data are generic on purpose.

## Trading journal domain rules (private.html)

- Instruments ES/NQ/MES/MNQ; $/point 50/20/5/2; commission per contract
  ES/NQ $3.50, MES/MNQ $1.00; tick = 0.25pt (validity: 4×(pnl+comm)/pointValue
  must be integer).
- points = (pnl + comm) / pointValue / size (per contract). R = pnl / risk.
- Numbers are **stored as plain numbers**, formatted (`$`, signs, 2dp) only on
  display (`money()`, `attachMoney` live-format inputs).
- Accounts: objects `{name,size,initialBalance,maxDrawdown,drawdownMode
  (Intraday|EOD),stage(Evaluation|Funded),status(ongoing|breached|passed)}`,
  plus `config.defaultAccount`. breached/passed accounts are hidden from entry
  forms but stay visible in dashboard/export. Renaming prompts to migrate
  history (name-keyed!).
- Day entries: date, dayType (configurable vocab), tradeCount 0–10 (0 = flat
  day), account, balance, violation (0/1), trades[], plan/analysis (text+
  encrypted images), psych (text). Trades may have `exits[]` (分批离场
  scale-out, totals auto-summed) and `subs[]` (copy-trades to other accounts,
  size = main×multiplier).
- Trailing drawdown: limit line ratchets up only. Intraday = per new equity
  high; EOD = at day close (a recorded day is already closed). The chart also
  has a per-trade high-water-mark variant (`chartLimit`), toggleable.
- Ledger (账本): income/expense cash flow, USD only; category 税收 (tax) is
  recorded but excluded from income/net, included in payout.
- Export tab produces self-describing Markdown (field dictionary first) meant
  to be fed to an AI; per-account or all-accounts.

## Validation before committing

```bash
node -c site.js
# inline scripts of every page:
for f in *.html; do node -e "const h=require('fs').readFileSync('$f','utf8');(h.match(/<script>([\s\S]*?)<\/script>/g)||[]).forEach((b,i)=>{try{new Function(b.replace(/^<script>/,'').replace(/<\/script>$/,''))}catch(e){console.log('$f',i,e.message);process.exit(1)}});console.log('$f OK')"; done
node -e "JSON.parse(require('fs').readFileSync('schedule.json','utf8'))"
python3 -c "import xml.dom.minidom as m,glob; [m.parse(f) for f in glob.glob('assets/maps/**/*.svg',recursive=True)]"
```

## Known deliberate quirks

- `404.html` uses absolute paths (`/styles.css`) — correct for a 404 page.
- Homepage schedule keeps a static fallback list in HTML in case the
  `schedule.json` fetch fails.
- Known open items (user aware, chose to defer): `private.html` uses UTC dates
  for "today" defaults (off-by-one before 8am Beijing); user-entered names are
  not HTML-escaped everywhere; decrypted screenshots re-fetched per render
  (no cache); no full-JSON backup/import.
