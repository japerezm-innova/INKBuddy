import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'
import { ProGate } from '@/shared/components'
import { ServiceRecipeEditor } from '@/features/inventory/components/service-recipe-editor'

export const metadata = {
  title: 'Recetas de Insumos | INKBuddy',
  description: 'Configura que materiales se gastan por cada tipo de servicio.',
}

export default function RecipesPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <ProGate>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-sm text-ink-dark/60 hover:text-ink-orange transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a inventario
        </Link>

        <header className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-dark">Recetas de Insumos</h1>
            <p className="text-xs text-ink-dark/50 mt-0.5">
              Define que materiales se gastan por cada servicio
            </p>
          </div>
        </header>

        <ServiceRecipeEditor />
      </ProGate>
    </div>
  )
}
