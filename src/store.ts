import { Application, applications, Audit, auditSeed } from './data'

const appKey = 'metriq-applications'; const auditKey = 'metriq-audit';
export const readApplications = (): Application[] => JSON.parse(localStorage.getItem(appKey) || 'null') || applications
export const writeApplications = (value: Application[]) => localStorage.setItem(appKey, JSON.stringify(value))
export const readAudit = (): Audit[] => JSON.parse(localStorage.getItem(auditKey) || 'null') || auditSeed
export const addAudit = (action: string, detail: string) => localStorage.setItem(auditKey, JSON.stringify([{ time: new Date().toLocaleString('en-IN'), action, detail }, ...readAudit()]))

export function updateApplication(id: string, changes: Partial<Application>) {
  const next = readApplications().map(app => app.id === id ? { ...app, ...changes } : app); writeApplications(next); return next.find(app => app.id === id)!
}
export function dbPut(store: string, value: unknown) {
  return new Promise<void>((resolve, reject) => { const req = indexedDB.open('metriq-offline', 1); req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true }); req.onsuccess = () => { const tx = req.result.transaction('queue', 'readwrite'); tx.objectStore('queue').add({ store, value, at: Date.now() }); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }; req.onerror = () => reject(req.error); })
}
export function dbCount() {
  return new Promise<number>((resolve) => { const req = indexedDB.open('metriq-offline', 1); req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true }); req.onsuccess = () => { const tx = req.result.transaction('queue'); const count = tx.objectStore('queue').count(); count.onsuccess = () => resolve(count.result); }; req.onerror = () => resolve(0); })
}
export function dbClear() {
  return new Promise<void>((resolve) => { const req = indexedDB.open('metriq-offline', 1); req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true }); req.onsuccess = () => { const tx = req.result.transaction('queue', 'readwrite'); tx.objectStore('queue').clear(); tx.oncomplete = () => resolve(); }; })
}
