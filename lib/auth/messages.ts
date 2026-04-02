export type AuthLoginHint = 'unknown' | 'existing_account' | 'social_only'

export const AUTH_MESSAGES = {
  login: {
    invalidCredentials: 'E-mail ou senha incorretos.',
    emailNotConfirmed: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
    oauthFailed: 'Não foi possível conectar com Google. Tente novamente.',
    oauthCallbackFailed: 'Não foi possível concluir o login com Google. Tente novamente.',
    socialOnlyAccount:
      'Esta conta foi criada com login social. Use Google para entrar ou defina uma senha em “Esqueceu a senha?”.',
    rateLimited: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
    generic: 'Não foi possível entrar agora. Tente novamente em instantes.',
  },
  signup: {
    duplicateEmail:
      'Este e-mail já está cadastrado. Se sua conta foi criada com Google, entre com Google ou redefina sua senha.',
    weakPassword: 'A senha deve ter pelo menos 8 caracteres.',
    rateLimited: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
    generic: 'Não foi possível concluir o cadastro agora. Tente novamente em instantes.',
    successTitle: 'Conta criada com sucesso',
    successDescription:
      'Enviamos um e-mail de verificação para ativar sua conta. Verifique sua caixa de entrada.',
  },
  password: {
    updateSuccess: 'Senha atualizada com sucesso.',
    mismatch: 'A confirmação de senha não confere.',
    minLength: 'A nova senha deve ter pelo menos 8 caracteres.',
    generic: 'Não foi possível atualizar a senha agora. Tente novamente em instantes.',
    invalidCredentials:
      'Sua sessão precisa ser reautenticada. Faça login novamente e tente atualizar sua senha.',
  },
} as const

export function mapLoginErrorMessage(rawMessage: string, hint: AuthLoginHint = 'unknown') {
  const normalized = rawMessage.toLowerCase()
  if (normalized.includes('email not confirmed')) {
    return AUTH_MESSAGES.login.emailNotConfirmed
  }
  if (normalized.includes('invalid login credentials')) {
    if (hint === 'social_only') return AUTH_MESSAGES.login.socialOnlyAccount
    return AUTH_MESSAGES.login.invalidCredentials
  }
  return AUTH_MESSAGES.login.generic
}

export function isInvalidCredentialsError(rawMessage: string) {
  return rawMessage.toLowerCase().includes('invalid login credentials')
}

export function isDuplicateSignupError(rawMessage: string) {
  const normalized = rawMessage.toLowerCase()
  return (
    normalized.includes('already') ||
    normalized.includes('registered') ||
    normalized.includes('exists') ||
    normalized.includes('already registered')
  )
}

export function mapSignupErrorMessage(rawMessage: string) {
  if (!rawMessage) return AUTH_MESSAGES.signup.generic
  if (isDuplicateSignupError(rawMessage)) return AUTH_MESSAGES.signup.duplicateEmail

  const normalized = rawMessage.toLowerCase()
  if (normalized.includes('password') && normalized.includes('at least')) {
    return AUTH_MESSAGES.signup.weakPassword
  }

  return AUTH_MESSAGES.signup.generic
}

export function mapPasswordUpdateErrorMessage(rawMessage: string) {
  if (!rawMessage) return AUTH_MESSAGES.password.generic
  const normalized = rawMessage.toLowerCase()
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('reauthentication') ||
    normalized.includes('auth session missing')
  ) {
    return AUTH_MESSAGES.password.invalidCredentials
  }
  if (normalized.includes('password')) {
    return AUTH_MESSAGES.password.minLength
  }
  return AUTH_MESSAGES.password.generic
}
