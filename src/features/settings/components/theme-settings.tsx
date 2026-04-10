'use client'

import { useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { GlassCard } from '@/shared/components'

export type ThemeId = 'original' | 'blackwork' | 'oldschool' | 'neotrad'

interface ThemeOption {
  id: ThemeId
  name: string
  description: string
  colors: string[] // 4 preview colors
}

const THEMES: ThemeOption[] = [
  {
    id: 'original',
    name: 'INKBuddy Original',
    description: 'Coral y naranjo fresco',
    colors: ['#FF6B35', '#FF8C61', '#FF6B8A', '#FFF5EE'],
  },
  {
    id: 'blackwork',
    name: 'Blackwork',
    description: 'Modo oscuro elegante',
    colors: ['#121218', '#333344', '#666677', '#E0E0E0'],
  },
  {
    id: 'oldschool',
    name: 'Old School',
    description: 'Crema, rojo y verde vintage',
    colors: ['#B83030', '#4A8C5C', '#D4A574', '#F5F0E8'],
  },
  {
    id: 'neotrad',
    name: 'Neo-Traditional',
    description: 'Purpura y dorado vibrante',
    colors: ['#7B3FA0', '#D44B7A', '#D4A44C', '#F8F4FF'],
  },
]

interface Props {
  currentTheme: ThemeId
  onThemeChange: (theme: ThemeId) => Promise<void>
}

export function ThemeSettings({ currentTheme, onThemeChange }: Props) {
  const [selected, setSelected] = useState<ThemeId>(currentTheme)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelect = async (themeId: ThemeId) => {
    if (themeId === selected) return
    setIsLoading(true)
    setSelected(themeId)

    // Apply immediately to DOM + localStorage
    if (themeId === 'original') {
      document.documentElement.removeAttribute('data-theme')
      localStorage.removeItem('inkbuddy-theme')
    } else {
      document.documentElement.setAttribute('data-theme', themeId)
      localStorage.setItem('inkbuddy-theme', themeId)
    }

    try {
      await onThemeChange(themeId)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GlassCard padding="p-5 md:p-6">
      <h2 className="text-base font-bold text-ink-dark mb-1 flex items-center gap-2">
        <Palette className="h-4 w-4 text-ink-orange" />
        Apariencia
      </h2>
      <p className="text-xs text-ink-dark/50 mb-4">
        Elige el estilo visual de tu estudio
      </p>

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const isActive = selected === theme.id
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme.id)}
              disabled={isLoading}
              className={cn(
                'relative flex flex-col items-center p-3 rounded-2xl transition-all duration-200',
                'border-2 text-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange/50',
                'disabled:opacity-60',
                isActive
                  ? 'border-ink-orange bg-ink-orange/10 shadow-warm'
                  : 'border-white/25 bg-white/20 hover:bg-white/35 hover:border-white/40'
              )}
            >
              {/* Color preview circles */}
              <div className="flex gap-1.5 mb-2.5">
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <p className="text-xs font-bold text-ink-dark leading-tight">
                {theme.name}
              </p>
              <p className="text-[10px] text-ink-dark/50 mt-0.5">
                {theme.description}
              </p>

              {/* Selected check */}
              {isActive && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-ink-orange flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
