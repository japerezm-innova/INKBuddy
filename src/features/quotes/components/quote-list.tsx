'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { QuoteCard } from './quote-card'
import type { Quote, QuoteStatus } from '../types/quote'

interface Props {
  quotes: Quote[]
}

type TabFilter = 'all' | QuoteStatus

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'Todas',     value: 'all' },
  { label: 'Borradores', value: 'draft' },
  { label: 'Enviadas',  value: 'sent' },
  { label: 'Aceptadas', value: 'accepted' },
]

export function QuoteList({ quotes }: Props) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all')

  const filtered = activeTab === 'all'
    ? quotes
    : quotes.filter((q) => q.status === activeTab)

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-ink-orange text-white'
                : 'bg-white/30 text-ink-dark/60 hover:bg-white/50'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1 opacity-70">
                ({quotes.filter((q) => q.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FileText className="h-10 w-10 text-ink-dark/20" />
          <p className="text-sm text-ink-dark/40">
            {activeTab === 'all'
              ? 'Aún no tienes cotizaciones'
              : 'No hay cotizaciones en esta categoría'}
          </p>
          {activeTab === 'all' && (
            <Link
              href="/quotes/new"
              className="mt-1 text-xs font-medium text-ink-orange hover:underline"
            >
              Crear primera cotización
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}

      {/* FAB mobile */}
      <Link
        href="/quotes/new"
        className="fixed bottom-24 right-4 z-50 md:hidden flex items-center justify-center h-14 w-14 rounded-full bg-ink-orange shadow-lg shadow-ink-orange/30 text-white"
        aria-label="Nueva cotización"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
