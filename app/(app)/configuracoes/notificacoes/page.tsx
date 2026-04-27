import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserWithSessionFallback } from '@/lib/auth/get-user-with-fallback'
import { NotificationPreferences } from '@/components/settings/workspace-helpers'
import { NotificationPreferencesPage } from '@/components/settings/NotificationPreferencesPage'

export const metadata = { title: 'Notificações | Configurações | Muuday' }

export default async function NotificacoesSettingsPage() {
  const supabase = await createClient()
  const user = await getUserWithSessionFallback<{ id: string }>(supabase)

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  const prefs = (profile?.notification_preferences as NotificationPreferences | undefined) || undefined

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Notificações</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalize como e quando você recebe alertas da plataforma.
        </p>
      </div>
      <NotificationPreferencesPage initialPreferences={prefs} />
    </main>
  )
}
