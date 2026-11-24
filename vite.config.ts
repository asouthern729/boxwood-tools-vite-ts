import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { APP_BASE, DEV_API_TARGET, DEV_PUBLIC_HOST } from './src/config.ts'

// https://vite.dev/config/
export default defineConfig(() => {
  // The app calls the backend on its own origin, so in dev these paths are forwarded to the local
  // boxwood-mcp-ts. changeOrigin stays false: the backend checks the Host header against
  // ALLOWED_HOSTS and builds /callback and /logout URLs from it, so it must see the dev server's host.
  // Keys are regexes matching whole path segments, so /token can't swallow e.g. /tokens or a SPA route.
  const proxiedPaths = [
    '/api/v1/boxwood-mcp',
    '/register',
    '/authorize',
    '/callback',
    '/token',
    '/logout',
    '/downloads',
    '/.well-known',
  ]
  const proxy = Object.fromEntries(proxiedPaths.map((p) => [
    `^${p.replace(/\./g, '\\.')}(/|\\?|$)`,
    { target: DEV_API_TARGET, changeOrigin: false },
  ]))

  // See DEV_PUBLIC_HOST in src/config.ts.
  const hmr = DEV_PUBLIC_HOST ? { protocol: 'wss', host: DEV_PUBLIC_HOST, clientPort: 443 } : undefined

  return {
    base: APP_BASE.endsWith('/') ? APP_BASE : `${APP_BASE}/`,
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      allowedHosts: ['mcp.boxwoodins.com', 'build.tyneside.io'],
      proxy,
      hmr,
    },
    resolve: {
      alias: {
        '@assets': path.resolve(import.meta.dirname, 'src/assets'),
        '@components': path.resolve(import.meta.dirname, 'src/components'),
        '@context': path.resolve(import.meta.dirname, 'src/context'),
        '@pages': path.resolve(import.meta.dirname, 'src/pages'),
        '@utils': path.resolve(import.meta.dirname, 'src/utils'),
      },
    },
  }
})
