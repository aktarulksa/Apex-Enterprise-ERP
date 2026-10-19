export type UserRole = 
  | 'super_admin' 
  | 'hr_manager' 
  | 'payroll_officer' 
  | 'finance_manager' 
  | 'supervisor' 
  | 'employee';

export interface RolePermission {
  role: UserRole;
  label: string;
  description: string;
  canViewAllTimesheets: boolean;
  canApproveTimesheets: boolean;
  canManageSalary: boolean;
  canGeneratePayroll: boolean;
  canApprovePayroll: boolean;
  canFinalizePayroll: boolean;
  canRecordPayment: boolean;
  canManageEmployees: boolean;
  canApproveLeave: boolean;
  canApproveLoans: boolean;
  canApproveExpenses: boolean;
  canManageSettings: boolean;
  canViewAllPayslips: boolean;
}

export interface CorporateIdentity {
  companyName: string;
  companyNameArabic: string;
  legalEntity: string;
  crNumber: string; // Commercial Registration (Saudi CR)
  vatNumber: string; // VAT / Tax ID
  companyEmail: string;
  companyPhone: string;
  headquarters: string;
  logoUrl: string;
  bankName: string;
  bankIban: string;
  bankSwift: string;
  accountNumber: string;
  baseCurrency: 'SAR' | 'USD' | 'EUR' | 'AED';
  currencySymbol: string;
  enableHijriDisplay: boolean;
  wpsEmployerCode: string;
  standardMonthlyWorkingDays: number; // typically 30 in KSA
  standardDailyWorkingHours: number; // typically 8 hours
  defaultOvertimeMultiplier: number; // 1.5x standard
  holidayOvertimeMultiplier: number; // 2.0x holiday
  gosiSaudiEmployeePercent: number; // 9.75%
  gosiSaudiCompanyPercent: number; // 11.75%
  gosiNonSaudiCompanyPercent: number; // 2%
}

export interface Department {
  id: string;
  code: string;
  name: string;
  operatingDivision: string;
  headEmployeeId?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  costCenter: string;
  clientName: string;
  status: 'active' | 'completed' | 'on_hold';
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  grade: string;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. EMP-101
  fullName: string;
  fullNameArabic?: string;
  email: string;
  phone: string;
  avatarUrl: string;
  departmentId: string;
  designationId: string;
  projectId?: string;
  role: UserRole;
  nationality: string;
  isSaudiNational: boolean;
  iqamaOrNationalId: string;
  passportNumber: string;
  joiningDate: string; // YYYY-MM-DD
  contractType: 'unlimited' | 'limited';
  shiftType: 'morning' | 'evening' | 'night' | 'flexible';
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherFixedAllowance: number;
  bankName: string;
  iban: string;
  status: 'active' | 'on_leave' | 'terminated';
  supervisorId?: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  hourlyRate: number;
  overtimeMultiplier: number;
  workingDaysPerMonth: number;
  standardDailyHours: number;
  currency: string;
  status: 'active' | 'superseded';
  approvedBy: string;
  approvedAt: string;
  deductionRulesSummary: string;
}

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  period: string; // YYYY-MM
  type: 'bonus' | 'commission' | 'arrears' | 'deduction_penalty' | 'manual_adjustment';
  amount: number;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  projectId?: string;
  workDate: string; // YYYY-MM-DD
  shift: 'morning' | 'evening' | 'night' | 'custom';
  scheduledStart: string; // HH:mm
  scheduledEnd: string; // HH:mm
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
  breakMinutes: number;
  regularHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  employeeRemarks?: string;
  supervisorRemarks?: string;
  submittedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  isLocked?: boolean;
}

export type AttendanceStatus = 
  | 'present' 
  | 'remote' 
  | 'overtime_only' 
  | 'paid_leave' 
  | 'unpaid_leave' 
  | 'absent' 
  | 'weekend' 
  | 'holiday';

export interface AttendanceLedgerEntry {
  id: string; // e.g. "LEDGER-EMP-1006-2026-10-15"
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  regularHours: number;
  overtimeHours: number;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AttendanceAuditLog {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  date: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_FILL';
  previousState?: string;
  newState: string;
  performedBy: string;
  userRole: string;
  reason?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'annual' | 'sick' | 'unpaid' | 'emergency' | 'maternity' | 'hajj';
  startDate: string;
  endDate: string;
  totalDays: number;
  isPaid: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface LoanAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  loanType: 'salary_advance' | 'personal_loan' | 'emergency_loan';
  principalAmount: number;
  monthlyInstallment: number;
  totalPaid: number;
  balanceRemaining: number;
  startDate: string; // YYYY-MM
  status: 'pending' | 'approved' | 'active' | 'repaid' | 'rejected';
  purpose: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  isSaudi: boolean;
  
  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  totalFixedEarnings: number;
  
  // Timesheet & Overtime inputs
  approvedTimesheetCount: number;
  totalRegularHours: number;
  approvedOvertimeHours: number;
  overtimeHourlyRate: number;
  overtimePay: number;
  
  // Variable Earnings
  bonus: number;
  commission: number;
  arrears: number;
  grossEarnings: number;
  
  // Deductions
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  absenceDeduction: number;
  gosiEmployeeDeduction: number;
  gosiCompanyContribution: number;
  loanInstallmentDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Net
  netSalary: number;
  currency: string;
  status: 'calculated' | 'approved' | 'finalized' | 'paid';
  paymentStatus: 'unpaid' | 'paid';
  notes: string[];
}

export interface PayrollPeriod {
  id: string;
  period: string; // YYYY-MM e.g. "2026-10"
  periodName: string; // e.g. "October 2026 Monthly Payroll"
  startDate: string;
  endDate: string;
  status: 'draft' | 'calculated' | 'pending_approval' | 'approved' | 'finalized' | 'paid';
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalOvertimePay: number;
  totalGosiCompany: number;
  records: PayrollRecord[];
  
  // Approval & Finalization Audit
  preparedBy: string;
  preparedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  
  // Payment tracking
  paymentDate?: string;
  paymentMethod?: 'wps_bank_transfer' | 'bank_transfer' | 'cash' | 'cheque';
  paymentReference?: string;
  paidBy?: string;
  paidAt?: string;
  
  auditLog: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userName: string;
  userRole: string;
  details: string;
}

export interface AccountingCategory {
  id: string;
  name: string;
  code: string;
  type: 'expense' | 'asset' | 'payroll_liability' | 'statutory';
  description: string;
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  categoryId: string;
  amount: number;
  currency: string;
  expenseDate: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
}

export interface ITAsset {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  assignedEmployeeId?: string;
  status: 'assigned' | 'available' | 'maintenance' | 'retired';
  specifications: string;
}

export interface PrintTemplateConfig {
  templateStyle: 'classic_enterprise' | 'modern_clean' | 'saudi_wps' | 'minimalist';
  showCompanyLogo: boolean;
  showArabicHeaders: boolean;
  showQrCode: boolean;
  showBankDetails: boolean;
  showOvertimeBreakdown: boolean;
  showGosiDetails: boolean;
  primaryBrandColor: string;
}
