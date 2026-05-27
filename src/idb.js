/**
 * idb.js — Cache IndexedDB pour la consultation hors ligne
 *
 * Stocke factures, devis, clients et chantiers localement.
 * Permet à l'artisan de consulter toutes ses données même sans réseau,
 * et de retrouver ses données entre deux sessions.
 */

const DB_NAME = 'artisan-plus-db';
const DB_VERSION = 1;
const STORES = ['factures', 'devis', 'clients', 'chantiers'];

let _db = null;

/** Ouvre (ou réutilise) la connexion IndexedDB */
function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          // Tous les objets Supabase ont un champ `id`
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Sauvegarde un tableau d'objets dans un store.
 * Remplace entièrement le contenu existant (snapshot frais depuis Supabase).
 */
export async function idbSave(storeName, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    items.forEach((item) => store.put(item));
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.warn('[IDB] idbSave error:', storeName, e);
  }
}

/**
 * Charge tous les objets d'un store.
 * Retourne [] si le store est vide ou en cas d'erreur.
 */
export async function idbLoad(storeName) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.warn('[IDB] idbLoad error:', storeName, e);
    return [];
  }
}
