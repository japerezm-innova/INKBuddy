'use client'

import { useSyncExternalStore } from 'react'

const HEARTBEAT_ONLINE_MS = 30_000
const HEARTBEAT_OFFLINE_MS = 10_000

let currentStatus = typeof navigator !== 'undefined' ? navigator.onLine : true
let listeners = new Set<() => void>()
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null

function notify() {
  listeners.forEach((l) => l())
}

function setStatus(online: boolean) {
  if (currentStatus === online) return
  currentStatus = online
  notify()
}

async function heartbeat() {
  try {
    const res = await fetch('/api/me', { method: 'HEAD', cache: 'no-store' })
    setStatus(res.ok)
  } catch {
    setStatus(false)
  }
  scheduleHeartbeat()
}

function scheduleHeartbeat() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer)
  heartbeatTimer = setTimeout(heartbeat, currentStatus ? HEARTBEAT_ONLINE_MS : HEARTBEAT_OFFLINE_MS)
}

function startListening() {
  if (typeof window === 'undefined') return

  window.addEventListener('offline', () => setStatus(false))
  window.addEventListener('online', () => {
    // Don't trust online event blindly — verify with heartbeat
    heartbeat()
  })

  scheduleHeartbeat()
}

let started = false

function subscribe(callback: () => void): () => void {
  if (!started) {
    started = true
    startListening()
  }
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot(): boolean {
  return currentStatus
}

function getServerSnapshot(): boolean {
  return true
}

export function useNetworkStatus(): { isOnline: boolean } {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { isOnline }
}

export function getNetworkStatus(): boolean {
  return currentStatus
}
