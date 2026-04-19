import type { ExchangeRateMap } from '@/lib/exchange-rates'
import type {
  Blocker,
  BlockerCta,
  PhotoValidationChecks,
  QualificationStructured,
  TrackerViewMode,
  AvailabilityDayState,
} from './types'
import { PLAN_ROW_BY_LABEL, WEEK_DAYS } from './constants'

export function normalizeStageIdForLookup(id: string) {
  const normalized = String(id || '')
  if (normalized === 'c1_create_account' || normalized === 'c1_account_creation') return 'c1_account_creation'
  if (normalized === 'c2_professional_identity' || normalized === 'c2_basic_identity') return 'c2_basic_identity'
  if (normalized === 'c3_public_profile') return 'c3_public_profile'
  if (normalized === 'c4_services' || normalized === 'c4_service_setup') return 'c4_service_setup'
  if (normalized === 'c5_availability_calendar') return 'c5_availability_calendar'
  if (
    normalized === 'c6_plan_billing_setup_pre' ||
    normalized === 'c6_plan_billing_setup_post' ||
    normalized === 'c6_plan_billing_setup'
  ) {
    return 'c6_plan_billing_setup'
  }
  if (normalized === 'c7_payout_receipt' || normalized === 'c7_payout_payments') return 'c7_payout_payments'
  if (normalized === 'c8_submit_review') return 'c8_submit_review'
  if (normalized === 'c9_go_live') return 'c9_go_live'
  return normalized
}

export function isValidCoverPhotoUrl(value: string) {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

export function parseProfileMediaPath(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return ''
  if (raw.startsWith('professional-profile-media/')) {
    return raw.slice('professional-profile-media/'.length)
  }
  return raw
}

export function sanitizePricingErrorMessage(error: string) {
  if (!error) return 'Preço indisponível no momento.'
  const normalized = error.toLowerCase()
  if (
    normalized.includes('faça login') ||
    normalized.includes('sessão inválida') ||
    normalized.includes('sessão inv')
  ) {
    return 'Sua sessão expirou. Entre novamente para continuar.'
  }
  if (error.includes('STRIPE_') || error.includes('AIRWALLEX_') || error.includes('PRICE_')) {
    return 'Preço indisponível no momento.'
  }
  return error
}

export function resolveTrackerViewMode(status: string): TrackerViewMode {
  const normalized = String(status || '').toLowerCase().trim()
  if (normalized === 'pending_review') return 'submitted_waiting'
  if (normalized === 'approved') return 'approved'
  if (normalized === 'needs_changes') return 'needs_changes'
  if (normalized === 'rejected') return 'rejected'
  return 'editing'
}

export function normalizeOption(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isRegistrationQualification(name: string) {
  return normalizeOption(name) === normalizeOption('Registro profissional')
}

export function inferCredentialType(name: string): 'diploma' | 'license' | 'certification' | 'other' {
  const normalized = normalizeOption(name)
  if (normalized.includes('registro')) return 'license'
  if (normalized.includes('diploma')) return 'diploma'
  if (
    normalized.includes('certificação') ||
    normalized.includes('especialização') ||
    normalized.includes('mestrado') ||
    normalized.includes('doutorado')
  ) {
    return 'certification'
  }
  return 'other'
}

export function toKeywords(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export function formatCurrencyFromBrl(amountBrl: number, currency: string, rates: ExchangeRateMap) {
  const safeCurrency = String(currency || 'BRL').toUpperCase()
  const rate = rates[safeCurrency] || 1
  const converted = safeCurrency === 'BRL' ? amountBrl : amountBrl * rate
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted)
  } catch {
    return `${safeCurrency} ${converted.toFixed(2)}`
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0)
      break
    case gn:
      h = (bn - rn) / d + 2
      break
    default:
      h = (rn - gn) / d + 4
      break
  }
  h /= 6
  return { h, s, l }
}

export function humanizeTaxonomyValue(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (!raw.includes('-')) return raw
  return raw
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function resolveTaxonomyLabel(value: string, nameBySlug: Record<string, string>) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const normalized = raw.toLowerCase()
  return nameBySlug[normalized] || humanizeTaxonomyValue(raw)
}

