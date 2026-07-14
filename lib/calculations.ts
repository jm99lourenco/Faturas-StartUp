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
 */
export function calculateInvoiceTotal(
  baseAmount: number,
  vatAmount: number,
  withholdingAmount: number,
  direction: 'incoming' | 'outgoing'
): number {
  if (direction === 'incoming') {
    return Math.round((baseAmount + vatAmount - withholdingAmount) * 100) / 100
  }
  return Math.round((baseAmount + vatAmount) * 100) / 100
}

/**
 * Calculate the full liquidity split from a set of invoices
 */
export function calculateLiquiditySplit(invoices: Invoice[]): LiquiditySplit {
  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const outgoing = invoices.filter((inv) => inv.direction === 'outgoing')

  const totalMoneyIn = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)
  const totalVatCollected = incoming.reduce((sum, inv) => sum + Number(inv.vat_amount), 0)
  const totalWithheld = incoming.reduce((sum, inv) => sum + Number(inv.withholding_amount), 0)
  const totalMoneyOut = outgoing.reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  const stateMoney = Math.round((totalVatCollected + totalWithheld) * 100) / 100
  const yourMoney = Math.round((totalMoneyIn - stateMoney - totalMoneyOut) * 100) / 100

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
 * Portuguese progressive IRS brackets (25/26 simulation)
 */
interface IrsBracket {
  limit: number
  rate: number
  deduction: number
}

const IRS_BRACKETS_CONTINENTE: IrsBracket[] = [
  { limit: 7703, rate: 0.13, deduction: 0 },
  { limit: 11623, rate: 0.165, deduction: 269.61 },
  { limit: 16472, rate: 0.22, deduction: 908.88 },
  { limit: 21321, rate: 0.25, deduction: 1403.04 },
  { limit: 27146, rate: 0.32, deduction: 2895.51 },
  { limit: 39799, rate: 0.355, deduction: 3845.62 },
  { limit: 51997, rate: 0.385, deduction: 5039.59 },
  { limit: 81199, rate: 0.45, deduction: 8419.40 },
  { limit: Infinity, rate: 0.48, deduction: 10855.37 },
]

// Madeira rates are slightly lower
const IRS_BRACKETS_MADEIRA: IrsBracket[] = IRS_BRACKETS_CONTINENTE.map(b => ({
  limit: b.limit,
  rate: Math.round(b.rate * 0.7 * 1000) / 1000,
  deduction: Math.round(b.deduction * 0.7 * 100) / 100
}))

// Azores rates are slightly lower
const IRS_BRACKETS_ACORES: IrsBracket[] = IRS_BRACKETS_CONTINENTE.map(b => ({
  limit: b.limit,
  rate: Math.round(b.rate * 0.75 * 1000) / 1000,
  deduction: Math.round(b.deduction * 0.75 * 100) / 100
}))

/**
 * Calculate Progressive IRS under the Portuguese Simplified Regime (Category B)
 */
export function calculateProgressiveIRS(
  categoryBIncome: number,
  params: {
    dependentes: number
    estado_civil: 'solteiro' | 'casado_1' | 'casado_2'
    trabalho_dependente: boolean
    rendimento_dependente_anual: number
    regiao: 'continente' | 'madeira' | 'acores'
  }
) {
  // 1. Calculate Taxable Income from Category B (75% coefficient for services)
  const taxableCategoryB = categoryBIncome * 0.75

  // 2. Add Category A (Trabalho dependente) taxable income (with standard €4104 deduction)
  const taxableCategoryA = params.trabalho_dependente
    ? Math.max(0, params.rendimento_dependente_anual - 4104)
    : 0

  let totalTaxableIncome = taxableCategoryB + taxableCategoryA

  // 3. Apply conjugal quotient (divided by 2 if casado joint filing)
  const isMarriedJoint = params.estado_civil === 'casado_2'
  const conjugalQuotient = isMarriedJoint ? 2 : 1
  const incomeForBrackets = totalTaxableIncome / conjugalQuotient

  // 4. Select regional brackets
  const brackets = 
    params.regiao === 'madeira' 
      ? IRS_BRACKETS_MADEIRA 
      : params.regiao === 'acores' 
        ? IRS_BRACKETS_ACORES 
        : IRS_BRACKETS_CONTINENTE

  // 5. Find bracket and calculate base tax
  let baseTax = 0
  for (const bracket of brackets) {
    if (incomeForBrackets <= bracket.limit) {
      baseTax = (incomeForBrackets * bracket.rate) - bracket.deduction
      break
    }
  }

  // Multiply back by conjugal quotient
  let totalBaseTax = baseTax * conjugalQuotient

  // 6. Apply deductions for dependents (€600 per dependent)
  const dependentsDeduction = params.dependentes * 600
  const finalIrsLiability = Math.max(0, totalBaseTax - dependentsDeduction)

  // 7. Calculate average effective tax rate
  const effectiveRate = totalTaxableIncome > 0 ? (finalIrsLiability / totalBaseIncome(categoryBIncome, params.rendimento_dependente_anual)) * 100 : 0

  return {
    rendimentoTributavel: totalTaxableIncome,
    irsBruto: totalBaseTax,
    deducoesDependentes: dependentsDeduction,
    coletaLiquida: finalIrsLiability,
    taxaEfetiva: Math.round(effectiveRate * 10) / 10,
  }
}

function totalBaseIncome(catB: number, catA: number) {
  return catB + catA
}

/**
 * Check if total income exceeds the VAT exemption threshold
 */
export function generateTaxAlerts(
  invoices: Invoice[],
  profile: { vat_exempt: boolean }
): TaxAlert[] {
  const alerts: TaxAlert[] = []
  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const totalMoneyIn = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)

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
