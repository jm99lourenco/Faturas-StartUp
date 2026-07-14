'use client'

import { useEffect, useState } from 'react'
import { TaxAlert } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

interface TaxAlertsProps {
  alerts: TaxAlert[]
}

const alertIcons = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
}

const alertStyles = {
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-700',
  },
  danger: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
}

export default function TaxAlerts({ alerts }: TaxAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) return null

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id))
  }

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert, index) => {
        const Icon = alertIcons[alert.type]
        const styles = alertStyles[alert.type]

        return (
          <Alert
            key={alert.id}
            className={`relative ${styles.container} transition-all duration-500 ${
              mounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${styles.icon}`} />
              <div className="flex-1 min-w-0">
                <AlertTitle className={`text-sm font-semibold ${styles.title}`}>
                  {alert.title}
                </AlertTitle>
                <AlertDescription className={`text-sm mt-1 ${styles.text}`}>
                  {alert.message}
                </AlertDescription>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Fechar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
