'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Sliders, Link2, CheckCircle2, Shield, Landmark } from 'lucide-react'

export default function ConfigsPage() {
  const [businessName, setBusinessName] = useState('João Lourenço — Design & Consultoria')
  const [nif, setNif] = useState('123456789')
  const [cae, setCae] = useState('74100 (Designers)')
  
  // Integration simulation state
  const [bankConnected, setBankConnected] = useState(false)
  const [connectingBank, setConnectingBank] = useState(false)

  const handleConnectBank = () => {
    setConnectingBank(true)
    setTimeout(() => {
      setBankConnected(true)
      setConnectingBank(false)
    }, 1500)
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gira os dados da sua empresa e conexões a integrações externas
          </p>
        </div>
        <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-400/20">
          <span className="text-white text-xl font-bold italic">R</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Business Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Perfil da Empresa</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Nome de Atividade / Empresa</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">NIF</Label>
                  <Input
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">CAE Principal</Label>
                  <Input
                    value={cae}
                    onChange={(e) => setCae(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 h-11"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button className="bg-[#4adeb5] hover:bg-[#39c79f] text-white font-semibold rounded-xl h-11 px-6 shadow-md shadow-[#4adeb5]/20">
                  Gravar Alterações
                </Button>
              </div>
            </div>
          </Card>

          {/* Security & Compliance Info Card */}
          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Segurança de Dados & RGPD</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  A Reqibo cumpre as normas de segurança europeias de encriptação de dados ponta-a-ponta. Todas as credenciais de leitura da Autoridade Tributária ou ligações bancárias são protegidas e nunca armazenadas nos nossos servidores.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Platform Connections & Integrations */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Integrações Oficiais</h2>
            </div>

            <div className="space-y-5">
              {/* AT Connection */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Finanças (AT)</h3>
                  <p className="text-[10px] text-gray-400">Leitura automática de e-Fatura</p>
                </div>
                <Badge className="bg-green-50 border border-green-200 text-green-700 font-semibold gap-1 py-1 px-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ligado
                </Badge>
              </div>

              {/* SS Connection */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Segurança Social</h3>
                  <p className="text-[10px] text-gray-400">Entrega de Declaração Trimestral</p>
                </div>
                <Badge className="bg-green-50 border border-green-200 text-green-700 font-semibold gap-1 py-1 px-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ligado
                </Badge>
              </div>

              {/* Bank Account integration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Conta Bancária</h3>
                    <p className="text-[10px] text-gray-400">Sincronização via Open Banking</p>
                  </div>
                  {bankConnected ? (
                    <Badge className="bg-green-50 border border-green-200 text-green-700 font-semibold gap-1 py-1 px-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ligado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-200 text-gray-400 bg-white">
                      Desligado
                    </Badge>
                  )}
                </div>

                {!bankConnected && (
                  <Button 
                    onClick={handleConnectBank} 
                    disabled={connectingBank}
                    className="w-full bg-[#4adeb5] hover:bg-[#39c79f] text-white font-semibold text-xs h-9 rounded-lg gap-2"
                  >
                    <Landmark className="w-3.5 h-3.5" /> 
                    {connectingBank ? 'A autenticar...' : 'Ligar via Nordigen (PSD2)'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
