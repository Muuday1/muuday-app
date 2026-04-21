'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, helper, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-md border bg-white text-slate-900 text-sm',
              'placeholder:text-slate-400',
              'focus:outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/15',
              'transition-all duration-200',
              error
                ? 'border-red-200 focus:border-red-300 focus:ring-red-100'
                : 'border-slate-200 hover:border-slate-300',
              icon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-slate-400">{helper}</p>}
      </div>
    )
  }
)
AppInput.displayName = 'AppInput'

interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ label, error, helper, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-md border bg-white text-slate-900 text-sm',
            'placeholder:text-slate-400',
            'focus:outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/15',
            'transition-all duration-200 resize-none',
            error
              ? 'border-red-200 focus:border-red-300 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300',
            'px-4 py-2.5',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-slate-400">{helper}</p>}
      </div>
    )
  }
)
AppTextarea.displayName = 'AppTextarea'
