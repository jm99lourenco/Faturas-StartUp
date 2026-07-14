import { Invoice, Client, Entity, Profile } from '@/types'
import { DEMO_INVOICES, DEMO_PROFILE } from './demo-data'

const KEY_INVOICES = 'reqibo_invoices'
const KEY_CLIENTS = 'reqibo_clients'
const KEY_ENTITIES = 'reqibo_entities'
const KEY_PROFILE = 'reqibo_profile'

export function getLocalInvoices(): Invoice[] {
  if (typeof window === 'undefined') return DEMO_INVOICES
  const data = localStorage.getItem(KEY_INVOICES)
  if (!data) {
    localStorage.setItem(KEY_INVOICES, JSON.stringify(DEMO_INVOICES))
    return DEMO_INVOICES
  }
  return JSON.parse(data)
}

export function saveLocalInvoices(invoices: Invoice[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_INVOICES, JSON.stringify(invoices))
}

export function getLocalClients(): Client[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEY_CLIENTS)
  if (!data) {
    const initial = [
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
    localStorage.setItem(KEY_CLIENTS, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(data)
}

export function saveLocalClients(clients: Client[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_CLIENTS, JSON.stringify(clients))
}

export function getLocalEntities(): Entity[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEY_ENTITIES)
  if (!data) {
    const initial = [
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
    localStorage.setItem(KEY_ENTITIES, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(data)
}

export function saveLocalEntities(entities: Entity[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_ENTITIES, JSON.stringify(entities))
}

export function getLocalProfile(): Profile {
  if (typeof window === 'undefined') return DEMO_PROFILE
  const data = localStorage.getItem(KEY_PROFILE)
  if (!data) {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(DEMO_PROFILE))
    return DEMO_PROFILE
  }
  return JSON.parse(data)
}

export function saveLocalProfile(profile: Profile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile))
}
