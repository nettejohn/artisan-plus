import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n.jsx'

// ── Enregistrement du Service Worker + détection des mises à jour ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Rend la registration accessible globalement (pour handleUpdate)
        window.__swRegistration = registration;

        // ── Détecte quand un nouveau SW est en cours d'installation ──
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Le nouveau SW est installé ET un SW précédent contrôle la page
            // → une nouvelle version est disponible, on peut proposer l'update
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        });

        // Vérifie les mises à jour disponibles toutes les 30 minutes
        setInterval(() => registration.update(), 30 * 60 * 1000);

        console.log('[PWA] Service Worker enregistré :', registration.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Échec enregistrement Service Worker :', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
