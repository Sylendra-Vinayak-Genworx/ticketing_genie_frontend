import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface SLATimerProps {
  dueAt: string
  createdAt: string
  status: string
  label?: string // Optional custom label (e.g., "Response SLA Met" or "Resolution SLA Met")
  slaType?: 'response' | 'resolution' // Type of SLA to determine met/breached logic
  firstResponseAt?: string | null // When ticket first reached IN_PROGRESS (for response SLA)
  resolvedAt?: string | null // When ticket was resolved (for resolution SLA)
}

export function SLATimer({ dueAt, createdAt, status, label, slaType, firstResponseAt, resolvedAt }: SLATimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isBreached, setIsBreached] = useState(false)
  const [isResolved, setIsResolved] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const due = new Date(dueAt)

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
        setIsBreached(!wasMetOnTime)
        return
      }

      // SLA is still active - calculate remaining time
      setIsResolved(false)
      const diff = due.getTime() - now.getTime()

      if (diff <= 0) {
        setIsBreached(true)
        const overdue = Math.abs(diff)
        const hours = Math.floor(overdue / (1000 * 60 * 60))
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}m overdue`)
      } else {
        setIsBreached(false)
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}m remaining`)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dueAt, createdAt, status, slaType, firstResponseAt, resolvedAt])

  // Resolved/Closed state
  if (isResolved) {
    if (isBreached) {
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