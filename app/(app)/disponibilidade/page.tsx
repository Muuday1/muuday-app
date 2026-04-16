import { redirect } from 'next/navigation'

export default function DisponibilidadePage() {
  redirect('/agenda?view=availability_rules')
}
