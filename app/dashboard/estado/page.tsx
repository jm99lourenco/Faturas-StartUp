'use client'

import { useEffect, useState, useCallback } from 'react'
import { Invoice } from '@/types'
import { formatCurrency } from '@/lib/calculations'
import { DEMO_MODE, DEMO_INVOICES } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Calendar,
} from 'lucide-react'

export default function EstadoPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (DEMO_MODE) {
      setInvoices(DEMO_INVOICES)
      setLoading(false)
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('profile_id', user.id)
        .order('date', { ascending: false })
      if (data) setInvoices(data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">A carregar obrigações fiscais...</p>
        </div>
      </div>
    )
  }

  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const totalVat = incoming.reduce((sum, inv) => sum + Number(inv.vat_amount), 0)
  const totalWithholding = incoming.reduce((sum, inv) => sum + Number(inv.withholding_amount), 0)
  const totalBaseIncome = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)

  // Simplified Social Security calculation (approximately 21.4% of 70% of income for simplified regime)
  const socialSecurityBase = totalBaseIncome * 0.7
  const socialSecurityMonthly = socialSecurityBase > 0 ? Math.round((socialSecurityBase * 0.214) / 12 * 100) / 100 : 0

  // Monthly IVA estimate (quarterly in practice, but shown monthly for simplicity)
  const monthlyVat = totalVat > 0 ? Math.round((totalVat / 3) * 100) / 100 : 0

  const obligations = [
    {
      label: 'IVA a Pagar (Mês)',
      value: monthlyVat,
      description: 'Estimativa mensal baseada no trimestre',
      icon: ArrowUpRight,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Segurança Social (Mês)',
      value: socialSecurityMonthly,
      description: 'Regime simplificado (21.4% de 70% do rendimento)',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Retenção na Fonte (Total)',
      value: totalWithholding,
      description: 'Total retido pelos seus clientes',
      icon: ArrowDownLeft,
      color: 'text-green-600',
      bg: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ]

  // Monthly breakdown (simplified)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const currentMonth = new Date().getMonth()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos ao Estado e Segurança Social</h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumo das suas obrigações fiscais e contribuições
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
          <span className="text-white text-xl font-bold italic">S</span>
        </div>
      </div>

      {/* Obrigações Fiscais Mensais Chart Area */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Obrigações Fiscais Mensais</h2>

          {/* Visual Timeline */}
          <div className="relative">
            {/* SVG Timeline with dots and labels */}
            <svg viewBox="0 0 800 200" className="w-full h-48" xmlns="http://www.w3.org/2000/svg">
              {/* Grid lines */}
              <line x1="50" y1="160" x2="750" y2="160" stroke="#e5e7eb" strokeWidth="1" />

              {/* Green path (IVA) */}
              <path
                d="M80,140 C160,140 200,60 280,50 C360,40 400,120 480,130 C520,135 560,80 640,70 C680,65 720,85 740,80"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.7"
              />

              {/* Blue path (Retenção) */}
              <path
                d="M80,120 C160,120 200,140 280,150 C360,160 400,100 480,80 C520,70 560,60 640,65 C680,68 720,75 740,70"
                fill="none"
                stroke="#4361ee"
                strokeWidth="2.5"
              />

              {/* Dots on green path */}
              <circle cx="80" cy="140" r="5" fill="#22c55e" />
              <circle cx="280" cy="50" r="7" fill="#22c55e" />
              <circle cx="480" cy="130" r="5" fill="#22c55e" />

              {/* Dots on blue path */}
              <circle cx="280" cy="150" r="5" fill="#4361ee" />
              <circle cx="480" cy="80" r="7" fill="#4361ee" />
              <circle cx="640" cy="65" r="7" fill="#4361ee" />
              <circle cx="740" cy="70" r="5" fill="#4361ee" />

              {/* Labels */}
              <text x="60" y="175" className="text-xs" fill="#9ca3af">Pasta</text>
              <text x="260" y="38" className="text-xs" fill="#22c55e" fontWeight="500">IVA</text>
              <text x="430" y="175" className="text-xs" fill="#9ca3af">Seg. Social</text>
              <text x="380" y="165" className="text-xs" fill="#4361ee" fontWeight="500">Retenção</text>
              <text x="560" y="55" className="text-xs" fill="#9ca3af">Seg. Social</text>
              <text x="620" y="55" className="text-xs" fill="#9ca3af">Retenção</text>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {obligations.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className={`bg-white border-gray-200 shadow-sm`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className={`text-3xl font-bold ${item.color} font-mono`}>
                  €{formatCurrency(item.value)}
                </p>
                <p className="text-xs text-gray-400 mt-2">{item.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Previsão de Pagamentos */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Previsão de Pagamentos</h2>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {months.map((month, i) => {
              const isPast = i < currentMonth
              const isCurrent = i === currentMonth
              const hasPayment = [0, 3, 6, 9].includes(i) // Quarterly IVA
              return (
                <div
                  key={month}
                  className={`text-center p-3 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : isPast
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <p className="text-xs font-medium">{month}</p>
                  {hasPayment && (
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                      isCurrent ? 'bg-white' : isPast ? 'bg-gray-300' : 'bg-blue-400'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>IVA Trimestral</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>Seg. Social: Dia 20 de cada mês</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
