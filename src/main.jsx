import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DYNAMIC_IMPORT_ERROR_EVENT, reloadOnceForNewVersion } from './utils/lazyWithRetry.js'

const CLIENT_ERROR_LOG_KEY = 'lp-client-error-log'

function readClientErrors() {
  try {
    return JSON.parse(window.localStorage?.getItem(CLIENT_ERROR_LOG_KEY) || '[]')
  } catch {
    return []
  }
}

function recordClientError(error, source = 'error') {
  if (typeof window === 'undefined') return
  const entry = {
    source,
    message: String(error?.message || error?.reason?.message || error || ''),
    stack: String(error?.stack || error?.reason?.stack || ''),
    view: window.location?.pathname || '',
    timestamp: new Date().toISOString()
  }
  try {
    window.localStorage?.setItem(CLIENT_ERROR_LOG_KEY, JSON.stringify([entry, ...readClientErrors()].slice(0, 50)))
  } catch {
    // Ignore storage failures; logging must not block app startup.
  }
}

window.addEventListener('error', event => recordClientError(event.error || event.message, 'error'))
window.addEventListener('unhandledrejection', event => recordClientError(event.reason, 'unhandledrejection'))
window.addEventListener('vite:preloadError', event => {
  recordClientError(event.payload || event, 'vite:preloadError')
  event.preventDefault?.()
  if (!reloadOnceForNewVersion()) {
    window.dispatchEvent(new CustomEvent(DYNAMIC_IMPORT_ERROR_EVENT, {
      detail: { message: 'A new version is available.' }
    }))
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
