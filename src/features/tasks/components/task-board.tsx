'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, SlidersHorizontal, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassButton } from '@/shared/components'
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../services/task-service'
import { useTaskStore } from '../store/task-store'
import { TaskColumn } from './task-column'
import { TaskModal } from './task-form'
import type {
  Task,
  TaskStatus,
  TaskCategory,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types/task'
import { TASK_CATEGORY_LABELS } from '../types/task'

// ---------------------------------------------------------------------------
// Category filter chips
// ---------------------------------------------------------------------------

const ALL_CATEGORIES: TaskCategory[] = [
  'design_prep',
  'studio_task',
  'client_followup',
  'inventory',
  'other',
]

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

// ---------------------------------------------------------------------------
// TaskBoard
// ---------------------------------------------------------------------------

export function TaskBoard() {
  const {
    tasks,
    setTasks,
    updateTaskLocally,
    addTaskLocally,
    removeTaskLocally,
    filterCategory,
    setFilterCategory,
  } = useTaskStore()

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Load tasks
  // ---------------------------------------------------------------------------

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    const result = await getTasks()
    if (result.error) {
      setLoadError(result.error)
    } else {
      setTasks(result.data ?? [])
    }
    setIsLoading(false)
  }, [setTasks])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const visibleTasks = filterCategory
    ? tasks.filter((t) => t.category === filterCategory)
    : tasks

  const tasksByStatus = COLUMN_ORDER.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = visibleTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.sort_order - b.sort_order)
      return acc
    },
    { todo: [], in_progress: [], done: [] }
  )

  // ---------------------------------------------------------------------------
  // Drag and drop handler
  // ---------------------------------------------------------------------------

  const handleDrop = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.status === newStatus) return

      // Optimistic update
      updateTaskLocally(taskId, { status: newStatus })

      const result = await updateTaskStatus(taskId, newStatus)
      if (result.error) {
        // Rollback
        updateTaskLocally(taskId, { status: task.status })
        console.error('Error al mover tarea:', result.error)
      } else if (result.data) {
        // Sync with server data
        updateTaskLocally(taskId, result.data)
      }
    },
    [tasks, updateTaskLocally]
  )

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = useCallback((status: TaskStatus = 'todo') => {
    setEditingTask(undefined)
    setDefaultStatus(status)
    setSubmitError(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task)
    setSubmitError(null)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingTask(undefined)
    setSubmitError(null)
  }, [])

  const handleSubmit = useCallback(
    async (input: CreateTaskInput | UpdateTaskInput) => {
      setIsSubmitting(true)
      setSubmitError(null)

      if (editingTask) {
        const result = await updateTask(editingTask.id, input as UpdateTaskInput)
        if (result.error) {
          setSubmitError(result.error)
        } else if (result.data) {
          updateTaskLocally(editingTask.id, result.data)
          closeModal()
        }
      } else {
        const result = await createTask(input as CreateTaskInput)
        if (result.error) {
          setSubmitError(result.error)
        } else if (result.data) {
          addTaskLocally(result.data)
          closeModal()
        }
      }

      setIsSubmitting(false)
    },
    [editingTask, updateTaskLocally, addTaskLocally, closeModal]
  )

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      removeTaskLocally(taskId)

      const result = await deleteTask(taskId)
      if (result.error) {
        // Re-load to restore state on error
        console.error('Error al eliminar tarea:', result.error)
        loadTasks()
      }
    },
    [removeTaskLocally, loadTasks]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4"
        role="status"
        aria-label="Cargando tablero de tareas"
      >
        <Loader2 className="h-8 w-8 animate-spin text-ink-orange" aria-hidden="true" />
        <p className="text-sm text-ink-dark/60 font-medium">Cargando tareas...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <div className="rounded-2xl bg-red-100/60 border border-red-200/60 px-6 py-4 text-sm text-red-700 font-medium max-w-sm text-center">
          <p className="font-semibold mb-1">Error al cargar tareas</p>
          <p className="opacity-80">{loadError}</p>
        </div>
        <GlassButton variant="secondary" size="sm" onClick={loadTasks}>
          Reintentar
        </GlassButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ----------------------------------------------------------------- */}
      {/* Toolbar                                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Category filters */}
        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="flex items-center gap-2 flex-wrap"
        >
          <SlidersHorizontal
            className="h-4 w-4 text-ink-dark/40 shrink-0"
            aria-hidden="true"
          />

          <button
            onClick={() => setFilterCategory(null)}
            aria-pressed={filterCategory === null}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
              filterCategory === null
                ? 'gradient-accent text-white shadow-sm'
                : 'bg-white/30 border border-white/30 text-ink-dark/70 hover:bg-white/50'
            )}
          >
            Todas
          </button>

          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? null : cat)
              }
              aria-pressed={filterCategory === cat}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                filterCategory === cat
                  ? 'gradient-accent text-white shadow-sm'
                  : 'bg-white/30 border border-white/30 text-ink-dark/70 hover:bg-white/50'
              )}
            >
              {TASK_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="hidden sm:block flex-1" />

        {/* New task button */}
        <GlassButton
          variant="primary"
          size="sm"
          onClick={() => openCreateModal('todo')}
          aria-label="Crear nueva tarea"
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva tarea
        </GlassButton>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Kanban board                                                        */}
      {/* ----------------------------------------------------------------- */}
      <main
        aria-label="Tablero Kanban"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
      >
        {COLUMN_ORDER.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onDrop={handleDrop}
            onAddTask={openCreateModal}
            onTaskClick={openEditModal}
          />
        ))}
      </main>

      {/* ----------------------------------------------------------------- */}
      {/* Create / Edit modal                                                 */}
      {/* ----------------------------------------------------------------- */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={editingTask ? handleDeleteTask : undefined}
          isSubmitting={isSubmitting}
          serverError={submitError}
        />
      )}
    </div>
  )
}
