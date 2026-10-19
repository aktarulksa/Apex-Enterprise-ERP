import { 
  CorporateIdentity, 
  Department, 
  Project, 
  Designation, 
  Employee, 
  SalaryStructure, 
  SalaryAdjustment, 
  TimesheetEntry, 
  LeaveRequest, 
  LoanAdvance, 
  PayrollPeriod, 
  PayrollRecord,
  AccountingCategory, 
  ExpenseClaim, 
  AssetCategory, 
  ITAsset,
  RolePermission,
  PrintTemplateConfig
} from '../types/erp';
import { calculateEmployeePayrollRecord } from './payrollCalculator';

const STORAGE_KEYS = {
  COMPANY: 'apex_erp_company_v2',
  DEPARTMENTS: 'apex_erp_departments_v2',
  PROJECTS: 'apex_erp_projects_v2',
  DESIGNATIONS: 'apex_erp_designations_v2',
  EMPLOYEES: 'apex_erp_employees_v2',
  SALARY_STRUCTURES: 'apex_erp_salaries_v2',
  SALARY_ADJUSTMENTS: 'apex_erp_adjustments_v2',
  TIMESHEETS: 'apex_erp_timesheets_v2',
  LEAVES: 'apex_erp_leaves_v2',
  LOANS: 'apex_erp_loans_v2',
  PAYROLL_PERIODS: 'apex_erp_payroll_v2',
  ACCOUNTING_CATEGORIES: 'apex_erp_categories_v2',
  EXPENSES: 'apex_erp_expenses_v2',
  ASSET_CATEGORIES: 'apex_erp_asset_cats_v2',
  ASSETS: 'apex_erp_assets_v2',
  PERMISSIONS: 'apex_erp_permissions_v2',
  PRINT_CONFIG: 'apex_erp_print_config_v2',
  CURRENT_USER_ID: 'apex_erp_current_user_v2'
};

// Initial Company Settings
export const DEFAULT_COMPANY: CorporateIdentity = {
  companyName: 'Apex Global Enterprise Technologies LLC',
  companyNameArabic: 'شركة آفاق العالمية لحلول المشاريع المحدودة',
  legalEntity: 'Limited Liability Company (LLC)',
  crNumber: '1010789234',
  vatNumber: '310245678900003',
  companyEmail: 'finance@apex-enterprise.sa',
  companyPhone: '+966 11 489 9200',
  headquarters: 'King Fahd Road, Al-Olaya Tower, Riyadh, Kingdom of Saudi Arabia',
  logoUrl: '/src/assets/images/corporate_erp_logo_1791893576894.jpg',
  bankName: 'Al Rajhi Bank (Corporate Division)',
  bankIban: 'SA4480000456608010123456',
  bankSwift: 'RJHISARI',
  accountNumber: '456608010123456',
  baseCurrency: 'SAR',
  currencySymbol: 'SAR',
  enableHijriDisplay: true,
  wpsEmployerCode: 'MOL-KSA-998124',
  standardMonthlyWorkingDays: 30,
  standardDailyWorkingHours: 8,
  defaultOvertimeMultiplier: 1.5,
  holidayOvertimeMultiplier: 2.0,
  gosiSaudiEmployeePercent: 9.75,
  gosiSaudiCompanyPercent: 11.75,
  gosiNonSaudiCompanyPercent: 2.0
};

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'DEP-EXEC', code: 'EXEC', name: 'Executive Leadership', operatingDivision: 'Corporate Strategy & Governance' },
  { id: 'DEP-HR', code: 'HR', name: 'Human Resources & Talent', operatingDivision: 'People, Culture & Legal' },
  { id: 'DEP-ENG', code: 'ENG', name: 'Enterprise Engineering', operatingDivision: 'Cloud Infrastructure & R&D' },
  { id: 'DEP-FIN', code: 'FIN', name: 'Corporate Finance & Ledger', operatingDivision: 'Treasury, Audit & Compliance' },
  { id: 'DEP-OPS', code: 'OPS', name: 'Field Operations & Logistics', operatingDivision: 'Client Delivery & PMO' }
];

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'PRJ-101', code: 'PRJ-NEOM-GRID', name: 'NEOM Smart Grid Integration', costCenter: 'CC-NEOM-801', clientName: 'NEOM Authority', status: 'active' },
  { id: 'PRJ-102', code: 'PRJ-RYD-METRO', name: 'Riyadh Metro Phase 3 Telecom', costCenter: 'CC-RYD-402', clientName: 'Royal Commission for Riyadh', status: 'active' },
  { id: 'PRJ-103', code: 'PRJ-RED-SEA', name: 'Red Sea Resort Sensor Grid', costCenter: 'CC-RSG-205', clientName: 'Red Sea Global', status: 'active' }
];

