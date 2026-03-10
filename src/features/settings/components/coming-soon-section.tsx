import { Sparkles, Palette, Bell, Calendar, Share2, Globe, type LucideIcon } from 'lucide-react'
import { GlassCard } from '@/shared/components'

interface FeatureCard {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const COMING_SOON_FEATURES: FeatureCard[] = [
  {
    id: 'themes',
    title: 'Temas por Estilo',
    description:
      'Personaliza la interfaz segun tu estilo de tatuaje: dark, neon, minimal, tradicional',
    icon: Palette,
  },
  {
    id: 'push-notifications',
    title: 'Notificaciones Push',
    description: 'Recibe alertas de citas, recordatorios y mensajes de clientes',
    icon: Bell,
  },
  {
    id: 'calendar-sync',
    title: 'Google Calendar',
    description: 'Sincroniza tus citas automaticamente con Google Calendar',
    icon: Calendar,
  },
  {
    id: 'social-api',
    title: 'API de Redes Sociales',
    description: 'Publica automaticamente y mide metricas desde INKBuddy',
    icon: Share2,
  },
  {
    id: 'multi-language',
    title: 'Multi-idioma',
    description: 'Soporte para ingles, espanol y portugues',
    icon: Globe,
  },
]

export function ComingSoonSection() {
  return (
    <section aria-labelledby="coming-soon-heading" className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-ink-orange" aria-hidden="true" />
        <h2 id="coming-soon-heading" className="text-lg font-semibold text-ink-dark">
          Proximamente
        </h2>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COMING_SOON_FEATURES.map(({ id, title, description, icon: Icon }) => (
          <GlassCard key={id} hover={false} className="opacity-70 flex flex-col gap-3">
            {/* Icon container */}
            <div
              className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <Icon className="h-5 w-5 text-ink-dark/70" />
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-ink-dark text-sm">{title}</span>
              <p className="text-sm text-ink-dark/50 leading-relaxed">{description}</p>
            </div>

            {/* Badge */}
            <span className="self-start text-xs px-2 py-0.5 rounded-full bg-ink-orange/15 text-ink-orange/80">
              Proximamente
            </span>
          </GlassCard>
        ))}
      </div>
    </section>
  )
}
