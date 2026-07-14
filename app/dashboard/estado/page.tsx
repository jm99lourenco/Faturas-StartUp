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
  Calculator,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

export default function EstadoPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Accounting simulator state
  const [regime, setRegime] = useState<'simplificado' | 'organizada'>('simplificado')

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
  const outgoing = invoices.filter((inv) => inv.direction === 'outgoing')
  
  const totalBaseIncome = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)
  const totalExpenses = outgoing.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const totalVat = incoming.reduce((sum, inv) => sum + Number(inv.vat_amount), 0)
  const totalWithholding = incoming.reduce((sum, inv) => sum + Number(inv.withholding_amount), 0)

  // Social Security: 21.4% rate over 70% of average quarterly base income
  const quarterlyIncome = totalBaseIncome / 2 // simplified estimate
  const ssBaseTributavel = quarterlyIncome * 0.7
  const ssMonthlyContribution = ssBaseTributavel > 0 ? (ssBaseTributavel * 0.214) / 3 : 0

  // VAT calculations
  const monthlyVat = totalVat > 0 ? totalVat / 3 : 0

  // IRS Simplified Regime: 75% coefficient of base income is taxed, 25% is assumed expense
  const irsRendimentoTributavel = totalBaseIncome * 0.75
  
  // Expenses justification requirement (simplified rule: 15% of total base income must be justified with business expenses)
  const expensesNeeded = totalBaseIncome * 0.15
  const expensesJustifiedDiff = totalExpenses - expensesNeeded

  // Estimate Tax bracket & IRS liability (Simplified Pt brackets)
  let irsTaxRate = 0.145 // start bracket
  if (totalBaseIncome > 7500 && totalBaseIncome <= 11284) irsTaxRate = 0.23
  else if (totalBaseIncome > 11284 && totalBaseIncome <= 15992) irsTaxRate = 0.265
  else if (totalBaseIncome > 15992) irsTaxRate = 0.285

  const estimatedIrsTotal = irsRendimentoTributavel * irsTaxRate
  const finalIrsToPayOrReceive = estimatedIrsTotal - totalWithholding

  const obligations = [
    {
      label: 'IVA Estimado (Mês)',
      value: monthlyVat,
      description: 'Estimativa baseada nas faturas emitidas com IVA',
      icon: ArrowUpRight,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Segurança Social (Mês)',
      value: ssMonthlyContribution,
      description: 'Contribuição calculada sobre 70% do rendimento',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Retenções Acumuladas',
      value: totalWithholding,
      description: 'Total retido na fonte pelos seus clientes',
      icon: ArrowDownLeft,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const currentMonth = new Date().getMonth()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obrigações Fiscais & Contabilidade</h1>
          <p className="text-gray-500 text-sm mt-1">
            Simulações de IRS, Segurança Social e obrigações AT
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
          <span className="text-white text-xl font-bold italic">S</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {obligations.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="bg-white border-gray-200 shadow-sm">
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

      {/* Accounting Simulator Section */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Simulador de Contabilidade AT</h2>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setRegime('simplificado')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                regime === 'simplificado' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Regime Simplificado
            </button>
            <button
              onClick={() => setRegime('organizada')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                regime === 'organizada' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Contabilidade Organizada
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {regime === 'simplificado' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Math breakdown table */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cálculo de Rendimento Tributável</h3>
                  
                  <div className="divide-y divide-gray-100 space-y-3">
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-500">Rendimento Bruto Total</span>
                      <span className="font-semibold text-gray-900 font-mono">€{formatCurrency(totalBaseIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3">
                      <span className="text-gray-500">Coeficiente Aplicado (75%)</span>
                      <span className="font-semibold text-blue-600 font-mono">€{formatCurrency(irsRendimentoTributavel)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3">
                      <span className="text-gray-500">Escalão de IRS Estimado</span>
                      <span className="font-semibold text-gray-900 font-mono">{irsTaxRate * 100}%</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                      <span className="text-gray-900 font-medium">IRS Bruto Estimado</span>
                      <span className="font-bold text-gray-900 font-mono">€{formatCurrency(estimatedIrsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3">
                      <span className="text-gray-500">Menos Retenção na Fonte</span>
                      <span className="font-semibold text-red-500 font-mono">- €{formatCurrency(totalWithholding)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t-2 border-gray-200">
                      <span className="text-gray-900 font-bold">IRS Final Estimado (a pagar/receber)</span>
                      <span className={`font-extrabold font-mono text-lg ${finalIrsToPayOrReceive > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {finalIrsToPayOrReceive > 0 ? `€${formatCurrency(finalIrsToPayOrReceive)}` : `- €${formatCurrency(Math.abs(finalIrsToPayOrReceive))}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Justification of expenses rules */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-blue-500" />
                      <h4 className="text-sm font-bold text-gray-900">Justificação de Despesas (Regra dos 15%)</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                      No regime simplificado, o Estado exige que justifique despesas de atividade de pelo menos 15% do seu rendimento para ter direito à dedução total automática de 25%.
                    </p>
                    
                    <div className="space-y-3 mt-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mínimo Necessário (15%):</span>
                        <span className="font-bold text-gray-800 font-mono">€{formatCurrency(expensesNeeded)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Despesas Apresentadas:</span>
                        <span className="font-bold text-gray-800 font-mono">€{formatCurrency(totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {expensesJustifiedDiff >= 0 ? (
                      <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-xl">
                        <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium">Atividade Segura! As suas despesas justificadas cobrem o mínimo exigido pela AT.</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-xl">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium">Atenção! Faltam justificar €{formatCurrency(Math.abs(expensesJustifiedDiff))} de despesas de atividade no E-Fatura para evitar penalização de IRS.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in text-center py-8">
              <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800">Simulador de Contabilidade Organizada</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                Este regime exige um Contabilista Certificado (TOC). Os seus lucros tributáveis são calculados com base no lucro real liquido (Rendimentos - Despesas justificadas de atividade).
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 max-w-sm mx-auto text-xs text-blue-800 mt-4 text-left">
                <span className="font-bold block mb-1">Simulação rápida de Lucro Real:</span>
                <span className="block">Rendimento bruto: €{formatCurrency(totalBaseIncome)}</span>
                <span className="block">Despesas reais: €{formatCurrency(totalExpenses)}</span>
                <span className="font-bold block mt-2">Lucro líquido tributável: €{formatCurrency(Math.max(0, totalBaseIncome - totalExpenses))}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Timetable */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Previsão de Pagamentos fiscais</h2>
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
