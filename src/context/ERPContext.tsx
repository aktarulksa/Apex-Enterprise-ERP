import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
  UserRole,
  RolePermission,
  PrintTemplateConfig,
  AttendanceLedgerEntry,
  AttendanceAuditLog,
  AttendanceStatus
} from '../types/erp';
import { 
  erpStorage, 
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_EMPLOYEES
} from '../services/storage';
import { calculateEmployeePayrollRecord } from '../services/payrollCalculator';
import { 
  attendanceLedgerRepo, 
  isSaudiWeekend, 
  getDaysInMonth 
} from '../services/attendanceLedgerService';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ERPContextType {
  // State
  company: CorporateIdentity;
  departments: Department[];
  projects: Project[];
  designations: Designation[];
  employees: Employee[];
  salaryStructures: SalaryStructure[];
  salaryAdjustments: SalaryAdjustment[];
  timesheets: TimesheetEntry[];
  attendanceLedger: AttendanceLedgerEntry[];
  attendanceAuditLogs: AttendanceAuditLog[];
  selectedAttendanceMonth: string;
  setSelectedAttendanceMonth: (m: string) => void;
  leaves: LeaveRequest[];
  loans: LoanAdvance[];
  payrollPeriods: PayrollPeriod[];
  accountingCategories: AccountingCategory[];
  expenses: ExpenseClaim[];
  assetCategories: AssetCategory[];
  assets: ITAsset[];
  printConfig: PrintTemplateConfig;
  
  // Navigation & Auth
  currentUserId: string;
  currentUser: Employee;
  userRole: UserRole;
  permissions: RolePermission;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  switchUserPersona: (employeeId: string) => void;
  
  // Feedback
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  
  // Formatting
  formatCurrency: (amount: number) => string;
  
  // Actions
  updateCompany: (data: Partial<CorporateIdentity>) => void;
  
  // Timesheets
  addTimesheet: (entry: Omit<TimesheetEntry, 'id'>) => void;
  updateTimesheet: (id: string, entry: Partial<TimesheetEntry>) => void;
  deleteTimesheet: (id: string) => void;
  submitTimesheet: (id: string) => void;
  approveTimesheet: (id: string, supervisorRemarks?: string) => void;
  rejectTimesheet: (id: string, reason: string) => void;
  bulkApproveTimesheets: (ids: string[]) => void;
  
  // Attendance & Time Ledger Matrix
  updateAttendanceCell: (employeeId: string, date: string, updates: Partial<AttendanceLedgerEntry>, reason?: string) => void;
  bulkFillMonthWorkdays: (month: string, employeeId?: string) => void;
  clearMonthAttendance: (month: string) => void;
  
  // Salary
  updateSalaryStructure: (employeeId: string, data: Partial<SalaryStructure>) => void;
  addSalaryAdjustment: (adj: Omit<SalaryAdjustment, 'id' | 'createdAt'>) => void;
  
  // Payroll
  generatePayrollForPeriod: (period: string, periodName?: string) => PayrollPeriod;
  approvePayrollPeriod: (periodId: string) => void;
  finalizePayrollPeriod: (periodId: string) => void;
  recordPayrollPayment: (periodId: string, method: 'wps_bank_transfer' | 'bank_transfer' | 'cash' | 'cheque', reference: string) => void;
  reversePayrollPeriod: (periodId: string, reason: string) => void;
  
  // Leave & Loans
  addLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'status'>) => void;
  approveLeaveRequest: (id: string) => void;
  rejectLeaveRequest: (id: string) => void;
  addLoanRequest: (loan: Omit<LoanAdvance, 'id' | 'status' | 'totalPaid' | 'balanceRemaining'>) => void;
  approveLoanRequest: (id: string) => void;
  
  // Employee, Dept, Project, Designation
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  deleteDepartment: (id: string) => void;
  addProject: (prj: Omit<Project, 'id'>) => void;
  deleteProject: (id: string) => void;
  addDesignation: (des: Omit<Designation, 'id'>) => void;
  deleteDesignation: (id: string) => void;
  
  // Expenses & Categories
  addExpenseClaim: (claim: Omit<ExpenseClaim, 'id' | 'status'>) => void;
  approveExpenseClaim: (id: string) => void;
  rejectExpenseClaim: (id: string) => void;
  addAccountingCategory: (cat: Omit<AccountingCategory, 'id'>) => void;
  
  // Assets
  addAsset: (asset: Omit<ITAsset, 'id'>) => void;
  updateAsset: (id: string, asset: Partial<ITAsset>) => void;
  addAssetCategory: (cat: Omit<AssetCategory, 'id'>) => void;
  
  // Templates
  updatePrintConfig: (cfg: Partial<PrintTemplateConfig>) => void;
  
  // System reset
  resetAllData: () => void;
}

