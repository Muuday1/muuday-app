import React from 'react'
import { cn } from '@/lib/utils'

interface AppTableProps {
  children: React.ReactNode
  className?: string
}

export function AppTable({ children, className }: AppTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200/80 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
  )
}

interface AppTableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function AppTableHeader({ children, className }: AppTableHeaderProps) {
  return (
    <thead className={cn('bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500', className)}>
      {children}
    </thead>
  )
}

interface AppTableBodyProps {
  children: React.ReactNode
  className?: string
}

export function AppTableBody({ children, className }: AppTableBodyProps) {
  return <tbody className={cn('divide-y divide-slate-100/80', className)}>{children}</tbody>
}

interface AppTableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export function AppTableRow({ children, className, onClick, href }: AppTableRowProps) {
  const baseClasses = cn(
    'transition-colors hover:bg-slate-50/50',
    onClick || href ? 'cursor-pointer' : '',
    className,
  )

  if (href) {
    return (
      <tr className={baseClasses}>
        <a href={href} className="contents">
          {children}
        </a>
      </tr>
    )
  }

  return (
    <tr className={baseClasses} onClick={onClick}>
      {children}
    </tr>
  )
}

interface AppTableCellProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function AppTableCell({ children, className, align = 'left' }: AppTableCellProps) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  return <td className={cn('px-4 py-3', alignClass, className)}>{children}</td>
}

interface AppTableHeadCellProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function AppTableHeadCell({ children, className, align = 'left' }: AppTableHeadCellProps) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  return <th className={cn('px-4 py-3', alignClass, className)}>{children}</th>
}

interface AppTableEmptyProps {
  colSpan: number
  title?: string
  description?: string
}

export function AppTableEmpty({ colSpan, title = 'Nenhum resultado', description }: AppTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      </td>
    </tr>
  )
}