export const DEFAULT_DESIGNATIONS: Designation[] = [
  { id: 'DES-01', title: 'Executive Vice President', departmentId: 'DEP-EXEC', grade: 'E-1' },
  { id: 'DES-02', title: 'Human Resources Director', departmentId: 'DEP-HR', grade: 'M-2' },
  { id: 'DES-03', title: 'Senior Solutions Architect', departmentId: 'DEP-ENG', grade: 'T-4' },
  { id: 'DES-04', title: 'Senior Finance Controller', departmentId: 'DEP-FIN', grade: 'M-1' },
  { id: 'DES-05', title: 'Payroll & Benefits Officer', departmentId: 'DEP-HR', grade: 'P-2' },
  { id: 'DES-06', title: 'Cloud DevOps Engineer', departmentId: 'DEP-ENG', grade: 'T-2' },
  { id: 'DES-07', title: 'Senior Frontend Engineer', departmentId: 'DEP-ENG', grade: 'T-3' },
  { id: 'DES-08', title: 'Field Operations Supervisor', departmentId: 'DEP-OPS', grade: 'O-2' }
];

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-1001',
    employeeCode: 'EMP-1001',
    fullName: 'Ahmed Al-Harbi',
    fullNameArabic: 'أحمد الحربي',
    email: 'ahmed.alharbi@apex-enterprise.sa',
    phone: '+966 50 123 4567',
    avatarUrl: '/src/assets/images/avatar_ahmed_alharbi_1791893577005.jpg',
    departmentId: 'DEP-EXEC',
    designationId: 'DES-01',
    projectId: 'PRJ-101',
    role: 'super_admin',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '1084920194',
    passportNumber: 'N9028172',
    joiningDate: '2021-03-01',
    contractType: 'unlimited',
    shiftType: 'flexible',
    basicSalary: 28000,
    housingAllowance: 7000,
    transportAllowance: 2500,
    foodAllowance: 1000,
    otherFixedAllowance: 1500,
    bankName: 'Al Rajhi Bank',
    iban: 'SA4480000100108492019401',
    status: 'active'
  },
  {
    id: 'EMP-1002',
    employeeCode: 'EMP-1002',
    fullName: 'Sarah Mansoor',
    fullNameArabic: 'سارة منصور',
    email: 'sarah.mansoor@apex-enterprise.sa',
    phone: '+966 55 987 6543',
    avatarUrl: '/src/assets/images/avatar_sarah_mansoor_1791893577989.jpg',
    departmentId: 'DEP-HR',
    designationId: 'DES-02',
    projectId: 'PRJ-101',
    role: 'hr_manager',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '1092837482',
    passportNumber: 'N8491023',
    joiningDate: '2022-06-15',
    contractType: 'unlimited',
    shiftType: 'morning',
    basicSalary: 18500,
    housingAllowance: 4625,
    transportAllowance: 1800,
    foodAllowance: 800,
    otherFixedAllowance: 1000,
    bankName: 'Saudi National Bank (SNB)',
    iban: 'SA0310000100209283748202',
    status: 'active'
  },
  {
    id: 'EMP-1003',
    employeeCode: 'EMP-1003',
    fullName: 'David Chen',
    fullNameArabic: 'ديفيد تشن',
    email: 'david.chen@apex-enterprise.sa',
    phone: '+966 54 321 0987',
    avatarUrl: '/src/assets/images/avatar_david_chen_1791893578060.jpg',
    departmentId: 'DEP-ENG',
    designationId: 'DES-03',
    projectId: 'PRJ-101',
    role: 'supervisor',
    nationality: 'United Kingdom',
    isSaudiNational: false,
    iqamaOrNationalId: '2491029384',
    passportNumber: 'GB8829104',
    joiningDate: '2023-01-10',
    contractType: 'limited',
    shiftType: 'morning',
    basicSalary: 22000,
    housingAllowance: 5500,
    transportAllowance: 2000,
    foodAllowance: 1000,
    otherFixedAllowance: 1200,
    bankName: 'Riyad Bank',
    iban: 'SA1220000100324910293843',
    status: 'active'
  },
  {
    id: 'EMP-1004',
    employeeCode: 'EMP-1004',
    fullName: 'Tariq Al-Otaibi',
    fullNameArabic: 'طارق العتيبي',
    email: 'tariq.otaibi@apex-enterprise.sa',
    phone: '+966 56 456 7890',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    departmentId: 'DEP-FIN',
    designationId: 'DES-04',
    projectId: 'PRJ-102',
    role: 'finance_manager',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '1058472910',
    passportNumber: 'N7294012',
    joiningDate: '2022-09-01',
    contractType: 'unlimited',
    shiftType: 'morning',
    basicSalary: 19000,
    housingAllowance: 4750,
    transportAllowance: 1800,
    foodAllowance: 800,
    otherFixedAllowance: 900,
    bankName: 'Alinma Bank',
    iban: 'SA5505000100410584729104',
    status: 'active'
  },
  {
    id: 'EMP-1005',
    employeeCode: 'EMP-1005',
    fullName: 'Fatima Al-Zahrani',
    fullNameArabic: 'فاطمة الزهراني',
    email: 'fatima.zahrani@apex-enterprise.sa',
    phone: '+966 53 112 2334',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    departmentId: 'DEP-HR',
    designationId: 'DES-05',
    projectId: 'PRJ-101',
    role: 'payroll_officer',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '1048291048',
    passportNumber: 'N6382019',
    joiningDate: '2023-08-01',
    contractType: 'unlimited',
    shiftType: 'morning',
    basicSalary: 12000,
    housingAllowance: 3000,
    transportAllowance: 1200,
    foodAllowance: 600,
    otherFixedAllowance: 500,
    bankName: 'Al Rajhi Bank',
    iban: 'SA4480000100510482910485',
    status: 'active'
  },
  {
    id: 'EMP-1006',
    employeeCode: 'EMP-1006',
    fullName: 'Faisal Al-Shammari',
    fullNameArabic: 'فيصل الشمري',
    email: 'faisal.shammari@apex-enterprise.sa',
    phone: '+966 59 888 7766',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    departmentId: 'DEP-ENG',
    designationId: 'DES-06',
    projectId: 'PRJ-102',
    role: 'employee',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '1073829104',
    passportNumber: 'N5529104',
    joiningDate: '2024-02-15',
    contractType: 'unlimited',
    shiftType: 'morning',
    basicSalary: 14000,
    housingAllowance: 3500,
    transportAllowance: 1500,
    foodAllowance: 700,
    otherFixedAllowance: 600,
    bankName: 'Saudi British Bank (SABB)',
    iban: 'SA2050000100610738291046',
    status: 'active',
    supervisorId: 'EMP-1003'
  },
  {
    id: 'EMP-1007',
    employeeCode: 'EMP-1007',
    fullName: 'Maria Santos',
    fullNameArabic: 'ماريا سانتوس',
    email: 'maria.santos@apex-enterprise.sa',
    phone: '+966 54 991 2233',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    departmentId: 'DEP-ENG',
    designationId: 'DES-07',
    projectId: 'PRJ-103',
    role: 'employee',
    nationality: 'Philippines',
    isSaudiNational: false,
    iqamaOrNationalId: '2384910294',
    passportNumber: 'P8920194B',
    joiningDate: '2023-11-01',
    contractType: 'limited',
    shiftType: 'morning',
    basicSalary: 13500,
    housingAllowance: 3375,
    transportAllowance: 1500,
    foodAllowance: 600,
    otherFixedAllowance: 500,
    bankName: 'Banque Saudi Fransi',
    iban: 'SA3330000100723849102947',
    status: 'active',
    supervisorId: 'EMP-1003'
  },
  {
    id: 'EMP-1008',
    employeeCode: 'EMP-1008',
    fullName: 'Omar Al-Ghamdi',
    fullNameArabic: 'عمر الغامدي',
    email: 'omar.ghamdi@apex-enterprise.sa',
    phone: '+966 55 443 2211',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    departmentId: 'DEP-OPS',
    designationId: 'DES-08',
    projectId: 'PRJ-102',
    role: 'supervisor',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '1063920194',
    passportNumber: 'N4482019',
    joiningDate: '2022-01-15',
    contractType: 'unlimited',
    shiftType: 'morning',
    basicSalary: 15000,
    housingAllowance: 3750,
    transportAllowance: 1500,
    foodAllowance: 700,
    otherFixedAllowance: 800,
    bankName: 'Al Rajhi Bank',
    iban: 'SA4480000100810639201948',
    status: 'active'
  }
];