const ERPContext = createContext<ERPContextType | null>(null);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [company, setCompanyState] = useState<CorporateIdentity>(() => erpStorage.getCompany());
  const [departments, setDepartmentsState] = useState<Department[]>(() => erpStorage.getDepartments());
  const [projects, setProjectsState] = useState<Project[]>(() => erpStorage.getProjects());
  const [designations, setDesignationsState] = useState<Designation[]>(() => erpStorage.getDesignations());
  const [employees, setEmployeesState] = useState<Employee[]>(() => erpStorage.getEmployees());
  const [salaryStructures, setSalaryStructuresState] = useState<SalaryStructure[]>(() => erpStorage.getSalaryStructures());
  const [salaryAdjustments, setSalaryAdjustmentsState] = useState<SalaryAdjustment[]>(() => erpStorage.getSalaryAdjustments());
  const [timesheets, setTimesheetsState] = useState<TimesheetEntry[]>(() => erpStorage.getTimesheets());
  const [attendanceLedger, setAttendanceLedgerState] = useState<AttendanceLedgerEntry[]>(() => attendanceLedgerRepo.getLedger(2026, 10, DEFAULT_EMPLOYEES));
  const [attendanceAuditLogs, setAttendanceAuditLogsState] = useState<AttendanceAuditLog[]>(() => attendanceLedgerRepo.getAuditLogs());
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState<string>('2026-10');
  const [leaves, setLeavesState] = useState<LeaveRequest[]>(() => erpStorage.getLeaves());
  const [loans, setLoansState] = useState<LoanAdvance[]>(() => erpStorage.getLoans());
  const [payrollPeriods, setPayrollPeriodsState] = useState<PayrollPeriod[]>(() => erpStorage.getPayrollPeriods());
  const [accountingCategories, setAccountingCategoriesState] = useState<AccountingCategory[]>(() => erpStorage.getAccountingCategories());
  const [expenses, setExpensesState] = useState<ExpenseClaim[]>(() => erpStorage.getExpenses());
  const [assetCategories, setAssetCategoriesState] = useState<AssetCategory[]>(() => erpStorage.getAssetCategories());
  const [assets, setAssetsState] = useState<ITAsset[]>(() => erpStorage.getAssets());
  const [printConfig, setPrintConfigState] = useState<PrintTemplateConfig>(() => erpStorage.getPrintConfig());
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => erpStorage.getCurrentUserId());
  
  const [activeTab, setActiveTab] = useState<string>('attendance_ledger');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Sync to local storage on changes
  useEffect(() => { erpStorage.setCompany(company); }, [company]);
  useEffect(() => { erpStorage.setDepartments(departments); }, [departments]);
  useEffect(() => { erpStorage.setProjects(projects); }, [projects]);
  useEffect(() => { erpStorage.setDesignations(designations); }, [designations]);
  useEffect(() => { erpStorage.setEmployees(employees); }, [employees]);
  useEffect(() => { erpStorage.setSalaryStructures(salaryStructures); }, [salaryStructures]);
  useEffect(() => { erpStorage.setSalaryAdjustments(salaryAdjustments); }, [salaryAdjustments]);
  useEffect(() => { erpStorage.setTimesheets(timesheets); }, [timesheets]);
  useEffect(() => { erpStorage.setLeaves(leaves); }, [leaves]);
  useEffect(() => { erpStorage.setLoans(loans); }, [loans]);
  useEffect(() => { erpStorage.setPayrollPeriods(payrollPeriods); }, [payrollPeriods]);
  useEffect(() => { erpStorage.setAccountingCategories(accountingCategories); }, [accountingCategories]);
  useEffect(() => { erpStorage.setExpenses(expenses); }, [expenses]);
  useEffect(() => { erpStorage.setAssetCategories(assetCategories); }, [assetCategories]);
  useEffect(() => { erpStorage.setAssets(assets); }, [assets]);
  useEffect(() => { erpStorage.setPrintConfig(printConfig); }, [printConfig]);
  useEffect(() => { erpStorage.setCurrentUserId(currentUserId); }, [currentUserId]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  };

  const hideToast = () => setToast(null);

  const currentUser = useMemo(() => {
    return employees.find(e => e.id === currentUserId) || employees[0];
  }, [employees, currentUserId]);

  const userRole = currentUser?.role || 'super_admin';
  const permissions = DEFAULT_ROLE_PERMISSIONS[userRole] || DEFAULT_ROLE_PERMISSIONS.employee;

  const switchUserPersona = (employeeId: string) => {
    const found = employees.find(e => e.id === employeeId);
    if (found) {
      setCurrentUserIdState(found.id);
      showToast(`Switched operational persona to ${found.fullName} (${found.role.replace('_', ' ').toUpperCase()})`, 'info');
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const prefix = amount < 0 ? '-' : '';
    return `${prefix}${company.currencySymbol} ${formatted}`;
  };

  const updateCompany = (data: Partial<CorporateIdentity>) => {
    setCompanyState(prev => ({ ...prev, ...data }));
    showToast('Organization settings & Operating Currency synchronized globally.', 'success');
  };

  // Timesheets CRUD & Workflow
  const addTimesheet = (entry: Omit<TimesheetEntry, 'id'>) => {
    // Duplicate check: employee cannot have two timesheets for the exact same date
    const duplicate = timesheets.some(t => t.employeeId === entry.employeeId && t.workDate === entry.workDate);
    if (duplicate) {
      showToast(`Timesheet already exists for this employee on ${entry.workDate}. Please edit the existing record.`, 'error');
      return;
    }

    const newId = `TS-${Date.now().toString().slice(-6)}`;
    const newEntry: TimesheetEntry = {
      ...entry,
      id: newId,
      status: entry.status || 'draft'
    };
    setTimesheetsState(prev => [newEntry, ...prev]);
    showToast('Timesheet record created successfully.', 'success');
  };

  const updateTimesheet = (id: string, entry: Partial<TimesheetEntry>) => {
    const target = timesheets.find(t => t.id === id);
    if (target?.isLocked && !permissions.canManageSettings && userRole !== 'super_admin') {
      showToast('Approved timesheets are locked against unauthorized employee edits.', 'error');
      return;
    }
    setTimesheetsState(prev => prev.map(t => (t.id === id ? { ...t, ...entry } : t)));
    showToast('Timesheet updated successfully.', 'success');
  };

  const deleteTimesheet = (id: string) => {
    const target = timesheets.find(t => t.id === id);
    if (target?.isLocked && userRole !== 'super_admin') {
      showToast('Cannot delete an approved/locked timesheet record.', 'error');
      return;
    }
    setTimesheetsState(prev => prev.filter(t => t.id !== id));
    showToast('Timesheet deleted.', 'info');
  };

  const submitTimesheet = (id: string) => {
    setTimesheetsState(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'submitted', submittedBy: currentUser.fullName };
      }
      return t;
    }));
    showToast('Timesheet submitted for supervisor review and approval.', 'success');
  };

  const approveTimesheet = (id: string, supervisorRemarks?: string) => {
    if (!permissions.canApproveTimesheets) {
      showToast('You do not possess supervisor permissions to approve timesheets.', 'error');
      return;
    }
    setTimesheetsState(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'approved',
          approvedBy: `${currentUser.fullName} (${userRole})`,
          approvedAt: new Date().toISOString().slice(0, 10),
          supervisorRemarks: supervisorRemarks || t.supervisorRemarks,
          isLocked: true
        };
      }
      return t;
    }));
    showToast('Timesheet approved and locked. Overtime eligible for payroll.', 'success');
  };

  const rejectTimesheet = (id: string, reason: string) => {
    if (!permissions.canApproveTimesheets) {
      showToast('You do not possess supervisor permissions to reject timesheets.', 'error');
      return;
    }
    setTimesheetsState(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'rejected',
          supervisorRemarks: reason,
          isLocked: false
        };
      }
      return t;
    }));
    showToast('Timesheet rejected and returned for employee correction.', 'info');
  };

  const bulkApproveTimesheets = (ids: string[]) => {
    if (!permissions.canApproveTimesheets) {
      showToast('You do not possess supervisor permissions for bulk approval.', 'error');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setTimesheetsState(prev => prev.map(t => {
      if (ids.includes(t.id) && t.status === 'submitted') {
        return {
          ...t,
          status: 'approved',
          approvedBy: `${currentUser.fullName} (${userRole})`,
          approvedAt: today,
          isLocked: true
        };
      }
      return t;
    }));
    showToast(`Bulk approved ${ids.length} timesheets successfully.`, 'success');
  };

  // Attendance & Time Ledger Matrix Methods
  const updateAttendanceCell = (
    employeeId: string, 
    date: string, 
    updates: Partial<AttendanceLedgerEntry>, 
    reason?: string
  ) => {
    // Database-level security check: Admin, HR, or Supervisor with permissions
    if (userRole === 'employee' && !permissions.canManageSettings && !permissions.canApproveTimesheets) {
      showToast('Security policy: Attendance & Time Ledger entries are admin-only and locked against employee modification.', 'error');
      return;
    }

    const cellId = `LEDGER-${employeeId}-${date}`;
    const targetEmp = employees.find(e => e.id === employeeId);
    let prevSummary = 'Unrecorded';

    setAttendanceLedgerState(prev => {
      const existing = prev.find(e => e.id === cellId);
      if (existing) {
        prevSummary = `Status: ${existing.status}, Regular: ${existing.regularHours}h, OT: ${existing.overtimeHours}h`;
        const updated: AttendanceLedgerEntry = {
          ...existing,
          ...updates,
          updatedBy: `${currentUser.fullName} (${userRole})`,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        const newList = prev.map(e => e.id === cellId ? updated : e);
        attendanceLedgerRepo.saveLedgerEntries(newList);
        return newList;
      } else {
        const newEntry: AttendanceLedgerEntry = {
          id: cellId,
          employeeId,
          date,
          status: updates.status || 'present',
          regularHours: updates.regularHours ?? 8,
          overtimeHours: updates.overtimeHours ?? 0,
          notes: updates.notes,
          checkIn: updates.checkIn,
          checkOut: updates.checkOut,
          updatedBy: `${currentUser.fullName} (${userRole})`,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        const newList = [...prev, newEntry];
        attendanceLedgerRepo.saveLedgerEntries(newList);
        return newList;
      }
    });

    const newSummary = `Status: ${updates.status || 'present'}, Regular: ${updates.regularHours ?? 8}h, OT: ${updates.overtimeHours ?? 0}h${updates.notes ? ` (${updates.notes})` : ''}`;

    // Add immutable Audit Log entry
    const auditEntry: AttendanceAuditLog = {
      id: `AUD-ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      employeeId,
      employeeName: targetEmp?.fullName || employeeId,
      date,
      action: 'UPDATE',
      previousState: prevSummary,
      newState: newSummary,
      performedBy: currentUser.fullName,
      userRole,
      reason: reason || updates.notes || 'Administrative ledger update'
    };

    setAttendanceAuditLogsState(prev => {
      const newLogs = [auditEntry, ...prev];
      attendanceLedgerRepo.addAuditLog(auditEntry);
      return newLogs;
    });

    showToast(`Saved ledger entry for ${targetEmp?.fullName || employeeId} on ${date}.`, 'success');
  };

  const bulkFillMonthWorkdays = (month: string, employeeId?: string) => {
    if (userRole === 'employee' && !permissions.canManageSettings) {
      showToast('Admin authority required to perform bulk workday fill.', 'error');
      return;
    }

    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const m = Number(monthStr);
    const days = getDaysInMonth(year, m);

    const targetEmployees = employeeId ? employees.filter(e => e.id === employeeId) : employees;
    const entriesToUpdate: AttendanceLedgerEntry[] = [];

    targetEmployees.forEach(emp => {
      days.forEach(day => {
        entriesToUpdate.push({
          id: `LEDGER-${emp.id}-${day.dateStr}`,
          employeeId: emp.id,
          date: day.dateStr,
          status: day.isWeekend ? 'weekend' : 'present',
          regularHours: day.isWeekend ? 0 : 8,
          overtimeHours: 0,
          updatedBy: `${currentUser.fullName} (${userRole})`,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        });
      });
    });

    setAttendanceLedgerState(prev => {
      const map = new Map<string, AttendanceLedgerEntry>();
      prev.forEach(e => map.set(e.id, e));
      entriesToUpdate.forEach(e => map.set(e.id, e));
      const res = Array.from(map.values());
      attendanceLedgerRepo.saveLedgerEntries(res);
      return res;
    });

    const auditEntry: AttendanceAuditLog = {
      id: `AUD-ATT-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      employeeId: employeeId || 'ALL',
      employeeName: employeeId ? (employees.find(e => e.id === employeeId)?.fullName || employeeId) : 'All Organization Staff',
      date: `${month}-01`,
      action: 'BULK_FILL',
      newState: `Filled standard 8h workdays (Fri/Sat shaded weekend) for month ${month}`,
      performedBy: currentUser.fullName,
      userRole,
      reason: 'Batch attendance matrix baseline fill'
    };

    setAttendanceAuditLogsState(prev => {
      const newLogs = [auditEntry, ...prev];
      attendanceLedgerRepo.addAuditLog(auditEntry);
      return newLogs;
    });

    showToast(`Bulk filled standard schedule for ${targetEmployees.length} employee(s) in ${month}.`, 'success');
  };

  const clearMonthAttendance = (month: string) => {
    if (userRole !== 'super_admin' && userRole !== 'hr_manager') {
      showToast('Admin authorization required to clear attendance ledger.', 'error');
      return;
    }

    setAttendanceLedgerState(prev => {
      const remaining = prev.filter(e => !e.date.startsWith(month));
      attendanceLedgerRepo.saveLedgerEntries(remaining);
      return remaining;
    });

    showToast(`Cleared attendance ledger entries for ${month}.`, 'info');
  };

  // Salary Structures
  const updateSalaryStructure = (employeeId: string, data: Partial<SalaryStructure>) => {
    if (!permissions.canManageSalary) {
      showToast('Permission denied: You cannot alter salary structures.', 'error');
      return;
    }
    setSalaryStructuresState(prev => {
      const existing = prev.find(s => s.employeeId === employeeId);
      if (existing) {
        return prev.map(s => s.employeeId === employeeId ? {
          ...s,
          ...data,
          approvedBy: currentUser.fullName,
          approvedAt: new Date().toISOString().slice(0, 10)
        } : s);
      } else {
        const newSal: SalaryStructure = {
          id: `SAL-${employeeId}`,
          employeeId,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          basicSalary: data.basicSalary || 0,
          housingAllowance: data.housingAllowance || 0,
          transportAllowance: data.transportAllowance || 0,
          foodAllowance: data.foodAllowance || 0,
          otherAllowances: data.otherAllowances || 0,
          hourlyRate: data.hourlyRate || Math.round(((data.basicSalary || 0) / 240) * 100) / 100,
          overtimeMultiplier: data.overtimeMultiplier || 1.5,
          workingDaysPerMonth: 30,
          standardDailyHours: 8,
          currency: company.baseCurrency,
          status: 'active',
          approvedBy: currentUser.fullName,
          approvedAt: new Date().toISOString().slice(0, 10),
          deductionRulesSummary: 'Standard Saudi Labor Law'
        };
        return [...prev, newSal];
      }
    });

    // Also sync the employee's cached basic allowances
    setEmployeesState(prev => prev.map(e => {
      if (e.id === employeeId) {
        return {
          ...e,
          basicSalary: data.basicSalary ?? e.basicSalary,
          housingAllowance: data.housingAllowance ?? e.housingAllowance,
          transportAllowance: data.transportAllowance ?? e.transportAllowance,
          foodAllowance: data.foodAllowance ?? e.foodAllowance,
          otherFixedAllowance: data.otherAllowances ?? e.otherFixedAllowance
        };
      }
      return e;
    }));

    showToast('Employee salary structure updated successfully with audit timestamp.', 'success');
  };

  const addSalaryAdjustment = (adj: Omit<SalaryAdjustment, 'id' | 'createdAt'>) => {
    const newAdj: SalaryAdjustment = {
      ...adj,
      id: `ADJ-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setSalaryAdjustmentsState(prev => [newAdj, ...prev]);
    showToast(`Salary adjustment of ${adj.amount} ${company.baseCurrency} registered for period ${adj.period}.`, 'success');
  };

  // Payroll Lifecycle
  const generatePayrollForPeriod = (period: string, periodName?: string): PayrollPeriod => {
    // Check if payroll already exists for this period
    const existing = payrollPeriods.find(p => p.period === period);
    if (existing && (existing.status === 'finalized' || existing.status === 'paid')) {
      showToast(`Cannot regenerate payroll: Period ${period} is already finalized/paid.`, 'error');
      return existing;
    }

    const periodId = existing ? existing.id : `PR-${period}`;
    const pName = periodName || `${period} Monthly Payroll`;

    // Filter active employees
    const activeEmployees = employees.filter(e => e.status === 'active');
    
    // Calculate records
    const records: PayrollRecord[] = activeEmployees.map(emp => {
      const sal = salaryStructures.find(s => s.employeeId === emp.id) || {
        id: `SAL-${emp.id}`, employeeId: emp.id, effectiveFrom: emp.joiningDate,
        basicSalary: emp.basicSalary, housingAllowance: emp.housingAllowance,
        transportAllowance: emp.transportAllowance, foodAllowance: emp.foodAllowance,
        otherAllowances: emp.otherFixedAllowance, hourlyRate: Math.round((emp.basicSalary / 240) * 100) / 100,
        overtimeMultiplier: 1.5, workingDaysPerMonth: 30, standardDailyHours: 8, currency: company.baseCurrency,
        status: 'active', approvedBy: 'Auto', approvedAt: '', deductionRulesSummary: ''
      };

      return calculateEmployeePayrollRecord(
        emp, company, sal, timesheets, leaves, loans, salaryAdjustments, periodId, attendanceLedger
      );
    });

    const totalGross = Math.round(records.reduce((acc, r) => acc + r.grossEarnings, 0) * 100) / 100;
    const totalDeductions = Math.round(records.reduce((acc, r) => acc + r.totalDeductions, 0) * 100) / 100;
    const totalNet = Math.round(records.reduce((acc, r) => acc + r.netSalary, 0) * 100) / 100;
    const totalOvertimePay = Math.round(records.reduce((acc, r) => acc + r.overtimePay, 0) * 100) / 100;
    const totalGosiCompany = Math.round(records.reduce((acc, r) => acc + r.gosiCompanyContribution, 0) * 100) / 100;

    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;

    const newPeriod: PayrollPeriod = {
      id: periodId,
      period,
      periodName: pName,
      startDate,
      endDate,
      status: 'calculated',
      totalEmployees: activeEmployees.length,
      totalGross,
      totalDeductions,
      totalNet,
      totalOvertimePay,
      totalGosiCompany,
      records,
      preparedBy: `${currentUser.fullName} (${userRole})`,
      preparedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      auditLog: [
        ...(existing?.auditLog || []),
        {
          id: `AUD-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Payroll Calculated',
          userName: currentUser.fullName,
          userRole,
          details: `Generated payroll run for ${activeEmployees.length} employees with ${records.filter(r => r.approvedOvertimeHours > 0).length} overtime recipients.`
        }
      ]
    };

    setPayrollPeriodsState(prev => {
      const filtered = prev.filter(p => p.id !== periodId);
      return [newPeriod, ...filtered];
    });

    showToast(`Monthly payroll for ${period} generated and calculated with precision.`, 'success');
    return newPeriod;
  };

  const approvePayrollPeriod = (periodId: string) => {
    if (!permissions.canApprovePayroll) {
      showToast('Permission denied: Only HR Manager or Super Admin can approve payroll.', 'error');
      return;
    }
    setPayrollPeriodsState(prev => prev.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'approved',
          approvedBy: `${currentUser.fullName} (${userRole})`,
          approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          auditLog: [
            ...p.auditLog,
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              action: 'Payroll Approved',
              userName: currentUser.fullName,
              userRole,
              details: 'Approved for final audit and treasury disbursement.'
            }
          ]
        };
      }
      return p;
    }));
    showToast('Payroll period officially approved by HR/Executive.', 'success');
  };

  const finalizePayrollPeriod = (periodId: string) => {
    if (!permissions.canFinalizePayroll) {
      showToast('Permission denied: Only Super Admin or Finance Manager can finalize payroll.', 'error');
      return;
    }
    setPayrollPeriodsState(prev => prev.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'finalized',
          finalizedBy: `${currentUser.fullName} (${userRole})`,
          finalizedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          records: p.records.map(r => ({ ...r, status: 'finalized' })),
          auditLog: [
            ...p.auditLog,
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              action: 'Payroll Finalized & Locked',
              userName: currentUser.fullName,
              userRole,
              details: 'Finalized. Records are immutable and ready for WPS bank execution.'
            }
          ]
        };
      }
      return p;
    }));
    showToast('Payroll finalized and locked. Ready for bank disbursement.', 'success');
  };

  const recordPayrollPayment = (
    periodId: string, 
    method: 'wps_bank_transfer' | 'bank_transfer' | 'cash' | 'cheque', 
    reference: string
  ) => {
    if (!permissions.canRecordPayment) {
      showToast('Permission denied: Only Finance Manager or Super Admin can disburse payments.', 'error');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    setPayrollPeriodsState(prev => prev.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'paid',
          paymentDate: today,
          paymentMethod: method,
          paymentReference: reference,
          paidBy: `${currentUser.fullName} (${userRole})`,
          paidAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          records: p.records.map(r => ({ ...r, status: 'paid', paymentStatus: 'paid' })),
          auditLog: [
            ...p.auditLog,
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              action: 'Disbursement Recorded',
              userName: currentUser.fullName,
              userRole,
              details: `Disbursed via ${method.toUpperCase()} with reference: ${reference}.`
            }
          ]
        };
      }
      return p;
    }));

    // Deduct loan installments in the active loans register!
    const targetPeriod = payrollPeriods.find(p => p.id === periodId);
    if (targetPeriod) {
      setLoansState(prevLoans => prevLoans.map(loan => {
        const empRecord = targetPeriod.records.find(r => r.employeeId === loan.employeeId);
        if (empRecord && empRecord.loanInstallmentDeduction > 0 && loan.balanceRemaining > 0) {
          const newPaid = loan.totalPaid + empRecord.loanInstallmentDeduction;
          const newBal = Math.max(0, loan.principalAmount - newPaid);
          return {
            ...loan,
            totalPaid: newPaid,
            balanceRemaining: newBal,
            status: newBal === 0 ? 'repaid' : 'active'
          };
        }
        return loan;
      }));
    }

    showToast(`Payment recorded under ref ${reference}. Employee payslips marked Paid.`, 'success');
  };

  const reversePayrollPeriod = (periodId: string, reason: string) => {
    if (userRole !== 'super_admin') {
      showToast('Permission denied: Only Super Admin can authorize a payroll reversal.', 'error');
      return;
    }
    setPayrollPeriodsState(prev => prev.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'draft',
          records: p.records.map(r => ({ ...r, status: 'calculated', paymentStatus: 'unpaid' })),
          auditLog: [
            ...p.auditLog,
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              action: 'Payroll Reversal Authorized',
              userName: currentUser.fullName,
              userRole,
              details: `Reversed to draft state with reason: ${reason}`
            }
          ]
        };
      }
      return p;
    }));
    showToast('Payroll period unlocked and returned to draft for corrections.', 'info');
  };

  // Leave & Loans
  const addLeaveRequest = (leave: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: `LV-${Date.now().toString().slice(-6)}`,
      status: 'pending'
    };
    setLeavesState(prev => [newLeave, ...prev]);
    showToast('Leave request submitted successfully.', 'success');
  };

  const approveLeaveRequest = (id: string) => {
    if (!permissions.canApproveLeave) {
      showToast('Permission denied: Cannot approve leave.', 'error');
      return;
    }
    setLeavesState(prev => prev.map(l => (l.id === id ? {
      ...l,
      status: 'approved',
      approvedBy: currentUser.fullName,
      approvedAt: new Date().toISOString().slice(0, 10)
    } : l)));
    showToast('Leave request approved.', 'success');
  };

  const rejectLeaveRequest = (id: string) => {
    if (!permissions.canApproveLeave) {
      showToast('Permission denied.', 'error');
      return;
    }
    setLeavesState(prev => prev.map(l => (l.id === id ? { ...l, status: 'rejected' } : l)));
    showToast('Leave request rejected.', 'info');
  };

  const addLoanRequest = (loan: Omit<LoanAdvance, 'id' | 'status' | 'totalPaid' | 'balanceRemaining'>) => {
    const newLoan: LoanAdvance = {
      ...loan,
      id: `LN-${Date.now().toString().slice(-6)}`,
      totalPaid: 0,
      balanceRemaining: loan.principalAmount,
      status: 'pending'
    };
    setLoansState(prev => [newLoan, ...prev]);
    showToast('Loan advance request submitted for executive approval.', 'success');
  };

  const approveLoanRequest = (id: string) => {
    if (!permissions.canApproveLoans) {
      showToast('Permission denied: Only Finance or Super Admin can approve loans.', 'error');
      return;
    }
    setLoansState(prev => prev.map(l => (l.id === id ? {
      ...l,
      status: 'active',
      approvedBy: currentUser.fullName,
      approvedAt: new Date().toISOString().slice(0, 10)
    } : l)));
    showToast('Loan advance approved and scheduled into payroll deductions.', 'success');
  };

  // Employees, Depts, Projects, Designations
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    if (!permissions.canManageEmployees) {
      showToast('Permission denied: Only HR or Super Admin can onboard employees.', 'error');
      return;
    }
    const newId = `EMP-${1000 + employees.length + 1}`;
    const newEmp: Employee = { ...emp, id: newId, employeeCode: newId };
    setEmployeesState(prev => [...prev, newEmp]);

    // Also auto-create a matching salary structure
    const hourlyRate = Math.round((newEmp.basicSalary / 240) * 100) / 100;
    const newSal: SalaryStructure = {
      id: `SAL-${newId}`,
      employeeId: newId,
      effectiveFrom: newEmp.joiningDate,
      basicSalary: newEmp.basicSalary,
      housingAllowance: newEmp.housingAllowance,
      transportAllowance: newEmp.transportAllowance,
      foodAllowance: newEmp.foodAllowance,
      otherAllowances: newEmp.otherFixedAllowance,
      hourlyRate,
      overtimeMultiplier: 1.5,
      workingDaysPerMonth: 30,
      standardDailyHours: 8,
      currency: company.baseCurrency,
      status: 'active',
      approvedBy: currentUser.fullName,
      approvedAt: new Date().toISOString().slice(0, 10),
      deductionRulesSummary: newEmp.isSaudiNational ? 'GOSI 9.75% + 11.75%' : 'GOSI 2% Employer'
    };
    setSalaryStructuresState(prev => [...prev, newSal]);
    showToast(`Employee ${newEmp.fullName} onboarded with salary structure.`, 'success');
  };

  const updateEmployee = (id: string, emp: Partial<Employee>) => {
    if (!permissions.canManageEmployees) {
      showToast('Permission denied.', 'error');
      return;
    }
    setEmployeesState(prev => prev.map(e => (e.id === id ? { ...e, ...emp } : e)));
    showToast('Employee profile updated.', 'success');
  };

  const deleteEmployee = (id: string) => {
    if (userRole !== 'super_admin') {
      showToast('Only Super Administrator can terminate or remove employee profiles.', 'error');
      return;
    }
    setEmployeesState(prev => prev.map(e => e.id === id ? { ...e, status: 'terminated' } : e));
    showToast('Employee status set to Terminated.', 'info');
  };

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const id = `DEP-${dept.code.toUpperCase()}`;
    setDepartmentsState(prev => [...prev, { ...dept, id }]);
    showToast(`Department ${dept.name} added.`, 'success');
  };

  const deleteDepartment = (id: string) => {
    setDepartmentsState(prev => prev.filter(d => d.id !== id));
    showToast('Department removed.', 'info');
  };

  const addProject = (prj: Omit<Project, 'id'>) => {
    const id = `PRJ-${prj.code.toUpperCase()}`;
    setProjectsState(prev => [...prev, { ...prj, id }]);
    showToast(`Project ${prj.name} created.`, 'success');
  };

  const deleteProject = (id: string) => {
    setProjectsState(prev => prev.filter(p => p.id !== id));
    showToast('Project removed.', 'info');
  };

  const addDesignation = (des: Omit<Designation, 'id'>) => {
    const id = `DES-${Date.now().toString().slice(-4)}`;
    setDesignationsState(prev => [...prev, { ...des, id }]);
    showToast(`Designation ${des.title} created.`, 'success');
  };

  const deleteDesignation = (id: string) => {
    setDesignationsState(prev => prev.filter(d => d.id !== id));
    showToast('Designation removed.', 'info');
  };

  // Expenses & Accounting
  const addExpenseClaim = (claim: Omit<ExpenseClaim, 'id' | 'status'>) => {
    const newClaim: ExpenseClaim = {
      ...claim,
      id: `EXP-${Date.now().toString().slice(-5)}`,
      status: 'pending'
    };
    setExpensesState(prev => [newClaim, ...prev]);
    showToast('Expense claim submitted for finance review.', 'success');
  };

  const approveExpenseClaim = (id: string) => {
    if (!permissions.canApproveExpenses) {
      showToast('Permission denied: Only Finance Manager or Admin can approve expenses.', 'error');
      return;
    }
    setExpensesState(prev => prev.map(e => (e.id === id ? {
      ...e,
      status: 'approved',
      approvedBy: currentUser.fullName,
      approvedAt: new Date().toISOString().slice(0, 10)
    } : e)));
    showToast('Expense claim approved.', 'success');
  };

  const rejectExpenseClaim = (id: string) => {
    if (!permissions.canApproveExpenses) {
      showToast('Permission denied.', 'error');
      return;
    }
    setExpensesState(prev => prev.map(e => (e.id === id ? { ...e, status: 'rejected' } : e)));
    showToast('Expense claim rejected.', 'info');
  };

  const addAccountingCategory = (cat: Omit<AccountingCategory, 'id'>) => {
    const id = `CAT-${Date.now().toString().slice(-4)}`;
    setAccountingCategoriesState(prev => [...prev, { ...cat, id }]);
    showToast(`Accounting Category ${cat.name} created.`, 'success');
  };

  // Assets
  const addAsset = (asset: Omit<ITAsset, 'id'>) => {
    const id = `AST-${Date.now().toString().slice(-4)}`;
    setAssetsState(prev => [...prev, { ...asset, id }]);
    showToast(`Asset ${asset.name} registered.`, 'success');
  };

  const updateAsset = (id: string, asset: Partial<ITAsset>) => {
    setAssetsState(prev => prev.map(a => (a.id === id ? { ...a, ...asset } : a)));
    showToast('Asset record updated.', 'success');
  };

  const addAssetCategory = (cat: Omit<AssetCategory, 'id'>) => {
    const id = `AC-${Date.now().toString().slice(-4)}`;
    setAssetCategoriesState(prev => [...prev, { ...cat, id }]);
    showToast(`Asset category ${cat.name} added.`, 'success');
  };

  const updatePrintConfig = (cfg: Partial<PrintTemplateConfig>) => {
    setPrintConfigState(prev => ({ ...prev, ...cfg }));
    showToast('Print & PDF template configuration updated.', 'success');
  };

  const resetAllData = () => {
    erpStorage.resetToFactoryDefaults();
    setCompanyState(erpStorage.getCompany());
    setDepartmentsState(erpStorage.getDepartments());
    setProjectsState(erpStorage.getProjects());
    setDesignationsState(erpStorage.getDesignations());
    setEmployeesState(erpStorage.getEmployees());
    setSalaryStructuresState(erpStorage.getSalaryStructures());
    setSalaryAdjustmentsState(erpStorage.getSalaryAdjustments());
    setTimesheetsState(erpStorage.getTimesheets());
    const resetLedger = attendanceLedgerRepo.getLedger(2026, 10, DEFAULT_EMPLOYEES);
    setAttendanceLedgerState(resetLedger);
    setAttendanceAuditLogsState(attendanceLedgerRepo.getAuditLogs());
    setLeavesState(erpStorage.getLeaves());
    setLoansState(erpStorage.getLoans());
    setPayrollPeriodsState(erpStorage.getPayrollPeriods());
    setAccountingCategoriesState(erpStorage.getAccountingCategories());
    setExpensesState(erpStorage.getExpenses());
    setAssetCategoriesState(erpStorage.getAssetCategories());
    setAssetsState(erpStorage.getAssets());
    setPrintConfigState(erpStorage.getPrintConfig());
    setCurrentUserIdState('EMP-1001');
    showToast('System reset to factory enterprise seed state.', 'info');
  };

  return (
    <ERPContext.Provider
      value={{
        company,
        departments,
        projects,
        designations,
        employees,
        salaryStructures,
        salaryAdjustments,
        timesheets,
        attendanceLedger,
        attendanceAuditLogs,
        selectedAttendanceMonth,
        setSelectedAttendanceMonth,
        leaves,
        loans,
        payrollPeriods,
        accountingCategories,
        expenses,
        assetCategories,
        assets,
        printConfig,
        currentUserId,
        currentUser,
        userRole,
        permissions,
        activeTab,
        setActiveTab,
        switchUserPersona,
        toast,
        showToast,
        hideToast,
        formatCurrency,
        updateCompany,
        addTimesheet,
        updateTimesheet,
        deleteTimesheet,
        submitTimesheet,
        approveTimesheet,
        rejectTimesheet,
        bulkApproveTimesheets,
        updateAttendanceCell,
        bulkFillMonthWorkdays,
        clearMonthAttendance,
        updateSalaryStructure,
        addSalaryAdjustment,
        generatePayrollForPeriod,
        approvePayrollPeriod,
        finalizePayrollPeriod,
        recordPayrollPayment,
        reversePayrollPeriod,
        addLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        addLoanRequest,
        approveLoanRequest,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addDepartment,
        deleteDepartment,
        addProject,
        deleteProject,
        addDesignation,
        deleteDesignation,
        addExpenseClaim,
        approveExpenseClaim,
        rejectExpenseClaim,
        addAccountingCategory,
        addAsset,
        updateAsset,
        addAssetCategory,
        updatePrintConfig,
        resetAllData
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
