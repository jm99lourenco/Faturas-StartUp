// ============================================
// Database table types
// ============================================

export interface Profile {
  id: string
  business_name: string | null
  nif: string | null
  vat_exempt: boolean
  default_withholding_rate: number
  created_at: string
}

export interface Invoice {
  id: string
  profile_id: string
  direction: 'incoming' | 'outgoing'
  client_supplier_name: string
  base_amount: number
  vat_rate: number
  vat_amount: number
  withholding_amount: number
  total_amount: number
  date: string
  created_at: string
}

// ============================================
// Computed types
// ============================================

export interface LiquiditySplit {
  totalMoneyIn: number
  totalMoneyOut: number
  totalVatCollected: number
  totalWithheld: number
  stateMoney: number
  yourMoney: number
  statePercentage: number
}

export interface TaxAlert {
  id: string
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
}

// ============================================
// Form types
// ============================================

export interface InvoiceFormData {
  direction: 'incoming' | 'outgoing'
  client_supplier_name: string
  base_amount: string
  vat_rate: string
  withholding_rate: string
  date: string
}
