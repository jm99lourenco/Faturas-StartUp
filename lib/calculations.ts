import { Invoice, LiquiditySplit, TaxAlert } from '@/types'

// Portuguese VAT exemption threshold (Article 53 CIVA)
const VAT_EXEMPTION_THRESHOLD = 13500

/**
 * Calculate VAT amount from base amount and rate
 */
export function calculateVatAmount(baseAmount: number, vatRate: number): number {
  return Math.round(baseAmount * (vatRate / 100) * 100) / 100
}

/**
 * Calculate IRS withholding amount from base amount and rate
 */
export function calculateWithholding(baseAmount: number, withholdingRate: number): number {
  return Math.round(baseAmount * (withholdingRate / 100) * 100) / 100
}

/**
 * Calculate the total amount for an invoice
 * Incoming: base + VAT - withholding (what you actually receive)
 * Outgoing: base + VAT (what you actually pay)
 */
export function calculateInvoiceTotal(
  baseAmount: number,
  vatAmount: number,
  withholdingAmount: number,
  direction: 'incoming' | 'outgoing'
): number {
  if (direction === 'incoming') {
    // You receive: base + VAT - withholding
    return Math.round((baseAmount + vatAmount - withholdingAmount) * 100) / 100
  }
  // You pay: base + VAT
  return Math.round((baseAmount + vatAmount) * 100) / 100
}

/**
 * Calculate the full liquidity split from a set of invoices
 * This is the core function that powers the dashboard
 */
export function calculateLiquiditySplit(invoices: Invoice[]): LiquiditySplit {
  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const outgoing = invoices.filter((inv) => inv.direction === 'outgoing')

  // Total Money In = sum of base amounts on incoming invoices
  const totalMoneyIn = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)

  // Total VAT Collected = sum of VAT on incoming invoices
  const totalVatCollected = incoming.reduce((sum, inv) => sum + Number(inv.vat_amount), 0)

  // Total Withheld = sum of withholding on incoming invoices
  const totalWithheld = incoming.reduce((sum, inv) => sum + Number(inv.withholding_amount), 0)

  // Total Money Out = sum of total amounts on outgoing invoices
  const totalMoneyOut = outgoing.reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  // The State's Money = VAT collected + amounts withheld
  const stateMoney = Math.round((totalVatCollected + totalWithheld) * 100) / 100

  // Your Money = Total Money In - State's Money - Expenses
  const yourMoney = Math.round((totalMoneyIn - stateMoney - totalMoneyOut) * 100) / 100

  // Calculate percentage for the visual split
  const totalPool = yourMoney + stateMoney
  const statePercentage = totalPool > 0 ? Math.round((stateMoney / totalPool) * 100) : 0

  return {
    totalMoneyIn: Math.round(totalMoneyIn * 100) / 100,
    totalMoneyOut: Math.round(totalMoneyOut * 100) / 100,
    totalVatCollected: Math.round(totalVatCollected * 100) / 100,
    totalWithheld: Math.round(totalWithheld * 100) / 100,
    stateMoney,
    yourMoney,
    statePercentage,
  }
}

/**
 * Check if total income exceeds the VAT exemption threshold
 * and generate appropriate tax alerts
 */
export function generateTaxAlerts(
  invoices: Invoice[],
  profile: { vat_exempt: boolean }
): TaxAlert[] {
  const alerts: TaxAlert[] = []
  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const totalMoneyIn = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)

  // Alerta de limite de isenção de IVA
  if (profile.vat_exempt && totalMoneyIn > VAT_EXEMPTION_THRESHOLD) {
    alerts.push({
      id: 'vat-threshold-exceeded',
      type: 'danger',
      title: 'Limite de Isenção de IVA Ultrapassado',
      message: `O seu rendimento total (€${formatCurrency(totalMoneyIn)}) ultrapassou o limite de isenção de €${formatCurrency(VAT_EXEMPTION_THRESHOLD)}. Poderá ter de se registar no regime de IVA e começar a cobrar IVA nas suas faturas.`,
    })
  } else if (profile.vat_exempt && totalMoneyIn > VAT_EXEMPTION_THRESHOLD * 0.8) {
    alerts.push({
      id: 'vat-threshold-approaching',
      type: 'warning',
      title: 'A Aproximar-se do Limite de IVA',
      message: `O seu rendimento total (€${formatCurrency(totalMoneyIn)}) está a aproximar-se do limite de isenção de €${formatCurrency(VAT_EXEMPTION_THRESHOLD)}. Está a ${Math.round((totalMoneyIn / VAT_EXEMPTION_THRESHOLD) * 100)}% do limite.`,
    })
  }

  // Sem faturas
  if (invoices.length === 0) {
    alerts.push({
      id: 'no-invoices',
      type: 'info',
      title: 'Comece Aqui',
      message: 'Adicione a sua primeira fatura para ver a divisão do seu saldo. Vá à página de Faturas para começar.',
    })
  }

  return alerts
}

/**
 * Format a number as currency (European format)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
