import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const glass = {
  card: 'bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl shadow-glass transition-all duration-300',
  cardHover: 'bg-white/30 backdrop-blur-xl border border-white/25 rounded-3xl shadow-glass transition-all duration-300 hover:shadow-glass-lg hover:bg-white/40',
  button: 'bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl transition-all duration-200',
  input: 'bg-white/15 backdrop-blur-md border border-white/20 focus:border-ink-orange/50 focus:ring-2 focus:ring-ink-orange/20 rounded-xl transition-all duration-200 placeholder:text-gray-400',
  nav: 'bg-white/20 backdrop-blur-2xl border-t border-white/20',
  sidebar: 'bg-white/15 backdrop-blur-2xl border-r border-white/15',
} as const
