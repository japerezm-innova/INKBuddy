export type SyncOperationType =
  | 'create_appointment'
  | 'update_appointment'
  | 'delete_appointment'

export interface SyncQueueItem {
  id: string
  type: SyncOperationType
  payload: unknown
  createdAt: string
  retryCount: number
  lastError?: string
}

export interface SyncQueueStatus {
  pendingCount: number
  isSyncing: boolean
  lastSyncAt: string | null
  errors: Array<{ itemId: string; error: string }>
}
