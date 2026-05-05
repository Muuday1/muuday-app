'use client'

import { Calendar } from 'lucide-react'
import { AppTable, AppTableHeader, AppTableBody, AppTableRow, AppTableHeadCell, AppTableCell } from '@/components/ui/AppTable'
import type { AdminDashboardData } from '@/lib/actions/admin'

interface AdminBookingsTabProps {
  bookings: AdminDashboardData['bookings']
}

export function AdminBookingsTab({ bookings }: AdminBookingsTabProps) {
  const bookingStatusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    no_show: 'bg-slate-100 text-slate-600',
  }
  const bookingStatusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  }

  return (
    <div className="space-y-3">
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum agendamento encontrado.</p>
        </div>
      ) : (
        <AppTable>
          <AppTableHeader>
            <AppTableRow>
              <AppTableHeadCell>Usuário</AppTableHeadCell>
              <AppTableHeadCell>Profissional</AppTableHeadCell>
              <AppTableHeadCell>Data</AppTableHeadCell>
              <AppTableHeadCell>Status</AppTableHeadCell>
              <AppTableHeadCell align="right">Preço</AppTableHeadCell>
            </AppTableRow>
          </AppTableHeader>
          <AppTableBody>
            {bookings.map(booking => (
              <AppTableRow key={booking.id}>
                <AppTableCell>
                  <p className="font-medium text-slate-900">{booking.user_profile?.full_name || '-'}</p>
                  <p className="text-xs text-slate-400">{booking.user_profile?.email || ''}</p>
                </AppTableCell>
                <AppTableCell className="text-slate-700">
                  {booking.professional_profile?.full_name || '-'}
                </AppTableCell>
                <AppTableCell className="text-slate-700 whitespace-nowrap">
                  {new Date(booking.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  <span className="text-slate-400 ml-1">
                    {new Date(booking.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </AppTableCell>
                <AppTableCell>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bookingStatusColors[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                    {bookingStatusLabels[booking.status] || booking.status}
                  </span>
                </AppTableCell>
                <AppTableCell align="right" className="font-medium text-slate-900 whitespace-nowrap">
                  R$ {booking.price_brl?.toFixed(2) || '0.00'}
                </AppTableCell>
              </AppTableRow>
            ))}
          </AppTableBody>
        </AppTable>
      )}
    </div>
  )
}
