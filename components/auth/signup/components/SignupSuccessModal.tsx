'use client'

import { AUTH_MESSAGES } from '@/lib/auth/messages'
import type { Role } from '../types'

interface SignupSuccessModalProps {
  role: Role
  email: string
  signupSuccessEmail: string
  onConfirm: () => void
}

export function SignupSuccessModal({ role, email, signupSuccessEmail, onConfirm }: SignupSuccessModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmação de cadastro"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        {role === 'profissional' ? (
          <>
            <h2 className="font-display text-xl font-bold text-slate-900">Cadastro enviado para analise</h2>
            <p className="mt-2 text-sm text-slate-600">
              Recebemos seus dados profissionais. Nossa equipe vai revisar as informacoes e validar sua especialidade.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Voce recebera um e-mail em{' '}
              <span className="font-semibold text-slate-800">{signupSuccessEmail || email}</span> quando for aprovado para completar as demais informacoes e finalizar a ativacao da conta profissional.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Dica: verifique tambem sua caixa de spam e promocoes para nao perder o e-mail de aprovacao.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-slate-900">{AUTH_MESSAGES.signup.successTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enviamos um e-mail para{' '}
              <span className="font-semibold text-slate-800">{signupSuccessEmail || email}</span>.
              {` ${AUTH_MESSAGES.signup.successDescription}`}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Se nao encontrar, confira tambem a pasta de spam/lixo eletronico.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-md bg-[#9FE870] py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ed85f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          OK
        </button>
      </div>
    </div>
  )
}
