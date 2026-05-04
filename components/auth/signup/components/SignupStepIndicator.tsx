'use client'

interface SignupStepIndicatorProps {
  step: number
  totalSteps: number
}

export function SignupStepIndicator({ step, totalSteps }: SignupStepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i + 1 <= step ? 'bg-[#9FE870]' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Passo {step} de {totalSteps}
        {step === 1 && ' — Escolha seu perfil'}
        {step === 2 && ' — Dados pessoais'}
        {step === 3 && ' — Dados profissionais'}
      </p>
    </div>
  )
}
