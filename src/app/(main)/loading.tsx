export default function MainLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-3 border-ink-orange/30 border-t-ink-orange animate-spin" />
        <span className="text-sm text-ink-dark/50">Cargando...</span>
      </div>
    </div>
  )
}
