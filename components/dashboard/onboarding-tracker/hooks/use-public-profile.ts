'use client'

import { useState, useCallback } from 'react'
import { isValidCoverPhotoUrl } from '../helpers'
import type { SaveState } from '../types'

interface UsePublicProfileOptions {
  initialBio: string
  saveSection: (
    payload: object,
    fallbackError: string,
    options?: { autoAdvance?: boolean },
  ) => Promise<unknown>
  coverPhotoUrl: string
  coverPhotoPath: string
  pendingPhoto: { previewUrl: string; file: File } | null
  photoUploadState: SaveState
  setPhotoUploadState: (state: SaveState) => void
  setPhotoUploadError: (error: string) => void
  uploadPreparedProfessionalPhoto: () => Promise<{ avatarUrl: string; avatarPath: string }>
  setActiveStageId: (stageId: string) => void
}

export function usePublicProfile({
  initialBio,
  saveSection,
  coverPhotoUrl,
  coverPhotoPath,
  pendingPhoto,
  photoUploadState,
  setPhotoUploadState,
  setPhotoUploadError,
  uploadPreparedProfessionalPhoto,
  setActiveStageId,
}: UsePublicProfileOptions) {
  const [bio, setBio] = useState(initialBio || '')
  const [bioSaveState, setBioSaveState] = useState<SaveState>('idle')
  const [bioError, setBioError] = useState('')

  const savePublicProfile = useCallback(async () => {
    if (bio.trim().length === 0) {
      setBioError('O campo "Sobre você" não pode ficar vazio.')
      setBioSaveState('error')
      return false
    }
    if (bio.length > 500) {
      setBioError('O campo "Sobre você" deve ter no máximo 500 caracteres.')
      setBioSaveState('error')
      return false
    }
    setBioSaveState('saving')
    setBioError('')
    try {
      setPhotoUploadState(pendingPhoto ? 'saving' : photoUploadState)
      const nextPhoto = pendingPhoto
        ? await uploadPreparedProfessionalPhoto()
        : { avatarUrl: coverPhotoUrl.trim(), avatarPath: coverPhotoPath.trim() }
      if (!isValidCoverPhotoUrl(nextPhoto.avatarUrl.trim())) {
        throw new Error('A URL final da foto do perfil e invalida.')
      }

      await saveSection(
        {
          section: 'public_profile',
          bio: bio.trim(),
          avatarUrl: nextPhoto.avatarUrl.trim(),
          avatarPath: nextPhoto.avatarPath.trim(),
        },
        'Não foi possível salvar o perfil público.',
        { autoAdvance: false },
      )
      setPhotoUploadState('saved')
      setBioSaveState('saved')
      setTimeout(() => {
        setPhotoUploadState('idle')
        setBioSaveState('idle')
      }, 2000)
      return true
    } catch (error) {
      setPhotoUploadState('error')
      setBioSaveState('error')
      setBioError(error instanceof Error ? error.message : 'Não foi possível salvar o perfil público.')
      return false
    }
  }, [
    bio,
    saveSection,
    coverPhotoUrl,
    coverPhotoPath,
    pendingPhoto,
    photoUploadState,
    setPhotoUploadState,
    setPhotoUploadError,
    uploadPreparedProfessionalPhoto,
  ])

  const saveIdentityAndPublicProfile = useCallback(
    async (saveIdentity: () => Promise<boolean>) => {
      const identityOk = await saveIdentity()
      if (!identityOk) return
      const profileOk = await savePublicProfile()
      if (!profileOk) return
      setActiveStageId('c4_services')
    },
    [savePublicProfile, setActiveStageId],
  )

  return {
    bio,
    setBio,
    bioSaveState,
    setBioSaveState,
    bioError,
    setBioError,
    savePublicProfile,
    saveIdentityAndPublicProfile,
  }
}
