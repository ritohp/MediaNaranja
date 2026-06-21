import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Sanitize URL to handle Facebook Ads copy-paste trailing characters (spaces, dots, slashes)
(function sanitizeUrl() {
  try {
    const rawPath = window.location.pathname;
    const decodedPath = decodeURIComponent(rawPath);
    
    // Target campaign routes that might get corrupted in ad copy-pastes
    const targets = ['/regalo-papa', '/cancion-para-papa', '/crear-cancion'];
    
    for (const target of targets) {
      if (decodedPath.startsWith(target) && decodedPath !== target) {
        const trailing = decodedPath.slice(target.length);
        // If trailing part consists of only spaces, dots, slashes, or %20
        if (/^[\s./%]+$/.test(trailing)) {
          const cleanPath = target;
          const newUrl = cleanPath + window.location.search + window.location.hash;
          window.history.replaceState(null, '', newUrl);
          break;
        }
      }
    }
  } catch (e) {
    console.error('URL sanitization failed:', e);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
