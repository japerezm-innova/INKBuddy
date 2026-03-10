'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type {
  Task,
  TaskStatus,
  TaskCategory,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderUpdate,
} from '../types/task'
import type { Profile } from '@/features/auth/types/auth'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const taskStatusSchema = z.enum(['todo', 'in_progress', 'done'])
const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
const taskCategorySchema = z.enum([
  'design_prep',
  'studio_task',
  'client_followup',
  'inventory',
  'other',
])

const createTaskSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido').max(300),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().optional(),
  category: taskCategorySchema.optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().optional(),
  category: taskCategorySchema.optional(),
  sort_order: z.number().int().min(0).optional(),
})

const reorderUpdateSchema = z.object({
  id: z.string().uuid(),
  sort_order: z.number().int().min(0),
  status: taskStatusSchema,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TASK_SELECT = `
  *,
  assignee:profiles!assigned_to(id, full_name, avatar_url)
` as const

type AuthProfileResult =
  | { profile: Profile; error: null }
  | { profile: null; error: string }

async function getAuthenticatedProfile(): Promise<AuthProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { profile: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'Perfil no encontrado' }
  }

  return { profile: data as Profile, error: null }
}

// ---------------------------------------------------------------------------
// Task Service
// ---------------------------------------------------------------------------

export interface GetTasksFilters {
  status?: TaskStatus
  category?: TaskCategory
  assignedTo?: string
}

export async function getTasks(
  filters?: GetTasksFilters
): Promise<{ data?: Task[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('studio_id', profile.studio_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as Task[] }
}

export async function createTask(
  input: CreateTaskInput
): Promise<{ data?: Task; error?: string }> {
  const parsed = createTaskSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos invalidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Get the highest sort_order for the target status column
  const { data: existing } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('studio_id', profile.studio_id)
    .eq('status', parsed.data.status ?? 'todo')
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxSortOrder =
    existing && existing.length > 0
      ? ((existing[0] as { sort_order: number }).sort_order ?? 0) + 1
      : 0

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...parsed.data,
      studio_id: profile.studio_id,
      sort_order: maxSortOrder,
    })
    .select(TASK_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')

  return { data: data as Task }
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<{ data?: Task; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = updateTaskSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos invalidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select(TASK_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')

  return { data: data as Task }
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<{ data?: Task; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = taskStatusSchema.safeParse(status)
  if (!parsed.success) return { error: 'Estado invalido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Get new sort_order at the end of the target column
  const { data: existing } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('studio_id', profile.studio_id)
    .eq('status', parsed.data)
    .order('sort_order', { ascending: false })
    .limit(1)

  const newSortOrder =
    existing && existing.length > 0
      ? ((existing[0] as { sort_order: number }).sort_order ?? 0) + 1
      : 0

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: parsed.data,
      sort_order: newSortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select(TASK_SELECT)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')

  return { data: data as Task }
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('studio_id', profile.studio_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')

  return {}
}

export async function reorderTasks(
  updates: ReorderUpdate[]
): Promise<{ error?: string }> {
  if (!updates || updates.length === 0) return {}

  const parsed = z.array(reorderUpdateSchema).safeParse(updates)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos de reorden invalidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  // Batch update using Promise.all
  const updatePromises = parsed.data.map(({ id, sort_order, status }) =>
    supabase
      .from('tasks')
      .update({
        sort_order,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('studio_id', profile.studio_id)
  )

  const results = await Promise.all(updatePromises)

  const firstErrorResult = results.find((r) => r.error)
  if (firstErrorResult?.error) {
    return { error: firstErrorResult.error.message }
  }

  revalidatePath('/tasks')

  return {}
}