export function getQualificationValidationMessage(item: QualificationStructured) {
  const label = item.name.trim() || 'qualificação'
  if (!item.name.trim()) return 'Informe o nome da qualificação.'
  if (item.requires_registration) {
    if (!item.registration_number.trim()) return `Informe o número de registro em "${label}".`
    if (!item.issuer.trim()) return `Informe o órgão emissor em "${label}".`
    if (!item.country.trim()) return `Informe o país do registro em "${label}".`
  } else if (!item.course_name.trim()) {
    return `Informe o nome do curso ou formação em "${label}".`
  }
  if (item.evidence_files.length === 0) return `Envie ao menos um comprovante para "${label}".`
  return ''
}

export async function readImageDimensions(file: File) {
  const previewUrl = URL.createObjectURL(file)
  const result = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'))
    image.src = previewUrl
  })

  return { previewUrl, ...result }
}

export async function runPhotoAutoValidation(file: File, width: number, height: number) {
  const checks: PhotoValidationChecks = {
    format: ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? 'pass' : 'fail',
    size: file.size <= 3 * 1024 * 1024 ? 'pass' : 'fail',
    minResolution: width >= 320 && height >= 320 ? 'pass' : 'fail',
    faceCentered: 'unknown',
    neutralBackground: 'unknown',
  }

  const previewUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image()
      next.onload = () => resolve(next)
      next.onerror = () => reject(new Error('Não foi possível ler a imagem para validação.'))
      next.src = previewUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(image, 0, 0)
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
      const step = Math.max(2, Math.floor(Math.min(canvas.width, canvas.height) / 80))
      let sampled = 0
      let satAcc = 0
      let lightAcc = 0
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const isEdge =
            x < canvas.width * 0.15 ||
            x > canvas.width * 0.85 ||
            y < canvas.height * 0.15 ||
            y > canvas.height * 0.85
          if (!isEdge) continue
          const idx = (y * canvas.width + x) * 4
          const hsl = rgbToHsl(data[idx] || 0, data[idx + 1] || 0, data[idx + 2] || 0)
          satAcc += hsl.s
          lightAcc += hsl.l
          sampled += 1
        }
      }
      if (sampled > 0) {
        const avgSat = satAcc / sampled
        const avgLight = lightAcc / sampled
        checks.neutralBackground = avgSat <= 0.35 && avgLight >= 0.52 ? 'pass' : 'fail'
      }
    }

    type FaceDetectorLike = {
      detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox?: { x: number; y: number; width: number; height: number } }>>
    }
    const FaceDetectorCtor = (window as unknown as { FaceDetector?: new (opts?: unknown) => FaceDetectorLike }).FaceDetector
    if (FaceDetectorCtor) {
      try {
        const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 } as unknown)
        const faces = await detector.detect(image)
        if (faces.length === 1 && faces[0]?.boundingBox) {
          const box = faces[0].boundingBox
          const centerX = (box.x + box.width / 2) / image.naturalWidth
          const centerY = (box.y + box.height / 2) / image.naturalHeight
          checks.faceCentered =
            Math.abs(centerX - 0.5) <= 0.22 && Math.abs(centerY - 0.45) <= 0.25 ? 'pass' : 'fail'
        } else {
          checks.faceCentered = 'fail'
        }
      } catch {
        checks.faceCentered = 'unknown'
      }
    }
  } finally {
    URL.revokeObjectURL(previewUrl)
  }

  return checks
}

