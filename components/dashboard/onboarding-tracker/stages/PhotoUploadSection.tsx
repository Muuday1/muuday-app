'use client'

import { Upload } from 'lucide-react'
import type { PendingPhoto, PhotoValidationChecks, SaveState } from '../types'

interface PhotoUploadSectionProps {
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
}

export function PhotoUploadSection({
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
}: PhotoUploadSectionProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5">
      <label className="mb-2 block text-sm font-semibold text-slate-900">Foto de perfil</label>
      <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f] sm:w-auto">
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
                className="relative h-48 w-48 overflow-hidden rounded-full border border-slate-200 bg-white"
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
              <p className="text-[11px] text-slate-500">
                Arraste a imagem para reposicionar o centro. Use o zoom se quiser ajustar também para os lados.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold text-slate-800">Validação automática</p>
                <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs">
                  {[
                    ['Formato (JPG/PNG/WEBP)', photoValidationChecks.format],
                    ['Tamanho (até 3MB)', photoValidationChecks.size],
                    ['Resolução mínima (320x320)', photoValidationChecks.minResolution],
                    ['Rosto centralizado', photoValidationChecks.faceCentered],
                    ['Fundo claro/neutro', photoValidationChecks.neutralBackground],
                  ].map(([label, status]) => (
                    <div key={String(label)} className="flex items-center justify-between gap-2">
                      <span className="text-slate-700">{label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          status === 'pass'
                            ? 'bg-green-100 text-green-700'
                            : status === 'fail'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-200 text-slate-600'
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
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={photoZoom}
                    onChange={event => setPhotoZoom(Number(event.target.value))}
                    className="w-full accent-[#8ed85f]"
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {photoUploadState === 'saving' ? (
        <p className="mt-2 text-xs text-[#3d6b1f]">Preparando foto...</p>
      ) : null}
      {photoUploadError ? <p className="mt-2 text-xs font-medium text-red-600">{photoUploadError}</p> : null}
    </div>
  )
}
