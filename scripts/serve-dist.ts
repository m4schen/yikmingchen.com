// Serves `dist/` the way GitHub Pages does, so local checks exercise the real
// production resolution rules instead of Vite's SPA fallback:
//   /foo      -> foo (file) | foo.html | 301 to /foo/ (dir with index.html)
//   /foo/     -> foo/index.html
//   otherwise -> 404.html with status 404
//
// Usage: pnpm serve:dist [--port 4173]
import type { Server } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.atom': 'application/atom+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export type Resolution
  = | { status: 200 | 404, file: string | undefined }
    | { status: 301, location: string }

function isFile(path: string) {
  return existsSync(path) && statSync(path).isFile()
}

export function resolveRequest(root: string, urlPath: string): Resolution {
  let pathname: string
  try {
    pathname = decodeURIComponent(urlPath.split(/[?#]/)[0])
  }
  catch {
    return { status: 404, file: undefined }
  }
  const target = normalize(join(root, pathname))
  // Refuse anything that escapes the root (e.g. /../etc/passwd)
  if (target !== root && !target.startsWith(root + sep))
    return { status: 404, file: undefined }

  if (pathname.endsWith('/')) {
    const index = join(target, 'index.html')
    if (isFile(index))
      return { status: 200, file: index }
  }
  else {
    if (isFile(target))
      return { status: 200, file: target }
    if (isFile(`${target}.html`))
      return { status: 200, file: `${target}.html` }
    if (isFile(join(target, 'index.html')))
      return { status: 301, location: `${pathname}/` }
  }

  const notFound = join(root, '404.html')
  return { status: 404, file: isFile(notFound) ? notFound : undefined }
}

export function startServer({ root = 'dist', port = 4173 } = {}): Promise<Server> {
  const absRoot = resolve(root)
  if (!existsSync(absRoot))
    throw new Error(`${absRoot} does not exist. Run \`pnpm build\` first.`)

  const server = createServer((req, res) => {
    const result = resolveRequest(absRoot, req.url || '/')
    if (result.status === 301) {
      res.writeHead(301, { Location: result.location })
      res.end()
      return
    }
    if (!result.file) {
      res.writeHead(404, { 'Content-Type': MIME['.txt'] })
      res.end('404 Not Found')
      return
    }
    res.writeHead(result.status, {
      'Content-Type': MIME[extname(result.file).toLowerCase()] || 'application/octet-stream',
    })
    res.end(readFileSync(result.file))
  })

  return new Promise((done, fail) => {
    server.once('error', fail)
    server.listen(port, '127.0.0.1', () => done(server))
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const portFlag = process.argv.indexOf('--port')
  const port = portFlag > -1 ? Number(process.argv[portFlag + 1]) : 4173
  await startServer({ port })
  console.log(`Serving dist/ like GitHub Pages at http://127.0.0.1:${port}`)
}
