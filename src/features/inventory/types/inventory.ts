export type InventoryCategory =
  | 'ink'
  | 'needle'
  | 'supply'
  | 'aftercare'
  | 'equipment'
  | 'other'

export interface InventoryItem {
  id: string
  studio_id: string
  name: string
  category: InventoryCategory
  current_stock: number
  minimum_stock: number
  unit: string
  cost_per_unit: number | null
  supplier: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryUsage {
  id: string
  studio_id: string
  item_id: string
  appointment_id: string | null
  quantity_used: number
  used_by: string | null
  used_at: string
  item?: { name: string; category: InventoryCategory }
  user?: { full_name: string | null }
}

export interface CreateInventoryInput {
  name: string
  category: InventoryCategory
  current_stock?: number
  minimum_stock?: number
  unit?: string
  cost_per_unit?: number
  supplier?: string
  notes?: string
}

export interface LogUsageInput {
  item_id: string
  quantity_used: number
  appointment_id?: string
}
