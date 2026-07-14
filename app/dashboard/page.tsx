'use client'

import { useEffect, useState, useCallback } from 'react'
import { Invoice, Profile } from '@/types'
import { calculateLiquiditySplit, generateTaxAlerts, formatCurrency } from '@/lib/calculations'
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
  Plus
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
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">A carregar o seu painel...</p>
        </div>
      </div>
    )
  }

  const split = calculateLiquiditySplit(invoices)
  const alerts = profile ? generateTaxAlerts(invoices, profile) : []
  const recentInvoices = invoices.slice(0, 5)

  // Simulated points for the Fluxo de Caixa Mensal SVG Line Chart (matching layout)
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
      label: 'Total Recebido',
      value: split.totalMoneyIn,
      icon: ArrowDownLeft,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Despesas',
      value: split.totalMoneyOut,
      icon: ArrowUpRight,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'IVA Cobrado',
      value: split.totalVatCollected,
      icon: Receipt,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Retenção na Fonte',
      value: split.totalWithheld,
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
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
          <span className="text-white text-xl font-bold italic">S</span>
        </div>
      </div>

      {/* Tax Alerts */}
      <TaxAlerts alerts={alerts} />

      {/* Liquidity Splitter — Hero */}
      <LiquiditySplitter split={split} />

      {/* Monthly Cash Flow Chart with Manual Input Button Row */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fluxo de Caixa Mensal</h2>
            <p className="text-xs text-gray-400">Rendimentos acumulados vs despesas justificadas</p>
          </div>
          <Link href="/dashboard/faturas">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-6 rounded-xl shadow-md shadow-blue-600/20 gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Adicionar Entrada Manual
            </Button>
          </Link>
        </div>

        {/* SVG Line Chart */}
        <div className="relative">
          <svg viewBox="0 0 700 200" className="w-full h-44" xmlns="http://www.w3.org/2000/svg">
            {/* Grid horizontal lines */}
            <line x1="30" y1="40" x2="670" y2="40" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="100" x2="670" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="160" x2="670" y2="160" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* X Labels */}
            {chartPoints.map((pt, i) => (
              <text key={i} x={pt.x} y="180" className="text-[10px]" fill="#94a3b8" textAnchor="middle">
                {pt.label}
              </text>
            ))}

            {/* Curve path (Line chart) */}
            <path
              d="M50,170 C100,165 150,160 250,155 C350,140 450,110 550,90 C600,80 650,70 650,70"
              fill="none"
              stroke="#4361ee"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Chart dots */}
            {chartPoints.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#4361ee" />
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

      {/* Recent Invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Faturas Recentes</h2>
          <Link
            href="/dashboard/faturas"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
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
                className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block font-medium"
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
