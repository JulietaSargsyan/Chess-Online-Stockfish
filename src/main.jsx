import { Analytics } from "@vercel/analytics/react"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)

// Register the offline service worker in production builds only (never in the
// Vite dev server, where it would cache dev modules and break HMR). This is what
// makes the app keep working — including the Stockfish engine — with no network.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => {
        // On a host that doesn't send COOP/COEP (e.g. GitHub Pages) the first
        // load isn't cross-origin isolated, so SharedArrayBuffer — and therefore
        // Stockfish — is unavailable. Once the service worker controls the page it
        // can serve the navigation with those headers, so reload once to gain
        // isolation. Guarded so it can never loop. On hosts that already send the
        // headers (Vercel), crossOriginIsolated is true and this is a no-op.
        if (window.crossOriginIsolated || sessionStorage.getItem('coiReloaded')) {
          return
        }
        const reloadOnce = () => {
          sessionStorage.setItem('coiReloaded', '1')
          window.location.reload()
        }
        if (navigator.serviceWorker.controller) {
          reloadOnce()
        } else {
          navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true })
        }
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
  })
}
