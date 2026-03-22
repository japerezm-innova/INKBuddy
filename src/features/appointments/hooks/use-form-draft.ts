'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getOfflineData,
  setOfflineData,
  deleteOfflineData,
  STORAGE_KEYS,
} from '@/shared/lib/offline/offline-storage'

function hasNonEmptyFields(obj: object): boolean {
  return Object.values(obj).some(
    (v) => v !== '' && v !== false && v != null && v !== 0
  )
}

export function useFormDraft<T extends object>(
  formState: T,
  setFormState: (state: T) => void,
  options?: { key?: string; debounceMs?: number }
): {
  hasDraft: boolean
  clearDraft: () => Promise<void>
  restoreDraft: () => Promise<void>
} {
  const key = options?.key ?? STORAGE_KEYS.FORM_DRAFT
  const debounceMs = options?.debounceMs ?? 1000
  const [hasDraft, setHasDraft] = useState(false)

  // On mount: check for existing draft
  useEffect(() => {
    getOfflineData<T>(key).then((draft) => {
      if (draft && hasNonEmptyFields(draft as object)) {
        setHasDraft(true)
      }
    })
  }, [key])

  // Auto-save: debounced write on formState change
  useEffect(() => {
    if (!hasNonEmptyFields(formState)) return

    const timer = setTimeout(() => {
      setOfflineData(key, formState)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [formState, key, debounceMs])

  const clearDraft = useCallback(async () => {
    await deleteOfflineData(key)
    setHasDraft(false)
  }, [key])

  const restoreDraft = useCallback(async () => {
    const draft = await getOfflineData<T>(key)
    if (draft) {
      setFormState(draft)
      setHasDraft(false)
    }
  }, [key, setFormState])

  return { hasDraft, clearDraft, restoreDraft }
}
