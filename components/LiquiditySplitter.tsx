'use client'

import { useEffect, useState } from 'react'
import { LiquiditySplit } from '@/types'
import { formatCurrency } from '@/lib/calculations'
import { Card } from '@/components/ui/card'

interface LiquiditySplitterProps {
  split: LiquiditySplit
}

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    let startTime: number | null = null
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])

  return value
}

export default function LiquiditySplitter({ split }: LiquiditySplitterProps) {
  const animatedYourMoney = useCountUp(split.yourMoney)
  const animatedStateMoney = useCountUp(split.stateMoney)
  const animatedPercentage = useCountUp(split.statePercentage, 800)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const yourPercentage = 100 - split.statePercentage

  return (
    <Card className="relative overflow-hidden bg-white border-gray-200 p-8 shadow-sm">
      <div className="relative z-10">
        {/* Title */}
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
          O Seu Saldo
        </h2>

        {/* Main split display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Your Money */}
          <div
            className={`transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">O Seu Dinheiro</p>
            <p className="text-5xl md:text-6xl font-bold text-green-600 tracking-tight">
              €{formatCurrency(animatedYourMoney)}
            </p>
            <p className="text-sm text-green-600/60 mt-2">
              {yourPercentage}% do seu rendimento
            </p>
          </div>

          {/* State's Money */}
          <div
            className={`transition-all duration-700 delay-150 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">Dinheiro a Reservar</p>
            <p className="text-5xl md:text-6xl font-bold text-blue-600 tracking-tight">
              €{formatCurrency(animatedStateMoney)}
            </p>
            <p className="text-sm text-blue-600/60 mt-2">
              {Math.round(animatedPercentage)}% vai para impostos
            </p>
          </div>
        </div>

        {/* Visual split bar */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: mounted ? `${yourPercentage}%` : '0%' }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-600 to-blue-500 rounded-full transition-all duration-1000 ease-out delay-200"
            style={{ width: mounted ? `${split.statePercentage}%` : '0%' }}
          />
        </div>

        {/* Bar labels */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-green-600/70">Seu</span>
          <span className="text-xs text-blue-600/70">Estado</span>
        </div>
      </div>
    </Card>
  )
}
