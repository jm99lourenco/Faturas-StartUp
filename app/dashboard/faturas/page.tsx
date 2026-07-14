'use client'

import { useEffect, useState, useCallback } from 'react'
import { Invoice, Profile } from '@/types'
import { formatCurrency } from '@/lib/calculations'
import { DEMO_MODE, DEMO_INVOICES, DEMO_PROFILE } from '@/lib/demo-data'
import { calculateVatAmount, calculateWithholding, calculateInvoiceTotal } from '@/lib/calculations'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, CheckCircle, Clock } from 'lucide-react'

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [entidade, setEntidade] = useState('')
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0])
  const [valorBase, setValorBase] = useState('')
  const [taxaIva, setTaxaIva] = useState('0')
  const [retencao, setRetencao] = useState('25')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Live calculations
  const baseAmount = parseFloat(valorBase) || 0
  const vatRate = parseFloat(taxaIva) || 0
  const withholdingRate = parseFloat(retencao) || 0
  const vatAmount = calculateVatAmount(baseAmount, vatRate)
  const withholdingAmount = calculateWithholding(baseAmount, withholdingRate)
  const totalAmount = calculateInvoiceTotal(baseAmount, vatAmount, withholdingAmount, 'incoming')

  const loadData = useCallback(async () => {
    if (DEMO_MODE) {
      setProfile(DEMO_PROFILE)
      setInvoices((prev) => (prev.length > 0 ? prev : DEMO_INVOICES))
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
      console.error('Erro ao carregar faturas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const newInvoice: Invoice = {
      id: DEMO_MODE ? Math.random().toString(36).substr(2, 9) : '',
      profile_id: 'demo-user-001',
      direction: 'incoming',
      client_supplier_name: entidade,
      base_amount: baseAmount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      withholding_amount: withholdingAmount,
      total_amount: totalAmount,
      date: dataEmissao,
      created_at: new Date().toISOString(),
    }

    if (DEMO_MODE) {
      DEMO_INVOICES.unshift(newInvoice)
      setInvoices([newInvoice, ...invoices])
    } else {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Não autenticado')
        const { error } = await supabase.from('invoices').insert({
          ...newInvoice,
          id: undefined,
          profile_id: user.id,
        })
        if (error) throw error
        await loadData()
      } catch (err) {
        console.error('Erro ao gravar fatura:', err)
      }
    }

    setEntidade('')
    setValorBase('')
    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta fatura?')) return
    setDeleting(id)
    if (DEMO_MODE) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
      setDeleting(null)
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    } catch (err) {
      console.error('Erro ao eliminar:', err)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">A carregar faturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Faturas e Entradas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registe e gira as suas faturas emitidas e recebidas
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
          <span className="text-white text-xl font-bold italic">S</span>
        </div>
      </div>

      {/* Invoice Form */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Entidade */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Entidade Client/Fornecedor</Label>
              <Input
                placeholder="Nome da entidade"
                value={entidade}
                onChange={(e) => setEntidade(e.target.value)}
                required
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-11"
              />
            </div>

            {/* Data de Emissão */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Data de Emissão</Label>
              <Input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                required
                className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Valor Base */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Valor Base (€)</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={valorBase}
                  onChange={(e) => setValorBase(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-10 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              </div>
            </div>

            {/* Taxa de IVA */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Taxa de IVA</Label>
              <Select value={taxaIva} onValueChange={(v) => v && setTaxaIva(v)}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="0" className="text-gray-900">Isento</SelectItem>
                  <SelectItem value="6" className="text-gray-900">6%</SelectItem>
                  <SelectItem value="13" className="text-gray-900">13%</SelectItem>
                  <SelectItem value="23" className="text-gray-900">23%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Retenção na Fonte */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Retenção na Fonte</Label>
              <Select value={retencao} onValueChange={(v) => v && setRetencao(v)}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="0" className="text-gray-900">0%</SelectItem>
                  <SelectItem value="11.5" className="text-gray-900">11.5%</SelectItem>
                  <SelectItem value="16.5" className="text-gray-900">16.5%</SelectItem>
                  <SelectItem value="25" className="text-gray-900">25%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            {success && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Fatura gravada com sucesso!
              </span>
            )}
            <Button
              type="submit"
              disabled={submitting || !entidade || !valorBase}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 h-11 rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200"
            >
              {submitting ? 'A gravar...' : 'Validar e Gravar Fatura'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Invoice Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">Ainda não tem faturas registadas</p>
            <p className="text-gray-400 text-xs mt-1">
              Use o formulário acima para registar a sua primeira fatura
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-500 text-xs uppercase font-semibold">Data</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase font-semibold">Entidade</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase font-semibold text-right">Montante Total</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase font-semibold text-right">IVA</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase font-semibold text-right">Retenção</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase font-semibold text-center">Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="text-gray-600 text-sm">
                      {new Date(invoice.date).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell className="text-gray-900 text-sm font-medium">
                      {invoice.client_supplier_name}
                    </TableCell>
                    <TableCell className="text-gray-900 text-sm text-right font-mono">
                      €{formatCurrency(Number(invoice.total_amount))}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm text-right font-mono">
                      €{formatCurrency(Number(invoice.vat_amount))}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm text-right font-mono">
                      €{formatCurrency(Number(invoice.withholding_amount))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          Math.random() > 0.3
                            ? 'text-green-700 border-green-200 bg-green-50'
                            : 'text-amber-700 border-amber-200 bg-amber-50'
                        }`}
                      >
                        {Math.random() > 0.3 ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Processado
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(invoice.id)}
                        disabled={deleting === invoice.id}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
