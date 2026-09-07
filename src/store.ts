import { Application, applications as initialApps, Audit, auditSeed } from './data'
import { api } from './api'

const appKey = 'metriq-applications'
const auditKey = 'metriq-audit'

/**
 * Reads applications from the real backend, with local cache fallback.
 */
export async function fetchApplications(): Promise<Application[]> {
  try {
    const res = await api.applications.list()
    if (res.success && res.data?.applications) {
      const mapped: Application[] = res.data.applications.map((a: any) => ({
        id: a.applicationId,
        applicant: a.applicantName,
        business: a.businessName,
        instrument: a.instrumentDetails?.type || 'Electronic Weighing Scale',
        district: a.district,
        submitted: new Date(a.createdAt).toLocaleDateString('en-IN'),
        priority: a.priority || 'Normal',
        status:
          a.status === 'SUBMITTED'
            ? 'Submitted'
            : a.status === 'UNDER_SCRUTINY'
            ? 'Under Scrutiny'
            : a.status === 'ASSIGNED'
            ? 'Assigned'
            : a.status === 'SCHEDULED'
            ? 'Scheduled'
            : a.status === 'FIELD_VERIFICATION'
            ? 'Field Verification'
            : a.status === 'CERTIFICATE_ISSUED'
            ? 'Certificate Issued'
            : a.status,
        officer: a.assignedOfficerName,
        date: a.scheduledDate ? `${a.scheduledDate} ${a.scheduledSlot || ''}` : undefined,
      }))
      localStorage.setItem(appKey, JSON.stringify(mapped))
      return mapped
    }
  } catch (err) {
    console.warn('Backend fetch failed, falling back to cache:', err)
  }

  const cached = localStorage.getItem(appKey)
  return cached ? JSON.parse(cached) : initialApps
}

export const readApplications = (): Application[] => {
  const cached = localStorage.getItem(appKey)
  return cached ? JSON.parse(cached) : initialApps
}

export const writeApplications = (value: Application[]) => {
  localStorage.setItem(appKey, JSON.stringify(value))
}

/**
 * Reads audit trail from real backend, with local cache fallback.
 */
export async function fetchAudit(): Promise<Audit[]> {
  try {
    const res = await api.audit.list({ limit: 50 })
    if (res.success && res.data?.logs) {
      const mapped: Audit[] = res.data.logs.map((l: any) => ({
        time: new Date(l.timestamp).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        action: l.action.replace(/_/g, ' '),
        detail: `${l.detail} (${l.actorName || 'SYSTEM'})`,
      }))
      localStorage.setItem(auditKey, JSON.stringify(mapped))
      return mapped
    }
  } catch (err) {
    console.warn('Backend audit fetch failed:', err)
  }

  const cached = localStorage.getItem(auditKey)
  return cached ? JSON.parse(cached) : auditSeed
}

export const readAudit = (): Audit[] => {
  const cached = localStorage.getItem(auditKey)
  return cached ? JSON.parse(cached) : auditSeed
}

export const addAudit = async (action: string, detail: string) => {
  const newEntry: Audit = { time: new Date().toLocaleString('en-IN'), action, detail }
  const current = readAudit()
  localStorage.setItem(auditKey, JSON.stringify([newEntry, ...current]))
}

export async function updateApplication(id: string, changes: Partial<Application>) {
  const next = readApplications().map((app) => (app.id === id ? { ...app, ...changes } : app))
  writeApplications(next)
  return next.find((app) => app.id === id)!
}

export function dbPut(store: string, value: unknown) {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('metriq-offline', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true })
    req.onsuccess = () => {
      const tx = req.result.transaction('queue', 'readwrite')
      tx.objectStore('queue').add({ store, value, at: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
    req.onerror = () => reject(req.error)
  })
}

export function dbCount() {
  return new Promise<number>((resolve) => {
    const req = indexedDB.open('metriq-offline', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true })
    req.onsuccess = () => {
      const tx = req.result.transaction('queue')
      const count = tx.objectStore('queue').count()
      count.onsuccess = () => resolve(count.result)
    }
    req.onerror = () => resolve(0)
  })
}

export function dbClear() {
  return new Promise<void>((resolve) => {
    const req = indexedDB.open('metriq-offline', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('queue', { autoIncrement: true })
    req.onsuccess = () => {
      const tx = req.result.transaction('queue', 'readwrite')
      tx.objectStore('queue').clear()
      tx.oncomplete = () => resolve()
    }
  })
}
