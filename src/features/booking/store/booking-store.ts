import { create } from 'zustand'
import type { BookingStep, BookingFormData } from '../types/booking'

const INITIAL_FORM_DATA: BookingFormData = {
  artistId: '',
  artistName: '',
  serviceId: '',
  serviceName: '',
  serviceDurationMinutes: 60,
  date: '',
  startTime: '',
  endTime: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  bodyPlacement: '',
  notes: '',
  designReferenceUrls: '',
}

interface BookingStore {
  currentStep: BookingStep
  formData: BookingFormData
  setStep: (step: BookingStep) => void
  updateFormData: (data: Partial<BookingFormData>) => void
  reset: () => void
}

export const useBookingStore = create<BookingStore>((set) => ({
  currentStep: 'artist',
  formData: INITIAL_FORM_DATA,

  setStep: (step) => set({ currentStep: step }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  reset: () =>
    set({
      currentStep: 'artist',
      formData: INITIAL_FORM_DATA,
    }),
}))
