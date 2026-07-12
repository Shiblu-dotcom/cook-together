import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initCrashLog } from './utils/crashlog'

// First thing, before anything can fail: start catching uncaught errors.
initCrashLog()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline shell + installability. Production only — a service worker during
// dev would cache-fight with Vite's HMR. BASE_URL keeps the scope correct on
// GitHub Pages (/cook-together/) and Vercel (/) alike.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {/* offline support is progressive — never break the app */})
  })
}
