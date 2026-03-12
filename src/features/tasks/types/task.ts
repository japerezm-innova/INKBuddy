export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory =
  | 'design_prep'
  | 'studio_task'
  | 'client_followup'
  | 'inventory'
  | 'social_media'
  | 'other'

export interface Task {
  id: string
  studio_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  due_date: string | null
  category: TaskCategory | null
  sort_order: number
  created_at: string
  updated_at: string
  assignee?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  due_date?: string
  category?: TaskCategory
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  sort_order?: number
}

export interface ReorderUpdate {
  id: string
  sort_order: number
  status: TaskStatus
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Por Hacer',
  in_progress: 'En Progreso',
  done: 'Completado',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  design_prep: 'Preparacion diseno',
  studio_task: 'Tarea del estudio',
  client_followup: 'Seguimiento cliente',
  inventory: 'Inventario',
  social_media: 'Redes sociales',
  other: 'Otro',
}
