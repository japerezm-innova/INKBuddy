'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, AlignLeft, Calendar, User, Loader2, Trash2 } from 'lucide-react'
import { GlassButton, GlassInput } from '@/shared/components'
import { cn, glass } from '@/shared/lib/utils'
import { getArtists } from '@/features/appointments/services/appointment-service'
import type { Profile } from '@/features/auth/types/auth'
import type {
  Task,
  TaskPriority,
  TaskCategory,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types/task'
import {
  TASK_PRIORITY_LABELS,
  TASK_CATEGORY_LABELS,
} from '../types/task'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type TaskPriorityOption = { value: TaskPriority; label: string; color: string }
type TaskCategoryOption = { value: TaskCategory; label: string }

const PRIORITY_OPTIONS: TaskPriorityOption[] = [
  { value: 'low', label: TASK_PRIORITY_LABELS.low, color: 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 data-[selected=true]:bg-gray-500 data-[selected=true]:text-white' },
  { value: 'medium', label: TASK_PRIORITY_LABELS.medium, color: 'bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white' },
  { value: 'high', label: TASK_PRIORITY_LABELS.high, color: 'bg-orange-100/80 text-orange-700 hover:bg-orange-200/80 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white' },
  { value: 'urgent', label: TASK_PRIORITY_LABELS.urgent, color: 'bg-red-100/80 text-red-700 hover:bg-red-200/80 data-[selected=true]:bg-red-600 data-[selected=true]:text-white' },
]

const CATEGORY_OPTIONS: TaskCategoryOption[] = (
  Object.entries(TASK_CATEGORY_LABELS) as [TaskCategory, string][]
).map(([value, label]) => ({ value, label }))

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'done', label: 'Completado' },
]

interface FormState {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string
  due_date: string
  category: TaskCategory | ''
}

interface FormErrors {
  title?: string
}

function buildInitialState(task?: Task): FormState {
  if (task) {
    return {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to ?? '',
      due_date: task.due_date ?? '',
      category: task.category ?? '',
    }
  }
  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    category: '',
  }
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.title.trim()) {
    errors.title = 'El titulo es requerido'
  }
  return errors
}

// ---------------------------------------------------------------------------
// Pill selector
// ---------------------------------------------------------------------------

interface PillSelectorProps<T extends string> {
  options: { value: T; label: string; color?: string }[]
  value: T | ''
  onChange: (val: T) => void
  label: string
  required?: boolean
}

