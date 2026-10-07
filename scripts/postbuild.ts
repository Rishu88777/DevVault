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
import { TOOLS, toolDescription, toolTitle } from '../src/data/tools'

const dist = join(import.meta.dirname, '..', 'dist')
const site = (process.env.SITE_URL ?? '').replace(/\/$/, '')
const base = (process.env.VITE_BASE ?? '/').replace(/\/$/, '')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

interface Page { path: string; title: string; description: string }
const pages: Page[] = [
  ...TOOLS.map((t) => ({ path: t.path, title: toolTitle(t), description: toolDescription(t) })),
  ...CATEGORIES.map((c) => ({ path: `/category/${c.id}`, title: `${c.id} Tools — DevCipher`, description: `${c.description}. Free, private and running locally in your browser.` })),
  { path: '/privacy', title: 'Privacy — DevCipher', description: 'DevCipher runs entirely in your browser. No backend, no accounts, no analytics. Learn what is and is not stored locally.' },
  { path: '/docs', title: 'Documentation — DevCipher', description: 'Keyboard shortcuts, tool conventions, security notes and how to add a tool to DevCipher.' },
]

function render(p: Page): string {
  const url = site ? `${site}${base}${p.path}` : ''
  let out = html
    .replace(/<title>.*?<\/title>/, `<title>${esc(p.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(p.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
  const extra = [
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    ...(url ? [`<link rel="canonical" href="${url}" />`, `<meta property="og:url" content="${url}" />`] : []),
  ].join('\n    ')
  return out.replace('</head>', `    ${extra}\n  </head>`)
}

for (const p of pages) {
  const file = join(dist, p.path.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, render(p))
}
writeFileSync(join(dist, '404.html'), html)

if (site) {
  const urls = ['/', ...pages.map((p) => p.path)]
  writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site}${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`)
  writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}${base}/sitemap.xml\n`)
}
console.log(`postbuild: wrote ${pages.length} static pages${site ? ' + sitemap.xml' : ' (set SITE_URL for canonical URLs and sitemap)'}`)
