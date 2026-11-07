import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    server: {
      port: 5173,
      strictPort: true,
      host: 'localhost',
      proxy: {
        '/api': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
        '/ws':  { target: 'ws://localhost:8000',  ws: true, changeOrigin: true },
      },
    },

    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    },

    build: {
      // ES2015 = supported by Chrome 53+ (Android 6), Safari 11+, Samsung 6+
      target: ['es2015', 'chrome53', 'safari11', 'ios11'],
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor';
            if (id.includes('node_modules/recharts'))    return 'charts';
            if (id.includes('node_modules/framer-motion')) return 'motion';
            if (id.includes('node_modules/@radix-ui'))   return 'ui';
          },
        },
      },
    },
  }
})
