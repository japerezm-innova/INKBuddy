'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Task, TaskStatus } from '../types/task'
import { TASK_STATUS_LABELS } from '../types/task'
import { TaskCard } from './task-card'

// ---------------------------------------------------------------------------
// Column header accent colors
// ---------------------------------------------------------------------------

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'bg-ink-orange',
  in_progress: 'bg-ink-coral',
  done: 'bg-emerald-500',
}

const COLUMN_HEADER_TEXT: Record<TaskStatus, string> = {
  todo: 'text-ink-orange',
  in_progress: 'text-ink-coral',
  done: 'text-emerald-600',
}

const COLUMN_COUNT_BG: Record<TaskStatus, string> = {
  todo: 'bg-ink-orange/15 text-ink-orange',
  in_progress: 'bg-ink-coral/15 text-ink-coral',
  done: 'bg-emerald-100/80 text-emerald-700',
}

const COLUMN_DROP_HIGHLIGHT: Record<TaskStatus, string> = {
  todo: 'border-ink-orange/50 bg-ink-orange/5',
  in_progress: 'border-ink-coral/50 bg-ink-coral/5',
  done: 'border-emerald-400/50 bg-emerald-500/5',
}

// ---------------------------------------------------------------------------
// TaskColumn component
// ---------------------------------------------------------------------------

interface TaskColumnProps {
  status: TaskStatus
  tasks: Task[]
  onDrop: (taskId: string, newStatus: TaskStatus) => void
  onAddTask?: (status: TaskStatus) => void
  onTaskClick?: (task: Task) => void
}

export function TaskColumn({
  status,
  tasks,
  onDrop,
  onAddTask,
  onTaskClick,
}: TaskColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    // Only trigger if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      onDrop(taskId, status)
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleAddClick = () => onAddTask?.(status)

  return (
    <section
      aria-label={`Columna ${TASK_STATUS_LABELS[status]}`}
      className="flex flex-col min-w-0"
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn('h-2.5 w-2.5 rounded-full shrink-0', COLUMN_ACCENT[status])}
            aria-hidden="true"
          />
          <h2
            className={cn(
              'text-sm font-bold uppercase tracking-wider',
              COLUMN_HEADER_TEXT[status]
            )}
          >
            {TASK_STATUS_LABELS[status]}
          </h2>
          <span
            className={cn(
              'min-w-[1.4rem] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center',
              COLUMN_COUNT_BG[status]
            )}
            aria-label={`${tasks.length} tareas`}
          >
            {tasks.length}
          </span>
        </div>

        {onAddTask && (
          <button
            onClick={handleAddClick}
            aria-label={`Agregar tarea en ${TASK_STATUS_LABELS[status]}`}
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center',
              'bg-white/30 border border-white/30 text-ink-dark/50',
              'hover:bg-white/50 hover:text-ink-dark transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50'
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        role="region"
        aria-label={`Zona de soltar para ${TASK_STATUS_LABELS[status]}`}
        aria-dropeffect="move"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex-1 rounded-2xl border-2 border-dashed transition-all duration-200',
          'min-h-[200px] p-2 flex flex-col gap-2',
          isDragOver
            ? cn('border-2', COLUMN_DROP_HIGHLIGHT[status])
            : 'border-white/20 bg-white/10'
        )}
      >
        {tasks.length === 0 ? (
          <div
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-8 px-4 text-center',
              isDragOver ? 'opacity-60' : 'opacity-40'
            )}
            aria-hidden="true"
          >
            <span className="text-2xl mb-2">
              {status === 'todo' ? '📋' : status === 'in_progress' ? '⚡' : '✅'}
            </span>
            <p className="text-xs text-ink-dark/50 font-medium">
              {isDragOver ? 'Suelta aqui' : 'Sin tareas'}
            </p>
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={handleDragStart}
                onClick={onTaskClick}
              />
            ))}

            {isDragOver && (
              <div
                className="h-16 rounded-xl border-2 border-dashed border-current/30 flex items-center justify-center"
                aria-hidden="true"
              >
                <p className="text-xs text-ink-dark/40 font-medium">Suelta aqui</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
