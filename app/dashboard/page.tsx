'use client'

import { useEffect, useState, useCallback } from 'react'
import { Invoice, Profile } from '@/types'
import { calculateTaxes } from '@/lib/taxCalculator'
import { formatCurrency } from '@/lib/calculations'
import LiquiditySplitter from '@/components/LiquiditySplitter'
import TaxAlerts from '@/components/TaxAlerts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Receipt,
  FileText,
  Plus,
  Users,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import { DEMO_MODE, DEMO_INVOICES, DEMO_PROFILE } from '@/lib/demo-data'

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (DEMO_MODE) {
      setProfile(DEMO_PROFILE)
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
        supabase.from('invoices').select('*').eq('profile_id', user.id).order('date', { ascending: false }),
      ])
      if (profileRes.data) setProfile(profileRes.data)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#7DFABE', borderTopColor: 'transparent' }} />
          <p className="text-gray-400 text-sm">A carregar o seu painel...</p>
        </div>
      </div>
    )
  }

  // RUN DYNAMIC TAX CALCULATION ENGINE
  const defaultProfile: Profile = profile || DEMO_PROFILE
  const taxResults = calculateTaxes(defaultProfile, invoices)

  // Map result to LiquiditySplitter format
  const split = {
    totalMoneyIn: taxResults.grossRevenue,
    totalMoneyOut: taxResults.expenses,
    totalVatCollected: taxResults.estimatedVat,
    totalWithheld: taxResults.totalWithholding,
    yourMoney: taxResults.netAvailable,
    stateMoney: taxResults.totalTaxesOwed,
    statePercentage: Math.round(taxResults.effectiveTaxRate),
  }

  const alerts = profile ? generateTaxAlerts(invoices, profile) : []
  const recentInvoices = invoices.slice(0, 5)

  // KPI Integration: Group sales by Client
  const clientTotals: { [key: string]: number } = {}
  invoices
    .filter((inv) => inv.direction === 'incoming')
    .forEach((inv) => {
      clientTotals[inv.client_supplier_name] = (clientTotals[inv.client_supplier_name] || 0) + Number(inv.base_amount)
    })

  const topClients = Object.keys(clientTotals)
    .map((client) => ({ name: client, total: clientTotals[client] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  // KPI Integration: Group sales by Location (simulated parsing of addresses)
  // Maps specific client names to regions/cities for display
  const clientLocations: { [key: string]: string } = {
    'Empresa ABC, Lda.': 'Lisboa',
    'StartupXYZ': 'Porto',
    'Consultora Digital': 'Braga',
    'Grupo Ferreira & Associados': 'Coimbra',
    'Tech Solutions Porto': 'Porto',
    'Google Ireland Limited': 'Estrangeiro (Irlanda)'
  }

  const locationTotals: { [key: string]: number } = {}
  invoices
    .filter((inv) => inv.direction === 'incoming')
    .forEach((inv) => {
      const city = clientLocations[inv.client_supplier_name] || 'Outra Região'
      locationTotals[city] = (locationTotals[city] || 0) + Number(inv.base_amount)
    })

  const regionalContributions = Object.keys(locationTotals)
    .map((loc) => ({ location: loc, total: locationTotals[loc] }))
    .sort((a, b) => b.total - a.total)

  // Simulated points for the Fluxo de Caixa Mensal SVG Line Chart
  const chartPoints = [
    { x: 50, y: 170, label: 'Jan' },
    { x: 150, y: 160, label: 'Fev' },
    { x: 250, y: 155, label: 'Mar' },
    { x: 350, y: 140, label: 'Abr' },
    { x: 450, y: 110, label: 'Mai' },
    { x: 550, y: 90, label: 'Jun' },
    { x: 650, y: 70, label: 'Jul' },
  ]

  const summaryCards = [
    {
      label: 'Rendimento Bruto',
      value: taxResults.grossRevenue,
      icon: ArrowDownLeft,
      color: 'text-gray-700',
      bg: 'bg-gray-50',
    },
    {
      label: 'Despesas Registadas',
      value: taxResults.expenses,
      icon: ArrowUpRight,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'IRS/IRC Estimado',
      value: taxResults.estimatedIrs + taxResults.estimatedIrc,
      icon: Receipt,
      color: 'text-[#55708C]',
      bg: 'bg-blue-50/50',
    },
    {
      label: 'Segurança Social (SS)',
      value: taxResults.estimatedSS,
      icon: Landmark,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo{profile?.business_name ? `, ${profile.business_name}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumo das suas finanças
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

      {/* Tax Alerts */}
      <TaxAlerts alerts={alerts} />

      {/* Liquidity Splitter — Hero */}
      <LiquiditySplitter split={split} />

      {/* Monthly Cash Flow Chart */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fluxo de Caixa Mensal</h2>
            <p className="text-xs text-gray-400">Rendimentos acumulados vs despesas justificadas</p>
          </div>
          <Link href="/dashboard/faturas">
            <Button 
              className="text-[#1a1a2e] font-semibold h-11 px-6 rounded-xl gap-2 w-full sm:w-auto shadow-md"
              style={{ 
                backgroundColor: '#7DFABE',
                boxShadow: '0 4px 6px -1px rgba(125, 250, 190, 0.2)'
              }}
            >
              <Plus className="w-4 h-4" /> Adicionar Entrada Manual
            </Button>
          </Link>
        </div>

        {/* SVG Line Chart */}
        <div className="relative">
          <svg viewBox="0 0 700 200" className="w-full h-44" xmlns="http://www.w3.org/2000/svg">
            <line x1="30" y1="40" x2="670" y2="40" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="100" x2="670" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="160" x2="670" y2="160" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* X Labels */}
            {chartPoints.map((pt, i) => (
              <text key={i} x={pt.x} y="180" className="text-[10px]" fill="#94a3b8" textAnchor="middle">
                {pt.label}
              </text>
            ))}

            {/* Curve path */}
            <path
              d="M50,170 C100,165 150,160 250,155 C350,140 450,110 550,90 C600,80 650,70 650,70"
              fill="none"
              stroke="#7DFABE"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Chart dots */}
            {chartPoints.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#7DFABE" />
            ))}
          </svg>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 font-mono">
                  €{formatCurrency(card.value)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Two Column Grid: Top Clients & Regional Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Top clients KPI */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Principais Clientes Faturados</h2>
          </div>

          <div className="space-y-3.5">
            {topClients.map((client, i) => (
              <div key={client.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-150">
                <span className="font-semibold text-gray-800 text-sm">{client.name}</span>
                <span className="font-mono text-emerald-600 font-bold text-sm">€{formatCurrency(client.total)}</span>
              </div>
            ))}
            {topClients.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">Sem rendimentos registados.</p>
            )}
          </div>
        </Card>

        {/* Right Column: Regional distribution KPI */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Distribuição por Região / Cidade</h2>
          </div>

          <div className="space-y-3.5">
            {regionalContributions.map((reg) => (
              <div key={reg.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-150">
                <span className="font-semibold text-gray-800 text-sm">{reg.location}</span>
                <span className="font-mono text-gray-700 font-bold text-sm">€{formatCurrency(reg.total)}</span>
              </div>
            ))}
            {regionalContributions.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">Sem dados de localização.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Faturas Recentes</h2>
          <Link
            href="/dashboard/faturas"
            className="text-sm font-semibold transition-colors"
            style={{ color: '#5cb896' }}
          >
            Ver todas →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Ainda não tem faturas</p>
              <Link
                href="/dashboard/faturas"
                className="text-sm mt-2 inline-block font-semibold"
                style={{ color: '#5cb896' }}
              >
                Adicionar primeira fatura →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50"
                    >
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.client_supplier_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(invoice.date).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-sm font-semibold font-mono text-green-600"
                  >
                    +€{formatCurrency(Number(invoice.total_amount))}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function generateTaxAlerts(invoices: Invoice[], profile: Profile) {
  const alerts = []
  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const totalMoneyIn = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)

  if (profile.vat_exempt && totalMoneyIn > 13500) {
    alerts.push({
      id: 'vat-threshold-exceeded',
      type: 'danger' as const,
      title: 'Limite de Isenção de IVA Ultrapassado',
      message: `O seu rendimento total (€${formatCurrency(totalMoneyIn)}) ultrapassou o limite de isenção de €13.500. Poderá ter de se registar no regime de IVA e começar a cobrar IVA nas suas faturas.`,
    })
  }
  return alerts
}