export async function buildAvatarCropFile(file: File, focusX: number, focusY: number, zoom: number) {
  const dimensions = await readImageDimensions(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image()
      next.onload = () => resolve(next)
      next.onerror = () => reject(new Error('Não foi possível preparar a imagem para recorte.'))
      next.src = dimensions.previewUrl
    })

    const outputSize = 800
    const normalizedZoom = clamp(zoom, 1, 2.5)
    const scale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight) * normalizedZoom
    const displayedWidth = image.naturalWidth * scale
    const displayedHeight = image.naturalHeight * scale
    const overflowX = Math.max(0, displayedWidth - outputSize)
    const overflowY = Math.max(0, displayedHeight - outputSize)
    const sourceSize = outputSize / scale
    const sourceX = overflowX > 0 ? clamp((overflowX * (focusX / 100)) / scale, 0, image.naturalWidth - sourceSize) : 0
    const sourceY = overflowY > 0 ? clamp((overflowY * (focusY / 100)) / scale, 0, image.naturalHeight - sourceSize) : 0

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Não foi possível preparar a foto agora.')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, outputSize, outputSize)
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        nextBlob => {
          if (nextBlob) {
            resolve(nextBlob)
            return
          }
          reject(new Error('Não foi possível exportar a foto recortada.'))
        },
        'image/jpeg',
        0.92,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
    return new File([blob], `${baseName}-avatar.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(dimensions.previewUrl)
  }
}

export function getPlanFeatureHighlights(stageId: string) {
  if (stageId === 'c2_professional_identity') {
    const tagsRow = PLAN_ROW_BY_LABEL['Tags de foco']
    return [
      `Básico: até ${tagsRow?.basic || '3'} tags de foco`,
      `Profissional: até ${tagsRow?.professional || '4'} tags de foco`,
      `Premium: até ${tagsRow?.premium || '5'} tags de foco`,
    ]
  }

  if (stageId === 'c4_services') {
    const servicesRow = PLAN_ROW_BY_LABEL['Serviços ativos']
    return [
      `Básico: ${servicesRow?.basic || '1'} serviço ativo`,
      `Profissional: ${servicesRow?.professional || '3'} serviços ativos`,
      `Premium: ${servicesRow?.premium || '5'} serviços ativos`,
    ]
  }

  if (stageId === 'c5_availability_calendar') {
    const windowRow = PLAN_ROW_BY_LABEL['Janela de agendamento']
    return [
      `Básico: ${windowRow?.basic || '30 dias'} de janela`,
      `Profissional: ${windowRow?.professional || '90 dias'} de janela`,
      `Premium: ${windowRow?.premium || '180 dias'} de janela`,
    ]
  }

  if (stageId === 'c7_payout_receipt') {
    const pdfRow = PLAN_ROW_BY_LABEL['Exportação PDF']
    return [
      `Básico: exportação em PDF ${pdfRow?.basic || 'Não'}`,
      `Profissional: exportação em PDF ${pdfRow?.professional || 'Não'}`,
      `Premium: exportação em PDF ${pdfRow?.premium || 'Sim'}`,
    ]
  }

  return []
}

export function buildDefaultAvailabilityMap(): Record<number, AvailabilityDayState> {
  return WEEK_DAYS.reduce<Record<number, AvailabilityDayState>>((acc, day) => {
    acc[day.value] = { is_available: false, start_time: '09:00', end_time: '18:00' }
    return acc
  }, {})
}

export function getBlockerCta(blocker: Blocker): BlockerCta | null {
  if (blocker.code === 'missing_review_requirements') {
    return { kind: 'internal', label: 'Revisar pendências do tracker', stageId: 'c8_submit_review' }
  }

  if (blocker.code === 'missing_credentials') {
    return { kind: 'internal', label: 'Abrir identidade profissional', stageId: 'c2_professional_identity' }
  }

  if (blocker.actionHref === '/disponibilidade') {
    return { kind: 'internal', label: 'Abrir disponibilidade', stageId: 'c5_availability_calendar' }
  }

  if (blocker.actionHref === '/configuracoes-agendamento') {
    return { kind: 'external', label: 'Abrir regras de agendamento', href: '/configuracoes-agendamento' }
  }

  if (blocker.actionHref === '/planos') {
    return { kind: 'internal', label: 'Abrir plano', stageId: 'c6_plan_billing_setup_post' }
  }

  if (blocker.actionHref === '/financeiro') {
    return { kind: 'internal', label: 'Abrir financeiro', stageId: 'c7_payout_receipt' }
  }

  if (blocker.actionHref === '/configuracoes') {
    return { kind: 'external', label: 'Abrir configurações da conta', href: '/configuracoes' }
  }

  if (blocker.actionHref === '/editar-perfil' || blocker.actionHref === '/editar-perfil-profissional') {
    return { kind: 'internal', label: 'Abrir identidade profissional', stageId: 'c2_professional_identity' }
  }

  if (blocker.actionHref === '/completar-perfil') {
    return { kind: 'internal', label: 'Abrir serviços', stageId: 'c4_services' }
  }

  if (blocker.actionHref === '/onboarding-profissional') {
    return { kind: 'internal', label: 'Voltar ao tracker', stageId: 'c8_submit_review' }
  }

  return blocker.actionHref ? { kind: 'external', label: 'Abrir etapa relacionada', href: blocker.actionHref } : null
}

export async function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs: number) {
  const promise = Promise.resolve(promiseLike)
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
    })
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
