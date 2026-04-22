import type { SupabaseClient } from '@supabase/supabase-js'
import { truncateErrorMessage } from './helpers'

export type StripeJobRunStart = {
  id: string
  started: boolean
}

export async function tryStartJobRun(
  admin: SupabaseClient,
  jobName: string,
  runKey: string,
  context: Record<string, unknown> = {},
): Promise<StripeJobRunStart> {
  const { data: existing, error: existingError } = await admin
    .from('stripe_job_runs')
    .select('id, status')
    .eq('job_name', jobName)
    .eq('run_key', runKey)
    .maybeSingle()

  if (existingError) {
    console.error(`[stripe/jobs] failed to check existing job run for ${jobName}/${runKey}:`, existingError.message)
    throw new Error(`Failed to check existing stripe job run: ${existingError.message}`)
  }

  if (existing?.id && existing.status === 'completed') {
    return { id: String(existing.id), started: false }
  }

  if (existing?.id && existing.status === 'started') {
    return { id: String(existing.id), started: false }
  }

  if (existing?.id && existing.status === 'failed') {
    const { data: restarted, error: restartError } = await admin
      .from('stripe_job_runs')
      .update({
        status: 'started',
        error_message: null,
        summary: {},
        context,
        finished_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single()

    if (restartError || !restarted) {
      throw new Error(`Failed to restart stripe job run: ${restartError?.message || 'unknown'}`)
    }
    return { id: String(restarted.id), started: true }
  }

  const { data: created, error: createError } = await admin
    .from('stripe_job_runs')
    .insert({
      job_name: jobName,
      run_key: runKey,
      status: 'started',
      context,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (createError || !created) {
    throw new Error(`Failed to start stripe job run: ${createError?.message || 'unknown'}`)
  }
  return { id: String(created.id), started: true }
}

export async function finishJobRun(
  admin: SupabaseClient,
  jobRunId: string,
  status: 'completed' | 'failed',
  summary: Record<string, unknown>,
  errorMessage?: string | null,
) {
  const { error } = await admin
    .from('stripe_job_runs')
    .update({
      status,
      summary,
      error_message: errorMessage ? truncateErrorMessage(errorMessage, 800) : null,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobRunId)

  if (error) {
    throw new Error(`Failed to finish stripe job run: ${error.message}`)
  }
}
