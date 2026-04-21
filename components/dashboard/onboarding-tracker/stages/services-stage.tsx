'use client'

import { formatCurrencyFromBrl } from '../helpers'
import type { ProfessionalServiceItem, SaveState } from '../types'
import type { ExchangeRateMap } from '@/lib/exchange-rates'
import type { TierLimits } from '@/lib/tier-config'

type ServicesLoadState = 'idle' | 'loaded' | 'degraded' | 'failed'

interface ServicesStageProps {
  tierLimits: TierLimits
  services: ProfessionalServiceItem[]
  servicesLoadedSuccessfully: boolean
  servicesLoadState: ServicesLoadState
  servicesLoadError: string | null
  servicesLoadFailed: boolean
  serviceCurrency: string
  serviceName: string
  setServiceName: (value: string) => void
  serviceDescription: string
  setServiceDescription: (value: string) => void
  servicePrice: string
  setServicePrice: (value: string) => void
  serviceDuration: string
  setServiceDuration: (value: string) => void
  editingServiceId: string | null
  serviceActionsDisabled: boolean
  serviceError: string | null
  serviceSaveState: SaveState
  saveService: () => Promise<void>
  resetServiceForm: () => void
  beginServiceEdit: (service: ProfessionalServiceItem) => void
  deleteService: (id: string) => Promise<void>
  reloadTrackerContext: () => Promise<void>
  loadingContext: boolean
  exchangeRates: ExchangeRateMap
}

export function ServicesStage({
  tierLimits,
  services,
  servicesLoadedSuccessfully,
  servicesLoadState,
  servicesLoadError,
  servicesLoadFailed,
  serviceCurrency,
  serviceName,
  setServiceName,
  serviceDescription,
  setServiceDescription,
  servicePrice,
  setServicePrice,
  serviceDuration,
  setServiceDuration,
  editingServiceId,
  serviceActionsDisabled,
  serviceError,
  serviceSaveState,
  saveService,
  resetServiceForm,
  beginServiceEdit,
  deleteService,
  reloadTrackerContext,
  loadingContext,
  exchangeRates,
}: ServicesStageProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5">
        <p className="text-sm text-slate-700">
          Limite do plano atual: <strong>{tierLimits.services} serviço(s)</strong> ativo(s).
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Serviços cadastrados:{' '}
          {servicesLoadedSuccessfully
            ? `${services.length}/${tierLimits.services}`
            : 'indisponível durante a sincronização'}
        </p>
        <p className="mt-1 text-xs text-slate-500">Valores exibidos em {serviceCurrency}.</p>
        {servicesLoadState === 'degraded' && servicesLoadError ? (
          <p className="mt-2 text-xs font-medium text-amber-700">{servicesLoadError}</p>
        ) : null}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3.5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          {editingServiceId ? 'Editar serviço' : 'Adicionar serviço'}
        </h3>
        {servicesLoadFailed ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {servicesLoadError || 'Não foi possível carregar seus serviços agora. Tente novamente em instantes.'}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Título</label>
            <input
              type="text"
              value={serviceName}
              onChange={event => setServiceName(event.target.value)}
              disabled={serviceActionsDisabled}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              maxLength={30}
              placeholder="Ex.: Consultoria fiscal"
            />
            <p className="mt-1 text-[11px] text-slate-500">{serviceName.length}/30</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Descrição</label>
            <textarea
              rows={4}
              value={serviceDescription}
              onChange={event => setServiceDescription(event.target.value)}
              disabled={serviceActionsDisabled}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              maxLength={120}
              placeholder="Explique o objetivo, formato e resultado esperado do serviço."
            />
            <p className="mt-1 text-[11px] text-slate-500">{serviceDescription.length}/120</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Preço por sessão ({serviceCurrency})</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={servicePrice}
              onChange={event => setServicePrice(event.target.value)}
              disabled={serviceActionsDisabled}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Duração (minutos)</label>
            <select
              value={serviceDuration}
              onChange={event => setServiceDuration(event.target.value)}
              disabled={serviceActionsDisabled}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              {[30, 45, 50, 60, 75, 90, 120].map(option => (
                <option key={option} value={option}>
                  {option} min
                </option>
              ))}
            </select>
          </div>
        </div>

        {serviceError ? <p className="mt-3 text-sm font-medium text-red-700">{serviceError}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void saveService()}
            disabled={serviceActionsDisabled}
            className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8ed85f] disabled:opacity-60"
          >
            {serviceSaveState === 'saving'
              ? 'Salvando...'
              : serviceSaveState === 'saved'
                ? 'Salvo'
                : editingServiceId
                  ? 'Salvar serviço'
                  : 'Adicionar serviço'}
          </button>
          {editingServiceId ? (
            <button
              type="button"
              onClick={resetServiceForm}
              disabled={serviceActionsDisabled}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50/70 disabled:opacity-60"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3.5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Serviços ativos</h3>
        {servicesLoadState === 'idle' ? (
          <p className="text-sm text-slate-500">Sincronizando seus serviços...</p>
        ) : servicesLoadFailed ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-amber-800">
              {servicesLoadError || 'Não foi possível carregar seus serviços agora.'}
            </p>
            <button
              type="button"
              onClick={() => void reloadTrackerContext()}
              disabled={loadingContext}
              className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
            >
              {loadingContext ? 'Recarregando...' : 'Tentar novamente'}
            </button>
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum serviço ativo ainda.</p>
        ) : (
          <div className="space-y-2">
            {services.map(service => (
              <div key={service.id} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                <p className="text-xs text-slate-600">{service.description || 'Sem descrição'}</p>
                <p className="mt-1 text-xs text-slate-700">
                  {formatCurrencyFromBrl(Number(service.price_brl || 0), serviceCurrency, exchangeRates)} ·{' '}
                  {service.duration_minutes} min
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => beginServiceEdit(service)}
                    disabled={serviceActionsDisabled}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteService(service.id)}
                    disabled={serviceActionsDisabled}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
