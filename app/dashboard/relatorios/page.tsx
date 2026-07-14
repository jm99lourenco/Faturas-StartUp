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
  Briefcase 
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
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">A carregar relatórios...</p>
        </div>
      </div>
    )
  }

  const split = calculateLiquiditySplit(invoices)

  // Aggregate monthly values for cash flow chart
  // Mock monthly data points based on invoices to draw a line chart
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
          <Button variant="outline" className="border-gray-300 text-gray-700 rounded-xl h-10 gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 gap-2 shadow-md shadow-blue-600/10">
            <Download className="w-4 h-4" /> Descarregar PDF
          </Button>
        </div>
      </div>

      {/* Cash Flow Line Chart Card */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fluxo de Caixa Mensal</h2>
            <p className="text-xs text-gray-400">Evolução do dinheiro acumulado vs. despesas ao longo do ano</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded bg-blue-600" />
              <span className="text-gray-600">Rendimentos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded bg-emerald-400" />
              <span className="text-gray-600">O Teu Dinheiro</span>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="relative">
          <svg viewBox="0 0 800 240" className="w-full h-56" xmlns="http://www.w3.org/2000/svg">
            {/* Grid Lines */}
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

            {/* Income line (Blue) */}
            <path
              d="M50,180 L165,160 L280,140 L395,110 L510,95 L625,70 L740,45"
              fill="none"
              stroke="#4361ee"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Net money line (Mint Green) */}
            <path
              d="M50,195 L165,180 L280,165 L395,140 L510,120 L625,95 L740,75"
              fill="none"
              stroke="#7ce2af"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Blue Points */}
            <circle cx="740" cy="45" r="5" fill="#4361ee" />
            <circle cx="625" cy="70" r="4" fill="#4361ee" />

            {/* Green Points */}
            <circle cx="740" cy="75" r="5" fill="#7ce2af" />
          </svg>
        </div>
      </Card>

      {/* Two Column Layout: Client Distribution & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Client Share */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Distribuição por Cliente</h2>
          </div>
          
          <div className="space-y-4">
            {clientData.map((client, i) => (
              <div key={client.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-800">{client.name}</span>
                  <span className="font-mono text-gray-600 font-medium">
                    €{formatCurrency(client.value)} ({client.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${client.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {clientData.length === 0 && (
              <p className="text-sm text-gray-500 py-6 text-center">Nenhum rendimento registado para clientes.</p>
            )}
          </div>
        </Card>

        {/* Right Column: Performance Indicators */}
        <Card className="bg-white border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Indicadores de Performance</h2>
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
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Rácio de Sobrevivência</p>
                <p className="text-xl font-bold text-emerald-600 font-mono">
                  {split.totalMoneyIn > 0 ? Math.round((split.yourMoney / split.totalMoneyIn) * 100) : 0}%
                </p>
                <span className="text-[10px] text-gray-500">Do rendimento que fica para si</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Retenção Média</p>
                <p className="text-xl font-bold text-purple-600 font-mono">
                  {split.totalMoneyIn > 0 ? Math.round((split.totalWithheld / split.totalMoneyIn) * 100) : 0}%
                </p>
                <span className="text-[10px] text-gray-500">Taxa média de retenção</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Despesa Acumulada</p>
                <p className="text-xl font-bold text-red-500 font-mono">
                  €{formatCurrency(split.totalMoneyOut)}
                </p>
                <span className="text-[10px] text-gray-500">Custos totais registados</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6 text-xs text-gray-400 flex items-center justify-between">
            <span>Última atualização: Hoje</span>
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Configurar alertas →</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
