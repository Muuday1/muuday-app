export async function register() {
  // Validate environment variables early (fails fast in CI/production)
  await import('./lib/config/env')

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