export const DEFAULT_SALARY_STRUCTURES: SalaryStructure[] = DEFAULT_EMPLOYEES.map(emp => {
  const hourlyRate = Math.round((emp.basicSalary / (30 * 8)) * 100) / 100;
  return {
    id: `SAL-${emp.employeeCode}`,
    employeeId: emp.id,
    effectiveFrom: emp.joiningDate,
    basicSalary: emp.basicSalary,
    housingAllowance: emp.housingAllowance,
    transportAllowance: emp.transportAllowance,
    foodAllowance: emp.foodAllowance,
    otherAllowances: emp.otherFixedAllowance,
    hourlyRate,
    overtimeMultiplier: 1.5,
    workingDaysPerMonth: 30,
    standardDailyHours: 8,
    currency: 'SAR',
    status: 'active',
    approvedBy: 'Sarah Mansoor (HR)',
    approvedAt: '2024-01-01',
    deductionRulesSummary: emp.isSaudiNational 
      ? 'GOSI 9.75% Employee + 11.75% Employer; Standard 30-day base.'
      : 'GOSI 2% Employer Hazard; Standard 30-day base; Expatriate contract.'
  };
});

export const DEFAULT_LOANS: LoanAdvance[] = [
  {
    id: 'LN-2026-001',
    employeeId: 'EMP-1006', // Faisal
    employeeName: 'Faisal Al-Shammari',
    loanType: 'salary_advance',
    principalAmount: 8000,
    monthlyInstallment: 2000,
    totalPaid: 4000,
    balanceRemaining: 4000,
    startDate: '2026-08',
    status: 'active',
    purpose: 'Relocation & housing maintenance allowance advance',
    approvedBy: 'Ahmed Al-Harbi (Super Admin)',
    approvedAt: '2026-08-05'
  }
];

