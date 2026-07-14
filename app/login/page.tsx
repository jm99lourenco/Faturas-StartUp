'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Landmark, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Registo efetuado com sucesso! Já pode iniciar sessão.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  const handleTestUserLogin = async () => {
    setLoading(true)
    setErrorMsg('')
    const testEmail = 'teste.reqibo@gmail.com'
    const testPassword = 'reqibo_password_2026'

    try {
      // First, try to login
      let { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      // If user doesn't exist, automatically sign them up first
      if (error && (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed'))) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        })
        
        if (!signUpError) {
          // Attempt sign in again after auto signup
          const retry = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          })
          if (retry.error) throw retry.error
        } else {
          throw signUpError
        }
      } else if (error) {
        throw error
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao aceder à conta de teste')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl rounded-3xl p-6 relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#7DFABE]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl" />
        </div>

        <CardContent className="relative z-10 space-y-6 p-0">
          {/* Header */}
          <div className="text-center space-y-2">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-3"
              style={{ 
                backgroundColor: '#7DFABE',
                boxShadow: '0 8px 12px -3px rgba(125, 250, 190, 0.3)'
              }}
            >
              <span className="text-[#1a1a2e] text-3xl font-extrabold italic tracking-tighter">R</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Entrar na Reqibo</h1>
            <p className="text-xs text-gray-450">
              Aceda à plataforma de gestão de faturas e simulações de impostos
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Email</Label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Ex: joao@empresa.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 pl-10 h-11 rounded-xl"
                />
                <Mail className="w-4 h-4 text-gray-450 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Palavra-passe</Label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Introduza a sua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 pl-10 h-11 rounded-xl"
                />
                <KeyRound className="w-4 h-4 text-gray-450 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-[#1a1a2e] font-semibold h-11 rounded-xl shadow-md transition-all mt-2"
              style={{ backgroundColor: '#7DFABE' }}
            >
              {loading ? 'A processar...' : isSignUp ? 'Criar Conta' : 'Entrar com Email'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] bg-gray-200 flex-1" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ou</span>
            <div className="h-[1px] bg-gray-200 flex-1" />
          </div>

          {/* Test Account Login Button */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleTestUserLogin}
              disabled={loading}
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 h-11 rounded-xl gap-2 font-semibold shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              Entrar com Conta de Teste (1-Clique)
            </Button>
            <p className="text-[10px] text-center text-gray-400">
              Liga instantaneamente a conta de simulação à sua base de dados Supabase real.
            </p>
          </div>

          {/* Footer toggle link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-semibold text-[#5cb896] hover:underline"
            >
              {isSignUp ? 'Já tem conta? Iniciar Sessão' : 'Não tem conta? Registar agora'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
