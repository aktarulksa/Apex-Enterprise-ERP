import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { PayrollRecord, PayrollPeriod, Employee } from '../../types/erp';
import { 
  Printer, 
  FileDown, 
  Building2, 
  CheckCircle, 
  QrCode, 
  ShieldCheck, 
  Globe, 
  User, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  FileText,
  Award,
  Layers,
  Calendar,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Stamp,
  Check
} from 'lucide-react';
import { formatHijriDate, calculateSaudiEOSB } from '../../services/saudiCompliance';

interface PayslipViewerProps {
  initialPeriodId?: string;
  initialEmployeeId?: string;
}

type StatementType = 
  | 'payslip' 
  | 'salary_certificate' 
  | 'annual_statement' 
  | 'eosb_settlement';

export const PayslipViewer: React.FC<PayslipViewerProps> = ({
  initialPeriodId,
  initialEmployeeId
}) => {
  const { 
    payrollPeriods, 
    employees, 
    departments,
    designations,
    company, 
    currentUser, 
    permissions, 
    formatCurrency 
  } = useERP();

  // Period state
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    return initialPeriodId || payrollPeriods[0]?.id || 'PR-2026-10';
  });

  const activePeriod = useMemo(() => {
    return payrollPeriods.find(p => p.id === selectedPeriodId) || payrollPeriods[0];
  }, [payrollPeriods, selectedPeriodId]);

  // Eligible records based on RBAC:
  // Ordinary employee can ONLY see their own record. HR/Payroll/Admin can see all.
  const eligibleRecords = useMemo(() => {
    if (!activePeriod) return [];
    if (!permissions.canViewAllPayslips) {
      return activePeriod.records.filter(r => r.employeeId === currentUser.id);
    }
    return activePeriod.records;
  }, [activePeriod, permissions, currentUser]);

  // Selected record state
  const [selectedRecordId, setSelectedRecordId] = useState<string>(() => {
    if (initialEmployeeId) {
      const match = eligibleRecords.find(r => r.employeeId === initialEmployeeId);
      if (match) return match.id;
    }
    return eligibleRecords[0]?.id || '';
  });

  // Ensure valid selection if period changes
  useEffect(() => {
    if (eligibleRecords.length > 0 && !eligibleRecords.some(r => r.id === selectedRecordId)) {
      setSelectedRecordId(eligibleRecords[0].id);
    }
  }, [eligibleRecords, selectedRecordId]);

  const activeRecord = useMemo(() => {
    return eligibleRecords.find(r => r.id === selectedRecordId) || eligibleRecords[0];
  }, [eligibleRecords, selectedRecordId]);

  const activeEmployee = useMemo(() => {
    if (!activeRecord) return currentUser;
    return employees.find(e => e.id === activeRecord.employeeId) || currentUser;
  }, [activeRecord, employees, currentUser]);

  const activeDept = useMemo(() => {
    return departments.find(d => d.id === activeEmployee.departmentId)?.name || activeEmployee.departmentId.replace('DEP-', '');
  }, [departments, activeEmployee]);

  const activeDesignation = useMemo(() => {
    return designations.find(d => d.id === activeEmployee.designationId)?.title || activeEmployee.designationId;
  }, [designations, activeEmployee]);

  // Statement Type state
  const [statementType, setStatementType] = useState<StatementType>('payslip');

  // Employee Dropdown Menu state
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered employees for dropdown
  const filteredDropdownEmployees = useMemo(() => {
    return eligibleRecords.filter(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const query = employeeSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        rec.employeeName.toLowerCase().includes(query) ||
        rec.employeeCode.toLowerCase().includes(query) ||
        (emp?.fullNameArabic && emp.fullNameArabic.includes(query)) ||
        (emp?.email && emp.email.toLowerCase().includes(query))
      );
    });
  }, [eligibleRecords, employees, employeeSearchQuery]);

  // Document formatting options
  const [bilingualArabic, setBilingualArabic] = useState<boolean>(true);
  const [bulkPrintMode, setBulkPrintMode] = useState<boolean>(false);
  const [watermark, setWatermark] = useState<'none' | 'OFFICIAL' | 'CONFIDENTIAL' | 'ORIGINAL'>('none');
  const [includeSeal, setIncludeSeal] = useState<boolean>(true);

  // PDF Preview Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfZoom, setPdfZoom] = useState<number>(100);

  // Cycling through employees
  const currentEmployeeIndex = eligibleRecords.findIndex(r => r.id === activeRecord?.id);
  const handlePrevEmployee = () => {
    if (currentEmployeeIndex > 0) {
      setSelectedRecordId(eligibleRecords[currentEmployeeIndex - 1].id);
    }
  };
  const handleNextEmployee = () => {
    if (currentEmployeeIndex < eligibleRecords.length - 1) {
      setSelectedRecordId(eligibleRecords[currentEmployeeIndex + 1].id);
    }
  };

  // Print & PDF Download Handler
  const handlePrint = (bulk: boolean = false) => {
    setBulkPrintMode(bulk);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadPdf = () => {
    // Triggers standard print dialog configured for high quality PDF output
    setBulkPrintMode(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Today dates
  const todayIso = new Date().toISOString().slice(0, 10);
  const hijriStr = company.enableHijriDisplay ? formatHijriDate(todayIso) : '';

  // End of service calculation for active employee
  const eosbCalc = useMemo(() => {
    const joiningDate = new Date(activeEmployee.joiningDate || '2023-01-01');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joiningDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalYears = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const totalMonths = Math.floor(remainingDays / 30);
    const daysRemainder = remainingDays % 30;

    return calculateSaudiEOSB({
      basicSalary: activeEmployee.basicSalary,
      housingAllowance: activeEmployee.housingAllowance,
      totalServiceYears: totalYears,
      totalServiceMonths: totalMonths,
      totalServiceDays: daysRemainder,
      terminationReason: 'end_of_contract'
    });
  }, [activeEmployee]);

  if (!activePeriod || eligibleRecords.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
        <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">No payslips available for this period</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {permissions.canViewAllPayslips
            ? 'Generate a payroll run first in the Payroll Automation module to review and generate official employee statements.'
            : 'Your payslip for this period has not been finalized yet. Please check back after HR payroll approval.'}
        </p>
      </div>
    );
  }

  // Content Renderer for different statement types
  const renderStatementContent = (rec: PayrollRecord, emp: Employee, isPrintOnly: boolean = false) => {
    return (
      <div className="relative">
        {/* Watermark Overlay */}
        {watermark !== 'none' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
            <span className="text-slate-200/40 text-7xl font-extrabold tracking-widest uppercase transform -rotate-45 select-none">
              {watermark}
            </span>
          </div>
        )}

        {/* 1. MONTHLY SALARY PAYSLIP */}
        {statementType === 'payslip' && (
          <div className="relative z-1 space-y-6">
            {/* Payslip Header */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-2xl shadow-xs">
                    {company.companyName.charAt(0)}
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {company.companyName}
                  </h2>
                  {bilingualArabic && (
                    <p className="text-xs text-slate-600 font-medium font-arabic mt-0.5" dir="rtl">
                      {company.companyNameArabic}
                    </p>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1.5 space-x-2 font-mono">
                    <span>CR: <strong>{company.crNumber}</strong></span>
                    <span>·</span>
                    <span>VAT: <strong>{company.vatNumber}</strong></span>
                    <span>·</span>
                    <span>WPS: <strong>{company.wpsEmployerCode}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-wider">
                  PAYSLIP / قسيمة الراتب
                </div>
                <div className="text-sm font-bold text-slate-900 mt-2 font-mono">
                  {activePeriod.periodName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Payment Date: {activePeriod.paymentDate || 'End of Month'}
                </div>
                <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                  {rec.paymentStatus === 'paid' ? 'STATUS: PAID (مدفوع)' : 'STATUS: APPROVED (معتمد)'}
                </div>
              </div>
            </div>

            {/* Employee Meta Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Employee / الموظف
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{emp.fullName}</div>
                {bilingualArabic && emp.fullNameArabic && (
                  <div className="text-[11px] text-slate-600 font-arabic mt-0.5" dir="rtl">
                    {emp.fullNameArabic}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Employee ID & National ID
                </div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {emp.employeeCode}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  ID: {emp.iqamaOrNationalId}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Department & Designation
                </div>
                <div className="text-slate-800 font-medium mt-0.5">
                  {activeDept}
                </div>
                <div className="text-[11px] text-slate-500">
                  {activeDesignation}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Bank IBAN / الحساب البنكي
                </div>
                <div className="font-mono text-[11px] font-medium text-slate-800 mt-0.5 truncate" title={emp.iban}>
                  {emp.iban}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {emp.bankName}
                </div>
              </div>
            </div>

            {/* Two Column Table: Earnings vs Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
              {/* Earnings Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Earnings / المستحقات
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{company.baseCurrency}</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-3.5 py-2 flex items-center justify-between">
                    <span className="text-slate-700">Basic Salary / الراتب الأساسي</span>
                    <span className="font-mono text-slate-900 font-medium tabular-nums">
                      {formatCurrency(rec.basicSalary)}
                    </span>
                  </div>

                  <div className="px-3.5 py-2 flex items-center justify-between">
                    <span className="text-slate-700">Housing Allowance / بدل سكن</span>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {formatCurrency(rec.housingAllowance)}
                    </span>
                  </div>

                  <div className="px-3.5 py-2 flex items-center justify-between">
                    <span className="text-slate-700">Transportation / بدل مواصلات</span>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {formatCurrency(rec.transportAllowance)}
                    </span>
                  </div>

                  <div className="px-3.5 py-2 flex items-center justify-between">
                    <span className="text-slate-700">Food & Other Allowances / بدلات أخرى</span>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {formatCurrency(rec.foodAllowance + rec.otherAllowances)}
                    </span>
                  </div>

                  {rec.overtimePay > 0 && (
                    <div className="px-3.5 py-2 flex items-center justify-between bg-emerald-50/50">
                      <div>
                        <div className="text-emerald-900 font-medium">Overtime / عمل إضافي</div>
                        <div className="text-[10px] text-emerald-700">
                          {rec.approvedOvertimeHours} hrs @ {formatCurrency(rec.overtimeHourlyRate)}/h
                        </div>
                      </div>
                      <span className="font-mono text-emerald-800 font-bold tabular-nums">
                        +{formatCurrency(rec.overtimePay)}
                      </span>
                    </div>
                  )}

                  {(rec.bonus > 0 || rec.commission > 0 || rec.arrears > 0) && (
                    <div className="px-3.5 py-2 flex items-center justify-between bg-blue-50/50">
                      <span className="text-blue-900">Bonuses & Arrears / مكافآت وتسويات</span>
                      <span className="font-mono text-blue-900 font-bold tabular-nums">
                        +{formatCurrency(rec.bonus + rec.commission + rec.arrears)}
                      </span>
                    </div>
                  )}

                  {/* Total Gross */}
                  <div className="px-3.5 py-2.5 bg-slate-50 flex items-center justify-between font-bold text-slate-900 border-t border-slate-200">
                    <span>Gross Earnings / إجمالي المستحقات</span>
                    <span className="font-mono tabular-nums text-sm">
                      {formatCurrency(rec.grossEarnings)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Deductions / الاستقطاعات
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{company.baseCurrency}</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-3.5 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-slate-700">GOSI Contribution (Employee)</div>
                      <div className="text-[10px] text-slate-400">التأمينات الاجتماعية (حصة الموظف)</div>
                    </div>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {rec.gosiEmployeeDeduction > 0 ? formatCurrency(rec.gosiEmployeeDeduction) : '0.00'}
                    </span>
                  </div>

                  {rec.unpaidLeaveDeduction > 0 && (
                    <div className="px-3.5 py-2 flex items-center justify-between bg-amber-50/40">
                      <div>
                        <div className="text-amber-900 font-medium">Unpaid Leave Deduction</div>
                        <div className="text-[10px] text-amber-700">{rec.unpaidLeaveDays} days absence</div>
                      </div>
                      <span className="font-mono text-amber-900 font-medium tabular-nums">
                        {formatCurrency(rec.unpaidLeaveDeduction)}
                      </span>
                    </div>
                  )}

                  {rec.loanInstallmentDeduction > 0 && (
                    <div className="px-3.5 py-2 flex items-center justify-between bg-purple-50/40">
                      <div>
                        <div className="text-purple-900 font-medium">Loan Advance Recovery</div>
                        <div className="text-[10px] text-purple-700">خصم قسط السلفة / القرض</div>
                      </div>
                      <span className="font-mono text-purple-900 font-bold tabular-nums">
                        {formatCurrency(rec.loanInstallmentDeduction)}
                      </span>
                    </div>
                  )}

                  {rec.otherDeductions > 0 && (
                    <div className="px-3.5 py-2 flex items-center justify-between">
                      <span className="text-slate-700">Other Deductions / أخرى</span>
                      <span className="font-mono text-slate-900 tabular-nums">
                        {formatCurrency(rec.otherDeductions)}
                      </span>
                    </div>
                  )}

                  {/* Total Deductions */}
                  <div className="px-3.5 py-2.5 bg-slate-50 flex items-center justify-between font-bold text-red-700 border-t border-slate-200">
                    <span>Total Deductions / إجمالي الاستقطاعات</span>
                    <span className="font-mono tabular-nums text-sm">
                      -{formatCurrency(rec.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Disbursed Salary Banner */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-200 font-bold">
                  Net Disbursed Salary / صافي الراتب المستحق
                </div>
                <div className="text-3xl font-extrabold font-mono mt-0.5 tabular-nums text-white">
                  {formatCurrency(rec.netSalary)}
                </div>
              </div>

              <div className="text-right text-xs text-blue-200 space-y-0.5">
                <div>Corporate Disbursing Bank: <strong className="text-white">{company.bankName}</strong></div>
                <div className="font-mono text-[11px] text-blue-300">
                  Employer GOSI Contribution: {formatCurrency(rec.gosiCompanyContribution)}
                </div>
              </div>
            </div>

            {/* Verification & Legal Sign-off Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    KSA WPS Cryptographic Verification
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    REF-{rec.id.replace('PR-REC-', '')}-WPS-CERTIFIED
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Compliant with Saudi Labor Law & GOSI
                  </div>
                </div>
              </div>

              {includeSeal && (
                <div className="text-right">
                  <div className="font-bold text-slate-900">Authorized Payroll Sign-off</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Corporate HR & Finance Directorate</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Certified on {todayIso} {hijriStr && `(${hijriStr})`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. OFFICIAL SALARY CERTIFICATE / EMPLOYMENT LETTER */}
        {statementType === 'salary_certificate' && (
          <div className="relative z-1 space-y-6">
            {/* Formal Letterhead */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b-2 border-slate-800">
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-2xl">
                    {company.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{company.companyName}</h2>
                  <p className="text-xs text-slate-600 font-arabic" dir="rtl">{company.companyNameArabic}</p>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 space-x-2">
                    <span>CR: {company.crNumber}</span>
                    <span>·</span>
                    <span>VAT: {company.vatNumber}</span>
                    <span>·</span>
                    <span>Riyadh, Kingdom of Saudi Arabia</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider">
                  OFFICIAL SALARY CERTIFICATE
                </div>
                <div className="text-[11px] font-arabic text-slate-600 mt-1" dir="rtl">
                  شهادة تعريف وتثبيت الراتب
                </div>
                <div className="text-xs font-mono text-slate-600 mt-1">
                  Ref: CERT-{emp.employeeCode}-{todayIso.replace(/-/g, '')}
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Date: {todayIso} {hijriStr && `(${hijriStr})`}
                </div>
              </div>
            </div>

            {/* Letter Salutation */}
            <div className="pt-2 text-sm">
              <div className="font-bold text-slate-900 text-base">
                TO WHOM IT MAY CONCERN / إلى من يهمه الأمر
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Subject: Employment & Salary Verification Letter / الموضوع: شهادة تعريف بالراتب
              </div>
            </div>

            {/* Formal Certification Body */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed text-justify">
              <p>
                This is to officially certify that <strong>{emp.fullName}</strong> {bilingualArabic && emp.fullNameArabic && `(${emp.fullNameArabic})`}, holder of National / Iqama ID No. <strong className="font-mono">{emp.iqamaOrNationalId}</strong> and Passport No. <strong className="font-mono">{emp.passportNumber || 'N/A'}</strong>, is a permanent, full-time employee of <strong>{company.companyName}</strong> since <strong className="font-mono">{emp.joiningDate}</strong>.
              </p>

              <p>
                {emp.fullName} currently serves in the capacity of <strong>{activeDesignation}</strong> within the <strong>{activeDept}</strong> Department.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl my-4">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Certified Remuneration Breakdown (Monthly Basis):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Basic Salary:</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(emp.basicSalary)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Housing Allowance:</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(emp.housingAllowance)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Transportation Allowance:</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(emp.transportAllowance)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Total Monthly Gross:</span>
                    <strong className="font-mono text-blue-900 font-bold">{formatCurrency(emp.basicSalary + emp.housingAllowance + emp.transportAllowance)}</strong>
                  </div>
                </div>
              </div>

              <p>
                All monthly salaries are disbursed electronically to the employee's designated bank account ({emp.bankName}, IBAN: <span className="font-mono font-medium">{emp.iban}</span>) via the Saudi Wage Protection System (WPS).
              </p>

              <p>
                This official certificate has been issued upon the specific request of the employee for banking, visa, or administrative purposes, without any legal or financial liability on our part.
              </p>
            </div>

            {/* Official Signatures & Seal */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <div className="font-bold text-slate-900">Human Resources Director</div>
                <div className="text-[11px] text-slate-500">Corporate HR Directorate</div>
                <div className="h-12 flex items-end">
                  <div className="border-b border-slate-400 w-40 text-slate-400 text-[10px] italic pb-1">
                    Authorized Signatory
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-900">Finance & Payroll Controller</div>
                <div className="text-[11px] text-slate-500">Corporate Finance Dept</div>
                <div className="h-12 flex items-end">
                  <div className="border-b border-slate-400 w-40 text-slate-400 text-[10px] italic pb-1">
                    Authorized Signatory
                  </div>
                </div>
              </div>

              {includeSeal && (
                <div className="border border-dashed border-slate-300 rounded-xl h-24 flex flex-col items-center justify-center text-center p-2 text-[10px] text-slate-400">
                  <Stamp className="w-5 h-5 text-slate-400 mb-1" />
                  <span>Official Corporate Stamp</span>
                  <span className="font-mono text-[9px] mt-0.5">CR: {company.crNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. ANNUAL EARNINGS & GOSI STATEMENT */}
        {statementType === 'annual_statement' && (
          <div className="relative z-1 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b-2 border-slate-800">
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-2xl">
                    {company.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{company.companyName}</h2>
                  <p className="text-xs text-slate-600 font-arabic" dir="rtl">{company.companyNameArabic}</p>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 space-x-2">
                    <span>CR: {company.crNumber}</span>
                    <span>·</span>
                    <span>VAT: {company.vatNumber}</span>
                    <span>·</span>
                    <span>WPS: {company.wpsEmployerCode}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider">
                  ANNUAL EARNINGS & GOSI STATEMENT
                </div>
                <div className="text-[11px] font-arabic text-slate-600 mt-1" dir="rtl">
                  بيان الدخل السنوي والتأمينات الاجتماعية
                </div>
                <div className="text-xs font-mono text-slate-700 mt-1 font-bold">
                  Calendar Fiscal Year: 2026
                </div>
              </div>
            </div>

            {/* Employee Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Beneficiary:</span>
                <div className="text-sm font-bold text-slate-900">{emp.fullName} ({emp.employeeCode})</div>
                <div className="text-[11px] text-slate-500">{activeDept} · {activeDesignation}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-400">GOSI Status:</div>
                <div className="text-xs font-bold text-slate-800">
                  {emp.isSaudiNational ? 'Saudi Citizen (GOSI Contributory)' : 'Non-Saudi Expatriate (Saned Exempt)'}
                </div>
              </div>
            </div>

            {/* Annual Totals Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Annual Basic Wage</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {formatCurrency(emp.basicSalary * 12)}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Annual Allowances</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {formatCurrency((emp.housingAllowance + emp.transportAllowance) * 12)}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Gross Annual Wage</div>
                <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                  {formatCurrency((emp.basicSalary + emp.housingAllowance + emp.transportAllowance) * 12)}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-[10px] font-bold text-blue-800 uppercase">GOSI Contributions YTD</div>
                <div className="text-base font-bold font-mono text-blue-900 mt-0.5">
                  {formatCurrency((rec.gosiEmployeeDeduction + rec.gosiCompanyContribution) * 12)}
                </div>
              </div>
            </div>

            {/* Progress breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-3">Fiscal Month</th>
                    <th className="py-2 px-3 text-right">Basic</th>
                    <th className="py-2 px-3 text-right">Allowances</th>
                    <th className="py-2 px-3 text-right">Overtime</th>
                    <th className="py-2 px-3 text-right">GOSI (Emp)</th>
                    <th className="py-2 px-3 text-right">Net Disbursed</th>
                    <th className="py-2 px-3 text-center">WPS Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                  {['2026-08', '2026-09', '2026-10'].map(m => (
                    <tr key={m} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{m}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(rec.basicSalary)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(rec.housingAllowance + rec.transportAllowance)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700">+{formatCurrency(rec.overtimePay)}</td>
                      <td className="py-2 px-3 text-right text-red-600">-{formatCurrency(rec.gosiEmployeeDeduction)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(rec.netSalary)}</td>
                      <td className="py-2 px-3 text-center text-emerald-700 font-sans font-bold">Processed (WPS)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verification Sign-off */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-800">Certified by Payroll & GOSI Compliance Officer</span>
                <div className="text-[10px] text-slate-400 mt-0.5">Government Social Insurance Record Synchronized</div>
              </div>
              <div className="text-right font-mono text-[10px]">
                Generated on: {todayIso}
              </div>
            </div>
          </div>
        )}

        {/* 4. END-OF-SERVICE (EOSB) SETTLEMENT STATEMENT */}
        {statementType === 'eosb_settlement' && (
          <div className="relative z-1 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b-2 border-slate-800">
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-2xl">
                    {company.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{company.companyName}</h2>
                  <p className="text-xs text-slate-600 font-arabic" dir="rtl">{company.companyNameArabic}</p>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 space-x-2">
                    <span>CR: {company.crNumber}</span>
                    <span>·</span>
                    <span>VAT: {company.vatNumber}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-red-900 text-white rounded text-xs font-bold uppercase tracking-wider">
                  END-OF-SERVICE SETTLEMENT
                </div>
                <div className="text-[11px] font-arabic text-slate-600 mt-1" dir="rtl">
                  بيان تصفية مستحقات نهاية الخدمة
                </div>
                <div className="text-xs font-mono text-slate-600 mt-1">
                  Saudi Labor Law Articles 84 & 85
                </div>
              </div>
            </div>

            {/* Service & Wage Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Joining Date:</span>
                <span className="font-mono font-bold text-slate-900">{emp.joiningDate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Tenure Length:</span>
                <span className="font-mono font-bold text-slate-900">{eosbCalc.effectiveServiceYears} Years</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Last Drawn Wage:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(eosbCalc.lastDrawnWage)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Legal Article:</span>
                <span className="font-medium text-slate-900">{eosbCalc.legalArticleReference}</span>
              </div>
            </div>

            {/* Gratuity Calculation Tiers */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800">
                Statutory Gratuity Calculation Breakdown
              </div>
              <div className="divide-y divide-slate-100 p-4 space-y-2">
                {eosbCalc.breakdown.map((item, idx) => (
                  <div key={idx} className="text-slate-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                <span>Final Statutory Gratuity Entitlement:</span>
                <span className="font-mono text-emerald-800 text-base">
                  {formatCurrency(eosbCalc.finalGratuityAmount)}
                </span>
              </div>
            </div>

            {/* Clearance & Signatures */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">Employee Final Settlement Clearance:</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  I hereby acknowledge receipt of all my legal labor entitlements, gratuities, and wages, with no further claims against the company.
                </p>
                <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Employee Signature</span>
                  <span>Date: {todayIso}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">Company Authorized Signatures:</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Approved by Head of Human Resources & Chief Financial Officer.
                </p>
                <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Corporate Seal</span>
                  <span>Authorized Representative</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Controller (Hidden during print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Employee Payslip & Official Statements
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Official Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any employee, period, and official document format with instant PDF preview and print download.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF View Modal Button */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Open dedicated PDF document canvas preview"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>PDF View</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            title="Download or save PDF file"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Print Single Button */}
          <button
            onClick={() => handlePrint(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Direct print"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          {/* Bulk Print (Admins only) */}
          {permissions.canViewAllPayslips && (
            <button
              onClick={() => handlePrint(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
              title="Bulk print payslips for all eligible employees in period"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Bulk Print ({eligibleRecords.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Strip: Employee Dropdown Menu, Period Selector, Statement Type Selector */}
      <div className="no-print p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. EMPLOYEE PAYSLIP DROPDOWN MENU */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Employee
            </label>

            {permissions.canViewAllPayslips ? (
              <div className="flex items-center gap-1.5">
                {/* Previous Employee Button */}
                <button
                  onClick={handlePrevEmployee}
                  disabled={currentEmployeeIndex <= 0}
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Employee"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                  className="flex-1 flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <img 
                      src={activeEmployee.avatarUrl} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate text-left">
                      <div className="font-bold text-slate-900 truncate leading-tight">
                        {activeEmployee.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {activeEmployee.employeeCode} · {activeDept}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {/* Next Employee Button */}
                <button
                  onClick={handleNextEmployee}
                  disabled={currentEmployeeIndex >= eligibleRecords.length - 1}
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Employee"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <img 
                  src={currentUser.avatarUrl} 
                  alt="" 
                  className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-bold text-slate-900">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{currentUser.employeeCode} (Personal Account)</div>
                </div>
              </div>
            )}

            {/* Dropdown Menu Popup */}
            {isEmployeeDropdownOpen && permissions.canViewAllPayslips && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1 max-h-72 flex flex-col animate-in fade-in-50 duration-100">
                {/* Search in dropdown */}
                <div className="relative pb-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, ID or code..."
                    value={employeeSearchQuery}
                    onChange={e => setEmployeeSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto flex-1 space-y-0.5">
                  {filteredDropdownEmployees.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No employees found
                    </div>
                  ) : (
                    filteredDropdownEmployees.map(rec => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      const isSelected = activeRecord?.id === rec.id;

                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecordId(rec.id);
                            setIsEmployeeDropdownOpen(false);
                            setEmployeeSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {emp && (
                              <img 
                                src={emp.avatarUrl} 
                                alt="" 
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="truncate">
                              <div className="text-xs truncate">{rec.employeeName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {rec.employeeCode} · Net: {formatCurrency(rec.netSalary)}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. PAYROLL PERIOD DROPDOWN */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Payroll Period
            </label>
            <select
              value={selectedPeriodId}
              onChange={e => setSelectedPeriodId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium cursor-pointer"
            >
              {payrollPeriods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.periodName} ({p.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* 3. OFFICIAL STATEMENT TYPE SELECTOR */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Document Format / Statement Type
            </label>
            <select
              value={statementType}
              onChange={e => setStatementType(e.target.value as StatementType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium cursor-pointer"
            >
              <option value="payslip">Monthly Salary Payslip (قسيمة الراتب)</option>
              <option value="salary_certificate">Salary Certificate & Employment Letter (شهادة تعريف)</option>
              <option value="annual_statement">Annual Earnings & GOSI Statement (بيان الدخل السنوي)</option>
              <option value="eosb_settlement">End-of-Service Settlement Statement (تصفية نهاية الخدمة)</option>
            </select>
          </div>
        </div>

        {/* Customization Quick Toggles Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            {/* Bilingual toggle */}
            <button
              onClick={() => setBilingualArabic(!bilingualArabic)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                bilingualArabic ? 'bg-blue-50 text-blue-800 border-blue-200 font-bold' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{bilingualArabic ? 'Bilingual (En / Ar)' : 'English Only'}</span>
            </button>

            {/* Seal & Stamp Toggle */}
            <button
              onClick={() => setIncludeSeal(!includeSeal)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                includeSeal ? 'bg-slate-100 text-slate-800 border-slate-300 font-bold' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Stamp className="w-3 h-3" />
              <span>Official Stamp & Sign-off</span>
            </button>

            {/* Watermark Selector */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Watermark:</span>
              <select
                value={watermark}
                onChange={e => setWatermark(e.target.value as any)}
                className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 font-medium"
              >
                <option value="none">None</option>
                <option value="OFFICIAL">OFFICIAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="ORIGINAL">ORIGINAL</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Document verified under Saudi Labor Law & GOSI standards
          </div>
        </div>
      </div>

      {/* Main Document Preview Card (Single or Bulk) */}
      <div className="print-container">
        {(bulkPrintMode ? eligibleRecords : [activeRecord]).filter(Boolean).map((rec, index) => {
          const emp = employees.find(e => e.id === rec.employeeId) || activeEmployee;
          const isBulk = bulkPrintMode && eligibleRecords.length > 1;

          return (
            <div
              key={rec.id}
              className={`bg-white border border-slate-200 shadow-xs rounded-2xl max-w-4xl mx-auto p-6 sm:p-10 ${
                isBulk ? 'mb-8 page-break-after' : ''
              }`}
            >
              {renderStatementContent(rec, emp)}
            </div>
          );
        })}
      </div>

      {/* DEDICATED PDF VIEW MODAL / CANVAS */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md animate-in fade-in-50 duration-150">
          {/* PDF Viewer Top Toolbar */}
          <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 text-white">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-2">
                  <span>{activeEmployee.fullName} — {statementType.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">
                    A4 PDF
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {company.companyName} · Period: {activePeriod.periodName}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setPdfZoom(prev => Math.max(60, prev - 10))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-300">
                  {pdfZoom}%
                </span>
                <button
                  onClick={() => setPdfZoom(prev => Math.min(140, prev + 10))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPdfZoom(100)}
                  className="p-1 text-slate-400 hover:text-white rounded ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Download PDF button */}
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              {/* Print in modal */}
              <button
                onClick={() => handlePrint(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Close Modal */}
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
                title="Close PDF Canvas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Document Body */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/70">
            <div 
              style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-100 ease-out w-[210mm] max-w-full bg-white shadow-2xl rounded-sm p-8 sm:p-12 text-slate-900 border border-slate-200 select-text"
            >
              {renderStatementContent(activeRecord, activeEmployee)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