export const DEFAULT_LEAVES: LeaveRequest[] = [
  {
    id: 'LV-2026-01',
    employeeId: 'EMP-1007', // Maria
    employeeName: 'Maria Santos',
    leaveType: 'unpaid',
    startDate: '2026-10-18',
    endDate: '2026-10-19',
    totalDays: 2,
    isPaid: false,
    status: 'approved',
    reason: 'Personal visa renewal overseas processing',
    approvedBy: 'Sarah Mansoor (HR)',
    approvedAt: '2026-10-10'
  },
  {
    id: 'LV-2026-02',
    employeeId: 'EMP-1006',
    employeeName: 'Faisal Al-Shammari',
    leaveType: 'annual',
    startDate: '2026-10-25',
    endDate: '2026-10-27',
    totalDays: 3,
    isPaid: true,
    status: 'approved',
    reason: 'Scheduled annual vacation leave',
    approvedBy: 'Sarah Mansoor (HR)',
    approvedAt: '2026-10-12'
  }
];

export const DEFAULT_TIMESHEETS: TimesheetEntry[] = [
  {
    id: 'TS-2026-1001',
    employeeId: 'EMP-1006',
    employeeName: 'Faisal Al-Shammari',
    department: 'DEP-ENG',
    designation: 'DES-06',
    projectId: 'PRJ-102',
    workDate: '2026-10-01',
    shift: 'morning',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    checkIn: '07:55',
    checkOut: '19:00',
    breakMinutes: 60,
    regularHours: 8,
    overtimeHours: 2.08,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    totalHours: 10.08,
    status: 'approved',
    employeeRemarks: 'Completed cloud grid deployment sprint release overtime',
    supervisorRemarks: 'Overtime verified against NEOM deploy schedule',
    submittedBy: 'Faisal Al-Shammari',
    approvedBy: 'David Chen (Supervisor)',
    approvedAt: '2026-10-02',
    isLocked: true
  },
  {
    id: 'TS-2026-1002',
    employeeId: 'EMP-1006',
    employeeName: 'Faisal Al-Shammari',
    department: 'DEP-ENG',
    designation: 'DES-06',
    projectId: 'PRJ-102',
    workDate: '2026-10-02',
    shift: 'morning',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    checkIn: '08:12',
    checkOut: '17:00',
    breakMinutes: 60,
    regularHours: 7.8,
    overtimeHours: 0,
    lateMinutes: 12,
    earlyDepartureMinutes: 0,
    totalHours: 7.8,
    status: 'approved',
    employeeRemarks: 'Traffic congestion on Ring Road',
    supervisorRemarks: 'Acknowledged',
    submittedBy: 'Faisal Al-Shammari',
    approvedBy: 'David Chen (Supervisor)',
    approvedAt: '2026-10-03',
    isLocked: true
  },
  {
    id: 'TS-2026-1003',
    employeeId: 'EMP-1007',
    employeeName: 'Maria Santos',
    department: 'DEP-ENG',
    designation: 'DES-07',
    projectId: 'PRJ-103',
    workDate: '2026-10-01',
    shift: 'morning',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    checkIn: '08:00',
    checkOut: '19:30',
    breakMinutes: 60,
    regularHours: 8,
    overtimeHours: 2.5,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    totalHours: 10.5,
    status: 'approved',
    employeeRemarks: 'UI optimization and accessibility audit overtime',
    supervisorRemarks: 'Verified and approved',
    submittedBy: 'Maria Santos',
    approvedBy: 'David Chen (Supervisor)',
    approvedAt: '2026-10-02',
    isLocked: true
  },
  {
    id: 'TS-2026-1004',
    employeeId: 'EMP-1008',
    employeeName: 'Omar Al-Ghamdi',
    department: 'DEP-OPS',
    designation: 'DES-08',
    projectId: 'PRJ-102',
    workDate: '2026-10-03',
    shift: 'night',
    scheduledStart: '22:00',
    scheduledEnd: '07:00',
    checkIn: '21:50',
    checkOut: '07:30',
    breakMinutes: 60,
    regularHours: 8,
    overtimeHours: 0.67,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    totalHours: 8.67,
    status: 'approved',
    employeeRemarks: 'Overnight field telemetry inspection shift',
    supervisorRemarks: 'Night shift confirmed on site',
    submittedBy: 'Omar Al-Ghamdi',
    approvedBy: 'Ahmed Al-Harbi (Super Admin)',
    approvedAt: '2026-10-04',
    isLocked: true
  },
  {
    id: 'TS-2026-1005',
    employeeId: 'EMP-1006',
    employeeName: 'Faisal Al-Shammari',
    department: 'DEP-ENG',
    designation: 'DES-06',
    projectId: 'PRJ-102',
    workDate: '2026-10-12',
    shift: 'morning',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    checkIn: '08:00',
    checkOut: '18:30',
    breakMinutes: 60,
    regularHours: 8,
    overtimeHours: 1.5,
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    totalHours: 9.5,
    status: 'submitted',
    employeeRemarks: 'System maintenance window overtime',
    submittedBy: 'Faisal Al-Shammari'
  }
];

