'use client'

import { useState } from 'react'
import {
  createProfessionalService,
  updateProfessionalService,
  deleteProfessionalService,
} from '@/lib/actions/professional-services'
import { Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price_brl: number
  is_active: boolean
}

interface Props {
  professionalId: string
  initialServices: Service[]
}

export function ProfessionalServicesManager({ initialServices }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMinutes: 50,
    priceBrl: '',
  })

  function resetForm() {
    setForm({ name: '', description: '', durationMinutes: 50, priceBrl: '' })
    setError(null)
  }

  async function handleCreate() {
    setIsLoading(true)
    setError(null)
    const result = await createProfessionalService(
      form.name,
      form.durationMinutes,
      Number(form.priceBrl),
      form.description || undefined,
    )
    if (result.success) {
      const newService: Service = {
        id: result.data.serviceId,
        name: form.name,
        description: form.description || null,
        duration_minutes: form.durationMinutes,
        price_brl: Number(form.priceBrl),
        is_active: true,
      }
      setServices(prev => [...prev, newService])
      setIsAdding(false)
      resetForm()
    } else {
      setError(result.error || 'Erro ao criar serviço.')
    }
    setIsLoading(false)
  }

  async function handleUpdate(serviceId: string) {
    setIsLoading(true)
    setError(null)
    const result = await updateProfessionalService(serviceId, {
      name: form.name,
      durationMinutes: form.durationMinutes,
      priceBrl: Number(form.priceBrl),
      description: form.description || undefined,
    })
    if (result.success) {
      setServices(prev =>
        prev.map(s =>
          s.id === serviceId
            ? {
                ...s,
                name: form.name,
                description: form.description || null,
                duration_minutes: form.durationMinutes,
                price_brl: Number(form.priceBrl),
              }
            : s,
        ),
      )
      setEditingId(null)
      resetForm()
    } else {
      setError(result.error || 'Erro ao atualizar serviço.')
    }
    setIsLoading(false)
  }

  async function handleDelete(serviceId: string) {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return
    setIsLoading(true)
    const result = await deleteProfessionalService(serviceId)
    if (result.success) {
      setServices(prev => prev.filter(s => s.id !== serviceId))
    } else {
      setError(result.error || 'Erro ao remover serviço.')
    }
    setIsLoading(false)
  }

  function startEdit(service: Service) {
    setEditingId(service.id)
    setForm({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.duration_minutes,
      priceBrl: String(service.price_brl),
    })
    setError(null)
  }

  const isFormValid =
    form.name.trim().length > 0 &&
    Number(form.priceBrl) >= 0 &&
    form.durationMinutes >= 15 &&
    form.durationMinutes <= 300

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isAdding && !editingId && (
        <button
          onClick={() => {
            setIsAdding(true)
            resetForm()
          }}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
        >
          <Plus className="h-4 w-4" />
          Adicionar serviço
        </button>
      )}

      {(isAdding || editingId) && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900">
            {editingId ? 'Editar serviço' : 'Novo serviço'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nome do serviço</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Sessão de terapia individual"
                className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Descrição</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição do serviço"
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Duração (min)</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={e => setForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                  min={15}
                  max={300}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Preço (R$)</label>
                <input
                  type="number"
                  value={form.priceBrl}
                  onChange={e => setForm(prev => ({ ...prev, priceBrl: e.target.value }))}
                  min={0}
                  step={0.01}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
              disabled={isLoading || !isFormValid}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ed85f] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {editingId ? 'Salvar' : 'Criar'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                resetForm()
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50/70"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {services.length === 0 && !isAdding ? (
          <div className="rounded-lg border border-slate-200/80 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
            <p className="text-xs text-slate-400">Adicione serviços para que os clientes possam escolher.</p>
          </div>
        ) : (
          services.map(service => (
            <div
              key={service.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-200/80 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                {service.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{service.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span>{service.duration_minutes} min</span>
                  <span>R$ {Number(service.price_brl).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(service)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
