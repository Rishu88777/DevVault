export interface ParsedUrl {
  href: string; protocol: string; username: string; password: string; host: string; hostname: string
  port: string; pathname: string; search: string; hash: string; origin: string; params: [string, string][]
}
export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim()
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    try { u = new URL(`https://${raw}`) } catch { throw new Error('Not a valid URL. Include a scheme such as https://') }
    if (!/^[\w.-]+\.[a-z]{2,}|^localhost|^\d+\.\d+\.\d+\.\d+/i.test(raw)) throw new Error('Not a valid URL. Include a scheme such as https://')
  }
  return {
    href: u.href, protocol: u.protocol, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
    host: u.host, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, origin: u.origin,
    params: [...u.searchParams.entries()],
  }
}
export function parseQuery(input: string): [string, string][] {
  const q = input.trim()
  const s = q.includes('?') ? q.slice(q.indexOf('?') + 1).split('#')[0] : q.replace(/^#/, '')
  return [...new URLSearchParams(s).entries()]
}
