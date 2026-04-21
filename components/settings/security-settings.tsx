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
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100/80 px-6 py-4">
        <Shield className="h-4 w-4 text-[#9FE870]" />
        <h2 className="font-display font-bold text-slate-900">Segurança</h2>
      </div>
      <div className="divide-y divide-slate-100/80">
        <button
          type="button"
          onClick={onOpenPassword}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50/70/50"
        >
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-slate-300" />
            <div>
              <p className="text-sm font-medium text-slate-700">Alterar senha</p>
              <p className="mt-0.5 text-xs text-slate-400">Redireciona para redefinição</p>
            </div>
          </div>
          <span className="text-sm text-slate-400">→</span>
        </button>
        <button
          type="button"
          onClick={onOpenVisibility}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50/70/50"
        >
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-slate-300" />
            <div>
              <p className="text-sm font-medium text-slate-700">Visibilidade do perfil</p>
              <p className="mt-0.5 text-xs text-slate-400">Controle como os clientes te veem</p>
            </div>
          </div>
          <span className="text-sm text-slate-400">→</span>
        </button>
      </div>

      <div className="border-t border-slate-100/80 px-6 py-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50/40 px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
