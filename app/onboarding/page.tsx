'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight, Building2, Loader2, TrendingUp } from 'lucide-react'

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('')
  const [nif, setNif] = useState('')
  const [vatExempt, setVatExempt] = useState('true')
  const [withholdingRate, setWithholdingRate] = useState('25')
  const [customRate, setCustomRate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate NIF
    if (nif.length !== 9 || !/^\d{9}$/.test(nif)) {
      setError('NIF must be exactly 9 digits')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const rate = withholdingRate === 'custom' ? parseFloat(customRate) : parseFloat(withholdingRate)

      if (isNaN(rate) || rate < 0 || rate > 100) {
        setError('Please enter a valid withholding rate between 0 and 100')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          business_name: businessName,
          nif,
          vat_exempt: vatExempt === 'true',
          default_withholding_rate: rate,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-950" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">JLDA</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">Set up your business</h1>
          <p className="text-slate-400 text-sm">
            We need a few details to calculate your money split correctly.
          </p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Business Profile
            </CardTitle>
            <CardDescription className="text-slate-400">
              You can always change these later in settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-slate-300">
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  placeholder="Your business or your name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
                />
              </div>

              {/* NIF */}
              <div className="space-y-2">
                <Label htmlFor="nif" className="text-slate-300">
                  NIF (Tax ID)
                </Label>
                <Input
                  id="nif"
                  placeholder="123456789"
                  value={nif}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                    setNif(val)
                  }}
                  required
                  maxLength={9}
                  inputMode="numeric"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20 font-mono"
                />
                <p className="text-xs text-slate-500">Your 9-digit Portuguese tax number</p>
              </div>

              {/* VAT Exempt */}
              <div className="space-y-2">
                <Label htmlFor="vatExempt" className="text-slate-300">
                  VAT Exempt?
                </Label>
                <Select value={vatExempt} onValueChange={(v) => v && setVatExempt(v)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="true" className="text-white hover:bg-slate-700">
                      Yes — I&apos;m exempt (under €13,500/year)
                    </SelectItem>
                    <SelectItem value="false" className="text-white hover:bg-slate-700">
                      No — I charge VAT
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Most freelancers under €13,500/year are VAT exempt (Art. 53º CIVA)
                </p>
              </div>

              {/* Withholding Rate */}
              <div className="space-y-2">
                <Label htmlFor="withholdingRate" className="text-slate-300">
                  Default IRS Withholding Rate
                </Label>
                <Select value={withholdingRate} onValueChange={(v) => v && setWithholdingRate(v)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="25" className="text-white hover:bg-slate-700">
                      25% (Standard rate)
                    </SelectItem>
                    <SelectItem value="11.5" className="text-white hover:bg-slate-700">
                      11.5% (Reduced rate — first year)
                    </SelectItem>
                    <SelectItem value="0" className="text-white hover:bg-slate-700">
                      0% (No withholding)
                    </SelectItem>
                    <SelectItem value="custom" className="text-white hover:bg-slate-700">
                      Custom rate
                    </SelectItem>
                  </SelectContent>
                </Select>
                {withholdingRate === 'custom' && (
                  <Input
                    type="number"
                    placeholder="Enter rate (e.g. 15.5)"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.5"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
                  />
                )}
                <p className="text-xs text-slate-500">
                  The IRS percentage your clients withhold from payments
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-semibold h-11 transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
