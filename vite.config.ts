import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { contentPlugin } from './vite-plugin-content'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('react-dom') || id.includes('react-router') || id.match(/\/react\//)) {
              return 'vendor-react';
            }
            if (id.includes('@dnd-kit') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
})
