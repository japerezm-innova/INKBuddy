'use client'

import { useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useNetworkStatus } from './network-status'
import { useSyncQueueStatus, startQueueProcessor } from './sync-queue'

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  const { pendingCount, isSyncing } = useSyncQueueStatus()

  useEffect(() => {
    const cleanup = startQueueProcessor()
    return cleanup
  }, [])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]" role="status" aria-live="polite">
      {!isOnline && (
        <div className="bg-amber-500/90 backdrop-blur-sm text-white text-xs text-center py-1.5 font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          Sin conexion - Los cambios se guardaran localmente
        </div>
      )}
      {isOnline && isSyncing && (
        <div className="bg-blue-500/90 backdrop-blur-sm text-white text-xs text-center py-1.5 font-medium flex items-center justify-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Sincronizando {pendingCount} operacion{pendingCount !== 1 ? 'es' : ''}...
        </div>
      )}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <div className="bg-amber-500/90 backdrop-blur-sm text-white text-xs text-center py-1.5 font-medium">
          {pendingCount} operacion{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de sincronizar
        </div>
      )}
    </div>
  )
}
