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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid divide by zero
  const totalPool = split.yourMoney + split.stateMoney
  const yourRatio = totalPool > 0 ? split.yourMoney / totalPool : 0.7
  const stateRatio = totalPool > 0 ? split.stateMoney / totalPool : 0.3

  // Size base dimensions for 3D boxes
  const baseWidth = 320 // max width of the container
  const yourMoneyWidth = Math.max(80, Math.min(260, baseWidth * yourRatio))
  const stateMoneyWidth = Math.max(60, Math.min(180, baseWidth * stateRatio))

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
        A tua Liquidez
      </h2>

      {/* Main 3D Container Card */}
      <Card className="relative overflow-hidden bg-gradient-to-tr from-white to-gray-50 border-gray-200 p-8 shadow-sm flex flex-col items-center justify-center min-h-[340px]">
        {/* Ambient background glow matching the screenshot reflection */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-60" />
        </div>

        {/* 3D Scene Viewport */}
        <div className={`relative flex items-center justify-center w-full max-w-lg transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Isometric Perspective Wrapper */}
          <div 
            className="flex items-end justify-center gap-6 select-none"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              paddingBottom: '40px'
            }}
          >
            {/* 1. YOUR MONEY BLOCK (Mint Green) */}
            <div className="relative group cursor-pointer" style={{ transformStyle: 'preserve-3d' }}>
              {/* Tooltip Popup */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-center shadow-lg transition-transform duration-300 group-hover:-translate-y-2 pointer-events-none z-30 min-w-[120px]">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Your Money</p>
                <p className="text-sm font-bold font-mono">€{formatCurrency(animatedYourMoney)}</p>
                {/* Arrow */}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
              </div>

              {/* 3D Shape */}
              <div 
                className="relative transition-all duration-500 ease-out group-hover:translate-y-[-8px]"
                style={{
                  transform: 'rotateX(60deg) rotateY(0deg) rotateZ(-45deg)',
                  transformStyle: 'preserve-3d',
                  width: `${yourMoneyWidth}px`,
                  height: '140px',
                }}
              >
                {/* Top Face */}
                <div 
                  className="absolute inset-0 bg-[#7ce2af] flex items-center justify-center font-bold text-slate-800 text-lg shadow-inner select-none"
                  style={{
                    transform: 'translateZ(60px)',
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <span className="transform rotate-45 select-none opacity-80">Your Money</span>
                </div>

                {/* Left Face */}
                <div 
                  className="absolute left-0 bottom-0 origin-bottom-left bg-[#5fc896]"
                  style={{
                    width: '100%',
                    height: '60px',
                    transform: 'rotateX(-90deg)',
                  }}
                />

                {/* Right Face */}
                <div 
                  className="absolute right-0 top-0 origin-top-right bg-[#4fae81]"
                  style={{
                    width: '60px',
                    height: '100%',
                    transform: 'rotateY(90deg)',
                  }}
                />
              </div>
            </div>

            {/* 2. STATE MONEY BLOCK (Royal Blue) */}
            <div className="relative group cursor-pointer" style={{ transformStyle: 'preserve-3d' }}>
              {/* Tooltip Popup */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-center shadow-lg transition-transform duration-300 group-hover:-translate-y-2 pointer-events-none z-30 min-w-[120px]">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">State Money</p>
                <p className="text-sm font-bold font-mono">€{formatCurrency(animatedStateMoney)}</p>
                {/* Arrow */}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
              </div>

              {/* 3D Shape */}
              <div 
                className="relative transition-all duration-500 ease-out group-hover:translate-y-[-8px]"
                style={{
                  transform: 'rotateX(60deg) rotateY(0deg) rotateZ(-45deg)',
                  transformStyle: 'preserve-3d',
                  width: `${stateMoneyWidth}px`,
                  height: '140px',
                }}
              >
                {/* Top Face */}
                <div 
                  className="absolute inset-0 bg-[#2b59ff] flex items-center justify-center font-bold text-white text-lg shadow-inner select-none"
                  style={{
                    transform: 'translateZ(90px)', // taller block for emphasis
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <span className="transform rotate-45 select-none opacity-85">State</span>
                </div>

                {/* Left Face */}
                <div 
                  className="absolute left-0 bottom-0 origin-bottom-left bg-[#1d43d4]"
                  style={{
                    width: '100%',
                    height: '90px',
                    transform: 'rotateX(-90deg)',
                  }}
                />

                {/* Right Face */}
                <div 
                  className="absolute right-0 top-0 origin-top-right bg-[#1534a7]"
                  style={{
                    width: '90px',
                    height: '100%',
                    transform: 'rotateY(90deg)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
