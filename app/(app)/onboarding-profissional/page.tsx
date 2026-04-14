import { redirect } from 'next/navigation'

export const metadata = { title: 'Onboarding Profissional | Muuday' }

export default function OnboardingProfissionalPage({
  searchParams,
}: {
  searchParams?: { result?: string }
}) {
  const result = searchParams?.result ? `&result=${encodeURIComponent(searchParams.result)}` : ''
  redirect(`/dashboard?openOnboarding=1${result}`)
}