export const DEFAULT_ADJUSTMENTS: SalaryAdjustment[] = [
  {
    id: 'ADJ-1001',
    employeeId: 'EMP-1003', // David Chen
    period: '2026-10',
    type: 'bonus',
    amount: 3000,
    reason: 'Q3 Architectural Delivery Excellence Award',
    approvedBy: 'Ahmed Al-Harbi (Super Admin)',
    createdAt: '2026-10-05'
  }
];

export const DEFAULT_ACCOUNTING_CATEGORIES: AccountingCategory[] = [
  { id: 'CAT-01', name: 'Cloud Infrastructure & SaaS', code: 'ACC-6100', type: 'expense', description: 'Hosting, database, and dev tool licenses' },
  { id: 'CAT-02', name: 'Corporate Travel & Lodging', code: 'ACC-6200', type: 'expense', description: 'Business flights, hotels, and per-diem' },
  { id: 'CAT-03', name: 'Client Engagement & Hospitality', code: 'ACC-6300', type: 'expense', description: 'Business meals and client meetings' },
  { id: 'CAT-04', name: 'Workplace Supplies & Hardware', code: 'ACC-6400', type: 'expense', description: 'Equipment, peripherals, and office supplies' },
  { id: 'CAT-05', name: 'Employee Health & Welfare', code: 'ACC-6500', type: 'expense', description: 'Medical insurance, wellness, training' }
];

export const DEFAULT_EXPENSES: ExpenseClaim[] = [
  {
    id: 'EXP-101',
    employeeId: 'EMP-1003',
    employeeName: 'David Chen',
    categoryId: 'CAT-02',
    amount: 1450,
    currency: 'SAR',
    expenseDate: '2026-10-04',
    description: 'Riyadh to NEOM site visit flight ticket & transportation',
    status: 'approved',
    approvedBy: 'Tariq Al-Otaibi (Finance)',
    approvedAt: '2026-10-06'
  },
  {
    id: 'EXP-102',
    employeeId: 'EMP-1007',
    employeeName: 'Maria Santos',
    categoryId: 'CAT-01',
    amount: 380,
    currency: 'SAR',
    expenseDate: '2026-10-08',
    description: 'Design system team Figma Enterprise add-on seat',
    status: 'pending'
  }
];

export const DEFAULT_ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'AC-01', name: 'Laptops & Workstations', code: 'HW-LPT' },
  { id: 'AC-02', name: 'Monitors & Displays', code: 'HW-DIS' },
  { id: 'AC-03', name: 'Mobile Devices & Tablets', code: 'HW-MOB' },
  { id: 'AC-04', name: 'Network & Server Gear', code: 'HW-NET' }
];

export const DEFAULT_ASSETS: ITAsset[] = [
  {
    id: 'AST-101',
    assetTag: 'APEX-LPT-001',
    name: 'MacBook Pro 16" M3 Max 64GB',
    categoryId: 'AC-01',
    serialNumber: 'C02G9981MD6R',
    purchaseDate: '2024-03-10',
    purchaseCost: 15400,
    assignedEmployeeId: 'EMP-1003',
    status: 'assigned',
    specifications: 'Apple M3 Max, 64GB Unified RAM, 1TB SSD, Space Black'
  },
  {
    id: 'AST-102',
    assetTag: 'APEX-LPT-002',
    name: 'ThinkPad P1 Gen 6 Workstation',
    categoryId: 'AC-01',
    serialNumber: 'PF3X8921',
    purchaseDate: '2024-04-15',
    purchaseCost: 13200,
    assignedEmployeeId: 'EMP-1006',
    status: 'assigned',
    specifications: 'Intel Core i9-13900H, RTX 4080, 64GB DDR5, 2TB SSD'
  },
  {
    id: 'AST-103',
    assetTag: 'APEX-DIS-001',
    name: 'Dell UltraSharp 32" 4K Thunderbolt Hub',
    categoryId: 'AC-02',
    serialNumber: 'CN094812',
    purchaseDate: '2024-05-01',
    purchaseCost: 4800,
    assignedEmployeeId: 'EMP-1007',
    status: 'assigned',
    specifications: 'IPS Black, 90W Power Delivery, RJ45 Ethernet'
  }
];

