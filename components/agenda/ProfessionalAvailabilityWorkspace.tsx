'use client'

import { Loader2, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { ProfessionalAvailabilityCalendar } from '@/components/agenda/ProfessionalAvailabilityCalendar'
import { WeeklyScheduleEditor } from './weekly-schedule-editor'
import { AvailabilityQuickSelect } from './availability-quick-select'
import { DAYS_OF_WEEK } from './availability-workspace-helpers'
import { useAvailabilityWorkspace } from './availability-workspace/hooks/use-availability-workspace'
import { AvailabilityWorkspaceHeader } from './availability-workspace/components/AvailabilityWorkspaceHeader'
import { AvailabilityWorkspaceStats } from './availability-workspace/components/AvailabilityWorkspaceStats'
import { AvailabilityWorkspaceRulesCard } from './availability-workspace/components/AvailabilityWorkspaceRulesCard'
import { AvailabilitySaveBar } from './availability-workspace/components/AvailabilitySaveBar'

type ProfessionalAvailabilityWorkspaceProps = {
  variant?: 'standalone' | 'embedded'
}

export function ProfessionalAvailabilityWorkspace({
  variant = 'standalone',
}: ProfessionalAvailabilityWorkspaceProps) {
  const ws = useAvailabilityWorkspace()

  if (ws.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#9FE870]" />
      </div>
    )
  }

  if (ws.accessDenied) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200/80 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Acesso restrito</h2>
          <p className="text-slate-500 text-sm mb-6">
            Esta página é exclusiva para profissionais com perfil completo.
          </p>
          <Link
            href="/completar-perfil"
            className="inline-block bg-[#9FE870] hover:bg-[#8ed85f] text-white font-semibold px-5 py-2.5 rounded-md transition-all text-sm"
          >
            Completar perfil profissional
          </Link>
        </div>
      </div>
    )
  }

  const activeDaysCount = DAYS_OF_WEEK.filter(d => ws.availability[d.value].is_available).length
  const wrapperClassName =
    variant === 'standalone' ? 'mx-auto max-w-5xl p-6 md:p-8' : 'space-y-6'

  return (
    <div className={wrapperClassName}>
      <AvailabilityWorkspaceHeader
        variant={variant}
        activeDaysCount={activeDaysCount}
        hasUnsavedChanges={ws.hasUnsavedChanges}
        calendarTimezone={ws.calendarTimezone}
      />

      <div className="mb-6 flex items-start gap-3 rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8 px-4 py-3">
        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3d6b1f]" />
        <div className="space-y-1 text-sm text-[#3d6b1f]">
          <p>Os horários abaixo representam sua disponibilidade recorrente de trabalho na Muuday.</p>
          <p>Compromissos pontuais fora da plataforma e períodos ocupados pelas integrações aparecem no calendário completo logo abaixo.</p>
        </div>
      </div>

      <AvailabilityWorkspaceStats
        bufferMinutes={ws.bufferMinutes}
        maxWindowDays={ws.maxWindowDays}
        calendarConnected={ws.calendarConnected}
      />

      <AvailabilityWorkspaceRulesCard variant={variant} />

      <WeeklyScheduleEditor
        availability={ws.availability}
        onToggleDay={ws.toggleDay}
        onUpdateTime={ws.updateTime}
        onCopyDay={ws.handleCopyDay}
      />

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-5">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Calendário completo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use esta visão para acompanhar a sua disponibilidade base, sessões já marcadas e ocupações vindas dos calendários conectados.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Fuso: {ws.calendarTimezone}
          </div>
        </div>
        <ProfessionalAvailabilityCalendar
          timezone={ws.calendarTimezone}
          availabilityRules={DAYS_OF_WEEK.map(day => ({
            day_of_week: day.value,
            start_time: ws.availability[day.value].start_time,
            end_time: ws.availability[day.value].end_time,
            is_active: ws.availability[day.value].is_available,
          }))}
          bookings={ws.upcomingBookings}
          exceptions={ws.availabilityExceptions}
        />
      </div>

      <AvailabilityQuickSelect onChange={ws.setAvailability} />

      <AvailabilitySaveBar
        hasUnsavedChanges={ws.hasUnsavedChanges}
        saveStatus={ws.saveStatus}
        hasErrors={ws.hasErrors}
        professionalId={ws.professionalId}
        errorMessage={ws.errorMessage}
        onSave={ws.handleSave}
      />
    </div>
  )
}
