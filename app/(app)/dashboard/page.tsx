import { redirect } from 'next/navigation'

export const metadata = { title: 'Dashboard | Muuday' }

export default function DashboardPage() {
  redirect('/buscar')
}
