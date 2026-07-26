import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works whether it's served from the domain root
  // (Vercel) or a project subpath (GitHub Pages, e.g. /Chess-Online-Stockfish/)
  // without any config change. All runtime asset paths derive from
  // import.meta.env.BASE_URL / the service worker's own location accordingly.
  base: './',
  plugins: [react()],
  base: '/Chess-Online-Stockfish/',
  assetsInclude: ['**/*.wasm'],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
})
