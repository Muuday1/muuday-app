'use client'

import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

function LoginPageContent() {
  return (
    <LoginForm
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta Muuday"
      idPrefix="login-page"
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <LoginPageContent />
    </Suspense>
  )
}
