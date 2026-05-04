'use client'

import { useState } from 'react'
import type { SaveState, ProfessionalServiceItem } from '../types'

export function useServiceState() {
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [services, setServices] = useState<ProfessionalServiceItem[]>([])
  const [serviceSaveState, setServiceSaveState] = useState<SaveState>('idle')
  const [serviceError, setServiceError] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('BRL')

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
  }
}
