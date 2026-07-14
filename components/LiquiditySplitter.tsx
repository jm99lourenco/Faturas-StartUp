'use client'

import { useEffect, useState } from 'react'
import { LiquiditySplit } from '@/types'
import { formatCurrency } from '@/lib/calculations'
import { Card } from '@/components/ui/card'
import { Wallet, Landmark } from 'lucide-react'

interface LiquiditySplitterProps {
  split: LiquiditySplit
}

function useCountUp(target: number, duration: number = 1000) {
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const totalPool = split.yourMoney + split.stateMoney
  const yourPercentage = totalPool > 0 ? Math.round((split.yourMoney / totalPool) * 100) : 70
  const statePercentage = 100 - yourPercentage

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
        A tua Liquidez
      </h2>

      {/* Main Split Visualization Card */}
      <Card className="relative overflow-hidden bg-white border border-gray-150 p-8 shadow-sm rounded-2xl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7DFABE]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#55708C]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Split Info Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* O Seu Dinheiro */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-[#7DFABE]/5 to-white border border-[#7DFABE]/20 rounded-2xl">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: '#7DFABE' }}
              >
                <Wallet className="w-6 h-6 text-[#1a1a2e]" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">O Seu Dinheiro</span>
                <p className="text-4xl font-extrabold font-mono tracking-tight text-gray-900">
                  €{formatCurrency(animatedYourMoney)}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {yourPercentage}% livre de impostos e despesas
                </p>
              </div>
            </div>

            {/* O Estado */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-[#55708C]/5 to-white border border-[#55708C]/20 rounded-2xl">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: '#55708C' }}
              >
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">O Estado</span>
                <p className="text-4xl font-extrabold font-mono tracking-tight text-gray-900">
                  €{formatCurrency(animatedStateMoney)}
                </p>
                <p className="text-xs text-[#55708C] font-semibold">
                  {statePercentage}% reservados para IVA e IRS (Imposto Muted)
                </p>
              </div>
            </div>
          </div>

          {/* Clean Premium Progress Ratio bar */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded-2xl overflow-hidden flex shadow-inner">
              {/* O Seu Dinheiro segment */}
              <div 
                className="h-full rounded-l-2xl transition-all duration-1000 ease-out"
                style={{ 
                  width: mounted ? `${yourPercentage}%` : '0%',
                  backgroundColor: '#7DFABE'
                }}
              />
              {/* O Estado segment */}
              <div 
                className="h-full rounded-r-2xl transition-all duration-1000 ease-out"
                style={{ 
                  width: mounted ? `${statePercentage}%` : '0%',
                  backgroundColor: '#55708C'
                }}
              />
            </div>
            
            {/* Split Info Labels */}
            <div className="flex justify-between text-xs font-bold text-gray-400 px-1 pt-1">
              <span className="flex items-center gap-1" style={{ color: '#7DFABE' }}>
                {yourPercentage}% Livre
              </span>
              <span className="flex items-center gap-1" style={{ color: '#55708C' }}>
                Reservado {statePercentage}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