export const DEFAULT_PRINT_CONFIG: PrintTemplateConfig = {
  templateStyle: 'classic_enterprise',
  showCompanyLogo: true,
  showArabicHeaders: true,
  showQrCode: true,
  showBankDetails: true,
  showOvertimeBreakdown: true,
  showGosiDetails: true,
  primaryBrandColor: '#1e3a8a'
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermission> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Administrator',
    description: 'Complete unrestricted authority over all ERP modules, configuration, and audit logs.',
    canViewAllTimesheets: true,
    canApproveTimesheets: true,
    canManageSalary: true,
    canGeneratePayroll: true,
    canApprovePayroll: true,
    canFinalizePayroll: true,
    canRecordPayment: true,
    canManageEmployees: true,
    canApproveLeave: true,
    canApproveLoans: true,
    canApproveExpenses: true,
    canManageSettings: true,
    canViewAllPayslips: true
  },
  hr_manager: {
    role: 'hr_manager',
    label: 'Human Resources Director',
    description: 'Full employee administration, leave approvals, attendance, and salary setup.',
    canViewAllTimesheets: true,
    canApproveTimesheets: true,
    canManageSalary: true,
    canGeneratePayroll: true,
    canApprovePayroll: true,
    canFinalizePayroll: false,
    canRecordPayment: false,
    canManageEmployees: true,
    canApproveLeave: true,
    canApproveLoans: true,
    canApproveExpenses: false,
    canManageSettings: false,
    canViewAllPayslips: true
  },
  payroll_officer: {
    role: 'payroll_officer',
    label: 'Payroll & Benefits Officer',
    description: 'Prepares calculations, audits timesheet hours, generates payslips and bank files.',
    canViewAllTimesheets: true,
    canApproveTimesheets: false,
    canManageSalary: true,
    canGeneratePayroll: true,
    canApprovePayroll: false,
    canFinalizePayroll: false,
    canRecordPayment: false,
    canManageEmployees: false,
    canApproveLeave: false,
    canApproveLoans: false,
    canApproveExpenses: false,
    canManageSettings: false,
    canViewAllPayslips: true
  },
  finance_manager: {
    role: 'finance_manager',
    label: 'Finance & Treasury Manager',
    description: 'Audits payroll summaries, authorizes payments, records bank references, approves expenses.',
    canViewAllTimesheets: true,
    canApproveTimesheets: false,
    canManageSalary: false,
    canGeneratePayroll: false,
    canApprovePayroll: true,
    canFinalizePayroll: true,
    canRecordPayment: true,
    canManageEmployees: false,
    canApproveLeave: false,
    canApproveLoans: true,
    canApproveExpenses: true,
    canManageSettings: false,
    canViewAllPayslips: true
  },
  supervisor: {
    role: 'supervisor',
    label: 'Operational Supervisor / Team Lead',
    description: 'Reviews and approves team timesheets and overtime requests for assigned members.',
    canViewAllTimesheets: true,
    canApproveTimesheets: true,
    canManageSalary: false,
    canGeneratePayroll: false,
    canApprovePayroll: false,
    canFinalizePayroll: false,
    canRecordPayment: false,
    canManageEmployees: false,
    canApproveLeave: true,
    canApproveLoans: false,
    canApproveExpenses: false,
    canManageSettings: false,
    canViewAllPayslips: false
  },
  employee: {
    role: 'employee',
    label: 'Employee (Self-Service)',
    description: 'Self-service timesheet entry, view personal salary, personal payslips, and loan status.',
    canViewAllTimesheets: false,
    canApproveTimesheets: false,
    canManageSalary: false,
    canGeneratePayroll: false,
    canApprovePayroll: false,
    canFinalizePayroll: false,
    canRecordPayment: false,
    canManageEmployees: false,
    canApproveLeave: false,
    canApproveLoans: false,
    canApproveExpenses: false,
    canManageSettings: false,
    canViewAllPayslips: false
  }
};

/**
 * Storage Repository with local persistence and initial data bootstrap
 */
