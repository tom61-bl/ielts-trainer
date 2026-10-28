"use client";

import { readJson, storageKeys, writeJson } from "./storage";
import type { PrivatePaperMeta } from "./types";

const DB_NAME = "ielts-private";
const STORE = "pdfs";

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function listPrivatePapers(ownerId: string) {
  return readJson<PrivatePaperMeta[]>(storageKeys.privatePapers, []).filter(
    (paper) => paper.ownerId === ownerId,
  );
}

export async function savePrivatePaper(meta: PrivatePaperMeta, file: Blob) {
  const all = readJson<PrivatePaperMeta[]>(storageKeys.privatePapers, []);
  writeJson(storageKeys.privatePapers, [meta, ...all.filter((item) => item.id !== meta.id)]);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, meta.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadPrivatePdf(id: string) {
  const db = await openDb();
  const file = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return file;
}
