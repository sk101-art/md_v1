# MAD Club site

Static site with a visual editor at `/admin/` and a GitHub-backed CMS (Decap) at `/admin/cms/`. All text, events, team and photos live in `content/*.json` and `photos/`, and the pages are built from them in the browser.

## Two editors

**1. Testing editor at `/admin/` (login `admin` / `admin`).** Visual forms with a live preview (desktop, tablet, phone). Edits are saved as a draft in your own browser and show on the site in that browser only. The password check runs in the browser, so it is for testing, not security. To publish an edit for everyone, press **Download JSON** and replace the matching file in `content/`, then commit.

**2. Real publishing editor at `/admin/cms/` (GitHub login).** Edit and press **Publish**. Decap commits to the repo and the site redeploys in about a minute. Only GitHub users with write access to the repo can log in; add collaborators on GitHub to give access.

## One-time setup (for the GitHub editor)

1. Push this folder to a GitHub repo (branch `main`).
2. In `admin/cms/config.yml` replace `YOUR_GITHUB_USERNAME/YOUR_REPO` (three places).
3. Enable Pages: repo Settings, Pages, Source "GitHub Actions" (workflow is included).
4. Login needs an OAuth step, because GitHub Pages cannot do it alone. Pick one:
   - **Netlify (simplest).** Host the site on Netlify (drag the folder in or connect the repo), then Site settings, Access control, OAuth, Install provider: GitHub (create a GitHub OAuth app with callback `https://api.netlify.com/auth/done`). `/admin/cms/` then works with no other change.
   - **Stay on GitHub Pages.** Deploy a free OAuth proxy (for example `sterlingwes/decap-proxy` on Cloudflare Workers), then set `base_url` in `admin/cms/config.yml` to its URL.

## Edit locally without logging in

```
npx decap-server
python -m http.server 8000
```

Open `http://localhost:8000/admin/cms/`. `local_backend: true` skips login and edits the files directly.

## Looks

"Glass Atelier": a light porcelain-and-optical-glass design (Porcelain, Frost, Crystal, Graphite, Cobalt, Sea Glass). Tokens live in `assets/design/tokens.css`. A Graphite (dark) appearance is optional, switched with the moon/sun button in the nav and remembered per browser.

## Motion

- **Swarm Rebuild** (`assets/motion/swarm-director.js`): colored collaborator cursors select real page regions, lay down skeletons, then fill in the content. It runs on arrival, on page changes (old page torn down, new page built), on filters and tabs (small selection-frame morphs) and as sections scroll in. Mark any element with `data-sw="text|block|box|media"` to include it. Press **Skip** or Esc to jump to the finished page.
- **Container tracing** (`assets/motion/container-tracer.js`): glass containers draw their real rounded perimeter before the surface resolves.
- **Phone build** (`assets/experiences/phone-builder.js`): the stage starts empty. Press **Build the phone** and particles leave the headline, buttons and nav, form the chassis and the home-screen outlines, and the body materializes.
- **MAD OS** (`assets/experiences/mad-os.js`): the built phone boots to a lock screen and home screen; the club logo flies in from the nav, becomes the MAD app icon and opens itself. Apps: MAD (events feed + detail), Gallery, Team, About, Join, Settings (switches the site's appearance). Swipe up on the home bar to go home, swipe from the left edge to go back. **Full screen** turns the visitor's own screen into the phone.
- `prefers-reduced-motion` (or `?still` in the URL) turns all of it off and shows finished pages.
- Press **I** for Inspect mode (size, type, colour and padding of anything you hover). Hold **Shift** to watch any animation at 0.18x. Scrolling or clicking during a build speeds it up.
- Ctrl+Shift+D opens a developer HUD (fps, build state, swarm timing).

## Code layout

No build step; plain ES modules served as static files.

```
assets/design/       tokens, base, components, pages, motion CSS
assets/core/         app entry, router, lifecycle, content loader, shell, segmented controls
assets/motion/       swarm director, agents, geometry, container tracer, transitions
assets/graphics/     particle field, geometry sampling
assets/experiences/  phone builder, living phone
assets/pages/        one module per page (render + wire)
```

## Interactions

Ctrl+K (or Search in the nav) opens a command menu for pages and events. Press `/` on the Events page to jump to search.

## Other

- Contact form: set "Form endpoint" in the admin to a Formspree URL. Success is shown only after the endpoint confirms. With no endpoint, the form opens the visitor's email app instead.
- Open the site through a web server, not by double-clicking `index.html`, so the browser can read `content/`.
