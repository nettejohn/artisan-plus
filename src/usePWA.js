/**
 * usePWA — Hook React pour les fonctionnalités Progressive Web App
 *
 * Fournit :
 *  • isOnline        — true si l'artisan a une connexion internet
 *  • canInstall      — true si le navigateur propose l'installation
 *  • handleInstall() — déclenche l'invite d'installation native
 *  • showSyncToast   — true pendant 4 s après le retour de la connexion
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  const deferredPrompt = useRef(null);
  const wasOffline = useRef(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    // ── Online / Offline ─────────────────────────────────────────
    const handleOnline = () => {
      setIsOnline(true);
      // Montrer le toast de synchronisation si on était hors ligne
      if (wasOffline.current) {
        setShowSyncToast(true);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowSyncToast(false), 4000);
      }
      wasOffline.current = false;

      // Déclencher le Background Sync si supporté
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.sync.register('sync-data').catch(() => {});
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
    };

    // ── Install prompt (Android Chrome, Edge, etc.) ──────────────
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
    };

    // ── Messages du Service Worker (sync, update) ─────────────────
    const handleSWMessage = (event) => {
      if (event.data?.type === 'SYNC_DATA') {
        // Le SW nous signale qu'une synchronisation est disponible
        window.dispatchEvent(new CustomEvent('artisan-sync'));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
      clearTimeout(toastTimer.current);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt.current = null;
      setCanInstall(false);
    }
  }, []);

  return { isOnline, canInstall, handleInstall, showSyncToast };
}
