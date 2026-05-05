'use client'

import { Upload } from 'lucide-react'
import { QUALIFICATION_APPROVED_OPTIONS } from '../constants'
import type { QualificationStructured } from '../types'

interface QualificationsSectionProps {
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
}

export function QualificationsSection({
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
}: QualificationsSectionProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Cursos e credenciamentos</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
        <select
          value={identityQualificationSelection}
          onChange={event => setIdentityQualificationSelection(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {QUALIFICATION_APPROVED_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={identityQualificationCustomEnabled}
            onChange={event => setIdentityQualificationCustomEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#3d6b1f] focus:ring-[#9FE870]"
          />
          Informar qualificação fora da lista
        </label>
        <button
          type="button"
          onClick={addIdentityQualification}
          className="rounded-lg bg-[#9FE870] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8ed85f]"
        >
          Adicionar
        </button>
      </div>
      {identityQualificationCustomEnabled ? (
        <input
          type="text"
          value={identityQualificationCustomName}
          onChange={event => setIdentityQualificationCustomName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Digite o nome da qualificação"
        />
      ) : null}
      <div className="mt-3 space-y-3">
        {identityQualifications.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              <button
                type="button"
                onClick={() => setIdentityQualifications(prev => prev.filter(current => current.id !== item.id))}
                className="text-xs font-semibold text-red-600"
              >
                Remover
              </button>
            </div>
            <label className="mb-2 inline-flex items-center gap-2 text-xs text-slate-700">
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
                className="h-4 w-4 rounded border-slate-300 text-[#3d6b1f] focus:ring-[#9FE870]"
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
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
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
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                placeholder="Nome do curso/formação"
              />
            )}

            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-2.5">
              <p className="text-[11px] text-slate-600">
                Envie comprovantes (PDF/JPG/PNG até 2MB por arquivo).
              </p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]">
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
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5"
                    >
                      <a
                        href={`/api/professional/credentials/download/${document.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-xs font-medium text-[#3d6b1f] hover:text-[#2d5016]"
                      >
                        {document.file_name}
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
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
  )
}
