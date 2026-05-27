import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Enregistrement du Service Worker ──────────────────────────────
// Activé uniquement en production (Vite injecte import.meta.env.PROD)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker enregistré :', registration.scope);

        // Vérifie les mises à jour du SW toutes les 30 minutes
        setInterval(() => registration.update(), 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[PWA] Échec enregistrement Service Worker :', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
