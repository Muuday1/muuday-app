'use client'

import { useState, useCallback } from 'react'
import {
  normalizeOption,
  isRegistrationQualification,
  inferCredentialType,
} from '../helpers'
import {
  QUALIFICATION_APPROVED_OPTIONS,
  QUALIFICATION_FILE_MAX_SIZE_BYTES,
  QUALIFICATION_ALLOWED_TYPES,
} from '../constants'
import type { SaveState, QualificationStructured } from '../types'

export function useIdentityState(tierLimits: { tags: number }) {
  const [identityTitle, setIdentityTitle] = useState('')
  const [identityDisplayName, setIdentityDisplayName] = useState('')
  const [identityDisplayNameLocked, setIdentityDisplayNameLocked] = useState(false)
  const [identityCategory, setIdentityCategory] = useState('')
  const [identitySubcategory, setIdentitySubcategory] = useState('')
  const [identityFocusAreas, setIdentityFocusAreas] = useState<string[]>([])
  const [identityYearsExperience, setIdentityYearsExperience] = useState('0')
  const [identityPrimaryLanguage, setIdentityPrimaryLanguage] = useState('Português')
  const [identitySecondaryLanguages, setIdentitySecondaryLanguages] = useState<string[]>([])
  const [secondaryLanguagesOpen, setSecondaryLanguagesOpen] = useState(false)
  const [identityTargetAudiences, setIdentityTargetAudiences] = useState<string[]>([])
  const [targetAudiencesOpen, setTargetAudiencesOpen] = useState(false)
  const [focusAreaInput, setFocusAreaInput] = useState('')
  const [identityQualifications, setIdentityQualifications] = useState<QualificationStructured[]>([])
  const [identityQualificationSelection, setIdentityQualificationSelection] = useState(
    QUALIFICATION_APPROVED_OPTIONS[0],
  )
  const [identityQualificationCustomName, setIdentityQualificationCustomName] = useState('')
  const [identityQualificationCustomEnabled, setIdentityQualificationCustomEnabled] = useState(false)
  const [identitySaveState, setIdentitySaveState] = useState<SaveState>('idle')
  const [identityError, setIdentityError] = useState('')

  const addFocusArea = useCallback(
    (rawValue: string) => {
      const nextValue = rawValue.trim().replace(/,$/, '')
      if (!nextValue) return
      if (identityFocusAreas.some(item => normalizeOption(item) === normalizeOption(nextValue))) {
        setFocusAreaInput('')
        return
      }
      if (identityFocusAreas.length >= tierLimits.tags) {
        setIdentityError(`Seu plano permite até ${tierLimits.tags} tag(s) de foco.`)
        return
      }
      setIdentityFocusAreas(previous => [...previous, nextValue])
      setFocusAreaInput('')
      setIdentityError('')
    },
    [identityFocusAreas, tierLimits.tags],
  )

  const removeFocusArea = useCallback((tag: string) => {
    setIdentityFocusAreas(previous => previous.filter(item => item !== tag))
  }, [])

  const addIdentityQualification = useCallback(() => {
    const name = identityQualificationCustomEnabled
      ? identityQualificationCustomName.trim()
      : identityQualificationSelection.trim()
    if (!name) return

    if (identityQualifications.some(item => normalizeOption(item.name) === normalizeOption(name))) {
      setIdentityError('Esta qualificação já foi adicionada.')
      return
    }

    setIdentityQualifications(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        requires_registration: isRegistrationQualification(name),
        course_name: '',
        registration_number: '',
        issuer: '',
        country: '',
        evidence_files: [],
      },
    ])
    setIdentityQualificationCustomName('')
    setIdentityError('')
  }, [
    identityQualificationCustomEnabled,
    identityQualificationCustomName,
    identityQualificationSelection,
    identityQualifications,
  ])

  const uploadQualificationDocument = useCallback(
    async (qualificationId: string, file: File | null) => {
      if (!file) return
      if (!QUALIFICATION_ALLOWED_TYPES.includes(file.type)) {
        setIdentityError('Arquivo inválido. Envie apenas PDF, JPG ou PNG.')
        return
      }
      if (file.size > QUALIFICATION_FILE_MAX_SIZE_BYTES) {
        setIdentityError('Arquivo excede 2MB. Reduza o tamanho antes de enviar.')
        return
      }

      const qualification = identityQualifications.find(item => item.id === qualificationId)
      if (!qualification) return

      const form = new FormData()
      form.append('file', file)
      form.append('qualificationName', qualification.name)
      form.append('credentialType', inferCredentialType(qualification.name))

      const response = await fetch('/api/professional/credentials/upload', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        setIdentityError(String(errorBody?.error || 'Falha ao enviar comprovante.'))
        return
      }

      const payload = (await response.json()) as {
        credential?: {
          id: string
          file_name: string
          file_url: string
          scan_status: string
          verified: boolean
          credential_type: string | null
        }
      }

      if (!payload.credential) return

      setIdentityQualifications(prev =>
        prev.map(item =>
          item.id === qualificationId
            ? {
                ...item,
                evidence_files: [...item.evidence_files, payload.credential!],
              }
            : item,
        ),
      )
      setIdentityError('')
    },
    [identityQualifications],
  )

  const removeQualificationDocument = useCallback(
    async (qualificationId: string, documentId: string) => {
      const response = await fetch('/api/professional/credentials/upload', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: documentId }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        setIdentityError(String(errorBody?.error || 'Falha ao remover comprovante.'))
        return
      }

      setIdentityQualifications(prev =>
        prev.map(item =>
          item.id === qualificationId
            ? {
                ...item,
                evidence_files: item.evidence_files.filter(file => file.id !== documentId),
              }
            : item,
        ),
      )
      setIdentityError('')
    },
    [],
  )

  return {
    identityTitle,
    setIdentityTitle,
    identityDisplayName,
    setIdentityDisplayName,
    identityDisplayNameLocked,
    setIdentityDisplayNameLocked,
    identityCategory,
    setIdentityCategory,
    identitySubcategory,
    setIdentitySubcategory,
    identityFocusAreas,
    setIdentityFocusAreas,
    identityYearsExperience,
    setIdentityYearsExperience,
    identityPrimaryLanguage,
    setIdentityPrimaryLanguage,
    identitySecondaryLanguages,
    setIdentitySecondaryLanguages,
    secondaryLanguagesOpen,
    setSecondaryLanguagesOpen,
    identityTargetAudiences,
    setIdentityTargetAudiences,
    targetAudiencesOpen,
    setTargetAudiencesOpen,
    focusAreaInput,
    setFocusAreaInput,
    identityQualifications,
    setIdentityQualifications,
    identityQualificationSelection,
    setIdentityQualificationSelection,
    identityQualificationCustomName,
    setIdentityQualificationCustomName,
    identityQualificationCustomEnabled,
    setIdentityQualificationCustomEnabled,
    identitySaveState,
    setIdentitySaveState,
    identityError,
    setIdentityError,
    addFocusArea,
    removeFocusArea,
    addIdentityQualification,
    uploadQualificationDocument,
    removeQualificationDocument,
  }
}
