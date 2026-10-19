/**
 * Saudi Arabia Labor Law Compliance Helpers
 * - End of Service Benefit (EOSB) Calculator per Articles 84 & 85
 * - Hijri Calendar formatting
 * - Saudi Wage Protection System (WPS) SIF file string generator
 */

export interface EosbCalculationInput {
  basicSalary: number;
  housingAllowance: number;
  totalServiceYears: number;
  totalServiceMonths: number;
  totalServiceDays: number;
  terminationReason: 'resignation' | 'company_termination' | 'end_of_contract' | 'force_majeure' | 'mutual_consent';
}

export interface EosbCalculationResult {
  lastDrawnWage: number;
  effectiveServiceYears: number;
  firstFiveYearsAward: number;
  subsequentYearsAward: number;
  unadjustedTotal: number;
  entitlementPercentage: number;
  finalGratuityAmount: number;
  legalArticleReference: string;
  breakdown: string[];
}

/**
 * Calculates End of Service Gratuity per Saudi Labor Law Articles 84 and 85
 */
export function calculateSaudiEOSB(input: EosbCalculationInput): EosbCalculationResult {
  const lastDrawnWage = input.basicSalary + input.housingAllowance;
  const effectiveYears = input.totalServiceYears + (input.totalServiceMonths / 12) + (input.totalServiceDays / 365);
  const roundedYears = Math.round(effectiveYears * 100) / 100;

  // Article 84 base calculation:
  // - Half-month wage for each of first 5 years
  // - Full-month wage for each subsequent year
  const first5Years = Math.min(5, effectiveYears);
  const subsequentYears = Math.max(0, effectiveYears - 5);

  const firstFiveYearsAward = Math.round(first5Years * 0.5 * lastDrawnWage * 100) / 100;
  const subsequentYearsAward = Math.round(subsequentYears * 1.0 * lastDrawnWage * 100) / 100;
  const unadjustedTotal = Math.round((firstFiveYearsAward + subsequentYearsAward) * 100) / 100;

  let entitlementPercentage = 100;
  let legalArticleReference = 'Article 84 (Full Entitlement)';
  const breakdown: string[] = [];

  breakdown.push(`Last drawn salary base (Basic + Housing): SAR ${lastDrawnWage.toLocaleString()}`);
  breakdown.push(`Total service length: ${roundedYears} years (${input.totalServiceYears}y, ${input.totalServiceMonths}m, ${input.totalServiceDays}d)`);
  breakdown.push(`First 5 years tier (0.5 month per year): SAR ${firstFiveYearsAward.toLocaleString()}`);
  if (subsequentYears > 0) {
    breakdown.push(`Subsequent ${Math.round(subsequentYears * 100) / 100} years tier (1.0 month per year): SAR ${subsequentYearsAward.toLocaleString()}`);
  }

  // Article 85 Resignation Rules:
  if (input.terminationReason === 'resignation') {
    if (effectiveYears < 2) {
      entitlementPercentage = 0;
      legalArticleReference = 'Article 85 (Resignation under 2 years: 0% award)';
      breakdown.push('Resignation with under 2 years of service yields no statutory gratuity entitlement.');
    } else if (effectiveYears >= 2 && effectiveYears < 5) {
      entitlementPercentage = 33.333;
      legalArticleReference = 'Article 85 (Resignation between 2 and 5 years: 1/3 award)';
      breakdown.push('Resignation between 2 and 5 years entitles employee to 1/3 (33.33%) of gratuity.');
    } else if (effectiveYears >= 5 && effectiveYears < 10) {
      entitlementPercentage = 66.666;
      legalArticleReference = 'Article 85 (Resignation between 5 and 10 years: 2/3 award)';
      breakdown.push('Resignation between 5 and 10 years entitles employee to 2/3 (66.67%) of gratuity.');
    } else {
      entitlementPercentage = 100;
      legalArticleReference = 'Article 85 (Resignation over 10 years: 100% award)';
      breakdown.push('Resignation exceeding 10 years entitles employee to full 100% gratuity award.');
    }
  } else {
    entitlementPercentage = 100;
    legalArticleReference = 'Article 84 (Company termination / Contract expiration: 100% award)';
    breakdown.push('Standard termination/contract fulfillment qualifies for 100% statutory benefit.');
  }

  const finalGratuityAmount = Math.round((unadjustedTotal * (entitlementPercentage / 100)) * 100) / 100;

  return {
    lastDrawnWage,
    effectiveServiceYears: roundedYears,
    firstFiveYearsAward,
    subsequentYearsAward,
    unadjustedTotal,
    entitlementPercentage,
    finalGratuityAmount,
    legalArticleReference,
    breakdown
  };
}

/**
 * Returns formatted Hijri date approximation for display
 */
export function formatHijriDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(date);
  } catch {
    return '';
  }
}

/**
 * Generate Saudi Wage Protection System (WPS) standard format SIF header & record rows
 */
export function generateSaudiWpsSif(
  companyCr: string,
  bankIban: string,
  periodYearMonth: string,
  records: Array<{
    nationalId: string;
    iban: string;
    employeeName: string;
    basicSalary: number;
    housingAllowance: number;
    otherAllowance: number;
    deductions: number;
    netSalary: number;
  }>
): string {
  const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [year, month] = periodYearMonth.split('-');
  const payrollPeriodStr = `${year}${month}`;

  // Header Record
  let output = `SCR,${companyCr},${bankIban},${fileDate},${payrollPeriodStr},${records.length}\n`;

  // Employee Detail Records
  records.forEach((rec, idx) => {
    const rowNum = idx + 1;
    output += `EDR,${rec.nationalId},${rec.iban},"${rec.employeeName}",${rec.basicSalary.toFixed(2)},${rec.housingAllowance.toFixed(2)},${rec.otherAllowance.toFixed(2)},${rec.deductions.toFixed(2)},${rec.netSalary.toFixed(2)},${rowNum}\n`;
  });

  return output;
}
