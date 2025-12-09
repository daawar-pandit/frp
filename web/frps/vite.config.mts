import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsDir: '',
  },
  server: {
    port: 5173,
    // Proxy API requests to the frps backend during development
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7500',
        changeOrigin: true,
        // Add authentication header for development
        // The frps dashboard uses basic auth (admin:admin by default)
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Base64 encode "admin:admin" for basic auth
            proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('admin:admin').toString('base64'))
          })
        },
      },
    },
  },
})
