'use client'

import { useState, useRef, useCallback } from 'react'
import { readImageDimensions, runPhotoAutoValidation, buildAvatarCropFile, clamp } from '../helpers'
import type { SaveState, PendingPhoto, PhotoValidationChecks } from '../types'

export function usePhotoState(initialCoverPhotoUrl?: string) {
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialCoverPhotoUrl || '')
  const [coverPhotoPath, setCoverPhotoPath] = useState('')
  const [photoUploadState, setPhotoUploadState] = useState<SaveState>('idle')
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [photoValidationChecks, setPhotoValidationChecks] = useState<PhotoValidationChecks>({
    format: 'unknown',
    size: 'unknown',
    minResolution: 'unknown',
    faceCentered: 'unknown',
    neutralBackground: 'unknown',
  })
  const [photoFocusX, setPhotoFocusX] = useState(50)
  const [photoFocusY, setPhotoFocusY] = useState(50)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null)
  const photoHealthCheckedRef = useRef(false)
  const dragStateRef = useRef<{
    startX: number
    startY: number
    startFocusX: number
    startFocusY: number
  } | null>(null)

  const prepareProfessionalPhoto = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoValidationChecks({
        format: 'fail',
        size: 'unknown',
        minResolution: 'unknown',
        faceCentered: 'unknown',
        neutralBackground: 'unknown',
      })
      setPhotoUploadState('error')
      setPhotoUploadError('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoValidationChecks({
        format: 'pass',
        size: 'fail',
        minResolution: 'unknown',
        faceCentered: 'unknown',
        neutralBackground: 'unknown',
      })
      setPhotoUploadState('error')
      setPhotoUploadError('Arquivo acima de 3MB. Reduza antes de enviar.')
      return
    }

    setPhotoUploadError('')
    setPhotoUploadState('saving')
    try {
      const imageMeta = await readImageDimensions(file)
      if (imageMeta.width < 320 || imageMeta.height < 320) {
        URL.revokeObjectURL(imageMeta.previewUrl)
        setPhotoUploadState('error')
        setPhotoUploadError('Use uma foto com pelo menos 320x320 pixels.')
        return
      }

      const checks = await runPhotoAutoValidation(file, imageMeta.width, imageMeta.height)
      setPhotoValidationChecks(checks)
      if (checks.faceCentered === 'fail') {
        URL.revokeObjectURL(imageMeta.previewUrl)
        setPhotoUploadState('error')
        setPhotoUploadError('Não foi possível validar o rosto centralizado. Escolha outra foto com o rosto bem enquadrado.')
        return
      }
      if (checks.neutralBackground === 'fail') {
        URL.revokeObjectURL(imageMeta.previewUrl)
        setPhotoUploadState('error')
        setPhotoUploadError('Fundo da foto fora do padrao. Use fundo claro ou neutro para continuar.')
        return
      }

      setPendingPhoto(previous => {
        if (previous?.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl)
        }
        return {
          file,
          previewUrl: imageMeta.previewUrl,
          width: imageMeta.width,
          height: imageMeta.height,
        }
      })
      setPhotoFocusX(50)
      setPhotoFocusY(50)
      setPhotoZoom(1)
      setPhotoUploadState('idle')
    } catch (error) {
      setPhotoUploadState('error')
      setPhotoUploadError(error instanceof Error ? error.message : 'Não foi possível preparar a foto.')
    }
  }, [])

  const uploadPreparedProfessionalPhoto = useCallback(async (): Promise<{
    avatarUrl: string
    avatarPath: string
  }> => {
    if (!pendingPhoto) {
      return {
        avatarUrl: coverPhotoUrl,
        avatarPath: coverPhotoPath,
      }
    }

    if (!photoHealthCheckedRef.current) {
      const healthResponse = await fetch('/api/professional/profile-media/health', {
        method: 'GET',
        credentials: 'include',
      })
      const healthPayload = (await healthResponse.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!healthResponse.ok || !healthPayload.ok) {
        throw new Error(healthPayload.error || 'Storage de fotos indisponivel no momento.')
      }
      photoHealthCheckedRef.current = true
    }

    const croppedFile = await buildAvatarCropFile(pendingPhoto.file, photoFocusX, photoFocusY, photoZoom)
    const form = new FormData()
    form.append('file', croppedFile)
    const response = await fetch('/api/professional/profile-media/upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(String(errorBody?.error || 'Falha no upload da foto. Tente novamente.'))
    }

    const payload = (await response.json()) as { signedUrl?: string; path?: string }
    const nextUrl = String(payload.signedUrl || '').trim()
    const nextPath = String(payload.path || '').trim()
    if (!nextUrl) {
      throw new Error('A foto foi enviada, mas a URL final não foi retornada.')
    }
    if (!nextPath) {
      throw new Error('A foto foi enviada, mas o caminho interno não foi retornado.')
    }

    setCoverPhotoUrl(nextUrl)
    setCoverPhotoPath(nextPath)
    setPendingPhoto(previous => {
      if (previous?.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl)
      }
      return null
    })
    return {
      avatarUrl: nextUrl,
      avatarPath: nextPath,
    }
  }, [pendingPhoto, coverPhotoUrl, coverPhotoPath, photoFocusX, photoFocusY, photoZoom])

  const handlePhotoDragStart = useCallback((clientX: number, clientY: number) => {
    if (!pendingPhoto) return
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startFocusX: photoFocusX,
      startFocusY: photoFocusY,
    }
  }, [pendingPhoto, photoFocusX, photoFocusY])

  const handlePhotoDragMove = useCallback((clientX: number, clientY: number) => {
    if (!pendingPhoto || !dragStateRef.current) return
    const previewSize = 192
    const scale = Math.max(previewSize / pendingPhoto.width, previewSize / pendingPhoto.height) * photoZoom
    const displayedWidth = pendingPhoto.width * scale
    const displayedHeight = pendingPhoto.height * scale
    const overflowX = Math.max(1, displayedWidth - previewSize)
    const overflowY = Math.max(1, displayedHeight - previewSize)
    const deltaX = clientX - dragStateRef.current.startX
    const deltaY = clientY - dragStateRef.current.startY
    setPhotoFocusX(clamp(dragStateRef.current.startFocusX - (deltaX / overflowX) * 100, 0, 100))
    setPhotoFocusY(clamp(dragStateRef.current.startFocusY - (deltaY / overflowY) * 100, 0, 100))
  }, [pendingPhoto, photoZoom])

  const handlePhotoDragEnd = useCallback(() => {
    dragStateRef.current = null
  }, [])

  return {
    coverPhotoUrl,
    setCoverPhotoUrl,
    coverPhotoPath,
    setCoverPhotoPath,
    photoUploadState,
    setPhotoUploadState,
    photoUploadError,
    setPhotoUploadError,
    photoValidationChecks,
    setPhotoValidationChecks,
    photoFocusX,
    setPhotoFocusX,
    photoFocusY,
    setPhotoFocusY,
    photoZoom,
    setPhotoZoom,
    pendingPhoto,
    setPendingPhoto,
    photoHealthCheckedRef,
    dragStateRef,
    prepareProfessionalPhoto,
    uploadPreparedProfessionalPhoto,
    handlePhotoDragStart,
    handlePhotoDragMove,
    handlePhotoDragEnd,
  }
}
