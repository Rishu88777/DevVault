/**
 * Static SEO step. After `vite build`, writes one HTML file per route with its own <title>,
 * description, canonical and Open Graph tags, plus sitemap.xml and a 404.html SPA fallback.
 * Works on any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
 *
 *   SITE_URL=https://example.com npm run build     # absolute canonical URLs + sitemap
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CATEGORIES } from '../src/data/categories'
import { TOOLS, toolDescription, toolFaq, toolTitle, visibleTools } from '../src/data/tools'

const dist = join(import.meta.dirname, '..', 'dist')
// SITE_URL wins; otherwise the URL the hosting platform exposes; otherwise the production default.
const guessed = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.URL ?? process.env.CF_PAGES_URL ?? '')
const site = (process.env.SITE_URL ?? (guessed || 'https://devcipher.pages.dev')).replace(/\/$/, '')
const base = (process.env.VITE_BASE ?? '/').replace(/\/$/, '')
const html = readFileSync(join(dist, 'index.html'), 'utf8').replace('</head>', site ? `    <meta property="og:image" content="${site}${base}/og.png" />\n    <meta name="twitter:image" content="${site}${base}/og.png" />\n  </head>` : '</head>')
const abs = (path: string) => `${site}${base}${path}`
const link = (path: string, text: string) => `<a href="${base}${path}">${esc(text)}</a>`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

interface Page { keywords?: string[]; faq?: { q: string; a: string }[]; path: string; title: string; description: string; h1?: string; body?: string[]; crumbs?: [string, string][]; ld?: object }
const home: Page = { keywords: ['developer tools online', 'json formatter', 'json compare', 'string to json', 'aes encryption decryption online', 'url encode decode', 'base64 encode decode', 'image to base64', 'jwt decoder', 'hash generator', 'free online developer tools'], path: '/', title: 'DevCipher — Free Online Developer Tools', description: 'Privacy-first developer tools for encoding, encryption, hashing, JSON formatting, JWT, URL utilities and more. Everything runs locally in your browser.',
  body: ['Encode. Encrypt. Decode. Transform. A fast, privacy-first toolbox for developers. Everything runs locally in your browser.', 'Use the JSON Formatter, JSON Compare, AES Encryption and Decryption, URL Encode and Decode, Base64 Encode and Decode, String to JSON converter, Hash Generator, JWT Decoder and UUID Generator — free, with no sign-up and no uploads.'],
  ld: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'DevCipher', description: 'Developer tools that run locally in your browser.', ...(site ? { url: abs('/') } : {}) } }
const pages: Page[] = [
  ...TOOLS.map((t): Page => ({
    path: t.path, title: toolTitle(t), description: toolDescription(t), h1: t.name, keywords: t.keywords,
    faq: toolFaq(t),
    body: [t.description + '.', t.howItWorks.title, ...t.howItWorks.body, 'Processed locally in your browser — your input is never uploaded.', ...toolFaq(t).flatMap((f) => [f.q, f.a])],
    crumbs: [['DevCipher', '/'], [t.category, `/category/${t.category}`], [t.name, t.path]],
    ld: { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, description: toolDescription(t), applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
  })),
  ...CATEGORIES.map((c) => ({ path: `/category/${c.id}`, title: `${c.id} Tools — DevCipher`, description: `${c.description}. Free, private and running locally in your browser.` })),
  { path: '/privacy', title: 'Privacy — DevCipher', description: 'DevCipher runs entirely in your browser. No backend, no accounts, no analytics. Learn what is and is not stored locally.' },
  { path: '/docs', title: 'Documentation — DevCipher', description: 'Keyboard shortcuts, tool conventions, security notes and how to add a tool to DevCipher.' },
]


/** Crawler-visible content inside #root. React replaces it on load (createRoot), so users never see duplicates. */
function prerender(p: Page): string {
  const h1 = p.h1 ?? 'DevCipher — Free Online Developer Tools'
  const paras = (p.body ?? [p.description]).map((t) => `<p>${esc(t)}</p>`).join('')
  const crumbs = p.crumbs ? `<nav aria-label="Breadcrumb">${p.crumbs.map(([n, u]) => link(u, n)).join(' › ')}</nav>` : ''
  const tools = `<nav aria-label="All tools"><h2>All developer tools</h2><ul>${visibleTools().map((t) => `<li>${link(t.path, t.name)} — ${esc(t.description)}</li>`).join('')}</ul></nav>`
  return `<main style="max-width:56rem;margin:0 auto;padding:2rem 1rem">${crumbs}<h1>${esc(h1)}</h1>${paras}${tools}</main>`
}

function render(p: Page): string {
  const url = site ? abs(p.path) : ''
  let out = html
    .replace(/<title>.*?<\/title>/, `<title>${esc(p.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(p.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
  const extra = [
    ...(p.keywords?.length ? [`<meta name="keywords" content="${esc(p.keywords.join(', '))}" />`] : []),
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    ...(url ? [`<link rel="canonical" href="${url}" />`, `<meta property="og:url" content="${url}" />`] : []),
  ].join('\n    ')
  const ld: object[] = []
  if (p.ld) ld.push(p.ld)
  if (p.faq) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) })
  if (p.crumbs && site) ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: p.crumbs.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(u) })) })
  const ldTags = ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n    ')
  out = out.replace('<div id="root"></div>', `<div id="root">${prerender(p)}</div>`)
  return out.replace('</head>', `    ${extra}\n    ${ldTags}\n  </head>`)
}

for (const p of pages) {
  const file = join(dist, p.path.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, render(p))
}
writeFileSync(join(dist, 'index.html'), render(home))
writeFileSync(join(dist, '404.html'), html)

if (site) {
  const urls = ['/', ...pages.map((p) => p.path)]
  const day = new Date().toISOString().slice(0, 10)
  writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${day}</lastmod><priority>${u === '/' ? '1.0' : u.startsWith('/tools/') ? '0.8' : '0.5'}</priority></url>`).join('\n')}\n</urlset>\n`)
  writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}${base}/sitemap.xml\n`)
}
console.log(`postbuild: wrote ${pages.length} static pages${site ? ' + sitemap.xml' : ' (set SITE_URL for canonical URLs and sitemap)'}`)
