import { create } from 'zustand'
import type { CalendarViewMode } from '../types/appointment'

interface AppointmentStore {
  selectedDate: Date
  viewMode: CalendarViewMode
  selectedAppointmentId: string | null
  setSelectedDate: (date: Date) => void
  setViewMode: (mode: CalendarViewMode) => void
  setSelectedAppointmentId: (id: string | null) => void
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  selectedDate: new Date(),
  viewMode: 'week',
  selectedAppointmentId: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedAppointmentId: (id) => set({ selectedAppointmentId: id }),
}))
