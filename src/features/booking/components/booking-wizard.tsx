'use client'

import { useCallback, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassCard, GlassButton } from '@/shared/components'
import { useBookingStore } from '../store/booking-store'
import { ArtistSelector } from './artist-selector'
import { ServiceSelector } from './service-selector'
import { DateTimePicker } from './date-time-picker'
import { BookingDetailsForm } from './booking-details-form'
import { BookingConfirmation } from './booking-confirmation'
import type { BookingStep, BookingFormData, PublicArtist, PublicService } from '../types/booking'

// ---------------------------------------------------------------------------
// Step configuration
// ---------------------------------------------------------------------------

interface StepConfig {
  id: BookingStep
  label: string
  shortLabel: string
}

const STEPS: StepConfig[] = [
  { id: 'artist', label: 'Artista', shortLabel: '1' },
  { id: 'service', label: 'Servicio', shortLabel: '2' },
  { id: 'datetime', label: 'Fecha y Hora', shortLabel: '3' },
  { id: 'details', label: 'Tus Datos', shortLabel: '4' },
  { id: 'confirmation', label: 'Confirmacion', shortLabel: '5' },
]

const STEP_ORDER: BookingStep[] = ['artist', 'service', 'datetime', 'details', 'confirmation']

function getStepIndex(step: BookingStep): number {
  return STEP_ORDER.indexOf(step)
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

interface StepIndicatorProps {
  currentStep: BookingStep
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep)

  return (
    <nav aria-label="Pasos del proceso de reserva" className="w-full mb-6">
      <ol className="flex items-center justify-between w-full">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300',
                    isCompleted
                      ? 'gradient-accent text-white border-transparent shadow-warm'
                      : isActive
                      ? 'bg-white border-ink-orange text-ink-orange shadow-warm'
                      : 'bg-white/30 border-white/40 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 10 10" className="h-4 w-4 text-white" fill="currentColor">
                      <path
                        d="M2 5l2.5 2.5 3.5-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'hidden sm:block text-xs mt-1 font-medium transition-colors duration-200 whitespace-nowrap',
                    isActive ? 'text-ink-orange' : isCompleted ? 'text-ink-dark/60' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 h-0.5 mx-1 sm:mx-2 transition-all duration-300 rounded-full',
                    index < currentIndex ? 'bg-ink-orange' : 'bg-white/30'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

type FieldErrors = Partial<Record<keyof BookingFormData, string>>

function validateStep(step: BookingStep, formData: BookingFormData): FieldErrors {
  const errors: FieldErrors = {}

  if (step === 'artist' && !formData.artistId) {
    errors.artistId = 'Selecciona un artista para continuar'
  }

  if (step === 'service' && !formData.serviceId) {
    errors.serviceId = 'Selecciona un servicio para continuar'
  }

  if (step === 'datetime') {
    if (!formData.date) errors.date = 'Selecciona una fecha'
    if (!formData.startTime) errors.startTime = 'Selecciona un horario'
  }

  if (step === 'details') {
    if (!formData.clientName || formData.clientName.trim().length < 2) {
      errors.clientName = 'Ingresa tu nombre completo (min. 2 caracteres)'
    }
    if (!formData.clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      errors.clientEmail = 'Ingresa un correo electronico valido'
    }
    if (!formData.clientPhone || formData.clientPhone.trim().length < 6) {
      errors.clientPhone = 'Ingresa un numero de telefono valido'
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Step title & subtitle
// ---------------------------------------------------------------------------

function getStepTitle(step: BookingStep): { title: string; subtitle: string } {
  const map: Record<BookingStep, { title: string; subtitle: string }> = {
    artist: {
      title: 'Elige tu artista',
      subtitle: 'Selecciona el artista con quien deseas agendar tu sesion',
    },
    service: {
      title: 'Selecciona el servicio',
      subtitle: 'Elige el tipo de trabajo que deseas realizar',
    },
    datetime: {
      title: 'Fecha y horario',
      subtitle: 'Escoge el dia y la hora que mejor te convenga',
    },
    details: {
      title: 'Tus datos de contacto',
      subtitle: 'Necesitamos esta informacion para confirmar tu cita',
    },
    confirmation: {
      title: 'Confirma tu reserva',
      subtitle: 'Revisa todos los detalles antes de confirmar',
    },
  }
  return map[step]
}

// ---------------------------------------------------------------------------
// Booking Wizard
// ---------------------------------------------------------------------------

export function BookingWizard() {
  const { currentStep, formData, setStep, updateFormData, reset } = useBookingStore()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const currentIndex = getStepIndex(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === STEP_ORDER.length - 1

  const { title, subtitle } = getStepTitle(currentStep)

  function handleNext() {
    const errors = validateStep(currentStep, formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    const nextStep = STEP_ORDER[currentIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  function handleBack() {
    setFieldErrors({})
    const prevStep = STEP_ORDER[currentIndex - 1]
    if (prevStep) setStep(prevStep)
  }

  const handleArtistSelect = useCallback(
    (artist: PublicArtist) => {
      updateFormData({
        artistId: artist.id,
        artistName: artist.full_name ?? 'Artista',
      })
      setFieldErrors({})
    },
    [updateFormData]
  )

  const handleServiceSelect = useCallback(
    (service: PublicService) => {
      updateFormData({
        serviceId: service.id,
        serviceName: service.name,
        serviceDurationMinutes: service.duration_minutes,
      })
      setFieldErrors({})
    },
    [updateFormData]
  )

  const handleDateTimeSelect = useCallback(
    (date: string, startTime: string, endTime: string) => {
      updateFormData({ date, startTime, endTime })
      setFieldErrors({})
    },
    [updateFormData]
  )

  // Inline validation error for artist/service/datetime steps
  const stepLevelError =
    fieldErrors.artistId ?? fieldErrors.serviceId ?? fieldErrors.date ?? fieldErrors.startTime

  return (
    <GlassCard hover={false} padding="p-6">
      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-ink-dark">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Step content */}
      <div className="min-h-[280px]">
        {currentStep === 'artist' && (
          <ArtistSelector
            selectedArtistId={formData.artistId}
            onSelect={handleArtistSelect}
          />
        )}

        {currentStep === 'service' && (
          <ServiceSelector
            selectedServiceId={formData.serviceId}
            onSelect={handleServiceSelect}
          />
        )}

        {currentStep === 'datetime' && (
          <DateTimePicker
            artistId={formData.artistId}
            durationMinutes={formData.serviceDurationMinutes}
            selectedDate={formData.date}
            selectedStartTime={formData.startTime}
            onSelect={handleDateTimeSelect}
          />
        )}

        {currentStep === 'details' && (
          <BookingDetailsForm
            formData={formData}
            onChange={updateFormData}
            errors={fieldErrors}
          />
        )}

        {currentStep === 'confirmation' && (
          <BookingConfirmation formData={formData} onReset={reset} />
        )}
      </div>

      {/* Step-level validation error */}
      {stepLevelError && currentStep !== 'details' && (
        <p role="alert" className="mt-4 text-sm text-center text-red-500 font-medium">
          {stepLevelError}
        </p>
      )}

      {/* Navigation buttons — not shown on confirmation step (it has its own CTA) */}
      {!isLastStep && (
        <div
          className={cn(
            'flex mt-6 gap-3',
            isFirstStep ? 'justify-end' : 'justify-between'
          )}
        >
          {!isFirstStep && (
            <GlassButton variant="secondary" size="md" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Atras
            </GlassButton>
          )}

          <GlassButton variant="primary" size="md" onClick={handleNext}>
            {currentIndex === STEP_ORDER.length - 2 ? 'Ver resumen' : 'Continuar'}
          </GlassButton>
        </div>
      )}

      {/* Back button on confirmation step */}
      {isLastStep && (
        <div className="mt-4">
          <GlassButton variant="ghost" size="sm" onClick={handleBack} className="text-gray-500">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Editar datos
          </GlassButton>
        </div>
      )}
    </GlassCard>
  )
}
