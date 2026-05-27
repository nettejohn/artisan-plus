/**
 * usePWA — Hook React pour les fonctionnalités Progressive Web App
 *
 * Fournit :
 *  • isOnline              — true si connexion internet active
 *  • canInstall            — true si le navigateur propose l'installation
 *  • handleInstall()       — déclenche l'invite d'installation native
 *  • showSyncToast         — true 4 s après le retour de connexion
 *  • updateAvailable       — true quand une nouvelle version du SW est prête
 *  • handleUpdate()        — applique la mise à jour et recharge la page
 *  • notifPermission       — 'default' | 'granted' | 'denied'
 *  • requestNotifPermission() — demande la permission de notification
 *  • checkAndNotify(f, d)  — vérifie devis/factures en retard et notifie
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const deferredPrompt = useRef(null);
  const wasOffline = useRef(false);
  const toastTimer = useRef(null);
  const notifCheckedThisSession = useRef(false);

  useEffect(() => {
    // ── Online / Offline ─────────────────────────────────────────
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        setShowSyncToast(true);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowSyncToast(false), 4000);
      }
      wasOffline.current = false;
      // Background Sync si supporté
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) =>
          reg.sync.register('sync-data').catch(() => {})
        );
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
    };

    // ── Install prompt (Android Chrome, Edge…) ───────────────────
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
    };

    // ── SW Update disponible ─────────────────────────────────────
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    // ── Messages du Service Worker ───────────────────────────────
    const handleSWMessage = (event) => {
      if (event.data?.type === 'SYNC_DATA') {
        window.dispatchEvent(new CustomEvent('artisan-sync'));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
      clearTimeout(toastTimer.current);
    };
  }, []);

  // ── Install ──────────────────────────────────────────────────────
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt.current = null;
      setCanInstall(false);
    }
  }, []);

  // ── Mise à jour de l'app ──────────────────────────────────────────
  const handleUpdate = useCallback(() => {
    const reg = window.__swRegistration;
    if (reg?.waiting) {
      reg.waiting.postMessage('SKIP_WAITING');
      // Recharge dès que le nouveau SW prend le contrôle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  // ── Notifications ─────────────────────────────────────────────────
  const requestNotifPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    return result;
  }, []);

  /**
   * Vérifie devis en retard (>7j sans réponse) et factures impayées,
   * envoie des notifications système si permission accordée.
   * N'envoie qu'une seule fois par session.
   */
  const checkAndNotify = useCallback((factures, devis) => {
    if (notifPermission !== 'granted') return;
    if (!('Notification' in window)) return;
    if (notifCheckedThisSession.current) return;
    notifCheckedThisSession.current = true;

    const now = Date.now();
    const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

    // Devis "en_attente" sans réponse depuis > 7 jours
    const devisEnRetard = (devis || []).filter(
      (d) => d.statut === 'en_attente' && (now - new Date(d.created_at).getTime()) > SEPT_JOURS
    );

    // Factures impayées
    const facturesImpayees = (factures || []).filter((f) => f.statut === 'en_attente');
    const montantImpaye = facturesImpayees.reduce((s, f) => s + (f.total_ttc || 0), 0);

    if (devisEnRetard.length > 0) {
      new Notification('📝 Devis en attente', {
        body: `${devisEnRetard.length} devis sans réponse depuis plus de 7 jours`,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'devis-en-retard',
        requireInteraction: false,
      });
    }

    if (facturesImpayees.length > 0) {
      setTimeout(() => {
        new Notification('💰 Factures impayées', {
          body: `${facturesImpayees.length} facture${facturesImpayees.length > 1 ? 's' : ''} impayée${facturesImpayees.length > 1 ? 's' : ''} — ${montantImpaye.toFixed(0)} € à encaisser`,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'factures-impayees',
          requireInteraction: false,
        });
      }, 2000); // légère pause pour ne pas empiler deux notifs simultanées
    }
  }, [notifPermission]);

  return {
    isOnline,
    canInstall,
    handleInstall,
    showSyncToast,
    updateAvailable,
    handleUpdate,
    notifPermission,
    requestNotifPermission,
    checkAndNotify,
  };
}
