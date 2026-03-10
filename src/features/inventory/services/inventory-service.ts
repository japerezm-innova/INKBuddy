'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/features/auth/types/auth'
import type {
  CreateInventoryInput,
  InventoryCategory,
  InventoryItem,
  InventoryUsage,
  LogUsageInput,
} from '../types/inventory'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const inventoryCategorySchema = z.enum([
  'ink',
  'needle',
  'supply',
  'aftercare',
  'equipment',
  'other',
])

const createInventorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  category: inventoryCategorySchema,
  current_stock: z.number().nonnegative().optional().default(0),
  minimum_stock: z.number().nonnegative().optional().default(0),
  unit: z.string().max(50).optional().default('unidad'),
  cost_per_unit: z.number().nonnegative().optional(),
  supplier: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
})

const updateInventorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: inventoryCategorySchema.optional(),
  current_stock: z.number().nonnegative().optional(),
  minimum_stock: z.number().nonnegative().optional(),
  unit: z.string().max(50).optional(),
  cost_per_unit: z.number().nonnegative().optional(),
  supplier: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
})

const logUsageSchema = z.object({
  item_id: z.string().uuid('ID de item inválido'),
  quantity_used: z.number().positive('La cantidad debe ser mayor a 0'),
  appointment_id: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Inventory Items
// ---------------------------------------------------------------------------

export interface GetInventoryFilter {
  category?: InventoryCategory
  lowStockOnly?: boolean
}

export async function getInventoryItems(
  filter?: GetInventoryFilter
): Promise<{ data?: InventoryItem[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .order('name', { ascending: true })

  if (filter?.category) {
    const parsed = inventoryCategorySchema.safeParse(filter.category)
    if (parsed.success) {
      query = query.eq('category', parsed.data)
    }
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  let items = (data ?? []) as InventoryItem[]

  if (filter?.lowStockOnly) {
    items = items.filter((item) => item.current_stock <= item.minimum_stock)
  }

  return { data: items }
}

export async function getInventoryItemById(
  id: string
): Promise<{ data?: InventoryItem; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as InventoryItem }
}

export async function createInventoryItem(
  input: CreateInventoryInput
): Promise<{ data?: InventoryItem; error?: string }> {
  const parsed = createInventorySchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      ...parsed.data,
      studio_id: profile.studio_id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inventory')

  return { data: data as InventoryItem }
}

export async function updateInventoryItem(
  id: string,
  input: Partial<CreateInventoryInput>
): Promise<{ data?: InventoryItem; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const parsed = updateInventorySchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)

  return { data: data as InventoryItem }
}

export async function deleteInventoryItem(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: 'ID requerido' }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  // Only owners can delete inventory items
  if (profile.role !== 'owner') {
    return { error: 'Solo el propietario puede eliminar items de inventario' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('studio_id', profile.studio_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inventory')

  return {}
}

export async function logUsage(
  input: LogUsageInput
): Promise<{ data?: InventoryUsage; error?: string }> {
  const parsed = logUsageSchema.safeParse(input)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? 'Datos inválidos' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_usage')
    .insert({
      studio_id: profile.studio_id,
      item_id: parsed.data.item_id,
      quantity_used: parsed.data.quantity_used,
      appointment_id: parsed.data.appointment_id ?? null,
      used_by: profile.id,
      used_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inventory')

  return { data: data as InventoryUsage }
}

export async function getUsageLog(
  itemId?: string
): Promise<{ data?: InventoryUsage[]; error?: string }> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  let query = supabase
    .from('inventory_usage')
    .select(
      `
      *,
      item:inventory_items!item_id(name, category),
      user:profiles!used_by(full_name)
    `
    )
    .eq('studio_id', profile.studio_id)
    .order('used_at', { ascending: false })
    .limit(100)

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: (data ?? []) as InventoryUsage[] }
}

export async function getLowStockItems(): Promise<{
  data?: InventoryItem[]
  error?: string
}> {
  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('studio_id', profile.studio_id)
    .order('name', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  const lowStock = ((data ?? []) as InventoryItem[]).filter(
    (item) => item.current_stock <= item.minimum_stock
  )

  return { data: lowStock }
}

export async function adjustStock(
  id: string,
  newStock: number
): Promise<{ data?: InventoryItem; error?: string }> {
  if (!id) return { error: 'ID requerido' }

  if (newStock < 0) {
    return { error: 'El stock no puede ser negativo' }
  }

  const { profile, error: authError } = await getAuthenticatedProfile()
  if (authError || !profile) return { error: authError ?? 'No autenticado' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('studio_id', profile.studio_id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)

  return { data: data as InventoryItem }
}
