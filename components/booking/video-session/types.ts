export type Phase = 'waiting' | 'connecting' | 'in-session'

export type SessionTokenPayload = {
  appId: string
  token: string
  channelName: string
  uid: string
  expiresAtUtc: string
  windowStartUtc: string
  windowEndUtc: string
}

export type VideoError =
  | { kind: 'permission_denied'; message: string }
  | { kind: 'camera_unavailable'; message: string }
  | { kind: 'microphone_unavailable'; message: string }
  | { kind: 'token_failed'; message: string }
  | { kind: 'join_failed'; message: string }
  | { kind: 'unknown'; message: string }

export function classifyVideoError(error: unknown): VideoError {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (
    lower.includes('permission') ||
    lower.includes('notallowederror') ||
    lower.includes('domexception') ||
    lower.includes('access denied')
  ) {
    return {
      kind: 'permission_denied',
      message:
        'Permissao de camera ou microfone negada. Verifique as permissoes do navegador e tente novamente.',
    }
  }

  if (
    lower.includes('camera') ||
    lower.includes('videoinput') ||
    lower.includes('device not found') ||
    lower.includes('could not start video')
  ) {
    return {
      kind: 'camera_unavailable',
      message:
        'Nao foi possivel acessar a camera. Verifique se ela esta conectada e nao esta sendo usada por outro aplicativo.',
    }
  }

  if (
    lower.includes('microphone') ||
    lower.includes('audioinput') ||
    lower.includes('could not start audio')
  ) {
    return {
      kind: 'microphone_unavailable',
      message:
        'Nao foi possivel acessar o microfone. Verifique se ele esta conectado e nao esta sendo usado por outro aplicativo.',
    }
  }

  if (lower.includes('token') || lower.includes('unauthorized')) {
    return {
      kind: 'token_failed',
      message: 'Falha ao obter autorizacao para a sessao de video. Tente recarregar a pagina.',
    }
  }

  if (lower.includes('join') || lower.includes('connect')) {
    return {
      kind: 'join_failed',
      message: 'Nao foi possivel conectar a sessao de video. Verifique sua conexao de internet.',
    }
  }

  return {
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Erro ao iniciar a sessao de video.',
  }
}
