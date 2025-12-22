import { openDB, DBSchema } from 'idb';
import { AnalysisResult } from '../types';

interface TSADB extends DBSchema {
  analyses: {
    key: string;
    value: AnalysisResult;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'tsa-db';
const STORE_NAME = 'analyses';

export const initDB = async () => {
  return openDB<TSADB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'timestamp');
      }
    },
  });
};

export const saveAnalysis = async (analysis: AnalysisResult) => {
  const db = await initDB();
  await db.put(STORE_NAME, analysis);
};

export const getAllAnalyses = async (): Promise<AnalysisResult[]> => {
  const db = await initDB();
  const results = await db.getAllFromIndex(STORE_NAME, 'by-date');
  return results.reverse(); // Newest first
};

export const deleteAnalysis = async (id: string) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const getAnalysis = async (id: string) => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

// Migration helper: Move legacy localStorage data to IDB
export const migrateFromLocalStorage = async () => {
  try {
    const raw = localStorage.getItem('techSpec_history');
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.id) await saveAnalysis(item);
          else {
             // Assign ID if missing (legacy data)
             await saveAnalysis({ ...item, id: Date.now().toString() + Math.random() });
          }
        }
      }
      localStorage.removeItem('techSpec_history'); // Clear after success
    }
  } catch (e) {
    console.warn("Migration failed", e);
  }
};