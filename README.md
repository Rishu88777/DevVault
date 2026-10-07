# DevCipher

**Encode. Encrypt. Decode. Transform.** — a privacy-first developer toolbox that runs entirely in your browser.

There is no backend, database or API. Inputs (JWTs, keys, passwords, JSON …) are processed locally with the Web Crypto API and native browser features. Production builds ship a Content Security Policy with `connect-src 'none'`, fonts are bundled, and there are no analytics.

## Tools (42, plus keyword landing pages)

| Category | Tools |
| --- | --- |
| Encoding | Image ⇄ Base64, URL, Base64 (side-by-side Encode / Decode), Base64URL, Hex, Binary, Unicode, HTML-entity encoders & decoders |
| Encryption | AES-128/192/256 (GCM, CBC, CTR), RSA & PEM (keygen, OAEP encrypt/decrypt, PSS & PKCS#1 v1.5 sign/verify) |
| Hashing | MD5, SHA-1/224/256/384/512, SHA3, SHAKE128/256, BLAKE2b/2s, HMAC |
| JSON | Formatter/validator, side-by-side comparator, String ⇄ JSON, tree viewer, JSON → TypeScript/JavaScript/Python/Go/Java/C# |
| Web | JWT decoder + verifier, JWT generator (HS/RS/ES), URL parser, query-string parser |
| Generators | UUID v4/v7, password, random string |
| Utilities | Timestamp, number base, colour, regex tester, CSV ⇄ JSON, YAML, XML, SQL |

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest — encodings, hashing, AES/RSA/JWT round trips, JSON, diff, generators …
npm run typecheck
npm run build      # tsc + vite build + per-route static SEO pages
npm run preview
```

Stack: React 19, TypeScript (strict), Vite, Tailwind CSS 3, shadcn-style primitives (cva + tailwind-merge), Lucide, Motion, React Router.

## Architecture

```
src/
  components/{layout,tool,common,ui}   app shell, tool frame (ToolInput/Settings/Actions/Output), shared bits
  data/{categories,tools}.ts           THE registry — drives sidebar, home, search, favourites, SEO, sitemap
  hooks/                               theme, prefs (favourites/recent/sidebar), shortcuts, SEO, JSON worker
  lib/{encoding,crypto,formatting,comparison,codegen,storage}   pure, tested logic (no React)
  tools/<name>/                        one lazy-loaded UI module per tool family
  pages/                               Home, ToolPage, CategoryPage, Privacy, Docs, NotFound
  workers/json.worker.ts               formats / compares large JSON off the main thread (> 150 kB)
scripts/postbuild.ts                   writes dist/tools/<id>/index.html with unique title/description/canonical/OG
```

**Adding a tool:** build the UI in `src/tools/…` with the `Tool*` parts, put logic in `src/lib` with a test, then add one `def({…})` entry in `src/data/tools.ts`. Adding a JSON → code language is one file in `src/lib/codegen`.

## Security notes

- AES uses Web Crypto only. Keys must be exactly 16/24/32 bytes (UTF-8, hex or Base64) and are used as-is. GCM nonce = 12 random bytes from `crypto.getRandomValues()`, tag = 16 bytes appended to the ciphertext. Output layout: `IV ‖ ciphertext(‖ tag)`.
- **ECB is intentionally not implemented** (Web Crypto doesn't provide it and it is insecure); unsupported algorithm/size combinations fail with an explicit error — nothing is silently substituted.
- MD5, SHA-3, SHAKE, SHA-224 and BLAKE2 aren't in Web Crypto, so the audited `@noble/hashes` library is used (labelled in the UI).
- Only theme, sidebar state, favourite IDs and recent tool IDs are stored in `localStorage`. Tool inputs are never persisted.
- No `Math.random()` anywhere security-relevant; passwords/strings use rejection sampling.

## Deploy (static)

`npm run build` → publish `dist/`. Set `SITE_URL=https://your.domain` at build time to emit canonical URLs, Open Graph image, JSON-LD breadcrumbs, `sitemap.xml` and `robots.txt` (each route is also pre-rendered with crawler-visible text and internal links); set `VITE_BASE=/repo/` for sub-path hosting (GitHub project pages). `netlify.toml`, `vercel.json` and a `404.html` SPA fallback are included; Cloudflare Pages needs no config.

## SEO

- Every route is pre-rendered with its own title, description, keywords, canonical URL, Open Graph tags, `WebApplication` + `BreadcrumbList` + `FAQPage` JSON-LD, crawler-visible text and internal links.
- Keyword landing pages (hidden from menus, included in the sitemap): `string-to-json`, `json-validator`, `json-beautifier`, `json-minifier`, `json-diff`, `aes-decryption`, `unix-timestamp-converter`.
- `SITE_URL` (or the platform's own URL on Vercel / Netlify / Cloudflare Pages) is used for canonical URLs and `sitemap.xml`. After deploying, add the site to Google Search Console and submit `/sitemap.xml`.
