import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the app from /<repo-name>/ — local dev is unaffected
  // because Vite only applies base during build/preview routing.
  base: process.env.GITHUB_ACTIONS ? '/cook-together/' : '/',
})
