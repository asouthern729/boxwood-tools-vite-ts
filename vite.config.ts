import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appBase = env.VITE_APP_BASE || '/'

  return {
    base: appBase.endsWith('/') ? appBase : `${appBase}/`,
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      allowedHosts: ['mcp.boxwoodins.com'],
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
