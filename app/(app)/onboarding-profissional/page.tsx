import { redirect } from 'next/navigation'

export const metadata = { title: 'Onboarding Profissional | Muuday' }

export default async function OnboardingProfissionalPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>
}) {
  const { result } = await searchParams
  const resultQuery = result ? `&result=${encodeURIComponent(result)}` : ''
  redirect(`/dashboard?openOnboarding=1${resultQuery}`)
}
