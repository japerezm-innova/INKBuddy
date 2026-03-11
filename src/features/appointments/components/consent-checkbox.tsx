'use client'

interface ConsentCheckboxProps {
  value: boolean
  onChange: (value: boolean) => void
  error?: string
}

export function ConsentCheckbox({ value, onChange, error }: ConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-ink-orange accent-ink-orange focus:ring-ink-orange/30"
        />
        <span className="text-sm text-ink-dark/80 leading-snug">
          El cliente declara conocer y aceptar los riesgos asociados al proceso de tatuaje.{' '}
          <span className="text-ink-dark/50">Ley 19.628 (Chile).</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="ml-7 text-xs text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
