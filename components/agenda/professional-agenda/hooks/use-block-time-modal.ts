'use client'

import { useState, useCallback } from 'react'

interface BlockModalState {
  open: boolean
  date: Date
  startMinutes: number
}

interface UseBlockTimeModalReturn {
  blockModal: BlockModalState | null
  blockReason: string
  blockLoading: boolean
  blockError: string | null
  openBlockModal: (date: Date, startMinutes: number) => void
  closeBlockModal: () => void
  setBlockReason: (value: string) => void
  setBlockError: (error: string | null) => void
  setBlockLoading: (loading: boolean) => void
}

export function useBlockTimeModal(): UseBlockTimeModalReturn {
  const [blockModal, setBlockModal] = useState<BlockModalState | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const openBlockModal = useCallback((date: Date, startMinutes: number) => {
    setBlockModal({ open: true, date, startMinutes })
    setBlockReason('')
    setBlockError(null)
  }, [])

  const closeBlockModal = useCallback(() => {
    setBlockModal(null)
  }, [])

  return {
    blockModal,
    blockReason,
    blockLoading,
    blockError,
    openBlockModal,
    closeBlockModal,
    setBlockReason,
    setBlockError,
    setBlockLoading,
  }
}
