'use client'

import { useState, useCallback } from 'react'
import type { SaveState, ProfessionalServiceItem } from '../types'

type SaveSectionFn = (
  payload: object,
  fallbackError: string,
  options?: { autoAdvance?: boolean },
) => Promise<{
  ok?: boolean
  error?: string
  evaluation?: object
  professionalStatus?: string
  reviewAdjustments?: object[]
  service?: ProfessionalServiceItem
  deletedServiceId?: string | null
}>

export function useServiceState(
  tierLimits: { services: number },
  exchangeRates: Record<string, number>,
  saveSection: SaveSectionFn,
) {
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [services, setServices] = useState<ProfessionalServiceItem[]>([])
  const [serviceSaveState, setServiceSaveState] = useState<SaveState>('idle')
  const [serviceError, setServiceError] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('BRL')

  const resetServiceForm = useCallback(() => {
    setEditingServiceId(null)
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setServiceDuration('60')
  }, [])

  const beginServiceEdit = useCallback(
    (service: ProfessionalServiceItem, servicesLoadFailed: boolean) => {
      if (servicesLoadFailed) {
        setServiceError('Não foi possível carregar seus serviços. Tente novamente antes de editar.')
        setServiceSaveState('error')
        return
      }
      const selectedCurrency = serviceCurrency || 'BRL'
      const selectedRate = exchangeRates[selectedCurrency] || 1
      const priceInSelectedCurrency =
        selectedCurrency === 'BRL'
          ? Number(service.price_brl || 0)
          : Number(service.price_brl || 0) * selectedRate

      setEditingServiceId(service.id)
      setServiceName(service.name || '')
      setServiceDescription(service.description || '')
      setServicePrice(priceInSelectedCurrency > 0 ? priceInSelectedCurrency.toFixed(2) : '')
      setServiceDuration(String(service.duration_minutes || 60))
      setServiceError('')
      setServiceSaveState('idle')
    },
    [exchangeRates, serviceCurrency],
  )

  const deleteService = useCallback(
    async (serviceId: string, servicesLoadFailed: boolean) => {
      if (servicesLoadFailed) {
        setServiceSaveState('error')
        setServiceError('Não foi possível carregar seus serviços. Tente novamente antes de excluir.')
        return
      }
      if (!serviceId || serviceSaveState === 'saving') return

      setServiceSaveState('saving')
      setServiceError('')

      try {
        const result = await saveSection(
          {
            section: 'service',
            operation: 'delete',
            serviceId,
          },
          'Não foi possível remover o serviço.',
          { autoAdvance: false },
        )
        const removedId = String(result.deletedServiceId || serviceId)
        setServices(prev => prev.filter(item => item.id !== removedId))
        if (editingServiceId === removedId) {
          resetServiceForm()
        }
        setServiceSaveState('saved')
        setTimeout(() => setServiceSaveState('idle'), 1500)
      } catch (error) {
        setServiceSaveState('error')
        setServiceError(error instanceof Error ? error.message : 'Não foi possível remover o serviço.')
      }
    },
    [editingServiceId, serviceSaveState, saveSection, resetServiceForm],
  )

  const saveService = useCallback(
    async (servicesLoadFailed: boolean) => {
      const isEditing = Boolean(editingServiceId)
      if (servicesLoadFailed) {
        setServiceSaveState('error')
        setServiceError('Não foi possível carregar seus serviços. Tente novamente antes de salvar alterações.')
        return
      }
      const maxServices = tierLimits.services
      if (!isEditing && services.length >= maxServices) {
        setServiceSaveState('error')
        setServiceError(`Seu plano permite até ${maxServices} serviço(s) ativo(s).`)
        return
      }
      if (!serviceName.trim()) {
        setServiceSaveState('error')
        setServiceError('Informe um título para o serviço.')
        return
      }
      if (serviceName.trim().length > 30) {
        setServiceSaveState('error')
        setServiceError('Título do serviço deve ter no máximo 30 caracteres.')
        return
      }
      if (!serviceDescription.trim()) {
        setServiceSaveState('error')
        setServiceError('Informe uma descrição para o serviço.')
        return
      }
      if (serviceDescription.trim().length > 120) {
        setServiceSaveState('error')
        setServiceError('Descrição deve ter no máximo 120 caracteres.')
        return
      }
      const price = Number(servicePrice)
      const duration = Number(serviceDuration)
      if (!Number.isFinite(price) || price <= 0) {
        setServiceSaveState('error')
        setServiceError('Informe um preço válido.')
        return
      }
      if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
        setServiceSaveState('error')
        setServiceError('Duração inválida. Use entre 15 e 240 minutos.')
        return
      }

      setServiceSaveState('saving')
      setServiceError('')

      const selectedCurrency = serviceCurrency || 'BRL'
      const selectedRate = exchangeRates[selectedCurrency] || 1
      const priceBrl = selectedCurrency === 'BRL' ? price : price / selectedRate

      try {
        const result = await saveSection(
          {
            section: 'service',
            operation: isEditing ? 'update' : 'create',
            serviceId: isEditing ? editingServiceId : undefined,
            name: serviceName.trim(),
            description: serviceDescription.trim(),
            priceBrl: Number(priceBrl.toFixed(2)),
            durationMinutes: duration,
          },
          isEditing ? 'Não foi possível atualizar o serviço.' : 'Não foi possível criar o serviço.',
          { autoAdvance: false },
        )

        if (result.service) {
          if (isEditing) {
            setServices(prev =>
              prev.map(item => (item.id === result.service!.id ? result.service! : item)),
            )
          } else {
            setServices(prev => [...prev, result.service!])
          }
        }
        resetServiceForm()
        setServiceSaveState('saved')
        setTimeout(() => setServiceSaveState('idle'), 2000)
      } catch (error) {
        setServiceSaveState('error')
        setServiceError(
          error instanceof Error
            ? error.message
            : isEditing
              ? 'Não foi possível atualizar o serviço.'
              : 'Não foi possível criar o serviço.',
        )
      }
    },
    [
      editingServiceId,
      services,
      serviceName,
      serviceDescription,
      servicePrice,
      serviceDuration,
      serviceCurrency,
      exchangeRates,
      tierLimits.services,
      saveSection,
      resetServiceForm,
    ],
  )

  return {
    serviceName,
    setServiceName,
    serviceDescription,
    setServiceDescription,
    servicePrice,
    setServicePrice,
    serviceDuration,
    setServiceDuration,
    editingServiceId,
    setEditingServiceId,
    services,
    setServices,
    serviceSaveState,
    setServiceSaveState,
    serviceError,
    setServiceError,
    serviceCurrency,
    setServiceCurrency,
    resetServiceForm,
    beginServiceEdit,
    deleteService,
    saveService,
  }
}
