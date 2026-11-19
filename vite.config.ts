import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appBase = env.VITE_APP_BASE || '/'
  const devApiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:3000'

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
    { target: devApiTarget, changeOrigin: false },
  ]))

  // Set when the dev server is reached through a TLS-terminating proxy on a public host
  // (e.g. https://build.tyneside.io/tools/ -> nginx -> 127.0.0.1:5173). The HMR client then
  // connects over wss on 443 via that proxy. Unset, plain localhost dev uses Vite's defaults.
  const devPublicHost = env.VITE_DEV_PUBLIC_HOST
  const hmr = devPublicHost ? { protocol: 'wss', host: devPublicHost, clientPort: 443 } : undefined

  return {
    base: appBase.endsWith('/') ? appBase : `${appBase}/`,
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
