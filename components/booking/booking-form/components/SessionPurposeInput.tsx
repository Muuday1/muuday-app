'use client'

interface SessionPurposeInputProps {
  value: string
  onChange: (value: string) => void
  required: boolean
}

export function SessionPurposeInput({ value, onChange, required }: SessionPurposeInputProps) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-6">
      <label className="mb-3 block text-sm font-semibold text-slate-900 font-display">
        Objetivo da sessão{' '}
        <span className="font-normal text-slate-400">
          {required ? '(obrigatório)' : '(opcional)'}
        </span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Descreva brevemente o que você quer trabalhar nesta sessão."
        rows={3}
        maxLength={500}
        className="w-full resize-none rounded-lg border border-slate-200/80 bg-slate-50/30 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 transition-all hover:border-slate-300 focus:border-[#9FE870] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/15"
      />
      <p className="mt-1 text-right text-xs text-slate-400">{value.length}/500</p>
    </div>
  )
}
