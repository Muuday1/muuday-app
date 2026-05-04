'use client'

import { Briefcase, User } from 'lucide-react'
import type { Role } from '../types'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'

interface RoleSelectorStepProps {
  role: Role
  redirectPath: string
  onSelectRole: (role: Role) => void
  onContinue: () => void
}

export function RoleSelectorStep({ role, redirectPath, onSelectRole, onContinue }: RoleSelectorStepProps) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-slate-700">Você é:</p>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelectRole('usuario')}
          className={`rounded-md border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30 ${
            role === 'usuario'
              ? 'border-[#9FE870] bg-[#9FE870]/8'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          aria-label="Selecionar conta de usuário"
        >
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white">
            <User className="h-5 w-5 text-[#3d6b1f]" />
          </div>
          <div className="text-sm font-semibold text-slate-900">Sou usuário</div>
          <div className="mt-0.5 text-xs text-slate-500">Busco profissionais brasileiros no exterior</div>
        </button>
        <button
          type="button"
          onClick={() => onSelectRole('profissional')}
          className={`rounded-md border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30 ${
            role === 'profissional'
              ? 'border-[#9FE870] bg-[#9FE870]/8'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          aria-label="Selecionar conta profissional"
        >
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white">
            <Briefcase className="h-5 w-5 text-[#3d6b1f]" />
          </div>
          <div className="text-sm font-semibold text-slate-900">Sou profissional</div>
          <div className="mt-0.5 text-xs text-slate-500">Atendo clientes no exterior</div>
        </button>
      </div>
      <button
        onClick={onContinue}
        className="w-full rounded-md bg-[#9FE870] py-3 font-semibold text-white transition-all hover:bg-[#8ed85f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
      >
        Continuar com e-mail
      </button>

      {role === 'usuario' && (
        <>
          <div className="relative my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">ou cadastre-se com</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <SocialAuthButtons redirectPath={redirectPath} roleHint="usuario" />
        </>
      )}
    </div>
  )
}
