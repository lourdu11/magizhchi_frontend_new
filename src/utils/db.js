import { openDB } from 'idb';

const DB_NAME = 'MagizhchiOfflineDB';
const DB_VERSION = 2;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      if (!db.objectStoreNames.contains('heldBills')) {
        db.createObjectStore('heldBills', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cartSessions')) {
        db.createObjectStore('cartSessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('posState')) {
        db.createObjectStore('posState', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offlineBills')) {
        db.createObjectStore('offlineBills', { keyPath: 'id' });
      }
    },
  });
};

export const dbService = {
  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },
  async get(storeName, key) {
    const db = await initDB();
    return db.get(storeName, key);
  },
  async put(storeName, val) {
    const db = await initDB();
    return db.put(storeName, val);
  },
  async delete(storeName, key) {
    const db = await initDB();
    return db.delete(storeName, key);
  },
  async clear(storeName) {
    const db = await initDB();
    return db.clear(storeName);
  }
};
