'use client'

import { useSyncExternalStore } from 'react'
import { getOfflineData, setOfflineData, STORAGE_KEYS } from './offline-storage'
import { getNetworkStatus } from './network-status'
import type { SyncQueueItem, SyncQueueStatus, SyncOperationType } from './sync-queue-types'
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '@/features/appointments/services/appointment-service'

const MAX_RETRIES = 3

let isProcessing = false
let listeners = new Set<() => void>()
let queueStatus: SyncQueueStatus = {
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,
  errors: [],
}

function notify() {
  listeners.forEach((l) => l())
}

async function loadPendingCount() {
  const queue = (await getOfflineData<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE)) ?? []
  queueStatus = { ...queueStatus, pendingCount: queue.length }
  notify()
}

export async function enqueueOperation(
  type: SyncOperationType,
  payload: unknown
): Promise<void> {
  const queue = (await getOfflineData<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE)) ?? []

  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }

  queue.push(item)
  await setOfflineData(STORAGE_KEYS.SYNC_QUEUE, queue)
  queueStatus = { ...queueStatus, pendingCount: queue.length }
  notify()

  if (getNetworkStatus()) {
    processQueue()
  }
}

export async function processQueue(): Promise<void> {
  if (isProcessing) return
  if (!getNetworkStatus()) return

  const queue = (await getOfflineData<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE)) ?? []
  if (queue.length === 0) return

  isProcessing = true
  queueStatus = { ...queueStatus, isSyncing: true, errors: [] }
  notify()

  const remaining: SyncQueueItem[] = []
  const errors: Array<{ itemId: string; error: string }> = []

  for (const item of queue) {
    if (!getNetworkStatus()) {
      remaining.push(item)
      continue
    }

    try {
      await executeOperation(item)
    } catch (err) {
      item.retryCount++
      item.lastError = err instanceof Error ? err.message : 'Error desconocido'

      if (item.retryCount < MAX_RETRIES) {
        remaining.push(item)
      } else {
        errors.push({ itemId: item.id, error: item.lastError })
      }
    }
  }

  await setOfflineData(STORAGE_KEYS.SYNC_QUEUE, remaining)

  queueStatus = {
    pendingCount: remaining.length,
    isSyncing: false,
    lastSyncAt: new Date().toISOString(),
    errors,
  }
  isProcessing = false
  notify()
}

async function executeOperation(item: SyncQueueItem): Promise<void> {
  switch (item.type) {
    case 'create_appointment': {
      const result = await createAppointment(item.payload as Parameters<typeof createAppointment>[0])
      if (result.error) throw new Error(result.error)
      break
    }
    case 'update_appointment': {
      const { id, input } = item.payload as { id: string; input: Parameters<typeof updateAppointment>[1] }
      const result = await updateAppointment(id, input)
      if (result.error) throw new Error(result.error)
      break
    }
    case 'delete_appointment': {
      const { id } = item.payload as { id: string }
      const result = await deleteAppointment(id)
      if (result.error) throw new Error(result.error)
      break
    }
    default:
      throw new Error(`Tipo de operacion desconocido: ${item.type}`)
  }
}

// React hook
export function useSyncQueueStatus(): SyncQueueStatus {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      loadPendingCount()
      return () => listeners.delete(callback)
    },
    () => queueStatus,
    () => queueStatus
  )
}

// Auto-process on connectivity change
export function startQueueProcessor(): () => void {
  function handleOnline() {
    processQueue()
  }
  window.addEventListener('online', handleOnline)
  processQueue()

  return () => window.removeEventListener('online', handleOnline)
}
