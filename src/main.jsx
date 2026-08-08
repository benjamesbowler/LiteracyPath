/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.js'
import './index.css'
import App from './App.jsx'
import { SoundKeysApp } from './features/soundkeys/SoundKeysApp.jsx'
import './features/soundkeys/home.css'
// Imported AFTER App so these rules land last in the cascade: the child-facing
// wide-layout + vibrant reskin layer always wins.
import './styles/student-vibrant.css'
// Comic-book mockup-fidelity layer. MUST stay after student-vibrant.css so it wins the cascade.
import './styles/comic-theme.css'
// Rewards V2 (My Hollow) layer - after comic-theme so its pop-art rules win.
import './styles/hollow.css'
// The "sage" skin (the only student look since the classic "comic" switch was
// removed on 2026-07-22). home-sage.css is the home page shell, scoped under
// .lp-home-sage; sage-subpages.css remaps the comic palette variables for
// every other student page (arcade + hollow exempted inside). Both must come
// after the comic layer they override.
import './styles/home-sage.css'
import './styles/sage-subpages.css'
// Generated: soft borders/shadows for every comic-heavy rule under the sage
// skin (Arcade + Hollow exempt). Regenerate: npm run generate:sage-soft.
import './styles/sage-soft.generated.css'
// The palettes sage-subpages.css never bridged (--phonics-, --kid-, --pal-,
// and the hardcoded home tile accents) plus the three form tells the generator
// does not cover: uppercase, rotation, halftone. Last, so it wins.
import './styles/sage-form.css'
// The kids-side redesign's design system (2026-07-29). Everything in it is
// scoped under .kg-viewport / .kg-stage, so it cannot reach the sage skin or
// the comic base; it loads LAST so the child shell wins inside its own stage.
import './styles/kids-glass.css'
// The child Home screen's own layout (phase B). Screen geometry only — every
// glass surface, radius and animation still comes from kids-glass.css. Loads
// after it so a screen rule can refine a system class, never replace one.
import './styles/kids-home.css'
// The Sound Trail and the Adventure Map (phase C). One file because they are
// the same idea twice — a path of stops over an illustration — and the marker
// machinery is shared rather than written out once per screen.
import './styles/kids-trail.css'
// Books and Story Quests (phase D). One file for the same reason: both screens
// are a panel about what you started over a grid of what you could start.
import './styles/kids-library.css'
// Cross-surface quality pass. This file is intentionally last: it contains
// responsive and overflow corrections that must win over each feature layer.
import './styles/ui-quality-pass.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { AppCrashFallback } from './components/AppCrashFallback.jsx'
import { DYNAMIC_IMPORT_ERROR_EVENT, reloadOnceForNewVersion } from './utils/lazyWithRetry.js'
import { registerOfflineShell } from './utils/offlineShell.js'
import { logClientError } from './utils/errorLog.js'

window.addEventListener('error', event => logClientError(event.error || event.message, 'window-error'))
window.addEventListener('unhandledrejection', event => logClientError(event.reason, 'unhandled-rejection'))
window.addEventListener('vite:preloadError', event => {
  logClientError(event.payload || event, 'vite-preload-error')
  event.preventDefault?.()
  if (!reloadOnceForNewVersion()) {
    window.dispatchEvent(new CustomEvent(DYNAMIC_IMPORT_ERROR_EVENT, {
      detail: { message: 'A new version is available.' }
    }))
  }
})

const Root = window.location.pathname.replace(/\/$/, '') === '/soundkeys' ? SoundKeysApp : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary logLabel="App root crashed" fallback={<AppCrashFallback />}>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.PROD) void registerOfflineShell()
