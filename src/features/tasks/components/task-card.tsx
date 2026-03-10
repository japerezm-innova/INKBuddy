'use client'

import { Calendar, AlertCircle, Tag } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { cn } from '@/shared/lib/utils'
import type { Task, TaskPriority, TaskCategory } from '../types/task'
import {
  TASK_PRIORITY_LABELS,
  TASK_CATEGORY_LABELS,
} from '../types/task'

// ---------------------------------------------------------------------------
// Priority badge styles
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-gray-100/80 text-gray-600 border-gray-200/60',
  medium: 'bg-blue-100/80 text-blue-700 border-blue-200/60',
  high: 'bg-orange-100/80 text-orange-700 border-orange-200/60',
  urgent: 'bg-red-100/80 text-red-700 border-red-200/60',
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

// ---------------------------------------------------------------------------
// Category tag styles
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<TaskCategory, string> = {
  design_prep: 'bg-purple-100/80 text-purple-700',
  studio_task: 'bg-ink-orange/10 text-ink-orange',
  client_followup: 'bg-emerald-100/80 text-emerald-700',
  inventory: 'bg-amber-100/80 text-amber-700',
  other: 'bg-gray-100/80 text-gray-600',
}

// ---------------------------------------------------------------------------
// Assignee avatar
// ---------------------------------------------------------------------------

interface AssigneeAvatarProps {
  fullName: string | null
  avatarUrl: string | null
}

function AssigneeAvatar({ fullName, avatarUrl }: AssigneeAvatarProps) {
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={fullName ?? 'Asignado'}
        className="h-6 w-6 rounded-full object-cover ring-1 ring-white/40"
      />
    )
  }

  return (
    <span
      className="h-6 w-6 rounded-full bg-gradient-to-br from-ink-orange to-ink-pink flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-white/40"
      aria-label={fullName ?? 'Asignado'}
    >
      {initials}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Task Card
// ---------------------------------------------------------------------------

interface TaskCardProps {
  task: Task
  onDragStart: (e: React.DragEvent<HTMLElement>, taskId: string) => void
  onClick?: (task: Task) => void
}

export function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
  const hasDueDate = Boolean(task.due_date)
  const dueDate = hasDueDate ? parseISO(task.due_date!) : null

  const isOverdue =
    dueDate && task.status !== 'done' && isPast(dueDate) && !isToday(dueDate)
  const isDueToday = dueDate && isToday(dueDate)

  const dueDateLabel = dueDate
    ? isToday(dueDate)
      ? 'Hoy'
      : format(dueDate, 'dd MMM')
    : null

  const handleClick = () => onClick?.(task)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(task)
    }
  }

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={0}
      role="button"
      aria-label={`Tarea: ${task.title}. Prioridad ${TASK_PRIORITY_LABELS[task.priority]}. Arrastra para mover.`}
      className={cn(
        'group relative bg-white/35 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass',
        'p-3.5 cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'hover:bg-white/50 hover:shadow-glass-lg hover:scale-[1.01]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
        'select-none'
      )}
    >
      {/* Priority indicator bar */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-full',
          PRIORITY_DOT[task.priority]
        )}
        aria-hidden="true"
      />

      <div className="pl-3">
        {/* Top row: priority badge + category */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border',
              PRIORITY_STYLES[task.priority]
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])}
              aria-hidden="true"
            />
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>

          {task.category && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium',
                CATEGORY_STYLES[task.category]
              )}
            >
              <Tag className="h-2.5 w-2.5" aria-hidden="true" />
              {TASK_CATEGORY_LABELS[task.category]}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-ink-dark leading-snug mb-1 line-clamp-2">
          {task.title}
        </h3>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-ink-dark/55 line-clamp-2 leading-relaxed mb-2">
            {task.description}
          </p>
        )}

        {/* Footer: due date + assignee */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Due date */}
          {dueDate ? (
            <time
              dateTime={task.due_date ?? undefined}
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium',
                isOverdue
                  ? 'text-red-600'
                  : isDueToday
                  ? 'text-orange-600'
                  : 'text-ink-dark/50'
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
              ) : (
                <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              )}
              {dueDateLabel}
            </time>
          ) : (
            <span />
          )}

          {/* Assignee */}
          {task.assignee && (
            <AssigneeAvatar
              fullName={task.assignee.full_name}
              avatarUrl={task.assignee.avatar_url}
            />
          )}
        </div>
      </div>
    </article>
  )
}
