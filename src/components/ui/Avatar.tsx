import React from 'react'
import { cn, initials, getAvatarColor } from '@/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const color = getAvatarColor(name)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        color,
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials(name)}
    </div>
  )
}
