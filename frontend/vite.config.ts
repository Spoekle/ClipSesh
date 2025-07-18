import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer for development
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Optimize bundle size and performance
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable in production for smaller builds
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
      },
    },
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for stable libraries
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
            'axios',
            '@tanstack/react-query',
          ],
          // UI components chunk
          ui: [
            'framer-motion',
            'react-helmet',
            'react-hot-toast',
            'emoji-picker-react',
            'react-icons',
            'recharts',
          ],
          // Utils chunk
          utils: [
            'socket.io-client',
            'lodash.debounce',
            'timeago.js',
            'uuid',
            'file-saver',
          ],
        },
        // Optimize asset naming
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Development server optimizations
    host: '0.0.0.0',
    port: 5173,
    open: true,
    hmr: {
      overlay: false, // Disable error overlay for performance
    },
    watch: {
      usePolling: true
    },
    allowedHosts: [
      'localhost',
      'dev.spoekle.com'
    ]
  },
  // CSS optimization
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        additionalData: '',
      },
    },
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'framer-motion',
      'socket.io-client',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  esbuild: {
    // Drop console logs in production
    drop: ['console', 'debugger'],
  },
})
