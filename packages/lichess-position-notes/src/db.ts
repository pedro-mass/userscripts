import type { PositionNoteHit } from './types';

const DB_NAME = 'lichess-position-notes';
const STORE = 'hits';
const VERSION = 2;

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

export async function upsertHit(hit: PositionNoteHit): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(hit);
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
