import { get, set, del, keys } from 'idb-keyval'

export const STORAGE_KEYS = {
  FORM_DRAFT: 'inkbuddy:form-draft:appointment',
  TODAY_APPOINTMENTS: 'inkbuddy:cache:today-appointments',
  TODAY_APPOINTMENTS_META: 'inkbuddy:cache:today-appointments-meta',
  SYNC_QUEUE: 'inkbuddy:sync-queue',
} as const

export async function getOfflineData<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key)
  } catch {
    return undefined
  }
}

export async function setOfflineData<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value)
  } catch {
    // IndexedDB unavailable (incognito, storage full, etc.)
  }
}

export async function deleteOfflineData(key: string): Promise<void> {
  try {
    await del(key)
  } catch {
    // Ignore
  }
}

export async function clearAllOfflineData(): Promise<void> {
  try {
    const allKeys = await keys()
    for (const k of allKeys) {
      if (typeof k === 'string' && k.startsWith('inkbuddy:')) {
        await del(k)
      }
    }
  } catch {
    // Ignore
  }
}
