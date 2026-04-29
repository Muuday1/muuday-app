import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Clock, User, CreditCard } from 'lucide-react-native'
import { useStripe } from '@stripe/stripe-react-native'
import { apiV1 } from '@/lib/api'
import { useAvailability } from '@/hooks/useAvailability'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import {
  generateTimeSlots,
  buildScheduledAt,
  isSlotBlockedByException,
  hasUtcBookingConflict,
} from '@/lib/booking/slots'
import type { AvailabilityRule, AvailabilityException, ExistingBooking } from '@/lib/booking/slots'

function formatPrice(priceBrl: number, currency: string | null): string {
  if (!priceBrl || priceBrl <= 0) return 'Preço sob consulta'
  const symbol = currency === 'BRL' ? 'R$' : currency || 'R$'
  return `${symbol} ${priceBrl.toFixed(2).replace('.', ',')}`
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateDisplay(date: Date): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return `${days[date.getDay()]}, ${date.getDate()}`
}

function getDayOfWeek(date: Date): number {
  return date.getDay()
}

function getAvailableSlotsForDate(
  date: Date,
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  existingBookings: ExistingBooking[],
  durationMinutes: number,
): string[] {
  const dateKey = formatDateKey(date)
  const dayOfWeek = getDayOfWeek(date)

  // Check exception - if fully unavailable, return empty
  const exception = exceptions.find((e) => e.date_local === dateKey)
  if (exception && !exception.is_available && exception.start_time_local === null) {
    return []
  }

  // Find rules for this day
  const dayRules = rules.filter((r) => r.weekday === dayOfWeek)
  if (dayRules.length === 0) {
    return []
  }

  // Generate slots from all applicable rules and deduplicate
  const allSlots = new Set<string>()
  for (const rule of dayRules) {
    const slots = generateTimeSlots(rule.start_time_local, rule.end_time_local, durationMinutes)
    for (const slot of slots) {
      allSlots.add(slot)
    }
  }

  // Filter out blocked slots
  const availableSlots: string[] = []
  for (const slot of Array.from(allSlots).sort()) {
    // Check exception override
    if (exception && !exception.is_available) {
      if (exception.start_time_local !== null && exception.end_time_local !== null) {
        if (slot >= exception.start_time_local && slot < exception.end_time_local) {
          continue
        }
      }
    }

    // Check existing bookings
    const scheduledAt = buildScheduledAt(dateKey, slot)
    const slotUtc = new Date(scheduledAt)
    const slotEndUtc = new Date(slotUtc.getTime() + durationMinutes * 60 * 1000)
    if (hasUtcBookingConflict(slotUtc, slotEndUtc, existingBookings)) {
      continue
    }

    availableSlots.push(slot)
  }

  return availableSlots
}

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)

  const {
    data: professionalData,
    isLoading: isProfessionalLoading,
    isError: isProfessionalError,
  } = useQuery({
    queryKey: ['professional', 'detail', id],
    queryFn: () => apiV1.professionals.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useAvailability(id)

  const createBooking = useCreateBooking()

  const professional = professionalData?.data?.professional
  const profile = professional?.profiles
  const displayName = profile?.full_name || 'Profissional'
  const durationMinutes = professional?.session_duration_minutes || 60
  const priceBrl = professional?.session_price_brl || 0
  const currency = professional?.session_price_currency || 'BRL'

  const availability = availabilityData?.data
  const rules = availability?.rules ?? []
  const exceptions = availability?.exceptions ?? []
  const existingBookings = availability?.existingBookings ?? []

  // Generate next 14 days, filtered to days with availability rules
  const availableDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i)
      const dayOfWeek = getDayOfWeek(date)
      const hasRule = rules.some((r) => r.weekday === dayOfWeek)
      if (hasRule) {
        dates.push(date)
      }
    }
    return dates.slice(0, 14)
  }, [rules])

  // Auto-select first available date
  useMemo(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0])
    }
  }, [availableDates, selectedDate])

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return getAvailableSlotsForDate(
      selectedDate,
      rules,
      exceptions,
      existingBookings,
      durationMinutes,
    )
  }, [selectedDate, rules, exceptions, existingBookings, durationMinutes])

  const handleConfirm = useCallback(async () => {
    if (!selectedDate || !selectedTime || !professional) return

    setIsPaymentLoading(true)

    try {
      // 1. Create booking
      const scheduledAt = buildScheduledAt(formatDateKey(selectedDate), selectedTime)
      const bookingResponse = await createBooking.mutateAsync({
        professionalId: id,
        scheduledAt,
        notes: notes.trim() || undefined,
        bookingType: 'one_off',
      })

      const bookingId = bookingResponse.bookingId
      if (!bookingId) {
        throw new Error('Booking creation failed: no bookingId returned')
      }

      // 2. Get payment intent
      const paymentResponse = await apiV1.payments.createPaymentIntent({
        bookingId,
      })

      // 3. Initialize PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentResponse.clientSecret,
        merchantDisplayName: 'Muuday',
        allowsDelayedPaymentMethods: false,
        style: 'automatic',
      })

      if (initError) {
        throw new Error(`Payment sheet initialization failed: ${initError.message}`)
      }

      // 4. Present PaymentSheet
      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        // User cancelled or payment failed
        if (presentError.code === 'Canceled') {
          Alert.alert(
            'Pagamento cancelado',
            'Sua reserva foi criada. Você pode completar o pagamento mais tarde.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/bookings'),
              },
            ],
          )
          return
        }
        throw new Error(`Payment failed: ${presentError.message}`)
      }

      // Payment successful
      Alert.alert(
        'Reserva confirmada!',
        `Sua sessão com ${displayName} foi agendada para ${formatDateDisplay(selectedDate)} às ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ],
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      Alert.alert('Erro', message)
    } finally {
      setIsPaymentLoading(false)
    }
  }, [
    selectedDate,
    selectedTime,
    professional,
    id,
    notes,
    createBooking,
    initPaymentSheet,
    presentPaymentSheet,
    router,
    displayName,
  ])

  if (isProfessionalLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (isProfessionalError || !professional) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page px-6">
        <Text className="text-error text-sm text-center">
          Erro ao carregar dados do profissional.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary rounded-lg px-6 py-2.5"
        >
          <Text className="text-text-primary font-medium text-sm">Voltar</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-surface-page">
      {/* Header */}
      <View className="pt-12 pb-4 px-4 bg-white border-b border-border flex-row items-center">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-text-primary text-lg font-bold ml-2 flex-1" numberOfLines={1}>
          Agendar sessão
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Professional Summary */}
        <View className="px-4 mt-4">
          <View className="bg-white rounded-xl border border-border p-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                <User size={24} color="#0F172A" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-text-primary font-semibold text-base" numberOfLines={1}>
                  {displayName}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Clock size={14} color="#64748B" />
                  <Text className="text-text-muted text-sm ml-1">{durationMinutes} min</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-text-primary font-bold text-lg">
                  {formatPrice(priceBrl, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        <View className="px-4 mt-4">
          <View className="bg-white rounded-xl border border-border p-4">
            <View className="flex-row items-center mb-3">
              <Calendar size={18} color="#0F172A" />
              <Text className="text-text-primary font-semibold text-base ml-2">
                Selecione uma data
              </Text>
            </View>

            {isAvailabilityLoading ? (
              <ActivityIndicator size="small" color="#007AFF" className="py-4" />
            ) : isAvailabilityError ? (
              <Text className="text-error text-sm text-center py-4">
                Erro ao carregar disponibilidade.
              </Text>
            ) : availableDates.length === 0 ? (
              <Text className="text-text-muted text-sm text-center py-4">
                Nenhuma data disponível nos próximos dias.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {availableDates.map((date) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString()
                    return (
                      <Pressable
                        key={date.toISOString()}
                        onPress={() => {
                          setSelectedDate(date)
                          setSelectedTime(null)
                        }}
                        className={`px-4 py-3 rounded-xl border items-center min-w-[72px] ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-surface-page border-border'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            isSelected ? 'text-text-primary' : 'text-text-muted'
                          }`}
                        >
                          {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </Text>
                        <Text
                          className={`text-lg font-bold mt-0.5 ${
                            isSelected ? 'text-text-primary' : 'text-text-primary'
                          }`}
                        >
                          {date.getDate()}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        {/* Time Slots */}
        {selectedDate && !isAvailabilityLoading && (
          <View className="px-4 mt-4">
            <View className="bg-white rounded-xl border border-border p-4">
              <View className="flex-row items-center mb-3">
                <Clock size={18} color="#0F172A" />
                <Text className="text-text-primary font-semibold text-base ml-2">
                  Selecione um horário
                </Text>
              </View>

              {slotsForSelectedDate.length === 0 ? (
                <Text className="text-text-muted text-sm text-center py-4">
                  Nenhum horário disponível para esta data.
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {slotsForSelectedDate.map((slot) => {
                    const isSelected = selectedTime === slot
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => setSelectedTime(slot)}
                        className={`px-4 py-2.5 rounded-lg border ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-surface-page border-border'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? 'text-text-primary' : 'text-text-primary'
                          }`}
                        >
                          {slot}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        <View className="px-4 mt-4">
          <View className="bg-white rounded-xl border border-border p-4">
            <Text className="text-text-primary font-semibold text-base mb-2">
              Observações (opcional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Algo que o profissional deva saber?"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-surface-page rounded-lg border border-border px-3 py-2.5 text-text-primary text-sm min-h-[80px]"
            />
          </View>
        </View>

        {/* Bottom spacing for CTA */}
        <View className="h-28" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 pb-6">
        <Pressable
          onPress={handleConfirm}
          disabled={!selectedDate || !selectedTime || isPaymentLoading}
          className={`rounded-xl h-14 items-center justify-center flex-row ${
            !selectedDate || !selectedTime || isPaymentLoading
              ? 'bg-gray-300'
              : 'bg-primary'
          }`}
        >
          {isPaymentLoading ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <>
              <CreditCard size={18} color="#0F172A" />
              <Text className="text-text-primary font-semibold text-sm ml-2">
                Confirmar e pagar {formatPrice(priceBrl, currency)}
              </Text>
            </>
          )}
        </Pressable>
        {(!selectedDate || !selectedTime) && (
          <Text className="text-text-muted text-xs text-center mt-2">
            Selecione uma data e horário para continuar
          </Text>
        )}
      </View>
    </View>
  )
}
