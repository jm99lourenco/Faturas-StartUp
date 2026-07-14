'use client'

import { useState } from 'react'
import { calculateVatAmount, calculateWithholding, calculateInvoiceTotal, formatCurrency } from '@/lib/calculations'
import { InvoiceFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowDownLeft, ArrowUpRight, Loader2, Plus } from 'lucide-react'

import { DEMO_MODE, DEMO_INVOICES } from '@/lib/demo-data'

interface InvoiceFormProps {
  defaultWithholdingRate: number
  onInvoiceAdded: () => void
}

export default function InvoiceForm({ defaultWithholdingRate, onInvoiceAdded }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    direction: 'incoming',
    client_supplier_name: '',
    base_amount: '',
    vat_rate: '0',
    withholding_rate: defaultWithholdingRate.toString(),
    date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Live calculations
  const baseAmount = parseFloat(formData.base_amount) || 0
  const vatRate = parseFloat(formData.vat_rate) || 0
  const withholdingRate = formData.direction === 'incoming' ? (parseFloat(formData.withholding_rate) || 0) : 0
  const vatAmount = calculateVatAmount(baseAmount, vatRate)
  const withholdingAmount = calculateWithholding(baseAmount, withholdingRate)
  const totalAmount = calculateInvoiceTotal(baseAmount, vatAmount, withholdingAmount, formData.direction)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (DEMO_MODE) {
      const newInvoice = {
        id: Math.random().toString(36).substr(2, 9),
        profile_id: 'demo-user-001',
        direction: formData.direction,
        client_supplier_name: formData.client_supplier_name,
        base_amount: baseAmount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        withholding_amount: withholdingAmount,
        total_amount: totalAmount,
        date: formData.date,
        created_at: new Date().toISOString(),
      }

      // Add to mock invoices list
      DEMO_INVOICES.unshift(newInvoice)

      setSuccess(true)
      setFormData({
        direction: formData.direction,
        client_supplier_name: '',
        base_amount: '',
        vat_rate: formData.vat_rate,
        withholding_rate: formData.withholding_rate,
        date: new Date().toISOString().split('T')[0],
      })
      onInvoiceAdded()
      setLoading(false)

      setTimeout(() => setSuccess(false), 3000)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('invoices').insert({
        profile_id: user.id,
        direction: formData.direction,
        client_supplier_name: formData.client_supplier_name,
        base_amount: baseAmount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        withholding_amount: withholdingAmount,
        total_amount: totalAmount,
        date: formData.date,
      })

      if (insertError) throw insertError

      setSuccess(true)
      setFormData({
        direction: formData.direction,
        client_supplier_name: '',
        base_amount: '',
        vat_rate: formData.vat_rate,
        withholding_rate: formData.withholding_rate,
        date: new Date().toISOString().split('T')[0],
      })
      onInvoiceAdded()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-400" />
          New Invoice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Direction Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, direction: 'incoming' })}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                formData.direction === 'incoming'
                  ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Money In
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, direction: 'outgoing' })}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                formData.direction === 'outgoing'
                  ? 'bg-orange-400/15 text-orange-400 border border-orange-400/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Money Out
            </button>
          </div>

          {/* Client/Supplier Name */}
          <div className="space-y-2">
            <Label className="text-slate-300">
              {formData.direction === 'incoming' ? 'Client Name' : 'Supplier Name'}
            </Label>
            <Input
              placeholder={formData.direction === 'incoming' ? 'Who paid you?' : 'Who did you pay?'}
              value={formData.client_supplier_name}
              onChange={(e) => setFormData({ ...formData, client_supplier_name: e.target.value })}
              required
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
            />
          </div>

          {/* Base Amount + Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Base Amount (€)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.base_amount}
                onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                required
                min="0.01"
                step="0.01"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="bg-slate-800/50 border-slate-700 text-white focus:border-emerald-400 focus:ring-emerald-400/20"
              />
            </div>
          </div>

          {/* VAT Rate + Withholding Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">VAT Rate</Label>
              <Select
                value={formData.vat_rate}
                onValueChange={(val) => val && setFormData({ ...formData, vat_rate: val })}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="0" className="text-white hover:bg-slate-700">0% (Exempt)</SelectItem>
                  <SelectItem value="6" className="text-white hover:bg-slate-700">6% (Reduced)</SelectItem>
                  <SelectItem value="13" className="text-white hover:bg-slate-700">13% (Intermediate)</SelectItem>
                  <SelectItem value="23" className="text-white hover:bg-slate-700">23% (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.direction === 'incoming' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Withholding Rate</Label>
                <Select
                  value={formData.withholding_rate}
                  onValueChange={(val) => val && setFormData({ ...formData, withholding_rate: val })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="0" className="text-white hover:bg-slate-700">0%</SelectItem>
                    <SelectItem value="11.5" className="text-white hover:bg-slate-700">11.5%</SelectItem>
                    <SelectItem value="25" className="text-white hover:bg-slate-700">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Live Calculation Preview */}
          {baseAmount > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Preview</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Base Amount</span>
                <span className="text-white font-mono">€{formatCurrency(baseAmount)}</span>
              </div>
              {vatAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">VAT ({vatRate}%)</span>
                  <span className="text-white font-mono">+ €{formatCurrency(vatAmount)}</span>
                </div>
              )}
              {withholdingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Withholding ({withholdingRate}%)</span>
                  <span className="text-orange-400 font-mono">- €{formatCurrency(withholdingAmount)}</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-300">
                    {formData.direction === 'incoming' ? 'You Receive' : 'You Pay'}
                  </span>
                  <span className={formData.direction === 'incoming' ? 'text-emerald-400 font-mono' : 'text-orange-400 font-mono'}>
                    €{formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error / Success Messages */}
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="text-emerald-400 text-sm bg-emerald-400/10 p-3 rounded-lg">
              Invoice added successfully!
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-semibold h-11 transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Invoice
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
