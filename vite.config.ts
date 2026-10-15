import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:1999'

  const morinagaApiTarget = env.VITE_MORINAGA_API_URL || 'https://api-morinaga-medical.dev.rollingglory.com'

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      port: Number(env.PORT) || 5173,
      open: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
        '/morinaga-api': {
          target: morinagaApiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/morinaga-api/, ''),
        },
      },
    },
  }
})