function PillSelector<T extends string>({
  options,
  value,
  onChange,
  label,
  required,
}: PillSelectorProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink-dark/80 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              data-selected={isSelected}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                opt.color ??
                  'bg-white/30 border border-white/30 text-ink-dark/70 hover:bg-white/50 data-[selected=true]:bg-ink-orange data-[selected=true]:text-white'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// TaskForm
// ---------------------------------------------------------------------------

interface TaskFormProps {
  task?: Task
  defaultStatus?: TaskStatus
  onSuccess?: (task: Task) => void
  onCancel?: () => void
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>
  isSubmitting?: boolean
  serverError?: string | null
}

export function TaskForm({
  task,
  defaultStatus,
  onSuccess: _onSuccess,
  onCancel,
  onSubmit,
  isSubmitting = false,
  serverError,
}: TaskFormProps) {
  const isEditMode = Boolean(task)

  const [form, setForm] = useState<FormState>(() => {
    const initial = buildInitialState(task)
    if (!task && defaultStatus) {
      initial.status = defaultStatus
    }
    return initial
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [artists, setArtists] = useState<Profile[]>([])
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      if (key === 'title' && errors.title) {
        setErrors((prev) => ({ ...prev, title: undefined }))
      }
    },
    [errors.title]
  )

  useEffect(() => {
    async function loadArtists() {
      setIsLoadingArtists(true)
      const result = await getArtists()
      if (result.data) {
        setArtists(result.data)
      }
      setIsLoadingArtists(false)
    }
    loadArtists()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload: CreateTaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      assigned_to: form.assigned_to || undefined,
      due_date: form.due_date || undefined,
      category: (form.category as TaskCategory) || undefined,
    }

    await onSubmit(payload)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditMode ? 'Editar tarea' : 'Crear nueva tarea'}
    >
      <div className="flex flex-col gap-5">
        {/* Title */}
        <GlassInput
          label="Titulo"
          id="task-title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Ej: Preparar diseno para cliente"
          error={errors.title}
          required
          aria-required="true"
          autoFocus
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="task-description"
            className="text-sm font-medium text-ink-dark/80"
          >
            Descripcion
          </label>
          <div className="relative">
            <AlignLeft
              className="absolute left-3 top-3 h-4 w-4 text-ink-dark/40 pointer-events-none"
              aria-hidden="true"
            />
            <textarea
              id="task-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Detalles adicionales de la tarea..."
              rows={3}
              className={cn(
                glass.input,
                'w-full px-4 pl-10 py-3 text-sm text-ink-dark outline-none resize-none'
              )}
            />
          </div>
        </div>

        {/* Status */}
        <PillSelector<TaskStatus>
          label="Estado"
          value={form.status}
          onChange={(v) => setField('status', v)}
          options={STATUS_OPTIONS}
        />

        {/* Priority */}
        <PillSelector<TaskPriority>
          label="Prioridad"
          value={form.priority}
          onChange={(v) => setField('priority', v)}
          options={PRIORITY_OPTIONS}
        />

        {/* Category */}
        <PillSelector<TaskCategory>
          label="Categoria"
          value={form.category as TaskCategory}
          onChange={(v) => setField('category', v)}
          options={CATEGORY_OPTIONS}
        />

        {/* Assignee */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="task-assigned-to"
            className="text-sm font-medium text-ink-dark/80"
          >
            Asignar a
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-dark/40 pointer-events-none"
              aria-hidden="true"
            />
            <select
              id="task-assigned-to"
              value={form.assigned_to}
              onChange={(e) => setField('assigned_to', e.target.value)}
              className={cn(
                glass.input,
                'w-full h-11 px-4 pl-10 text-sm text-ink-dark outline-none appearance-none cursor-pointer'
              )}
            >
              <option value="">
                {isLoadingArtists ? 'Cargando...' : 'Sin asignar'}
              </option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name ?? 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due date */}
        <GlassInput
          label="Fecha limite"
          id="task-due-date"
          type="date"
          icon={Calendar}
          value={form.due_date}
          onChange={(e) => setField('due_date', e.target.value)}
        />

        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="rounded-xl bg-red-100/60 border border-red-200/60 px-4 py-3 text-sm text-red-700 font-medium"
          >
            {serverError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {onCancel && (
            <GlassButton
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </GlassButton>
          )}
          <GlassButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="flex-1"
          >
            {isEditMode ? 'Guardar cambios' : 'Crear tarea'}
          </GlassButton>
        </div>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// TaskModal — wraps TaskForm in a glass modal dialog
// ---------------------------------------------------------------------------

interface TaskModalProps {
  task?: Task
  defaultStatus?: TaskStatus
  onClose: () => void
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  isSubmitting?: boolean
  serverError?: string | null
}

export function TaskModal({
  task,
  defaultStatus,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
  serverError,
}: TaskModalProps) {
  const isEditMode = Boolean(task)
  const [isDeleting, setIsDeleting] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleDelete = async () => {
    if (!task || !onDelete) return
    setIsDeleting(true)
    await onDelete(task.id)
    setIsDeleting(false)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Editar tarea' : 'Nueva tarea'}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
          'bg-white/40 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-glass-lg',
          'p-6'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink-dark">
            {isEditMode ? 'Editar tarea' : 'Nueva tarea'}
          </h2>

          <div className="flex items-center gap-2">
            {isEditMode && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Eliminar tarea"
                className={cn(
                  'h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold',
                  'bg-red-100/80 text-red-600 border border-red-200/60',
                  'hover:bg-red-200/80 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Eliminar
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center',
                'bg-white/30 border border-white/30 text-ink-dark/50',
                'hover:bg-white/50 hover:text-ink-dark transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <TaskForm
          task={task}
          defaultStatus={defaultStatus}
          onCancel={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      </div>
    </div>
  )
}
