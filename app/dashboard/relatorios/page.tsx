'use client'

import { useEffect, useState, useCallback } from 'react'
import { Invoice } from '@/types'
import { formatCurrency, calculateLiquiditySplit } from '@/lib/calculations'
import { DEMO_MODE, DEMO_INVOICES } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Download, 
  TrendingUp, 
  FileSpreadsheet, 
  Briefcase,
  HelpCircle,
  Percent
} from 'lucide-react'

export default function RelatoriosPage() {
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
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#7DFABE', borderTopColor: 'transparent' }} />
          <p className="text-gray-400 text-sm">A carregar relatórios...</p>
        </div>
      </div>
    )
  }

  const split = calculateLiquiditySplit(invoices)

  const monthlyFlow = [
    { month: 'Jan', in: 1800, out: 200 },
    { month: 'Fev', in: 2500, out: 300 },
    { month: 'Mar', in: 3200, out: 400 },
    { month: 'Abr', in: 4100, out: 550 },
    { month: 'Mai', in: 4500, out: 300 },
    { month: 'Jun', in: 6800, out: 650 },
    { month: 'Jul', in: 8750, out: 504.29 },
  ]

  // Client distribution calculations
  const clientTotals: { [key: string]: number } = {}
  invoices
    .filter((inv) => inv.direction === 'incoming')
    .forEach((inv) => {
      clientTotals[inv.client_supplier_name] = (clientTotals[inv.client_supplier_name] || 0) + Number(inv.base_amount)
    })

  const clientData = Object.keys(clientTotals).map((client) => ({
    name: client,
    value: clientTotals[client],
    percentage: split.totalMoneyIn > 0 ? Math.round((clientTotals[client] / split.totalMoneyIn) * 100) : 0,
  })).sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-500 text-sm mt-1">
            Análise detalhada de rendimentos, despesas e distribuição de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-700 rounded-xl h-10 gap-2 font-semibold">
            <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button 
            className="text-[#1a1a2e] rounded-xl h-10 gap-2 shadow-md font-semibold"
            style={{ 
              backgroundColor: '#7DFABE',
              boxShadow: '0 4px 6px -1px rgba(125, 250, 190, 0.2)' 
            }}
          >
            <Download className="w-4 h-4" /> Descarregar PDF
          </Button>
        </div>
      </div>

      {/* Cash Flow Line Chart Card */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fluxo de Caixa Mensal</h2>
            <p className="text-xs text-gray-400">Evolução do dinheiro bruto acumulado vs. dinheiro líquido (livre de impostos)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded" style={{ backgroundColor: '#7DFABE' }} />
              <span className="text-gray-600">Rendimento Bruto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded bg-gray-300" />
              <span className="text-gray-600">O Teu Dinheiro (Líquido)</span>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="relative">
          <svg viewBox="0 0 800 240" className="w-full h-56" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="40" x2="750" y2="40" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="100" x2="750" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="160" x2="750" y2="160" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="210" x2="750" y2="210" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* X Axis Labels */}
            {monthlyFlow.map((data, i) => (
              <text key={i} x={50 + (i * 115)} y="232" className="text-[10px]" fill="#94a3b8" textAnchor="middle">
                {data.month}
              </text>
            ))}

            {/* Income line */}
            <path
              d="M50,180 L165,160 L280,140 L395,110 L510,95 L625,70 L740,45"
              fill="none"
              stroke="#7DFABE"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Net money line */}
            <path
              d="M50,195 L165,180 L280,165 L395,140 L510,120 L625,95 L740,75"
              fill="none"
              stroke="#d1ffd9"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Points */}
            <circle cx="740" cy="45" r="5" fill="#7DFABE" />
            <circle cx="740" cy="75" r="5" fill="#d1ffd9" />
          </svg>
        </div>
      </Card>

      {/* Two Column Layout: Client Distribution & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Client Share (Donut / Pie Chart included) */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Distribuição por Cliente</h2>
            </div>
            <div className="group relative cursor-help">
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              <div className="absolute right-0 top-6 hidden group-hover:block bg-slate-900 text-white text-[10px] p-3 rounded-xl shadow-xl w-60 z-20 leading-relaxed">
                Demonstra a dependência comercial e concentração de faturação por cliente. Menor dependência de um só cliente reduz o risco financeiro.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 36 36" className="w-40 h-40">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
                {/* 35% Segment - Client 1 (#7DFABE) */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" 
                  stroke="#7DFABE" 
                  strokeWidth="3.2" 
                  strokeDasharray="35 65" 
                  strokeDashoffset="100" 
                />
                {/* 35% Segment - Client 2 (soft blue #55708C) */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" 
                  stroke="#55708C" 
                  strokeWidth="3.2" 
                  strokeDasharray="35 65" 
                  strokeDashoffset="65" 
                />
                {/* 30% Segment - Client 3 (purple-500) */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" 
                  stroke="#a855f7" 
                  strokeWidth="3.2" 
                  strokeDasharray="30 70" 
                  strokeDashoffset="30" 
                />
              </svg>
              {/* Inner Donut Text */}
              <div className="absolute flex flex-col items-center">
                <Percent className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Partilha</span>
              </div>
            </div>

            {/* List Details with Legend Colors */}
            <div className="space-y-3">
              {clientData.map((client, i) => {
                const legendColors = ['bg-[#7DFABE]', 'bg-[#55708C]', 'bg-purple-500']
                const colorClass = legendColors[i % legendColors.length]
                return (
                  <div key={client.name} className="flex items-start gap-2.5">
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${colorClass}`} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-gray-900 leading-none">{client.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        €{formatCurrency(client.value)} ({client.percentage}%)
                      </p>
                    </div>
                  </div>
                )
              })}
              {clientData.length === 0 && (
                <p className="text-xs text-gray-500 py-6 text-center">Nenhum cliente registado.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Right Column: Performance Indicators */}
        <Card className="bg-white border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-450" />
              <h2 className="text-lg font-bold text-gray-900">Indicadores de Performance</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Rendimento Médio</p>
                <p className="text-xl font-bold text-gray-900 font-mono">
                  €{formatCurrency(split.totalMoneyIn > 0 ? split.totalMoneyIn / invoices.filter(i => i.direction === 'incoming').length : 0)}
                </p>
                <span className="text-[10px] text-gray-500">Por fatura emitida</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Margem Líquida Real</p>
                <p className="text-xl font-bold font-mono" style={{ color: '#5cb896' }}>
                  {split.totalMoneyIn > 0 ? Math.round((split.yourMoney / split.totalMoneyIn) * 100) : 0}%
                </p>
                <span className="text-[10px] text-gray-500">Percentagem livre para si</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Carga Fiscal Média</p>
                <p className="text-xl font-bold text-[#55708C] font-mono">
                  {split.totalMoneyIn > 0 ? Math.round((split.stateMoney / split.totalMoneyIn) * 100) : 0}%
                </p>
                <span className="text-[10px] text-gray-500">Percentagem retida para impostos</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Rácio Despesa / Ganho</p>
                <p className="text-xl font-bold text-red-500 font-mono">
                  {split.totalMoneyIn > 0 ? Math.round((split.totalMoneyOut / split.totalMoneyIn) * 100) : 0}%
                </p>
                <span className="text-[10px] text-gray-500">Percentagem gasta em despesas</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6 text-xs text-gray-400 flex items-center justify-between">
            <span>Última atualização: Hoje</span>
            <span className="font-semibold cursor-pointer hover:underline" style={{ color: '#5cb896' }}>Configurar alertas →</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
