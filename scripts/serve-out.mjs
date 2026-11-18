// Minimal static server for the exported site (out/), like a static host:
// /bn/ -> out/bn/index.html, unknown paths -> out/404.html with status 404.
//   node scripts/serve-out.mjs [port]
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve('out')
const port = Number(process.argv[2] || 4173)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '')
  const full = join(root, safe)
  if (!full.startsWith(root)) return null
  for (const candidate of [full, join(full, 'index.html'), `${full}.html`]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {
      // try next
    }
  }
  return null
}

createServer(async (req, res) => {
  const path = new URL(req.url || '/', 'http://x').pathname
  // Static hosts redirect /bn -> /bn/ when trailingSlash is on.
  if (!extname(path) && !path.endsWith('/')) {
    res.writeHead(308, { Location: `${path}/` })
    return res.end()
  }
  const file = await resolveFile(path)
  if (!file) {
    res.writeHead(404, { 'Content-Type': types['.html'] })
    return res.end(await readFile(join(root, '404.html')))
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(port, () => console.log(`Serving out/ on http://localhost:${port}`))
