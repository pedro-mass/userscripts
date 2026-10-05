import { collapseHitsToSlots, mergeHitsForSlot, withSlotId } from './slot-id';
import type { PositionNoteHit } from './types';

const DB_NAME = 'lichess-position-notes';
const STORE = 'hits';
const VERSION = 3;

function ensureIndexes(store: IDBObjectStore, oldVersion: number): void {
  if (!store.indexNames.contains('positionKey')) {
    store.createIndex('positionKey', 'positionKey', { unique: false });
  }
  if (!store.indexNames.contains('studyChapterPath')) {
    store.createIndex('studyChapterPath', ['studyId', 'chapterId', 'path'], {
      unique: false,
    });
  }
  if (oldVersion < 2 && !store.indexNames.contains('studyId')) {
    store.createIndex('studyId', 'studyId', { unique: false });
  }
  if (!store.indexNames.contains('positionKeyStudyId')) {
    store.createIndex('positionKeyStudyId', ['positionKey', 'studyId'], {
      unique: false,
    });
  }
}

function migrateRowsToSlots(store: IDBObjectStore): void {
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    const rows = getAll.result as PositionNoteHit[];
    const merged = collapseHitsToSlots(rows);
    store.clear();
    for (const hit of merged) store.put(hit);
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = event.oldVersion;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: 'id' });
        ensureIndexes(store, oldVersion);
      } else {
        store = req.transaction!.objectStore(STORE);
        ensureIndexes(store, oldVersion);
        if (oldVersion > 0 && oldVersion < 3) migrateRowsToSlots(store);
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

export async function upsertSlotHit(hit: PositionNoteHit): Promise<void> {
  const normalized = withSlotId(hit);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(normalized.id);
    getReq.onsuccess = () => {
      const existing = getReq.result as PositionNoteHit | undefined;
      store.put(
        existing ? mergeHitsForSlot(existing, normalized) : normalized,
      );
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function upsertMany(hits: PositionNoteHit[]): Promise<void> {
  const collapsed = collapseHitsToSlots(hits);
  if (collapsed.length === 0) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const hit of collapsed) {
      const getReq = store.get(hit.id);
      getReq.onsuccess = () => {
        const existing = getReq.result as PositionNoteHit | undefined;
        store.put(existing ? mergeHitsForSlot(existing, hit) : hit);
      };
      getReq.onerror = () => reject(getReq.error);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getByPositionKeyForStudy(
  positionKey: string,
  studyId: string,
): Promise<PositionNoteHit[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx
      .objectStore(STORE)
      .index('positionKeyStudyId')
      .getAll([positionKey, studyId]);
    req.onsuccess = () =>
      resolve(
        (req.result as PositionNoteHit[]).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        ),
      );
    req.onerror = () => reject(req.error);
  });
}

/** All studies at this EPD (export / rare). */
export async function getByPositionKey(
  positionKey: string,
): Promise<PositionNoteHit[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('positionKey').getAll(positionKey);
    req.onsuccess = () =>
      resolve(
        (req.result as PositionNoteHit[]).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        ),
      );
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
