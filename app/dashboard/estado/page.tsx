'use client'

import { useEffect, useState, useCallback } from 'react'
import { Invoice } from '@/types'
import { formatCurrency, calculateLiquiditySplit, calculateProgressiveIRS } from '@/lib/calculations'
import { DEMO_MODE, DEMO_INVOICES } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Calculator,
  Info,
  CheckCircle,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  Sliders
} from 'lucide-react'

export default function EstadoPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Tax profile state (user editable)
  const [dependentes, setDependentes] = useState(1)
  const [estadoCivil, setEstadoCivil] = useState<'solteiro' | 'casado_1' | 'casado_2'>('solteiro')
  const [trabalhoDependente, setTrabalhoDependente] = useState(false)
  const [rendimentoCatA, setRendimentoCatA] = useState('0')
  const [regiao, setRegiao] = useState<'continente' | 'madeira' | 'acores'>('continente')

  // Calendar interactive state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())

  // SS Quarterly deviation selection (-25%, 0, +25%)
  const [ssDeviation, setSsDeviation] = useState<number>(0)

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
      
      const [profileRes, invoicesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('invoices').select('*').eq('profile_id', user.id).order('date', { ascending: false })
      ])
      
      if (profileRes.data) {
        setDependentes(profileRes.data.dependentes ?? 0)
        setEstadoCivil(profileRes.data.estado_civil ?? 'solteiro')
        setTrabalhoDependente(profileRes.data.trabalho_dependente ?? false)
        setRendimentoCatA(String(profileRes.data.rendimento_dependente_anual ?? 0))
        setRegiao(profileRes.data.regiao ?? 'continente')
      }
      if (invoicesRes.data) setInvoices(invoicesRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveProfile = async () => {
    if (DEMO_MODE) {
      alert('Perfil de Simulação atualizado com sucesso!')
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({
        dependentes,
        estado_civil: estadoCivil,
        trabalho_dependente: trabalhoDependente,
        rendimento_dependente_anual: parseFloat(rendimentoCatA) || 0,
        regiao
      }).eq('id', user.id)
      alert('Perfil gravado com sucesso no Supabase!')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#7DFABE', borderTopColor: 'transparent' }} />
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

  // Social Security math
  const ssRendimentoTrimestre = totalBaseIncome / 2
  const ssBaseTributavelTrimestre = ssRendimentoTrimestre * 0.7
  const ssMonthlyBaseBase = ssBaseTributavelTrimestre > 0 ? (ssBaseTributavelTrimestre * 0.214) / 3 : 0
  const ssMonthlyContribution = ssMonthlyBaseBase * (1 + ssDeviation)

  // VAT calculations
  const monthlyVat = totalVat > 0 ? totalVat / 3 : 0

  // Run Progressive IRS calculation engine
  const irsResult = calculateProgressiveIRS(totalBaseIncome, {
    dependentes,
    estado_civil: estadoCivil,
    trabalho_dependente: trabalhoDependente,
    rendimento_dependente_anual: parseFloat(rendimentoCatA) || 0,
    regiao
  })

  const expensesNeeded = totalBaseIncome * 0.15
  const expensesJustifiedDiff = totalExpenses - expensesNeeded

  const obligations = [
    {
      label: 'IVA a Pagar Estimado',
      value: monthlyVat,
      description: 'Média mensal calculada com base no trimestre',
      icon: ArrowUpRight,
      color: 'text-[#55708C]', // Softer, less shocking steel blue
      bg: 'bg-blue-50/50',
    },
    {
      label: 'Segurança Social (Mês)',
      value: ssMonthlyContribution,
      description: 'Contribuição mensal ajustada pelo desvio selecionado',
      icon: TrendingUp,
      color: 'text-gray-900', // unified clean colors
      bg: 'bg-gray-50',
    },
    {
      label: 'Retenções na Fonte Efetuadas',
      value: totalWithholding,
      description: 'Total acumulado retido pelos seus clientes (IRS)',
      icon: ArrowDownLeft,
      color: 'text-gray-700',
      bg: 'bg-gray-50',
    },
  ]

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  const getMonthPaymentDetails = (mIndex: number) => {
    const isQuarterVat = [1, 4, 7, 10].includes(mIndex) // Feb, May, Aug, Nov
    const details = []
    
    details.push({
      title: 'Segurança Social',
      due: `Dia 20 de ${months[mIndex]}`,
      description: `Pagamento da contribuição mensal estimada em €${formatCurrency(ssMonthlyContribution)}.`,
      status: 'Obrigatório'
    })

    if (isQuarterVat) {
      details.push({
        title: 'IVA Trimestral',
        due: `Dia 25 de ${months[mIndex]}`,
        description: 'Entrega da Declaração Periódica do IVA e pagamento do imposto acumulado do trimestre anterior.',
        status: 'Trimestral'
      })
    }

    if (mIndex === 3) {
      details.push({
        title: 'Declaração Anual de IRS (Modelo 3)',
        due: 'Entre 1 de Abril e 30 de Junho',
        description: 'Entrega obrigatória da declaração anual de rendimentos obtidos no ano anterior.',
        status: 'Anual'
      })
    }

    return details
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Obrigações Fiscais & Contabilidade</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestão do seu perfil de impostos e simulações progressivas de IRS
          </p>
        </div>
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
          style={{ 
            backgroundColor: '#7DFABE',
            boxShadow: '0 4px 6px -1px rgba(125, 250, 190, 0.2)' 
          }}
        >
          <span className="text-[#1a1a2e] text-xl font-bold italic">R</span>
        </div>
      </div>

      {/* Tax Profile Configuration Panel */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Configuração de Perfil Fiscal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Região */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Região Fiscal (Taxas de IRS)</Label>
            <Select value={regiao} onValueChange={(v) => v && setRegiao(v as any)}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="continente">Continente</SelectItem>
                <SelectItem value="madeira">Madeira (Taxa reduzida)</SelectItem>
                <SelectItem value="acores">Açores (Taxa reduzida)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado Civil */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Estado Civil (IRS)</Label>
            <Select value={estadoCivil} onValueChange={(v) => v && setEstadoCivil(v as any)}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="solteiro">Solteiro / Divorciado</SelectItem>
                <SelectItem value="casado_1">Casado (Tributação Separada)</SelectItem>
                <SelectItem value="casado_2">Casado (Tributação Conjunta)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dependentes */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Número de Dependentes</Label>
            <Select value={String(dependentes)} onValueChange={(v) => v && setDependentes(Number(v))}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="0">Sem dependentes</SelectItem>
                <SelectItem value="1">1 dependente (€600 dedução)</SelectItem>
                <SelectItem value="2">2 dependentes (€1200 dedução)</SelectItem>
                <SelectItem value="3">3 ou mais dependentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="catA"
                checked={trabalhoDependente}
                onChange={(e) => setTrabalhoDependente(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 focus:ring-emerald-400"
                style={{ color: '#7DFABE' }}
              />
              <Label htmlFor="catA" className="text-gray-700 font-medium cursor-pointer select-none">
                Trabalho por Conta de Outrem em simultâneo
              </Label>
            </div>
          </div>

          {trabalhoDependente && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-gray-700 font-medium">Salário Anual Bruto (Conta de Outrem - Cat A)</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={rendimentoCatA}
                  onChange={(e) => setRendimentoCatA(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-emerald-500 h-10 pr-10 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSaveProfile}
            className="text-[#1a1a2e] font-semibold rounded-xl h-10 px-6 shadow-md"
            style={{ 
              backgroundColor: '#7DFABE',
              boxShadow: '0 4px 6px -1px rgba(125, 250, 190, 0.2)' 
            }}
          >
            Gravar Dados do Perfil
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
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
                <p className="text-3xl font-bold text-gray-900 font-mono">
                  €{formatCurrency(item.value)}
                </p>
                <p className="text-xs text-gray-400 mt-2">{item.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progressive IRS Simulator Block */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-150 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Simulador de Contabilidade Progressiva (AT)</h2>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Calculation Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cálculo Progressivo de IRS</h3>
              
              <div className="divide-y divide-gray-100 space-y-3">
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-500">Rendimento Bruto Total (Recibos Verdes)</span>
                  <span className="font-semibold text-gray-900 font-mono">€{formatCurrency(totalBaseIncome)}</span>
                </div>
                {trabalhoDependente && (
                  <div className="flex justify-between text-sm pt-3">
                    <span className="text-gray-500">Rendimento Coletável (Conta de Outrem - Cat A)</span>
                    <span className="font-semibold text-gray-900 font-mono">€{formatCurrency(Math.max(0, (parseFloat(rendimentoCatA) || 0) - 4104))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-3">
                  <span className="text-gray-500">Rendimento Tributável Simulado (Coeficiente 75%)</span>
                  <span className="font-semibold font-mono" style={{ color: '#5cb896' }}>€{formatCurrency(irsResult.rendimentoTributavel)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3">
                  <span className="text-gray-500">Dedução por Dependentes</span>
                  <span className="font-semibold font-mono" style={{ color: '#5cb896' }}>€{formatCurrency(irsResult.deducoesDependentes)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                  <span className="text-gray-900 font-medium">IRS Bruto Coleta</span>
                  <span className="font-bold text-gray-900 font-mono">€{formatCurrency(irsResult.coletaLiquida)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3">
                  <span className="text-gray-500">Menos Retenção Efetuada (Adiantamento)</span>
                  <span className="font-semibold text-red-500 font-mono">- €{formatCurrency(totalWithholding)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t-2 border-gray-200">
                  <span className="text-gray-900 font-bold">Acerto Estimado de IRS (a pagar/receber)</span>
                  {totalWithholding > irsResult.coletaLiquida ? (
                    <span className="font-extrabold font-mono text-lg text-green-600">
                      Reembolso Estimado: €{formatCurrency(totalWithholding - irsResult.coletaLiquida)}
                    </span>
                  ) : (
                    <span className="font-extrabold font-mono text-lg text-red-600">
                      A Pagar à AT: €{formatCurrency(irsResult.coletaLiquida - totalWithholding)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expenses Validation card */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-gray-400" />
                  <h4 className="text-sm font-bold text-gray-900">Validação de Despesas Declaradas</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  A Autoridade Tributária exige a justificação de pelo menos 15% do seu rendimento in despesas de atividade para salvaguardar a dedução automática de 25%.
                </p>
                
                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mínimo Obrigatório:</span>
                    <span className="font-bold text-gray-800 font-mono">€{formatCurrency(expensesNeeded)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Despesas Submetidas:</span>
                    <span className="font-bold text-gray-800 font-mono">€{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                {expensesJustifiedDiff >= 0 ? (
                  <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-xl">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium">Situação regularizada! As suas despesas cobrem o patamar obrigatório do regime.</span>
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
        </CardContent>
      </Card>

      {/* Safety Social Quarterly Declaration Simulator */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-150 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Simulador de Declaração Trimestral (Segurança Social Direta)</h2>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ajuste de Esforço Fiscal</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pode optar legalmente por desviar a sua contribuição mensal calculada em **-25%** ou **+25%** para se ajustar aos seus fluxos de tesouraria.
              </p>
              
              <div className="space-y-2 pt-2">
                <Label className="text-gray-700 font-semibold text-xs">Selecione o Desvio de Contribuição:</Label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setSsDeviation(-0.25)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-all ${ssDeviation === -0.25 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-505 border-gray-200'}`}
                  >
                    -25%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSsDeviation(0)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-all ${ssDeviation === 0 ? 'text-gray-900 border-gray-300' : 'bg-white text-gray-505 border-gray-200'}`}
                    style={{ backgroundColor: ssDeviation === 0 ? '#7DFABE' : 'white' }}
                  >
                    Base (0%)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSsDeviation(0.25)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-all ${ssDeviation === 0.25 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-505 border-gray-200'}`}
                  >
                    +25%
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                Valores para introduzir na Segurança Social Direta
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-150 text-center">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">Rendimento do Trimestre</span>
                  <span className="text-lg font-bold text-gray-900 font-mono">€{formatCurrency(ssRendimentoTrimestre)}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-150 text-center">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">Base de Incidência (70%)</span>
                  <span className="text-lg font-bold text-gray-900 font-mono">€{formatCurrency(ssBaseTributavelTrimestre)}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-150 text-center">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">Pagamento Mensal Final</span>
                  <span className="text-lg font-extrabold font-mono text-gray-900">€{formatCurrency(ssMonthlyContribution)}</span>
                </div>
              </div>

              <div className="mt-4 bg-emerald-50 text-emerald-800 p-3 rounded-xl text-[10px] flex items-center gap-1.5 leading-relaxed">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>O valor de **€{formatCurrency(ssMonthlyContribution)}** é devido mensalmente nos 3 meses seguintes ao trimestre declarativo.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previsão de Pagamentos Fiscais (Interactive Months Calendar) */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Previsão de Pagamentos Fiscais (Interativo)</h2>
            <span className="text-xs text-gray-400 font-medium">Selecione o mês para ver os detalhes</span>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-12 gap-2">
            {months.map((month, i) => {
              const isSelected = selectedMonth === i
              const hasQuarterVat = [1, 4, 7, 10].includes(i) // Feb, May, Aug, Nov
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonth(i)}
                  className={`text-center p-3 rounded-xl transition-all font-semibold text-xs border ${
                    isSelected
                      ? 'text-[#1a1a2e] border-[#7DFABE] shadow-md'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? '#7DFABE' : 'transparent',
                    boxShadow: isSelected ? '0 4px 6px -1px rgba(125, 250, 190, 0.2)' : 'none'
                  }}
                >
                  <p>{month}</p>
                  {hasQuarterVat && (
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                      isSelected ? 'bg-[#1a1a2e]' : 'bg-[#7DFABE]'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Obrigações e prazos em {months[selectedMonth]}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getMonthPaymentDetails(selectedMonth).map((obligation, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-gray-150 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{obligation.title}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      {obligation.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold block mb-1">Prazo: {obligation.due}</span>
                    <p className="leading-relaxed">{obligation.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
