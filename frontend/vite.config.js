import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      host: 'localhost',
      // Dev proxy: forwards /api calls to the local FastAPI backend
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    define: {
      // Make the production API URL available at build time if set
      __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          // Chunk splitting keeps initial load fast (Rolldown-compatible function form)
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('node_modules/recharts')) {
              return 'charts';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'motion';
            }
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui';
            }
          },
        },
      },
    },
  }
})
