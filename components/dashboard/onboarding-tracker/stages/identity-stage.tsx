'use client'

import type {
  PendingPhoto,
  PhotoValidationChecks,
  SaveState,
  QualificationStructured,
} from '../types'
import type { TierLimits } from '@/lib/tier-config'
import { PhotoUploadSection } from './PhotoUploadSection'
import { IdentityFormSection } from './IdentityFormSection'
import { LanguageSelectorSection } from './LanguageSelectorSection'
import { TargetAudienceSection } from './TargetAudienceSection'
import { QualificationsSection } from './QualificationsSection'

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

export function IdentityStage(props: IdentityStageProps) {
  return (
    <div className="space-y-4">
      <PhotoUploadSection
        pendingPhoto={props.pendingPhoto}
        coverPhotoUrl={props.coverPhotoUrl}
        photoZoom={props.photoZoom}
        setPhotoZoom={props.setPhotoZoom}
        photoFocusX={props.photoFocusX}
        photoFocusY={props.photoFocusY}
        photoValidationChecks={props.photoValidationChecks}
        photoUploadState={props.photoUploadState}
        photoUploadError={props.photoUploadError}
        prepareProfessionalPhoto={props.prepareProfessionalPhoto}
        setPhotoUploadState={props.setPhotoUploadState}
        setPhotoUploadError={props.setPhotoUploadError}
        dragStateRef={props.dragStateRef}
        handlePhotoDragMove={props.handlePhotoDragMove}
        handlePhotoDragEnd={props.handlePhotoDragEnd}
        handlePhotoDragStart={props.handlePhotoDragStart}
      />

      <IdentityFormSection
        identityTitle={props.identityTitle}
        setIdentityTitle={props.setIdentityTitle}
        identityDisplayName={props.identityDisplayName}
        setIdentityDisplayName={props.setIdentityDisplayName}
        identityDisplayNameLocked={props.identityDisplayNameLocked}
        identityCategory={props.identityCategory}
        identitySubcategory={props.identitySubcategory}
        categoryNameBySlug={props.categoryNameBySlug}
        subcategoryNameBySlug={props.subcategoryNameBySlug}
        identityFocusAreas={props.identityFocusAreas}
        focusAreaInput={props.focusAreaInput}
        setFocusAreaInput={props.setFocusAreaInput}
        removeFocusArea={props.removeFocusArea}
        addFocusArea={props.addFocusArea}
        tierLimits={props.tierLimits}
        bio={props.bio}
        setBio={props.setBio}
        identityYearsExperience={props.identityYearsExperience}
        setIdentityYearsExperience={props.setIdentityYearsExperience}
        identityPrimaryLanguage={props.identityPrimaryLanguage}
        setIdentityPrimaryLanguage={props.setIdentityPrimaryLanguage}
      />

      <LanguageSelectorSection
        identitySecondaryLanguages={props.identitySecondaryLanguages}
        identityPrimaryLanguage={props.identityPrimaryLanguage}
        toggleMultiValue={props.toggleMultiValue}
        setIdentitySecondaryLanguages={props.setIdentitySecondaryLanguages}
        secondaryLanguagesOpen={props.secondaryLanguagesOpen}
        setSecondaryLanguagesOpen={props.setSecondaryLanguagesOpen}
      />

      <TargetAudienceSection
        identityTargetAudiences={props.identityTargetAudiences}
        setIdentityTargetAudiences={props.setIdentityTargetAudiences}
        targetAudiencesOpen={props.targetAudiencesOpen}
        setTargetAudiencesOpen={props.setTargetAudiencesOpen}
        toggleMultiValue={props.toggleMultiValue}
      />

      <QualificationsSection
        identityQualificationSelection={props.identityQualificationSelection}
        setIdentityQualificationSelection={props.setIdentityQualificationSelection}
        identityQualificationCustomEnabled={props.identityQualificationCustomEnabled}
        setIdentityQualificationCustomEnabled={props.setIdentityQualificationCustomEnabled}
        identityQualificationCustomName={props.identityQualificationCustomName}
        setIdentityQualificationCustomName={props.setIdentityQualificationCustomName}
        identityQualifications={props.identityQualifications}
        setIdentityQualifications={props.setIdentityQualifications}
        addIdentityQualification={props.addIdentityQualification}
        uploadQualificationDocument={props.uploadQualificationDocument}
        removeQualificationDocument={props.removeQualificationDocument}
      />

      {props.identityError ? <p className="text-sm font-medium text-red-700">{props.identityError}</p> : null}
      {props.bioError ? <p className="text-sm font-medium text-red-700">{props.bioError}</p> : null}
      <button
        type="button"
        onClick={() => void props.saveIdentityAndPublicProfile()}
        disabled={props.identitySaveState === 'saving' || props.bioSaveState === 'saving'}
        className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8ed85f] disabled:opacity-60"
      >
        {props.identitySaveState === 'saving' || props.bioSaveState === 'saving'
          ? 'Salvando...'
          : props.identitySaveState === 'saved' && props.bioSaveState === 'saved'
            ? 'Salvo'
            : 'Salvar identidade e perfil'}
      </button>
    </div>
  )
}
