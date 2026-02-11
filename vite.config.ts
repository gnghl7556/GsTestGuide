import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { contentPlugin } from './vite-plugin-content'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentPlugin()],
})
