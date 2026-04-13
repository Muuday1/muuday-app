export type DetectedFileKind = 'jpg' | 'png' | 'webp' | 'pdf'

const KIND_TO_MIME: Record<DetectedFileKind, readonly string[]> = {
  jpg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
  pdf: ['application/pdf', 'application/x-pdf'],
}

const KIND_TO_EXTENSION: Record<DetectedFileKind, string> = {
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  pdf: 'pdf',
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

function isPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  return signature.every((value, index) => bytes[index] === value)
}

function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  const riff =
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF'
  const webp =
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
  return riff && webp
}

function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  )
}

export function detectFileKind(bytes: Uint8Array): DetectedFileKind | null {
  if (isJpeg(bytes)) return 'jpg'
  if (isPng(bytes)) return 'png'
  if (isWebp(bytes)) return 'webp'
  if (isPdf(bytes)) return 'pdf'
  return null
}

export function getCanonicalMimeType(kind: DetectedFileKind): string {
  return KIND_TO_MIME[kind][0]
}

export function getCanonicalExtension(kind: DetectedFileKind): string {
  return KIND_TO_EXTENSION[kind]
}

export function validateFileSignature(options: {
  bytes: Uint8Array
  claimedMimeType: string
  allowedKinds: readonly DetectedFileKind[]
}):
  | {
      ok: true
      kind: DetectedFileKind
      canonicalMimeType: string
      extension: string
    }
  | { ok: false; error: string } {
  const detectedKind = detectFileKind(options.bytes)
  if (!detectedKind) {
    return { ok: false, error: 'Nao foi possivel validar o tipo real do arquivo.' }
  }

  if (!options.allowedKinds.includes(detectedKind)) {
    return { ok: false, error: 'Tipo de arquivo nao permitido para este upload.' }
  }

  const claimed = String(options.claimedMimeType || '').toLowerCase().trim()
  const acceptedClaimedTypes = KIND_TO_MIME[detectedKind]
  if (claimed && !acceptedClaimedTypes.includes(claimed)) {
    return {
      ok: false,
      error: 'Tipo MIME informado nao corresponde ao conteudo do arquivo.',
    }
  }

  return {
    ok: true,
    kind: detectedKind,
    canonicalMimeType: getCanonicalMimeType(detectedKind),
    extension: getCanonicalExtension(detectedKind),
  }
}
