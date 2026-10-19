import { CorporateIdentity, Employee, SalaryStructure, TimesheetEntry, LeaveRequest, LoanAdvance, SalaryAdjustment, PayrollRecord } from '../types/erp';

/**
 * Calculates working hours, handling overnight shifts (e.g. 22:00 to 06:00) and break deductions.
 */
export function calculateTimesheetHours(
  checkIn: string,
  checkOut: string,
  breakMinutes: number = 60,
  scheduledHours: number = 8
): {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
} {
  if (!checkIn || !checkOut) {
    return { totalHours: 0, regularHours: 0, overtimeHours: 0 };
  }

  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);

  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
    return { totalHours: 0, regularHours: 0, overtimeHours: 0 };
  }

  let inMinutes = inH * 60 + inM;
  let outMinutes = outH * 60 + outM;

  // Handle overnight shift where checkout is next morning
  if (outMinutes < inMinutes) {
    outMinutes += 24 * 60;
  }

  const durationMinutes = Math.max(0, outMinutes - inMinutes - breakMinutes);
  const totalHours = Math.round((durationMinutes / 60) * 100) / 100;
  
  const regularHours = Math.min(totalHours, scheduledHours);
  const overtimeHours = Math.max(0, Math.round((totalHours - scheduledHours) * 100) / 100);

  return { totalHours, regularHours, overtimeHours };
}

/**
 * Calculates late arrival minutes against scheduled start time
 */
export function calculateLateArrivalMinutes(checkIn: string, scheduledStart: string): number {
  if (!checkIn || !scheduledStart) return 0;
  const [inH, inM] = checkIn.split(':').map(Number);
  const [schH, schM] = scheduledStart.split(':').map(Number);
  const inMin = inH * 60 + inM;
  const schMin = schH * 60 + schM;
  return inMin > schMin ? inMin - schMin : 0;
}

/**
 * Calculates early departure minutes against scheduled end time
 */
export function calculateEarlyDepartureMinutes(checkOut: string, scheduledEnd: string): number {
  if (!checkOut || !scheduledEnd) return 0;
  const [outH, outM] = checkOut.split(':').map(Number);
  const [schH, schM] = scheduledEnd.split(':').map(Number);
  const outMin = outH * 60 + outM;
  const schMin = schH * 60 + schM;
  return outMin < schMin ? schMin - outMin : 0;
}

/**
 * Calculate the applicable Hourly Rate for an employee.
 * Standard formula: Basic Salary / (workingDaysPerMonth * standardDailyHours)
 */
export function calculateHourlyRate(
  basicSalary: number,
  workingDays: number = 30,
  dailyHours: number = 8
): number {
  const totalMonthlyHours = Math.max(1, workingDays * dailyHours);
  return Math.round((basicSalary / totalMonthlyHours) * 100) / 100;
}

/**
 * Comprehensive itemized payroll calculation for a single employee in a period
 */
