export interface AnalyticsData {
  revenue: {
    thisMonth: number
    lastMonth: number
    trend: number // percentage change
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
  }
  demographics: {
    gender: { label: string; value: number; color: string }[]
    source: { label: string; value: number; color: string }[]
    topProfessions: { label: string; value: number }[]
  }
  topServices: { name: string; count: number }[]
  revenueByArtist: { name: string; revenue: number }[]
  appointmentsByDay: { date: string; count: number }[]
}

export interface DateRange {
  from: string // ISO date
  to: string   // ISO date
}

export type DateRangePreset = 'last7' | 'last30' | 'thisMonth' | 'last3months'
