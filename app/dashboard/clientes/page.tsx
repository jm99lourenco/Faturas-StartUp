'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client, Entity } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DEMO_MODE } from '@/lib/demo-data'
import { getLocalClients, saveLocalClients, getLocalEntities, saveLocalEntities } from '@/lib/localStorage'
import { Users, Building, Plus, Trash2, CheckCircle } from 'lucide-react'

// Demo data for clients and entities
const DEMO_CLIENTS: Client[] = [
  {
    id: 'cli-001',
    profile_id: 'demo-user-001',
    name: 'Empresa ABC, Lda.',
    email: 'financeiro@abc.pt',
    phone: '912345678',
    notes: 'Cliente principal, pagamentos a 30 dias.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cli-002',
    profile_id: 'demo-user-001',
    name: 'StartupXYZ, S.A.',
    email: 'billing@startupxyz.com',
    phone: '961122334',
    notes: 'Faturação recorrente de avença mensal.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cli-003',
    profile_id: 'demo-user-001',
    name: 'Grupo Ferreira & Associados',
    email: 'contacto@ferreira.pt',
    phone: '210000000',
    notes: 'Consultoria de design e marketing.',
    created_at: new Date().toISOString(),
  }
]

const DEMO_ENTITIES: Entity[] = [
  {
    id: 'ent-001',
    profile_id: 'demo-user-001',
    name: 'WeWork Lisboa',
    email: 'wework@lisboa.pt',
    phone: '219999999',
    notes: 'Renda mensal do escritório.',
    address: 'Avenida da Liberdade 123, Lisboa',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ent-002',
    profile_id: 'demo-user-001',
    name: 'Adobe Creative Cloud',
    email: 'billing@adobe.com',
    phone: null,
    notes: 'Subscrição anual software de design.',
    address: 'Dublin, Irlanda',
    created_at: new Date().toISOString(),
  }
]

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<'clientes' | 'entidades'>('clientes')
  const [clients, setClients] = useState<Client[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)

  // Client form states
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNotes, setClientNotes] = useState('')

  // Entity form states
  const [entityName, setEntityName] = useState('')
  const [entityEmail, setEntityEmail] = useState('')
  const [entityPhone, setEntityPhone] = useState('')
  const [entityAddress, setEntityAddress] = useState('')
  const [entityNotes, setEntityNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const loadData = useCallback(async () => {
    if (DEMO_MODE) {
      setClients(getLocalClients())
      setEntities(getLocalEntities())
      setLoading(false)
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const [clientsRes, entitiesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('profile_id', user.id).order('name', { ascending: true }),
        supabase.from('entities').select('*').eq('profile_id', user.id).order('name', { ascending: true }),
      ])
      
      if (clientsRes.data) setClients(clientsRes.data)
      if (entitiesRes.data) setEntities(entitiesRes.data)
    } catch (err) {
      console.error('Erro ao carregar clientes/entidades:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const newClient: Client = {
      id: DEMO_MODE ? Math.random().toString(36).substr(2, 9) : '',
      profile_id: 'demo-user-001',
      name: clientName,
      email: clientEmail || null,
      phone: clientPhone || null,
      notes: clientNotes || null,
      created_at: new Date().toISOString(),
    }

    if (DEMO_MODE) {
      const updated = [...clients, newClient]
      setClients(updated)
      saveLocalClients(updated)
    } else {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Não autenticado')
        
        const { error } = await supabase.from('clients').insert({
          ...newClient,
          id: undefined,
          profile_id: user.id
        })
        if (error) throw error
        await loadData()
      } catch (err) {
        console.error('Erro ao adicionar cliente:', err)
      }
    }

    setClientName('')
    setClientEmail('')
    setClientPhone('')
    setClientNotes('')
    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const newEntity: Entity = {
      id: DEMO_MODE ? Math.random().toString(36).substr(2, 9) : '',
      profile_id: 'demo-user-001',
      name: entityName,
      email: entityEmail || null,
      phone: entityPhone || null,
      address: entityAddress || null,
      notes: entityNotes || null,
      created_at: new Date().toISOString(),
    }

    if (DEMO_MODE) {
      const updated = [...entities, newEntity]
      setEntities(updated)
      saveLocalEntities(updated)
    } else {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Não autenticado')
        
        const { error } = await supabase.from('entities').insert({
          ...newEntity,
          id: undefined,
          profile_id: user.id
        })
        if (error) throw error
        await loadData()
      } catch (err) {
        console.error('Erro ao adicionar entidade:', err)
      }
    }

    setEntityName('')
    setEntityEmail('')
    setEntityPhone('')
    setEntityAddress('')
    setEntityNotes('')
    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Eliminar este cliente?')) return
    if (DEMO_MODE) {
      const updated = clients.filter((c) => c.id !== id)
      setClients(updated)
      saveLocalClients(updated)
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('Eliminar esta entidade?')) return
    if (DEMO_MODE) {
      const updated = entities.filter((e) => e.id !== id)
      setEntities(updated)
      saveLocalEntities(updated)
      return
    }
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from('entities').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#7DFABE', borderTopColor: 'transparent' }} />
          <p className="text-gray-400 text-sm">A carregar registos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Clientes e Entidades</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gira os registos de faturação de clientes e entidades parceiras
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

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-150 max-w-sm">
        <button
          onClick={() => setActiveTab('clientes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clientes' 
              ? 'text-[#1a1a2e] shadow-sm' 
              : 'text-gray-400 hover:text-gray-650'
          }`}
          style={{ backgroundColor: activeTab === 'clientes' ? '#7DFABE' : 'transparent' }}
        >
          <Users className="w-4 h-4" /> Clientes
        </button>
        <button
          onClick={() => setActiveTab('entidades')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'entidades' 
              ? 'text-[#1a1a2e] shadow-sm' 
              : 'text-gray-400 hover:text-gray-650'
          }`}
          style={{ backgroundColor: activeTab === 'entidades' ? '#7DFABE' : 'transparent' }}
        >
          <Building className="w-4 h-4" /> Entidades
        </button>
      </div>

      {/* Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Card */}
        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm p-6 self-start">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {activeTab === 'clientes' ? 'Adicionar Cliente' : 'Adicionar Entidade'}
            </h2>
          </div>

          {activeTab === 'clientes' ? (
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Nome do Cliente *</Label>
                <Input
                  placeholder="Ex: ACME Lda."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="Ex: financeiro@acme.pt"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Contacto Telefónico</Label>
                <Input
                  placeholder="Ex: 912345678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Notas</Label>
                <textarea
                  placeholder="Notas internas ou CAE associado..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:border-[#7DFABE] focus:ring-1 focus:ring-[#7DFABE]/20 focus:outline-none min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {success && (
                  <span className="text-green-600 text-xs flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Gravado!
                  </span>
                )}
                <Button
                  type="submit"
                  className="text-[#1a1a2e] font-semibold h-10 px-4 rounded-xl shadow-sm"
                  style={{ backgroundColor: '#7DFABE' }}
                >
                  Registar Cliente
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddEntity} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Nome da Entidade *</Label>
                <Input
                  placeholder="Ex: Coworking Centro"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="Ex: info@coworking.pt"
                  value={entityEmail}
                  onChange={(e) => setEntityEmail(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Contacto Telefónico</Label>
                <Input
                  placeholder="Ex: 210000000"
                  value={entityPhone}
                  onChange={(e) => setEntityPhone(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Morada Física (opcional)</Label>
                <Input
                  placeholder="Ex: Rua Direita, 25, Lisboa"
                  value={entityAddress}
                  onChange={(e) => setEntityAddress(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Notas</Label>
                <textarea
                  placeholder="Notas internas..."
                  value={entityNotes}
                  onChange={(e) => setEntityNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:border-[#7DFABE] focus:ring-1 focus:ring-[#7DFABE]/20 focus:outline-none min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {success && (
                  <span className="text-green-600 text-xs flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Gravado!
                  </span>
                )}
                <Button
                  type="submit"
                  className="text-[#1a1a2e] font-semibold h-10 px-4 rounded-xl shadow-sm"
                  style={{ backgroundColor: '#7DFABE' }}
                >
                  Registar Entidade
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Right Column: List Card */}
        <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm overflow-hidden">
          {activeTab === 'clientes' ? (
            <div>
              {clients.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  Sem clientes registados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Nome</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Email</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Telemóvel</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Notas</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} className="border-gray-100">
                          <TableCell className="font-semibold text-gray-900">{client.name}</TableCell>
                          <TableCell className="text-gray-650">{client.email || '-'}</TableCell>
                          <TableCell className="text-gray-650">{client.phone || '-'}</TableCell>
                          <TableCell className="text-xs text-gray-400">{client.notes || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-gray-400 hover:text-red-500 h-8 w-8"
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
            </div>
          ) : (
            <div>
              {entities.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  Sem entidades registadas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Nome</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Email</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Morada</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-gray-500">Notas</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entities.map((entity) => (
                        <TableRow key={entity.id} className="border-gray-100">
                          <TableCell className="font-semibold text-gray-900">{entity.name}</TableCell>
                          <TableCell className="text-gray-650">{entity.email || '-'}</TableCell>
                          <TableCell className="text-xs text-gray-650 max-w-[150px] truncate">{entity.address || '-'}</TableCell>
                          <TableCell className="text-xs text-gray-400">{entity.notes || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEntity(entity.id)}
                              className="text-gray-400 hover:text-red-500 h-8 w-8"
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
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
