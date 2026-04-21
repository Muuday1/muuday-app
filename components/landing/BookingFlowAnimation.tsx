'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ChevronRight, Clock, CreditCard, Repeat, Star, User, Video } from 'lucide-react'

const STEPS = [
  {
    id: 'profile',
    label: 'Encontra o profissional',
  },
  {
    id: 'service',
    label: 'Escolhe o serviço',
  },
  {
    id: 'datetime',
    label: 'Seleciona dia e hora',
  },
  {
    id: 'payment',
    label: 'Confirma e paga',
  },
]

export function BookingFlowAnimation() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const currentStep = STEPS[step]

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-slate-900 bg-slate-900">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-xl bg-slate-900" />

        {/* Screen */}
        <div className="relative h-[480px] bg-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <span className="text-xs font-bold text-slate-900">9:41</span>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-full bg-slate-900" />
              <div className="h-3 w-3 rounded-full bg-slate-900" />
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 px-5 pb-3">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-[#9FE870]' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-4">
            <AnimatePresence mode="wait">
              {currentStep.id === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3"
                >
                  {/* Search bar */}
                  <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2.5">
                    <div className="h-4 w-4 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">Buscar psicólogos...</span>
                  </div>

                  {/* Pro card */}
                  <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#9FE870]" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">Dra. Fernanda Lima</p>
                        <p className="text-xs text-slate-500">Psicóloga Clínica · Lisboa</p>
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700">4.9</span>
                          <span className="text-xs text-slate-400">(47 avaliações)</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">R$ 200 <span className="text-xs font-normal text-slate-500">/ sessão</span></span>
                      <motion.span
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                        className="inline-flex items-center gap-1 rounded-full bg-[#9FE870] px-3 py-1.5 text-xs font-bold text-slate-900"
                      >
                        Agendar <ChevronRight className="h-3 w-3" />
                      </motion.span>
                    </div>

                    {/* Cursor */}
                    <motion.div
                      className="absolute bottom-4 right-4"
                      animate={{ x: [0, -60, 0], y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.44 0 .66-.53.35-.85L6.35 2.86a.5.5 0 00-.85.35z" fill="white" stroke="#0f172a" strokeWidth="1.5" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {currentStep.id === 'service' && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-bold text-slate-900">Escolha o serviço</p>
                  {[
                    { name: 'Consulta inicial', price: 'R$ 200', time: '50 min' },
                    { name: 'Pacote 4 sessões', price: 'R$ 720', time: '4x 50 min', highlight: true },
                  ].map((svc) => (
                    <motion.div
                      key={svc.name}
                      animate={svc.highlight ? { borderColor: ['#e2e8f0', '#9FE870', '#e2e8f0'] } : {}}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                      className={`rounded-md border-2 p-3 ${svc.highlight ? 'border-[#9FE870] bg-[#9FE870]/5' : 'border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{svc.name}</p>
                          <p className="text-xs text-slate-500">{svc.time}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{svc.price}</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Cursor */}
                  <motion.div
                    className="absolute bottom-24 right-8"
                    animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.44 0 .66-.53.35-.85L6.35 2.86a.5.5 0 00-.85.35z" fill="white" stroke="#0f172a" strokeWidth="1.5" />
                    </svg>
                  </motion.div>
                </motion.div>
              )}

              {currentStep.id === 'datetime' && (
                <motion.div
                  key="datetime"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-bold text-slate-900">Selecione dia e hora</p>

                  {/* Date picker mock */}
                  <div className="flex gap-2">
                    {['Seg', 'Ter', 'Qua', 'Qui'].map((d, i) => (
                      <motion.div
                        key={d}
                        animate={i === 1 ? { backgroundColor: ['#ffffff', '#9FE870', '#ffffff'], borderColor: ['#e2e8f0', '#9FE870', '#e2e8f0'] } : {}}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
                        className={`flex h-14 w-14 flex-col items-center justify-center rounded-md border-2 ${i === 1 ? 'border-[#9FE870]' : 'border-slate-200'}`}
                      >
                        <span className="text-[10px] text-slate-500">{d}</span>
                        <span className="text-sm font-bold text-slate-900">{15 + i}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Time slots */}
                  <div className="grid grid-cols-3 gap-2">
                    {['14:00', '15:00', '16:00'].map((t, i) => (
                      <motion.div
                        key={t}
                        animate={i === 1 ? { backgroundColor: ['#ffffff', '#9FE870', '#ffffff'], borderColor: ['#e2e8f0', '#9FE870', '#e2e8f0'] } : {}}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
                        className={`rounded-lg border-2 py-2 text-center text-xs font-bold ${i === 1 ? 'border-[#9FE870] text-slate-900' : 'border-slate-200 text-slate-600'}`}
                      >
                        {t}
                      </motion.div>
                    ))}
                  </div>

                  {/* Recurrence toggle */}
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <Repeat className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">Agendar recorrente (toda semana)</span>
                    <div className="ml-auto h-5 w-9 rounded-full bg-[#9FE870]" />
                  </div>

                  {/* Cursor */}
                  <motion.div
                    className="absolute bottom-32 right-10"
                    animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.44 0 .66-.53.35-.85L6.35 2.86a.5.5 0 00-.85.35z" fill="white" stroke="#0f172a" strokeWidth="1.5" />
                    </svg>
                  </motion.div>
                </motion.div>
              )}

              {currentStep.id === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-bold text-slate-900">Confirme e pague</p>

                  {/* Summary */}
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Serviço</span>
                      <span className="font-bold text-slate-900">Consulta inicial</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Data</span>
                      <span className="font-bold text-slate-900">Ter, 16 às 15:00</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Profissional</span>
                      <span className="font-bold text-slate-900">Dra. Fernanda Lima</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="font-bold text-slate-900">R$ 200,00</span>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div className="space-y-2">
                    {['Cartão de crédito', 'Pix'].map((m, i) => (
                      <motion.div
                        key={m}
                        animate={i === 0 ? { borderColor: ['#e2e8f0', '#9FE870', '#e2e8f0'] } : {}}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
                        className={`flex items-center gap-2 rounded-md border-2 p-3 ${i === 0 ? 'border-[#9FE870]' : 'border-slate-200'}`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 ${i === 0 ? 'border-[#9FE870] bg-[#9FE870]' : 'border-slate-300'}`} />
                        <CreditCard className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">{m}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                    className="mt-2 rounded-md bg-[#9FE870] py-3 text-center text-sm font-bold text-slate-900"
                  >
                    Confirmar pagamento
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Step labels */}
      <div className="mt-6 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              i === step ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        {currentStep.label}
      </p>
    </div>
  )
}