class ErpStorage {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to store key: ${key}`, e);
    }
  }

  getCompany(): CorporateIdentity {
    return this.get<CorporateIdentity>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
  }
  setCompany(company: CorporateIdentity): void {
    this.set(STORAGE_KEYS.COMPANY, company);
  }

  getDepartments(): Department[] {
    return this.get<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS);
  }
  setDepartments(items: Department[]): void {
    this.set(STORAGE_KEYS.DEPARTMENTS, items);
  }

  getProjects(): Project[] {
    return this.get<Project[]>(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  }
  setProjects(items: Project[]): void {
    this.set(STORAGE_KEYS.PROJECTS, items);
  }

  getDesignations(): Designation[] {
    return this.get<Designation[]>(STORAGE_KEYS.DESIGNATIONS, DEFAULT_DESIGNATIONS);
  }
  setDesignations(items: Designation[]): void {
    this.set(STORAGE_KEYS.DESIGNATIONS, items);
  }

  getEmployees(): Employee[] {
    return this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  }
  setEmployees(items: Employee[]): void {
    this.set(STORAGE_KEYS.EMPLOYEES, items);
  }

  getSalaryStructures(): SalaryStructure[] {
    return this.get<SalaryStructure[]>(STORAGE_KEYS.SALARY_STRUCTURES, DEFAULT_SALARY_STRUCTURES);
  }
  setSalaryStructures(items: SalaryStructure[]): void {
    this.set(STORAGE_KEYS.SALARY_STRUCTURES, items);
  }

  getSalaryAdjustments(): SalaryAdjustment[] {
    return this.get<SalaryAdjustment[]>(STORAGE_KEYS.SALARY_ADJUSTMENTS, DEFAULT_ADJUSTMENTS);
  }
  setSalaryAdjustments(items: SalaryAdjustment[]): void {
    this.set(STORAGE_KEYS.SALARY_ADJUSTMENTS, items);
  }

  getTimesheets(): TimesheetEntry[] {
    return this.get<TimesheetEntry[]>(STORAGE_KEYS.TIMESHEETS, DEFAULT_TIMESHEETS);
  }
  setTimesheets(items: TimesheetEntry[]): void {
    this.set(STORAGE_KEYS.TIMESHEETS, items);
  }

  getLeaves(): LeaveRequest[] {
    return this.get<LeaveRequest[]>(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES);
  }
  setLeaves(items: LeaveRequest[]): void {
    this.set(STORAGE_KEYS.LEAVES, items);
  }

  getLoans(): LoanAdvance[] {
    return this.get<LoanAdvance[]>(STORAGE_KEYS.LOANS, DEFAULT_LOANS);
  }
  setLoans(items: LoanAdvance[]): void {
    this.set(STORAGE_KEYS.LOANS, items);
  }

  getAccountingCategories(): AccountingCategory[] {
    return this.get<AccountingCategory[]>(STORAGE_KEYS.ACCOUNTING_CATEGORIES, DEFAULT_ACCOUNTING_CATEGORIES);
  }
  setAccountingCategories(items: AccountingCategory[]): void {
    this.set(STORAGE_KEYS.ACCOUNTING_CATEGORIES, items);
  }

  getExpenses(): ExpenseClaim[] {
    return this.get<ExpenseClaim[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  }
  setExpenses(items: ExpenseClaim[]): void {
    this.set(STORAGE_KEYS.EXPENSES, items);
  }

  getAssetCategories(): AssetCategory[] {
    return this.get<AssetCategory[]>(STORAGE_KEYS.ASSET_CATEGORIES, DEFAULT_ASSET_CATEGORIES);
  }
  setAssetCategories(items: AssetCategory[]): void {
    this.set(STORAGE_KEYS.ASSET_CATEGORIES, items);
  }

  getAssets(): ITAsset[] {
    return this.get<ITAsset[]>(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
  }
  setAssets(items: ITAsset[]): void {
    this.set(STORAGE_KEYS.ASSETS, items);
  }

  getPrintConfig(): PrintTemplateConfig {
    return this.get<PrintTemplateConfig>(STORAGE_KEYS.PRINT_CONFIG, DEFAULT_PRINT_CONFIG);
  }
  setPrintConfig(cfg: PrintTemplateConfig): void {
    this.set(STORAGE_KEYS.PRINT_CONFIG, cfg);
  }

  getCurrentUserId(): string {
    return this.get<string>(STORAGE_KEYS.CURRENT_USER_ID, 'EMP-1001'); // Default Super Admin Ahmed
  }
  setCurrentUserId(id: string): void {
    this.set(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  /**
   * Generates or fetches payroll periods
   */
  getPayrollPeriods(): PayrollPeriod[] {
    const existing = this.get<PayrollPeriod[] | null>(STORAGE_KEYS.PAYROLL_PERIODS, null);
    if (existing && existing.length > 0) return existing;

    // Bootstrap September 2026 (Paid) and October 2026 (Calculated / Ready to Review)
    const company = this.getCompany();
    const employees = this.getEmployees();
    const salaryStructures = this.getSalaryStructures();
    const timesheets = this.getTimesheets();
    const leaves = this.getLeaves();
    const loans = this.getLoans();
    const adjustments = this.getSalaryAdjustments();

    // 1. September 2026 (Finalized & Paid)
    const sepRecords: PayrollRecord[] = employees.map(emp => {
      const sal = salaryStructures.find(s => s.employeeId === emp.id) || {
        id: `SAL-${emp.id}`, employeeId: emp.id, effectiveFrom: emp.joiningDate,
        basicSalary: emp.basicSalary, housingAllowance: emp.housingAllowance,
        transportAllowance: emp.transportAllowance, foodAllowance: emp.foodAllowance,
        otherAllowances: emp.otherFixedAllowance, hourlyRate: Math.round((emp.basicSalary / 240) * 100) / 100,
        overtimeMultiplier: 1.5, workingDaysPerMonth: 30, standardDailyHours: 8, currency: 'SAR',
        status: 'active', approvedBy: 'HR', approvedAt: '2026-09-01', deductionRulesSummary: ''
      };
      const rec = calculateEmployeePayrollRecord(emp, company, sal, [], [], [], [], 'PR-2026-09');
      rec.status = 'paid';
      rec.paymentStatus = 'paid';
      return rec;
    });

    const sepGross = sepRecords.reduce((a, b) => a + b.grossEarnings, 0);
    const sepDeductions = sepRecords.reduce((a, b) => a + b.totalDeductions, 0);
    const sepNet = sepRecords.reduce((a, b) => a + b.netSalary, 0);
    const sepGosiComp = sepRecords.reduce((a, b) => a + b.gosiCompanyContribution, 0);

    const sepPeriod: PayrollPeriod = {
      id: 'PR-2026-09',
      period: '2026-09',
      periodName: 'September 2026 Monthly Payroll',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'paid',
      totalEmployees: employees.length,
      totalGross: Math.round(sepGross * 100) / 100,
      totalDeductions: Math.round(sepDeductions * 100) / 100,
      totalNet: Math.round(sepNet * 100) / 100,
      totalOvertimePay: 0,
      totalGosiCompany: Math.round(sepGosiComp * 100) / 100,
      records: sepRecords,
      preparedBy: 'Fatima Al-Zahrani (Payroll)',
      preparedAt: '2026-09-26 10:00',
      approvedBy: 'Sarah Mansoor (HR)',
      approvedAt: '2026-09-27 14:30',
      finalizedBy: 'Ahmed Al-Harbi (Super Admin)',
      finalizedAt: '2026-09-28 09:15',
      paymentDate: '2026-09-30',
      paymentMethod: 'wps_bank_transfer',
      paymentReference: 'WPS-REF-202609-ALRAJHI-88912',
      paidBy: 'Tariq Al-Otaibi (Finance)',
      paidAt: '2026-09-30 11:45',
      auditLog: [
        { id: 'AUD-01', timestamp: '2026-09-26 10:00', action: 'Payroll Generated', userName: 'Fatima Al-Zahrani', userRole: 'payroll_officer', details: 'Initialized calculation for 8 active employees.' },
        { id: 'AUD-02', timestamp: '2026-09-27 14:30', action: 'Payroll Approved', userName: 'Sarah Mansoor', userRole: 'hr_manager', details: 'HR verification completed without discrepancies.' },
        { id: 'AUD-03', timestamp: '2026-09-28 09:15', action: 'Payroll Finalized', userName: 'Ahmed Al-Harbi', userRole: 'super_admin', details: 'Finalized and locked against ordinary edits.' },
        { id: 'AUD-04', timestamp: '2026-09-30 11:45', action: 'Payment Executed', userName: 'Tariq Al-Otaibi', userRole: 'finance_manager', details: 'Disbursed via Al Rajhi Corporate WPS. Ref: WPS-REF-202609-ALRAJHI-88912' }
      ]
    };

    // 2. October 2026 (Calculated & Ready for Review/Approval)
    const octRecords: PayrollRecord[] = employees.map(emp => {
      const sal = salaryStructures.find(s => s.employeeId === emp.id) || salaryStructures[0];
      return calculateEmployeePayrollRecord(
        emp, company, sal, timesheets, leaves, loans, adjustments, 'PR-2026-10'
      );
    });

    const octGross = octRecords.reduce((a, b) => a + b.grossEarnings, 0);
    const octDeductions = octRecords.reduce((a, b) => a + b.totalDeductions, 0);
    const octNet = octRecords.reduce((a, b) => a + b.netSalary, 0);
    const octOvertime = octRecords.reduce((a, b) => a + b.overtimePay, 0);
    const octGosiComp = octRecords.reduce((a, b) => a + b.gosiCompanyContribution, 0);

    const octPeriod: PayrollPeriod = {
      id: 'PR-2026-10',
      period: '2026-10',
      periodName: 'October 2026 Monthly Payroll',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      status: 'calculated',
      totalEmployees: employees.length,
      totalGross: Math.round(octGross * 100) / 100,
      totalDeductions: Math.round(octDeductions * 100) / 100,
      totalNet: Math.round(octNet * 100) / 100,
      totalOvertimePay: Math.round(octOvertime * 100) / 100,
      totalGosiCompany: Math.round(octGosiComp * 100) / 100,
      records: octRecords,
      preparedBy: 'Fatima Al-Zahrani (Payroll)',
      preparedAt: '2026-10-13 09:00',
      auditLog: [
        { id: 'AUD-10', timestamp: '2026-10-13 09:00', action: 'Payroll Calculated', userName: 'Fatima Al-Zahrani', userRole: 'payroll_officer', details: 'Auto-synchronized approved timesheets, overtime hours, unpaid leave deductions, and loan installments.' }
      ]
    };

    const initialPeriods = [octPeriod, sepPeriod];
    this.set(STORAGE_KEYS.PAYROLL_PERIODS, initialPeriods);
    return initialPeriods;
  }

  setPayrollPeriods(items: PayrollPeriod[]): void {
    this.set(STORAGE_KEYS.PAYROLL_PERIODS, items);
  }

  /**
   * Reset all data to factory demo defaults
   */
  resetToFactoryDefaults(): void {
    localStorage.clear();
    this.setCompany(DEFAULT_COMPANY);
    this.setDepartments(DEFAULT_DEPARTMENTS);
    this.setProjects(DEFAULT_PROJECTS);
    this.setDesignations(DEFAULT_DESIGNATIONS);
    this.setEmployees(DEFAULT_EMPLOYEES);
    this.setSalaryStructures(DEFAULT_SALARY_STRUCTURES);
    this.setSalaryAdjustments(DEFAULT_ADJUSTMENTS);
    this.setTimesheets(DEFAULT_TIMESHEETS);
    this.setLeaves(DEFAULT_LEAVES);
    this.setLoans(DEFAULT_LOANS);
    this.setAccountingCategories(DEFAULT_ACCOUNTING_CATEGORIES);
    this.setExpenses(DEFAULT_EXPENSES);
    this.setAssetCategories(DEFAULT_ASSET_CATEGORIES);
    this.setAssets(DEFAULT_ASSETS);
    this.setPrintConfig(DEFAULT_PRINT_CONFIG);
    this.setCurrentUserId('EMP-1001');
    this.getPayrollPeriods(); // bootstrap periods
  }
}

export const erpStorage = new ErpStorage();
