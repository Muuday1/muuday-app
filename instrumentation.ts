export async function register() {
  // Only validate env vars in Node.js runtime (not Edge, where not all vars are available)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/config/env')
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
