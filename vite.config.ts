import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },

  // IMPORTANT for devcontainers/port-forwarding:
  server: {
    host: true,        // same as 0.0.0.0
    port: 5173,
    strictPort: true,
  },

  test: {
    globals: true,
    environment: 'jsdom',
  },
})
