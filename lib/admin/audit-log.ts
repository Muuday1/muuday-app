import { createClient } from '@/lib/supabase/server'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type AdminAuditInsert = {
  adminUserId: string
  action: string
  targetTable: string
  targetId: string
  oldValue?: JsonValue | null
  newValue?: JsonValue | null
  metadata?: JsonValue | null
}

export type AdminAuditWriteResult =
  | { success: true }
  | { success: false; error: string }

const FAIL_ON_AUDIT_ERROR = process.env.ADMIN_AUDIT_FAIL_ON_ERROR === 'true'

function toJsonValue(input: unknown): JsonValue | null {
  if (input === null || input === undefined) return null
  try {
    return JSON.parse(JSON.stringify(input)) as JsonValue
  } catch {
    return null
  }
}

export async function writeAdminAuditLog(
  supabase: ReturnType<typeof createClient>,
  payload: AdminAuditInsert,
): Promise<AdminAuditWriteResult> {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_user_id: payload.adminUserId,
    action: payload.action,
    target_table: payload.targetTable,
    target_id: payload.targetId,
    old_value: toJsonValue(payload.oldValue),
    new_value: toJsonValue(payload.newValue),
    metadata: toJsonValue(payload.metadata),
  })

  if (!error) return { success: true }

  const message = `Falha ao gravar audit log administrativo: ${error.message}`
  if (FAIL_ON_AUDIT_ERROR) {
    return { success: false, error: message }
  }

  console.error('[admin-audit-log]', message)
  return { success: true }
}
