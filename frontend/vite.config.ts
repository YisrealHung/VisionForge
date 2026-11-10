import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend port follows VF_PORT (same variable the launch scripts and the backend use).
const backendPort = process.env.VF_PORT || '8000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true
      },
      '/ws': {
        target: `ws://127.0.0.1:${backendPort}`,
        ws: true
      }
    }
  }
})
