import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  text?: string
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function LoadingSpinner({ className, size = 'md', fullPage, text }: LoadingSpinnerProps) {
  const icon = (
    <Loader2 className={cn('animate-spin text-blue-600', SIZE_CLASSES[size], className)} />
  )

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        {icon}
        {text && <p className="text-sm text-gray-500">{text}</p>}
      </div>
    )
  }

  return icon
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 skeleton rounded" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="h-5 skeleton rounded w-1/3" />
      <div className="h-4 skeleton rounded w-2/3" />
      <div className="h-4 skeleton rounded w-1/2" />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
