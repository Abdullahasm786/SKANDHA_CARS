# Skandha Cars

Pre-owned car marketplace, admin dashboard and installable PWA.
Next.js 16 (App Router) · TypeScript strict · Tailwind 4 · MongoDB Atlas · Cloudinary · Framer Motion.

Nothing in the app is pre-filled with business facts: no numbers, prices or reviews.
Everything unverified is configured by the owner in `/admin` and clearly marked as missing until entered.

## 1. Local setup

```bash
npm install
cp .env.example .env.local        # fill in the three NEXT_PUBLIC_* values
npm run dev                        # http://localhost:3000
```

Without MongoDB variables the public site still runs and shows honest empty states; `/admin` redirects to login.

## 2. MongoDB Atlas, Cloudinary and admin login

1. **MongoDB Atlas:** create a cluster, a database user, and allow your IP (and Vercel: `0.0.0.0/0` or Vercel's integration).
   Put the connection string in `MONGODB_URI` — **URL-encode special characters in the password** (e.g. `/` → `%2F`, `@` → `%40`).
   Indexes are created automatically on first connection. Collections: `vehicles` (images embedded), `site_settings`,
   `vehicle_status_history`, `vehicle_slug_redirects`, `admins`.
2. **Cloudinary:** copy cloud name, API key and secret into `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. **AUTH_SECRET:** `openssl rand -hex 32`.
4. **First admin** (local, once; password typed at a prompt):
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs owner@example.com
   ```
5. Sign in at `/admin/login`, open **Settings** (logo, WhatsApp number, SEO text), then **Add car**.

There is no sign-up UI; only documents in `admins` can sign in. Sessions are signed JWT cookies (httpOnly, 7 days) and every
admin page and server action re-checks that the admin record still exists.

## 3. How it works

| Area | Where |
| --- | --- |
| Public pages | `src/app` (`/`, `/cars`, `/cars/[slug]`, about/faq/privacy/terms) |
| Admin | `src/app/admin` — gated by `src/proxy.ts` **and** `requireAdmin()` in every page / `getAdminOrNull()` in every server action |
| Data access | `src/lib/db` (Mongo), `src/lib/vehicles/queries.ts` (public reads). Public visibility rules (published only) live in these queries — there is no database-level RLS in MongoDB |
| Sold workflow | `StatusControls` (confirm dialog) → `changeStatus` → one Mongo **transaction** updating the vehicle and writing `vehicle_status_history` (previous, new, actor, time, reason); caches revalidated |
| Images | server-side decode with `sharp` (type from content, not MIME/filename), EXIF stripped, 1800px WebP → Cloudinary; thumbnails are Cloudinary transformations |
| Logo | PNG/JPEG/WebP/SVG→PNG (SVG is rasterised, never served). Header, icons, favicon, apple icon and 1200×630 OG derived with `fit: contain` — never stretched |
| WhatsApp | `src/lib/whatsapp.ts` |
| PWA | `manifest.ts`, `public/sw.js`, `PwaProvider` |
| SEO | Metadata API, canonical, JSON-LD, `sitemap.ts`, `robots.ts` |

### Decisions you may want to revisit
- **Sold vehicles** stay reachable (marked SOLD, `noindex`) and are excluded from the sitemap. Reserved cars are indexable but not in the sitemap. Drafts/archived return 404.
- **Slug changes** write a row to `vehicle_slug_redirects`; old URLs 308-redirect.
- `site_settings` only holds public contact info and page text. Never store secrets there.
- Cloudinary images are public by URL (random UUID paths); uploads/deletes happen only server-side after the admin check.
- Upload progress is per file (queued → uploading → done/failed with retry), not byte-level, because uploads go through server actions.
- Admin "Preview" of unpublished cars is not implemented; publish as draft→published or view on the edit page.

## 4. Scripts

```bash
npm run lint | npm run typecheck | npm test          # unit tests (vitest)
npm run test:e2e                                       # builds, serves on :3100, runs Playwright
npm run build && npm start
```

## 5. Deploy to Vercel

1. Push to Git; import in Vercel (framework: Next.js).
2. Environment variables: everything in `.env.example` (`NEXT_PUBLIC_SITE_URL` = your final https URL).
3. Add the custom domain in Vercel → Domains; set DNS as instructed; confirm HTTPS (padlock, `curl -I https://domain` shows HSTS).
4. In Atlas → Network Access, allow Vercel to connect.
5. Verify: `/manifest.webmanifest`, `/sitemap.xml`, `/robots.txt`, `/admin/login`.

**PWA checks:** Chrome DevTools → Application → Manifest (installable, icons) and Service Workers; Lighthouse PWA/installability. Android Chrome and desktop Chrome/Edge show an *Install app* button. **iOS:** Safari → Share → *Add to Home Screen* (no install prompt API on iOS). Push notifications are **not** implemented.
Offline: public pages previously visited are served from cache with an offline banner warning that data may be stale; `/admin`, `/api` and non-GET requests are never cached.

**Search Console:** add the domain property, verify via DNS, submit `https://domain/sitemap.xml`, inspect a car URL, check the Rich Results test for the `Car` and `FAQPage` markup.
**Analytics:** none is bundled. If you add one, prefer a cookieless/privacy-first tool (Plausible, Vercel Web Analytics) and update `/privacy`.
**Backups:** enable Atlas backups (or schedule `mongodump`); Cloudinary assets need a separate export. Test a restore before relying on it.

## 6. Security notes
- Authorisation is enforced in server code (no RLS in MongoDB): public queries filter to published/public data, and every mutation checks the admin session. Never expose `MONGODB_URI` with a `NEXT_PUBLIC_` prefix. Use an Atlas user with access to this database only.
- Login is rate-limited in memory per instance (`src/lib/security/rate-limit.ts`). On serverless, add Vercel Firewall rate limiting or Upstash for a shared limit.
- Security headers in `next.config.ts` (no CSP yet — add one once any third-party scripts are decided).
- No customer data is collected; WhatsApp links open the user's own WhatsApp. If you add enquiry forms later, restrict access and document retention.
- Run `npm audit` regularly.

## 7. Owner checklist
Logo · WhatsApp number · About/Privacy/Terms text (legal review recommended) · default SEO description · vehicles with real photos.
