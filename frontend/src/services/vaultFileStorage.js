/**
 * IndexedDB Binary File Storage & LocalStorage Synchronization Service
 * Ensures uploaded evidence files and documents are persisted reliably across page reloads
 * without disappearing due to browser localStorage 5MB quota limits.
 */

const DB_NAME = 'NDCMS_Vault_DB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_files';

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function storeVaultFile(docId, fileDataUrl) {
  if (!docId || !fileDataUrl) return false;
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id: String(docId), dataUrl: fileDataUrl, storedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function getVaultFile(docId) {
  if (!docId) return null;
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(docId));
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function saveVaultDocumentSafe(doc) {
  if (!doc || !doc.id) return;
  try {
    const raw = localStorage.getItem('sih_vault_documents');
    const list = raw ? JSON.parse(raw) : [];
    
    // Cache the full binary dataUrl asynchronously in IndexedDB
    if (doc.fileDataUrl) {
      storeVaultFile(doc.id, doc.fileDataUrl);
    }

    const updated = [doc, ...list.filter(d => String(d.id) !== String(doc.id))];
    
    try {
      localStorage.setItem('sih_vault_documents', JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn('LocalStorage quota limit reached, persisting document metadata safely without fileDataUrl:', quotaErr?.message);
      // Strip large binary payloads so metadata is 100% guaranteed to persist
      const safeList = updated.map(({ fileDataUrl, ...rest }) => rest);
      localStorage.setItem('sih_vault_documents', JSON.stringify(safeList));
    }
  } catch (err) {
    console.error('Error saving document to vault:', err);
  }
}

export function getVaultDocumentsSafe(caseId, caseNumber) {
  try {
    const raw = localStorage.getItem('sih_vault_documents');
    const list = raw ? JSON.parse(raw) : [];
    if (!caseId && !caseNumber) return list;
    const cidStr = caseId != null ? String(caseId).trim() : '';
    const cnumStr = caseNumber != null ? String(caseNumber).trim() : '';

    return list.filter(d => {
      const docCid = d.caseId != null ? String(d.caseId).trim() : '';
      const docCnum = d.caseNumber != null ? String(d.caseNumber).trim() : '';

      // 1. Primary check: If doc has a caseId, it MUST match this case's ID or caseNumber
      if (docCid) {
        return (cidStr && docCid === cidStr) || (cnumStr && docCid === cnumStr);
      }

      // 2. Legacy fallback: If doc does NOT have a caseId, check caseNumber
      if (docCnum) {
        return (cnumStr && docCnum === cnumStr) || (cidStr && docCnum === cidStr);
      }

      return false;
    });
  } catch {
    return [];
  }
}
