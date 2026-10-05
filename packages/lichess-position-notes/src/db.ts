import type { PositionNoteHit } from './types';

const DB_NAME = 'lichess-position-notes';
const STORE = 'hits';
const VERSION = 2;

export function liveNodeId(
  studyId: string,
  chapterId: string,
  path: string,
): string {
  return `live|${studyId}|${chapterId}|${path}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('positionKey', 'positionKey', { unique: false });
        store.createIndex('studyChapterPath', ['studyId', 'chapterId', 'path'], {
          unique: false,
        });
        store.createIndex('studyId', 'studyId', { unique: false });
      } else {
        store = req.transaction!.objectStore(STORE);
      }
      if (event.oldVersion < 2 && !store.indexNames.contains('studyId')) {
        store.createIndex('studyId', 'studyId', { unique: false });
      }
    };
  });
}

export async function deleteHitById(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function upsertHit(hit: PositionNoteHit): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(hit);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** One live row per node; drop stale text-keyed live rows and import dupes at this ply. */
export async function replaceLiveNodeHit(hit: PositionNoteHit): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.index('positionKey').getAll(hit.positionKey);
    req.onsuccess = () => {
      const rows = req.result as PositionNoteHit[];
      for (const row of rows) {
        if (row.studyId !== hit.studyId || row.chapterId !== hit.chapterId) {
          continue;
        }
        if (row.id === hit.id) continue;
        if (row.positionKey === hit.positionKey) {
          store.delete(row.id);
        }
      }
      store.put(hit);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function upsertMany(hits: PositionNoteHit[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const hit of hits) store.put(hit);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** After import: one indexed row per chapter per board (newest text wins). */
export async function collapseStudyPositionRows(studyId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.index('studyId').getAll(studyId);
    req.onsuccess = () => {
      const rows = req.result as PositionNoteHit[];
      const keep = new Map<string, PositionNoteHit>();
      for (const row of rows) {
        const key = `${row.positionKey}\0${row.chapterId}`;
        const prev = keep.get(key);
        if (!prev || row.updatedAt > prev.updatedAt) keep.set(key, row);
      }
      const keepIds = new Set(keep.values().map((h) => h.id));
      for (const row of rows) {
        if (!keepIds.has(row.id)) store.delete(row.id);
      }
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getByPositionKey(
  positionKey: string,
): Promise<PositionNoteHit[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('positionKey').getAll(positionKey);
    req.onsuccess = () =>
      resolve((req.result as PositionNoteHit[]).sort((a, b) => b.updatedAt - a.updatedAt));
    req.onerror = () => reject(req.error);
  });
}

export async function countForStudy(studyId: string): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('studyId').count(studyId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function countAll(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function exportJson(): Promise<string> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(JSON.stringify(req.result, null, 2));
    req.onerror = () => reject(req.error);
  });
}
