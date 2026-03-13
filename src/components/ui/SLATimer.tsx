import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface SLATimerProps {
  dueAt: string
  createdAt?: string
  status: string
  label?: string // Optional custom label (e.g., "Response SLA Met" or "Resolution SLA Met")
  slaType?: 'response' | 'resolution' // Type of SLA to determine met/breached logic
  firstResponseAt?: string | null // When ticket first reached IN_PROGRESS (for response SLA)
  resolvedAt?: string | null // When ticket was resolved (for resolution SLA)
  compact?: boolean // Compact display for table views
  isBreached?: boolean // Backend-calculated breach status (takes precedence if provided)
}

export function SLATimer({ dueAt, createdAt, status, label, slaType, firstResponseAt, resolvedAt, compact = false, isBreached: backendIsBreached }: SLATimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isBreached, setIsBreached] = useState(false)
  const [isResolved, setIsResolved] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const due = new Date(dueAt)

      // Validate the due date
      if (!dueAt || isNaN(due.getTime())) {
        setTimeLeft('Not Started')
        setIsBreached(false)
        setIsResolved(false)
        return
      }

      // Check if this specific SLA has been met based on type
      let slaCompleted = false
      let wasMetOnTime = false

      if (slaType === 'response' && firstResponseAt) {
        // Response SLA: check if ticket reached IN_PROGRESS
        slaCompleted = true
        const responseTime = new Date(firstResponseAt)
        wasMetOnTime = responseTime <= due
      } else if (slaType === 'resolution' && resolvedAt) {
        // Resolution SLA: check if ticket was resolved
        slaCompleted = true
        const resolutionTime = new Date(resolvedAt)
        wasMetOnTime = resolutionTime <= due
      } else if (status === 'RESOLVED' || status === 'CLOSED') {
        // Fallback for tickets that are resolved/closed but missing specific timestamps
        slaCompleted = true
        wasMetOnTime = now <= due
      }

      // If this SLA is completed, show met/breached status
      if (slaCompleted) {
        setIsResolved(true)
        // Use backend value if provided, otherwise use calculated value
        setIsBreached(backendIsBreached !== undefined ? backendIsBreached : !wasMetOnTime)
        return
      }

      // SLA is still active - calculate remaining time
      setIsResolved(false)
      const diff = due.getTime() - now.getTime()

      if (diff <= 0) {
        // Use backend value if provided, otherwise calculate based on time
        setIsBreached(backendIsBreached !== undefined ? backendIsBreached : true)
        const overdue = Math.abs(diff)
        
        // Sanity check: if overdue by more than 365 days, it's likely bad data
        const maxReasonableDays = 365
        const calculatedDays = Math.floor(overdue / (1000 * 60 * 60 * 24))
        
        if (calculatedDays > maxReasonableDays) {
          setTimeLeft('Not Started')
          setIsBreached(false)
          return
        }
        
        const days = calculatedDays
        const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m overdue`)
        } else {
          setTimeLeft(`${hours}h ${minutes}m overdue`)
        }
      } else {
        // Use backend value if provided, otherwise not breached
        setIsBreached(backendIsBreached !== undefined ? backendIsBreached : false)
        
        // Sanity check: if remaining time is more than 365 days, it's likely bad data
        const maxReasonableDays = 365
        const calculatedDays = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        if (calculatedDays > maxReasonableDays) {
          setTimeLeft('Not Started')
          setIsBreached(false)
          return
        }
        
        const days = calculatedDays
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`)
        } else {
          setTimeLeft(`${hours}h ${minutes}m remaining`)
        }
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dueAt, createdAt, status, slaType, firstResponseAt, resolvedAt, backendIsBreached])

  // Not Started state (invalid or missing date)
  if (timeLeft === 'Not Started') {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Not Started</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NOT STARTED</p>
          <p className="text-xs text-gray-400">SLA tracking pending</p>
        </div>
      </div>
    )
  }

  // Resolved/Closed state
  if (isResolved) {
    if (isBreached) {
      if (compact) {
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">BREACHED</span>
          </div>
        )
      }
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              {label ? label.replace('Met', 'Breached') : 'SLA BREACHED'}
            </p>
            <div className="w-full bg-red-200 rounded-full h-1.5 mt-1">
              <div className="bg-red-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        </div>
      )
    }

    if (compact) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide whitespace-nowrap">MET</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            {label || 'SLA MET'}
          </p>
          <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
            <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      </div>
    )
  }

  // Active state
  if (isBreached) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-600 font-medium whitespace-nowrap">{timeLeft}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">SLA BREACHED</p>
          <p className="text-xs text-red-600 font-medium">{timeLeft}</p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-200">
        <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span className="text-xs text-blue-600 font-medium whitespace-nowrap">{timeLeft}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">SLA ACTIVE</p>
        <p className="text-xs text-blue-600 font-medium">{timeLeft}</p>
      </div>
    </div>
  )
}