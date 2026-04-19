'use client'

import { Upload } from 'lucide-react'
import {
  PROFESSIONAL_TITLES,
  LANGUAGE_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  QUALIFICATION_APPROVED_OPTIONS,
} from '../constants'
import { resolveTaxonomyLabel } from '../helpers'
import type {
  PendingPhoto,
  PhotoValidationChecks,
  SaveState,
  QualificationStructured,
} from '../types'
import type { TierLimits } from '@/lib/tier-config'

interface IdentityStageProps {
  pendingPhoto: PendingPhoto | null
  coverPhotoUrl: string | null
  photoZoom: number
  setPhotoZoom: (value: number) => void
  photoFocusX: number
  photoFocusY: number
  photoValidationChecks: PhotoValidationChecks
  photoUploadState: SaveState
  photoUploadError: string
  prepareProfessionalPhoto: (file: File) => Promise<void>
  setPhotoUploadState: (state: SaveState) => void
  setPhotoUploadError: (error: string) => void
  dragStateRef: React.MutableRefObject<{ startX: number; startY: number; startFocusX: number; startFocusY: number } | null>
  handlePhotoDragMove: (x: number, y: number) => void
  handlePhotoDragEnd: () => void
  handlePhotoDragStart: (x: number, y: number) => void
  identityTitle: string
  setIdentityTitle: (value: string) => void
  identityDisplayName: string
  setIdentityDisplayName: (value: string) => void
  identityDisplayNameLocked: boolean
  identityCategory: string
  identitySubcategory: string
  categoryNameBySlug: Record<string, string>
  subcategoryNameBySlug: Record<string, string>
  identityFocusAreas: string[]
  focusAreaInput: string
  setFocusAreaInput: (value: string) => void
  removeFocusArea: (tag: string) => void
  addFocusArea: (value: string) => void
  tierLimits: TierLimits
  bio: string
  setBio: (value: string) => void
  identityYearsExperience: string
  setIdentityYearsExperience: (value: string) => void
  identityPrimaryLanguage: string
  setIdentityPrimaryLanguage: (value: string) => void
  identitySecondaryLanguages: string[]
  setIdentitySecondaryLanguages: React.Dispatch<React.SetStateAction<string[]>>
  toggleMultiValue: (option: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => void
  secondaryLanguagesOpen: boolean
  setSecondaryLanguagesOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  identityTargetAudiences: string[]
  setIdentityTargetAudiences: React.Dispatch<React.SetStateAction<string[]>>
  targetAudiencesOpen: boolean
  setTargetAudiencesOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  identityQualificationSelection: string
  setIdentityQualificationSelection: (value: string) => void
  identityQualificationCustomEnabled: boolean
  setIdentityQualificationCustomEnabled: (value: boolean) => void
  identityQualificationCustomName: string
  setIdentityQualificationCustomName: (value: string) => void
  identityQualifications: QualificationStructured[]
  setIdentityQualifications: React.Dispatch<React.SetStateAction<QualificationStructured[]>>
  addIdentityQualification: () => void
  uploadQualificationDocument: (qualificationId: string, file: File | null) => Promise<void>
  removeQualificationDocument: (qualificationId: string, documentId: string) => Promise<void>
  identityError: string | null
  bioError: string | null
  identitySaveState: SaveState
  bioSaveState: SaveState
  saveIdentityAndPublicProfile: () => Promise<void>
}

export function IdentityStage({
  pendingPhoto,
  coverPhotoUrl,
  photoZoom,
  setPhotoZoom,
  photoFocusX,
  photoFocusY,
  photoValidationChecks,
  photoUploadState,
  photoUploadError,
  prepareProfessionalPhoto,
  setPhotoUploadState,
  setPhotoUploadError,
  dragStateRef,
  handlePhotoDragMove,
  handlePhotoDragEnd,
  handlePhotoDragStart,
  identityTitle,
  setIdentityTitle,
  identityDisplayName,
  setIdentityDisplayName,
  identityDisplayNameLocked,
  identityCategory,
  identitySubcategory,
  categoryNameBySlug,
  subcategoryNameBySlug,
  identityFocusAreas,
  focusAreaInput,
  setFocusAreaInput,
  removeFocusArea,
  addFocusArea,
  tierLimits,
  bio,
  setBio,
  identityYearsExperience,
  setIdentityYearsExperience,
  identityPrimaryLanguage,
  setIdentityPrimaryLanguage,
  identitySecondaryLanguages,
  setIdentitySecondaryLanguages,
  toggleMultiValue,
  secondaryLanguagesOpen,
  setSecondaryLanguagesOpen,
  identityTargetAudiences,
  setIdentityTargetAudiences,
  targetAudiencesOpen,
  setTargetAudiencesOpen,
  identityQualificationSelection,
  setIdentityQualificationSelection,
  identityQualificationCustomEnabled,
  setIdentityQualificationCustomEnabled,
  identityQualificationCustomName,
  setIdentityQualificationCustomName,
  identityQualifications,
  setIdentityQualifications,
  addIdentityQualification,
  uploadQualificationDocument,
  removeQualificationDocument,
  identityError,
  bioError,
  identitySaveState,
  bioSaveState,
  saveIdentityAndPublicProfile,
}: IdentityStageProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
        <label className="mb-2 block text-sm font-semibold text-neutral-900">Foto de perfil</label>
        <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700 sm:w-auto">
          <Upload className="h-3.5 w-3.5" />
          Enviar foto
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) {
                void prepareProfessionalPhoto(file)
              } else {
                setPhotoUploadState('error')
                setPhotoUploadError('Não foi possível selecionar a foto. Tente novamente.')
              }
              event.currentTarget.value = ''
            }}
          />
        </label>
        {(pendingPhoto || coverPhotoUrl) ? (
          <div className="mt-3">
            <div className="grid gap-4 lg:grid-cols-[208px_minmax(0,1fr)] lg:items-start">
              <div className="space-y-3">
                <div
                  className="relative h-48 w-48 overflow-hidden rounded-full border border-neutral-200 bg-white"
                  onMouseMove={event => {
                    if (dragStateRef.current) handlePhotoDragMove(event.clientX, event.clientY)
                  }}
                  onMouseUp={handlePhotoDragEnd}
                  onMouseLeave={handlePhotoDragEnd}
                  onTouchMove={event => {
                    const touch = event.touches[0]
                    if (touch) handlePhotoDragMove(touch.clientX, touch.clientY)
                  }}
                  onTouchEnd={handlePhotoDragEnd}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingPhoto?.previewUrl || coverPhotoUrl || undefined}
                    alt="Prévia da foto do perfil"
                    className="absolute select-none object-cover"
                    draggable={false}
                    onMouseDown={event => handlePhotoDragStart(event.clientX, event.clientY)}
                    onTouchStart={event => {
                      const touch = event.touches[0]
                      if (touch) handlePhotoDragStart(touch.clientX, touch.clientY)
                    }}
                    style={
                      pendingPhoto
                        ? (() => {
                            const previewSize = 192
                            const scale =
                              Math.max(previewSize / pendingPhoto.width, previewSize / pendingPhoto.height) *
                              photoZoom
                            const displayedWidth = pendingPhoto.width * scale
                            const displayedHeight = pendingPhoto.height * scale
                            const overflowX = Math.max(0, displayedWidth - previewSize)
                            const overflowY = Math.max(0, displayedHeight - previewSize)
                            return {
                              width: `${displayedWidth}px`,
                              height: `${displayedHeight}px`,
                              left: `${-(overflowX * (photoFocusX / 100))}px`,
                              top: `${-(overflowY * (photoFocusY / 100))}px`,
                            }
                          })()
                        : { inset: 0, width: '100%', height: '100%', objectPosition: 'center' }
                    }
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Arraste a imagem para reposicionar o centro. Use o zoom se quiser ajustar também para os lados.
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-semibold text-neutral-800">Validação automática</p>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs">
                    {[
                      ['Formato (JPG/PNG/WEBP)', photoValidationChecks.format],
                      ['Tamanho (até 3MB)', photoValidationChecks.size],
                      ['Resolução mínima (320x320)', photoValidationChecks.minResolution],
                      ['Rosto centralizado', photoValidationChecks.faceCentered],
                      ['Fundo claro/neutro', photoValidationChecks.neutralBackground],
                    ].map(([label, status]) => (
                      <div key={String(label)} className="flex items-center justify-between gap-2">
                        <span className="text-neutral-700">{label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            status === 'pass'
                              ? 'bg-green-100 text-green-700'
                              : status === 'fail'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {status === 'pass' ? 'ok' : status === 'fail' ? 'falhou' : 'n/a'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {pendingPhoto ? (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-700">Zoom</span>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.05"
                      value={photoZoom}
                      onChange={event => setPhotoZoom(Number(event.target.value))}
                      className="w-full accent-brand-600"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {photoUploadState === 'saving' ? (
          <p className="mt-2 text-xs text-brand-700">Preparando foto...</p>
        ) : null}
        {photoUploadError ? <p className="mt-2 text-xs font-medium text-red-600">{photoUploadError}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Título</label>
          <select
            value={identityTitle}
            onChange={event => setIdentityTitle(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {PROFESSIONAL_TITLES.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Nome público profissional</label>
          <input
            type="text"
            value={identityDisplayName}
            onChange={event => setIdentityDisplayName(event.target.value)}
            disabled={identityDisplayNameLocked}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
          />
          {identityDisplayNameLocked ? (
            <p className="mt-1 text-[11px] text-neutral-500">
              Esse nome foi definido no cadastro inicial e não pode ser alterado aqui.
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Categoria principal</label>
          <input
            type="text"
            value={resolveTaxonomyLabel(identityCategory, categoryNameBySlug)}
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Área de atuação específica</label>
          <input
            type="text"
            value={resolveTaxonomyLabel(identitySubcategory, subcategoryNameBySlug)}
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Tags de foco</label>
          <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            {identityFocusAreas.length > 0 ? (
              identityFocusAreas.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeFocusArea(tag)}
                  className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800"
                >
                  {tag} ×
                </button>
              ))
            ) : (
              <span className="text-xs text-neutral-500">Nenhuma tag registrada ainda.</span>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={focusAreaInput}
              onChange={event => {
                const nextValue = event.target.value
                if (nextValue.endsWith(',')) {
                  addFocusArea(nextValue)
                  return
                }
                setFocusAreaInput(nextValue)
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault()
                  addFocusArea(focusAreaInput)
                }
                if (event.key === 'Backspace' && !focusAreaInput && identityFocusAreas.length > 0) {
                  removeFocusArea(identityFocusAreas[identityFocusAreas.length - 1]!)
                }
              }}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder={`Adicione tags de foco (${identityFocusAreas.length}/${tierLimits.tags})`}
            />
            <button
              type="button"
              onClick={() => addFocusArea(focusAreaInput)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
            >
              Adicionar tag
            </button>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Pressione vírgula ou Enter para adicionar. Clique na tag para remover.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-neutral-900">Sobre você</label>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">Resumo público exibido no perfil</span>
            <span className="text-xs text-neutral-500">{bio.length}/500</span>
          </div>
          <textarea
            value={bio}
            onChange={event => setBio(event.target.value.slice(0, 500))}
            rows={5}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Descreva sua atuação profissional em linguagem clara e objetiva."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Anos de experiência</label>
          <input
            type="number"
            min={0}
            max={60}
            value={identityYearsExperience}
            onChange={event => setIdentityYearsExperience(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Idioma principal</label>
          <select
            value={identityPrimaryLanguage}
            onChange={event => setIdentityPrimaryLanguage(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
        <p className="mb-2 text-xs font-semibold text-neutral-700">Idiomas secundários</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSecondaryLanguagesOpen(previous => !previous)}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-700"
          >
            <span className="truncate">
              {identitySecondaryLanguages.length > 0
                ? identitySecondaryLanguages.join(', ')
                : 'Selecione idiomas secundários'}
            </span>
            <span className="text-xs text-neutral-400">{secondaryLanguagesOpen ? 'Fechar' : 'Selecionar'}</span>
          </button>
          {secondaryLanguagesOpen ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
              <div className="grid gap-1">
                {LANGUAGE_OPTIONS.filter(item => item !== identityPrimaryLanguage).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      toggleMultiValue(option, identitySecondaryLanguages, setIdentitySecondaryLanguages)
                    }
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      identitySecondaryLanguages.includes(option)
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{option}</span>
                    <span className="text-xs font-semibold">
                      {identitySecondaryLanguages.includes(option) ? 'Selecionado' : 'Selecionar'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
        <p className="mb-2 text-xs font-semibold text-neutral-700">Público atendido</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setTargetAudiencesOpen(previous => !previous)}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-700"
          >
            <span className="truncate">
              {identityTargetAudiences.length > 0
                ? identityTargetAudiences.join(', ')
                : 'Selecione os públicos atendidos'}
            </span>
            <span className="text-xs text-neutral-400">{targetAudiencesOpen ? 'Fechar' : 'Selecionar'}</span>
          </button>
          {targetAudiencesOpen ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
              <div className="grid gap-1">
                {TARGET_AUDIENCE_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiValue(option, identityTargetAudiences, setIdentityTargetAudiences)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      identityTargetAudiences.includes(option)
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{option}</span>
                    <span className="text-xs font-semibold">
                      {identityTargetAudiences.includes(option) ? 'Selecionado' : 'Selecionar'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Cursos e credenciamentos</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
          <select
            value={identityQualificationSelection}
            onChange={event => setIdentityQualificationSelection(event.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {QUALIFICATION_APPROVED_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={identityQualificationCustomEnabled}
              onChange={event => setIdentityQualificationCustomEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            Informar qualificação fora da lista
          </label>
          <button
            type="button"
            onClick={addIdentityQualification}
            className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Adicionar
          </button>
        </div>
        {identityQualificationCustomEnabled ? (
          <input
            type="text"
            value={identityQualificationCustomName}
            onChange={event => setIdentityQualificationCustomName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Digite o nome da qualificação"
          />
        ) : null}
        <div className="mt-3 space-y-3">
          {identityQualifications.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                <button
                  type="button"
                  onClick={() => setIdentityQualifications(prev => prev.filter(current => current.id !== item.id))}
                  className="text-xs font-semibold text-red-600"
                >
                  Remover
                </button>
              </div>
              <label className="mb-2 inline-flex items-center gap-2 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={item.requires_registration}
                  onChange={event =>
                    setIdentityQualifications(prev =>
                      prev.map((current, i) =>
                        i === index
                          ? { ...current, requires_registration: event.target.checked }
                          : current,
                      ),
                    )
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                Exige número de registro profissional
              </label>
              {item.requires_registration ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={item.registration_number}
                    onChange={event =>
                      setIdentityQualifications(prev =>
                        prev.map((current, i) =>
                          i === index ? { ...current, registration_number: event.target.value } : current,
                        ),
                      )
                    }
                    className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                    placeholder="Número do registro"
                  />
                  <input
                    type="text"
                    value={item.issuer}
                    onChange={event =>
                      setIdentityQualifications(prev =>
                        prev.map((current, i) =>
                          i === index ? { ...current, issuer: event.target.value } : current,
                        ),
                      )
                    }
                    className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                    placeholder="Órgão emissor"
                  />
                  <input
                    type="text"
                    value={item.country}
                    onChange={event =>
                      setIdentityQualifications(prev =>
                        prev.map((current, i) =>
                          i === index ? { ...current, country: event.target.value } : current,
                        ),
                      )
                    }
                    className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                    placeholder="País do registro"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={item.course_name}
                  onChange={event =>
                    setIdentityQualifications(prev =>
                      prev.map((current, i) =>
                        i === index ? { ...current, course_name: event.target.value } : current,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                  placeholder="Nome do curso/formação"
                />
              )}

              <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-white p-2.5">
                <p className="text-[11px] text-neutral-600">
                  Envie comprovantes (PDF/JPG/PNG até 2MB por arquivo).
                </p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700">
                  <Upload className="h-3.5 w-3.5" />
                  Upload comprovante
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={event => {
                      const file = event.target.files?.[0] || null
                      void uploadQualificationDocument(item.id, file)
                      event.currentTarget.value = ''
                    }}
                  />
                </label>

                {item.evidence_files.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {item.evidence_files.map(document => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5"
                      >
                        <a
                          href={`/api/professional/credentials/download/${document.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs font-medium text-brand-700 hover:text-brand-800"
                        >
                          {document.file_name}
                        </a>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                            {document.scan_status === 'clean'
                              ? 'limpo'
                              : document.scan_status === 'rejected'
                                ? 'rejeitado'
                                : 'pendente'}
                          </span>
                          <button
                            type="button"
                            onClick={() => void removeQualificationDocument(item.id, document.id)}
                            className="text-[11px] font-semibold text-red-600"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-amber-700">
                    Envie ao menos um arquivo para esta qualificação.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {identityError ? <p className="text-sm font-medium text-red-700">{identityError}</p> : null}
      {bioError ? <p className="text-sm font-medium text-red-700">{bioError}</p> : null}
      <button
        type="button"
        onClick={() => void saveIdentityAndPublicProfile()}
        disabled={identitySaveState === 'saving' || bioSaveState === 'saving'}
        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {identitySaveState === 'saving' || bioSaveState === 'saving'
          ? 'Salvando...'
          : identitySaveState === 'saved' && bioSaveState === 'saved'
            ? 'Salvo'
            : 'Salvar identidade e perfil'}
      </button>
    </div>
  )
}
