import { Profile, Invoice } from '@/types'

// Progressive IRS Brackets (2025/2026 Continental Portugal)
export interface IrsBracket {
  limit: number
  rate: number
  deduction: number
}

export const IRS_BRACKETS_CONTINENTE: IrsBracket[] = [
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

export const IRS_BRACKETS_MADEIRA: IrsBracket[] = IRS_BRACKETS_CONTINENTE.map(b => ({
  limit: b.limit,
  rate: Math.round(b.rate * 0.7 * 1000) / 1000,
  deduction: Math.round(b.deduction * 0.7 * 100) / 100
}))

export const IRS_BRACKETS_ACORES: IrsBracket[] = IRS_BRACKETS_CONTINENTE.map(b => ({
  limit: b.limit,
  rate: Math.round(b.rate * 0.75 * 1000) / 1000,
  deduction: Math.round(b.deduction * 0.75 * 100) / 100
}))

export interface TaxCalculationResult {
  grossRevenue: number
  expenses: number
  taxableIncome: number
  estimatedIrs: number
  estimatedIrc: number // for Unipessoal
  estimatedSS: number
  estimatedVat: number
  totalWithholding: number
  totalTaxesOwed: number
  netAvailable: number
  effectiveTaxRate: number
  expensesValidation: {
    needed: number
    submitted: number
    diff: number
    isRegularized: boolean
  }
}

/**
 * Institutional-grade PT Tax Engine
 */
export function calculateTaxes(
  profile: Profile,
  invoices: Invoice[]
): TaxCalculationResult {
  const incoming = invoices.filter((inv) => inv.direction === 'incoming')
  const outgoing = invoices.filter((inv) => inv.direction === 'outgoing')

  const grossRevenue = incoming.reduce((sum, inv) => sum + Number(inv.base_amount), 0)
  const expenses = outgoing.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const estimatedVat = incoming.reduce((sum, inv) => sum + Number(inv.vat_amount), 0)
  const totalWithholding = incoming.reduce((sum, inv) => sum + Number(inv.withholding_amount), 0)

  let taxableIncome = 0
  let estimatedIrs = 0
  let estimatedIrc = 0
  let estimatedSS = 0

  // 1. DYNAMIC TAX CLUSTERING BASED ON EMPLOYMENT REGIME
  if (profile.regime === 'independente') {
    // CATEGORY B: Simplified Regime
    // Determine coefficient based on CAE (usually 75% for services, 15% for sales/goods)
    const isSalesCae = profile.cae && (profile.cae.startsWith('46') || profile.cae.startsWith('47'))
    const coefficient = isSalesCae ? 0.15 : 0.75
    
    // Taxable profit
    taxableIncome = grossRevenue * coefficient

    // Accumulate Category A if applicable
    const catATaxable = profile.trabalho_dependente
      ? Math.max(0, profile.rendimento_dependente_anual - 4104)
      : 0
    const combinedTaxable = taxableIncome + catATaxable

    // Apply progressive IRS brackets
    const conjugalQuotient = profile.estado_civil === 'casado_2' ? 2 : 1
    const incomeForBrackets = combinedTaxable / conjugalQuotient

    const brackets = 
      profile.regiao === 'madeira'
        ? IRS_BRACKETS_MADEIRA
        : profile.regiao === 'acores'
          ? IRS_BRACKETS_ACORES
          : IRS_BRACKETS_CONTINENTE

    let baseIrs = 0
    for (const b of brackets) {
      if (incomeForBrackets <= b.limit) {
        baseIrs = (incomeForBrackets * b.rate) - b.deduction
        break
      }
    }

    // Multiply back by joint quotient
    let totalBaseIrs = baseIrs * conjugalQuotient

    // Deduct dependents (€600/dependent)
    const dependentsDeduction = profile.dependentes * 600
    estimatedIrs = Math.max(0, totalBaseIrs - dependentsDeduction)

    // Calculate Social Security (21.4% rate over 70% of average quarterly income)
    // For Category B, quarterly average is estimated as total annual divided by 4
    const ssQuarterlyAvg = (grossRevenue / 4) * 0.7
    const ssMonthlyContribution = ssQuarterlyAvg > 0 ? ssQuarterlyAvg * 0.214 : 0
    estimatedSS = ssMonthlyContribution * 12

  } else {
    // UNIPESSOAL LDA: Corporate Tax (IRC)
    // Taxable profit is real net profit
    taxableIncome = Math.max(0, grossRevenue - expenses)

    // IRC: 17% on first €50,000 for SMEs, 21% on remaining
    if (taxableIncome <= 50000) {
      estimatedIrc = taxableIncome * 0.17
    } else {
      estimatedIrc = (50000 * 0.17) + ((taxableIncome - 50000) * 0.21)
    }

    // Social Security for Managing Partner (TSU - Taxa Social Única is 34.75% of IAS/wage, simulated here)
    // 34.75% of a simulated manager salary of €1,000/month
    estimatedSS = 1000 * 0.3475 * 12
    
    // Partner pays IRS on distributed dividends (flat 28% or aggregated)
    // Let's simulate a flat 28% tax on net profit after IRC
    const netProfitAfterIrc = taxableIncome - estimatedIrc
    estimatedIrs = Math.max(0, netProfitAfterIrc * 0.28)
  }

  // 2. EXPENSES JUSTIFICATION DEDUCTION (15% rule for simplified regime)
  const expensesNeeded = profile.regime === 'independente' ? grossRevenue * 0.15 : 0
  const expensesJustifiedDiff = expenses - expensesNeeded
  const isRegularized = expensesJustifiedDiff >= 0

  // Total taxes owed (excluding VAT collected, which is a pass-through)
  const totalTaxesOwed = estimatedIrs + estimatedIrc + estimatedSS
  
  // Net available money for the business
  const netAvailable = Math.max(0, grossRevenue - totalTaxesOwed - expenses)
  const totalIncome = grossRevenue + (profile.trabalho_dependente ? profile.rendimento_dependente_anual : 0)
  const effectiveTaxRate = totalIncome > 0 ? (totalTaxesOwed / totalIncome) * 100 : 0

  return {
    grossRevenue,
    expenses,
    taxableIncome,
    estimatedIrs,
    estimatedIrc,
    estimatedSS,
    estimatedVat,
    totalWithholding,
    totalTaxesOwed,
    netAvailable,
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    expensesValidation: {
      needed: expensesNeeded,
      submitted: expenses,
      diff: expensesJustifiedDiff,
      isRegularized,
    }
  }
}