export function calculateEmployeePayrollRecord(
  employee: Employee,
  company: CorporateIdentity,
  salaryStructure: SalaryStructure,
  timesheets: TimesheetEntry[],
  leaves: LeaveRequest[],
  loans: LoanAdvance[],
  adjustments: SalaryAdjustment[],
  payrollPeriodId: string,
  attendanceLedger?: Array<{ employeeId: string; date: string; status: string; regularHours: number; overtimeHours: number }>
): PayrollRecord {
  const notes: string[] = [];

  // 1. Fixed Earnings from Salary Structure
  const basicSalary = salaryStructure.basicSalary || employee.basicSalary;
  const housingAllowance = salaryStructure.housingAllowance || employee.housingAllowance;
  const transportAllowance = salaryStructure.transportAllowance || employee.transportAllowance;
  const foodAllowance = salaryStructure.foodAllowance || employee.foodAllowance;
  const otherAllowances = salaryStructure.otherAllowances || employee.otherFixedAllowance;
  const totalFixedEarnings = basicSalary + housingAllowance + transportAllowance + foodAllowance + otherAllowances;

  // 2. Attendance & Overtime (From Attendance Ledger Matrix or Timesheets)
  let approvedTimesheetCount = 0;
  let totalRegularHours = 0;
  let approvedOvertimeHours = 0;
  let ledgerUnpaidDays = 0;

  const empLedger = attendanceLedger ? attendanceLedger.filter(l => l.employeeId === employee.id) : [];
  if (empLedger.length > 0) {
    approvedTimesheetCount = empLedger.filter(l => l.status === 'present' || l.status === 'remote').length;
    totalRegularHours = empLedger.reduce((acc, l) => acc + (l.regularHours || 0), 0);
    approvedOvertimeHours = Math.round(empLedger.reduce((acc, l) => acc + (l.overtimeHours || 0), 0) * 100) / 100;
    ledgerUnpaidDays = empLedger.filter(l => l.status === 'unpaid_leave' || l.status === 'absent').length;
  } else {
    const approvedTimesheets = timesheets.filter(t => t.employeeId === employee.id && t.status === 'approved');
    approvedTimesheetCount = approvedTimesheets.length;
    totalRegularHours = approvedTimesheets.reduce((acc, t) => acc + (t.regularHours || 0), 0);
    approvedOvertimeHours = approvedTimesheets.reduce((acc, t) => acc + (t.overtimeHours || 0), 0);
  }

  // Hourly rate & overtime pay
  const hourlyRate = salaryStructure.hourlyRate || calculateHourlyRate(
    basicSalary, 
    company.standardMonthlyWorkingDays, 
    company.standardDailyWorkingHours
  );
  
  const overtimeMultiplier = salaryStructure.overtimeMultiplier || company.defaultOvertimeMultiplier;
  const overtimePay = Math.round(approvedOvertimeHours * hourlyRate * overtimeMultiplier * 100) / 100;

  if (approvedOvertimeHours > 0) {
    notes.push(`Overtime: ${approvedOvertimeHours} hrs @ ${hourlyRate} × ${overtimeMultiplier} = ${overtimePay} ${company.baseCurrency}`);
  }

  // 3. Variable adjustments (Bonuses, Commissions, Arrears, Manual)
  const empAdjustments = adjustments.filter(a => a.employeeId === employee.id);
  const bonus = empAdjustments.filter(a => a.type === 'bonus').reduce((acc, a) => acc + a.amount, 0);
  const commission = empAdjustments.filter(a => a.type === 'commission').reduce((acc, a) => acc + a.amount, 0);
  const arrears = empAdjustments.filter(a => a.type === 'arrears').reduce((acc, a) => acc + a.amount, 0);

  const grossEarnings = Math.round((totalFixedEarnings + overtimePay + bonus + commission + arrears) * 100) / 100;

  // 4. Leave deductions (Unpaid leave & Absences from ledger)
  const approvedUnpaidLeaves = leaves.filter(
    l => l.employeeId === employee.id && l.status === 'approved' && !l.isPaid
  );
  const unpaidLeaveDays = Math.max(
    ledgerUnpaidDays, 
    approvedUnpaidLeaves.reduce((acc, l) => acc + l.totalDays, 0)
  );
  const dailyRate = Math.round((basicSalary / company.standardMonthlyWorkingDays) * 100) / 100;
  const unpaidLeaveDeduction = Math.round((dailyRate * unpaidLeaveDays) * 100) / 100;

  if (unpaidLeaveDays > 0) {
    notes.push(`Unpaid Leave / Absence: ${unpaidLeaveDays} days deducted at daily rate of ${dailyRate} ${company.baseCurrency}`);
  }

  // Absence from missed scheduled timesheets if applicable
  const absenceDeduction = 0;

  // 5. GOSI Contribution (Saudi Social Insurance)
  // GOSI base is Basic + Housing (capped at SAR 45,000 monthly)
  const gosiWageBase = Math.min(45000, basicSalary + housingAllowance);
  let gosiEmployeeDeduction = 0;
  let gosiCompanyContribution = 0;

  if (employee.isSaudiNational) {
    gosiEmployeeDeduction = Math.round((gosiWageBase * (company.gosiSaudiEmployeePercent / 100)) * 100) / 100;
    gosiCompanyContribution = Math.round((gosiWageBase * (company.gosiSaudiCompanyPercent / 100)) * 100) / 100;
    notes.push(`GOSI (Saudi National): ${company.gosiSaudiEmployeePercent}% employee (${gosiEmployeeDeduction}), ${company.gosiSaudiCompanyPercent}% employer (${gosiCompanyContribution})`);
  } else {
    // Non-Saudi: 0% employee, 2% company (Occupational Hazards)
    gosiEmployeeDeduction = 0;
    gosiCompanyContribution = Math.round((gosiWageBase * (company.gosiNonSaudiCompanyPercent / 100)) * 100) / 100;
    notes.push(`GOSI (Expatriate): 0% employee, ${company.gosiNonSaudiCompanyPercent}% employer hazards (${gosiCompanyContribution})`);
  }

  // 6. Loans and Salary Advances
  const activeLoans = loans.filter(l => l.employeeId === employee.id && (l.status === 'approved' || l.status === 'active') && l.balanceRemaining > 0);
  let loanInstallmentDeduction = 0;

  activeLoans.forEach(loan => {
    // Deduct installment, but never exceed remaining balance
    const deductible = Math.min(loan.monthlyInstallment, loan.balanceRemaining);
    loanInstallmentDeduction += deductible;
    notes.push(`Loan Installment (${loan.loanType.replace('_', ' ')}): ${deductible} deducted, balance remaining ${loan.balanceRemaining - deductible}`);
  });

  // 7. Other penalties or authorized deductions
  const penaltyDeductions = empAdjustments
    .filter(a => a.type === 'deduction_penalty')
    .reduce((acc, a) => acc + a.amount, 0);
  const otherDeductions = penaltyDeductions;

  // 8. Total Deductions & Net Salary
  const totalDeductions = Math.round(
    (unpaidLeaveDeduction + absenceDeduction + gosiEmployeeDeduction + loanInstallmentDeduction + otherDeductions) * 100
  ) / 100;

  const netSalary = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100);

  return {
    id: `PR-REC-${employee.employeeCode}-${Date.now().toString().slice(-4)}`,
    payrollPeriodId,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    department: employee.departmentId,
    designation: employee.designationId,
    isSaudi: employee.isSaudiNational,
    basicSalary,
    housingAllowance,
    transportAllowance,
    foodAllowance,
    otherAllowances,
    totalFixedEarnings,
    approvedTimesheetCount,
    totalRegularHours,
    approvedOvertimeHours,
    overtimeHourlyRate: hourlyRate,
    overtimePay,
    bonus,
    commission,
    arrears,
    grossEarnings,
    unpaidLeaveDays,
    unpaidLeaveDeduction,
    absenceDeduction,
    gosiEmployeeDeduction,
    gosiCompanyContribution,
    loanInstallmentDeduction,
    otherDeductions,
    totalDeductions,
    netSalary,
    currency: company.baseCurrency,
    status: 'calculated',
    paymentStatus: 'unpaid',
    notes
  };
}
