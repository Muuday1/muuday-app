'use client'

import { Shield, Lock, Eye, LogOut } from 'lucide-react'

interface SecuritySettingsProps {
  onOpenPassword: () => void
  onOpenVisibility: () => void
  onSignOut: () => void
}

export function SecuritySettings({
  onOpenPassword,
  onOpenVisibility,
  onSignOut,
}: SecuritySettingsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-50 px-6 py-4">
        <Shield className="h-4 w-4 text-brand-500" />
        <h2 className="font-display font-bold text-neutral-900">Segurança</h2>
      </div>
      <div className="divide-y divide-neutral-50">
        <button
          type="button"
          onClick={onOpenPassword}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-50/50"
        >
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-neutral-300" />
            <div>
              <p className="text-sm font-medium text-neutral-700">Alterar senha</p>
              <p className="mt-0.5 text-xs text-neutral-400">Redireciona para redefinição</p>
            </div>
          </div>
          <span className="text-sm text-neutral-400">→</span>
        </button>
        <button
          type="button"
          onClick={onOpenVisibility}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-50/50"
        >
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-neutral-300" />
            <div>
              <p className="text-sm font-medium text-neutral-700">Visibilidade do perfil</p>
              <p className="mt-0.5 text-xs text-neutral-400">Controle como os clientes te veem</p>
            </div>
          </div>
          <span className="text-sm text-neutral-400">→</span>
        </button>
      </div>

      <div className="border-t border-neutral-50 px-6 py-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/40 px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
