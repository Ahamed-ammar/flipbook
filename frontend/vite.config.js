import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    // Increase body size limit for PDF uploads (default is 10mb)
    maxBodySize: 200 * 1024 * 1024, // 200 MB
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Let the proxy handle the full stream without buffering
        ws: false,
        proxyTimeout: 120000,  // 2 min timeout for large uploads
        timeout: 120000,
      },
    },
  },
})
