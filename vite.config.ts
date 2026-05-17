import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // `@/components/Button` instead of `../../../components/Button`
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Forward /api requests to the Spring Boot backend during development.
    // This avoids CORS issues without configuring the backend.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
