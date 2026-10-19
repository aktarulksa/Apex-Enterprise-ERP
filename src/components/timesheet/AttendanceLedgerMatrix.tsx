import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  AttendanceLedgerEntry, 
  AttendanceStatus, 
  Employee 
} from '../../types/erp';
import { 
  Calendar, 
  Clock, 
  Printer, 
  FileDown, 
  Search, 
  Filter, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Info, 
  Sparkles, 
  Building2,
  X,
  Edit3,
  CalendarCheck,
  FileSpreadsheet,
  Check,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { getDaysInMonth, isSaudiWeekend } from '../../services/attendanceLedgerService';

interface AttendanceLedgerMatrixProps {
  initialView?: 'matrix' | 'audit' | 'summary';
}

export const AttendanceLedgerMatrix: React.FC<AttendanceLedgerMatrixProps> = ({ 
  initialView = 'matrix' 
}) => {
  const { 
    company, 
    employees, 
    departments, 
    currentUser, 
    userRole, 
    permissions, 
    attendanceLedger, 
    attendanceAuditLogs, 
    selectedAttendanceMonth, 
    setSelectedAttendanceMonth, 
    updateAttendanceCell, 
    bulkFillMonthWorkdays, 
    clearMonthAttendance, 
    formatCurrency 
  } = useERP();

  // Active view: Matrix, Audit Log, or Executive Monthly Summary Report
  const [activeView, setActiveView] = useState<'matrix' | 'audit' | 'summary'>(initialView);

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Parsing active month (YYYY-MM)
  const [selectedYear, selectedMonth] = useMemo(() => {
    const parts = selectedAttendanceMonth.split('-');
    return [Number(parts[0]) || 2026, Number(parts[1]) || 10];
  }, [selectedAttendanceMonth]);

  const monthDays = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Filtering
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Modals & Drawers
  const [isCellDialogOpen, setIsCellDialogOpen] = useState<boolean>(false);
  const [activeCellData, setActiveCellData] = useState<{
    employeeId: string;
    date: string;
    dayNumber: number;
    dayName: string;
    isWeekend: boolean;
    status: AttendanceStatus;
    regularHours: number;
    overtimeHours: number;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
    reason: string;
  } | null>(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (departmentFilter !== 'all' && emp.departmentId !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = emp.fullName.toLowerCase().includes(q) ||
          emp.employeeCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [employees, departmentFilter, searchQuery]);

  // Lookup map for ledger cells: "EMP_ID:YYYY-MM-DD" -> AttendanceLedgerEntry
  const ledgerMap = useMemo(() => {
    const map = new Map<string, AttendanceLedgerEntry>();
    attendanceLedger.forEach(entry => {
      if (entry.date.startsWith(selectedAttendanceMonth)) {
        map.set(`${entry.employeeId}:${entry.date}`, entry);
      }
    });
    return map;
  }, [attendanceLedger, selectedAttendanceMonth]);

  // Month Statistics Calculations
  const stats = useMemo(() => {
    const workDaysCount = monthDays.filter(d => !d.isWeekend).length;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalLeaveDays = 0;
    let totalAbsenceDays = 0;
    let totalPresentDays = 0;

    employees.forEach(emp => {
      monthDays.forEach(day => {
        const entry = ledgerMap.get(`${emp.id}:${day.dateStr}`);
        if (entry) {
          totalRegularHours += entry.regularHours || 0;
          totalOvertimeHours += entry.overtimeHours || 0;
          if (entry.status === 'present' || entry.status === 'remote') {
            totalPresentDays++;
          } else if (entry.status === 'paid_leave' || entry.status === 'unpaid_leave') {
            totalLeaveDays++;
          } else if (entry.status === 'absent') {
            totalAbsenceDays++;
          }
        } else if (!day.isWeekend) {
          totalRegularHours += 8;
          totalPresentDays++;
        }
      });
    });

    const totalPossibleShifts = employees.length * workDaysCount;
    const attendanceRate = totalPossibleShifts > 0 
      ? Math.min(100, Math.round((totalPresentDays / totalPossibleShifts) * 100)) 
      : 100;

    return {
      calendarDays: monthDays.length,
      scheduledWorkDays: workDaysCount,
      activeStaffCount: employees.length,
      totalRegularHours: Math.round(totalRegularHours * 10) / 10,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalLeaveDays,
      totalAbsenceDays,
      attendanceRate
    };
  }, [monthDays, ledgerMap, employees]);

  // Per-Employee row totals
  const employeeTotalsMap = useMemo(() => {
    const map = new Map<string, {
      presentDays: number;
      regularHours: number;
      overtimeHours: number;
      leaveDays: number;
      paidLeaveDays: number;
      unpaidLeaveDays: number;
      absenceDays: number;
      totalHours: number;
      estimatedOtPay: number;
    }>();

    employees.forEach(emp => {
      let presentDays = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      let absenceDays = 0;

      monthDays.forEach(day => {
        const entry = ledgerMap.get(`${emp.id}:${day.dateStr}`);
        if (entry) {
          if (entry.status === 'present' || entry.status === 'remote') {
            presentDays++;
          } else if (entry.status === 'paid_leave') {
            paidLeaveDays++;
          } else if (entry.status === 'unpaid_leave') {
            unpaidLeaveDays++;
          } else if (entry.status === 'absent') {
            absenceDays++;
          }
          regularHours += entry.regularHours || 0;
          overtimeHours += entry.overtimeHours || 0;
        } else if (!day.isWeekend) {
          // Default baseline workday
          presentDays++;
          regularHours += 8;
        }
      });

      // Overtime estimation: (Basic salary / 30 / 8) * 1.5 * overtimeHours
      const hourlyBase = (emp.basicSalary + emp.housingAllowance + emp.transportAllowance) / 240;
      const estimatedOtPay = Math.round(overtimeHours * hourlyBase * 1.5);

      map.set(emp.id, {
        presentDays,
        regularHours: Math.round(regularHours * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        leaveDays: paidLeaveDays + unpaidLeaveDays,
        paidLeaveDays,
        unpaidLeaveDays,
        absenceDays,
        totalHours: Math.round((regularHours + overtimeHours) * 100) / 100,
        estimatedOtPay
      });
    });

    return map;
  }, [employees, monthDays, ledgerMap]);

  // Per-Day column totals
  const dayTotalsList = useMemo(() => {
    return monthDays.map(day => {
      let presentCount = 0;
      let dayRegularHours = 0;
      let dayOvertimeHours = 0;

      employees.forEach(emp => {
        const entry = ledgerMap.get(`${emp.id}:${day.dateStr}`);
        if (entry) {
          if (entry.status === 'present' || entry.status === 'remote') {
            presentCount++;
          }
          dayRegularHours += entry.regularHours || 0;
          dayOvertimeHours += entry.overtimeHours || 0;
        } else if (!day.isWeekend) {
          presentCount++;
          dayRegularHours += 8;
        }
      });

      return {
        dateStr: day.dateStr,
        presentCount,
        dayRegularHours: Math.round(dayRegularHours * 10) / 10,
        dayOvertimeHours: Math.round(dayOvertimeHours * 100) / 100
      };
    });
  }, [monthDays, employees, ledgerMap]);

  // Admin permission check: ordinary employee cannot edit
  const canEdit = userRole !== 'employee' || permissions.canManageSettings || permissions.canApproveTimesheets;

  // Click on cell
  const handleCellClick = (emp: Employee, day: { dayNumber: number; dateStr: string; dayName: string; isWeekend: boolean }) => {
    const existing = ledgerMap.get(`${emp.id}:${day.dateStr}`);
    const defaultStatus: AttendanceStatus = day.isWeekend ? 'weekend' : 'present';
    const defaultReg = day.isWeekend ? 0 : 8;

    setActiveCellData({
      employeeId: emp.id,
      date: day.dateStr,
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      isWeekend: day.isWeekend,
      status: existing ? existing.status : defaultStatus,
      regularHours: existing ? existing.regularHours : defaultReg,
      overtimeHours: existing ? existing.overtimeHours : 0,
      checkIn: existing?.checkIn || (defaultReg > 0 ? '08:00' : ''),
      checkOut: existing?.checkOut || (defaultReg > 0 ? '17:00' : ''),
      notes: existing?.notes || '',
      reason: ''
    });
    setIsCellDialogOpen(true);
  };

  // Save active cell
  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCellData) return;

    updateAttendanceCell(
      activeCellData.employeeId,
      activeCellData.date,
      {
        status: activeCellData.status,
        regularHours: Number(activeCellData.regularHours),
        overtimeHours: Number(activeCellData.overtimeHours),
        checkIn: activeCellData.checkIn,
        checkOut: activeCellData.checkOut,
        notes: activeCellData.notes
      },
      activeCellData.reason
    );

    setIsCellDialogOpen(false);
  };

  // Month navigation helpers
  const handleMonthChange = (offset: number) => {
    let nextMonth = selectedMonth + offset;
    let nextYear = selectedYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear--;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    const newMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    setSelectedAttendanceMonth(newMonthStr);
  };

  // Month formatted title
  const monthTitle = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return attendanceAuditLogs.filter(log => {
      if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = log.employeeName.toLowerCase().includes(q) ||
          log.employeeId.toLowerCase().includes(q) ||
          log.performedBy.toLowerCase().includes(q) ||
          (log.reason && log.reason.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [attendanceAuditLogs, auditActionFilter, searchQuery]);

  // Export summary to CSV
  const handleExportSummaryCsv = () => {
    const headers = [
      'Employee Code',
      'Full Name',
      'Department',
      'Designation',
      'Month',
      'Scheduled Days',
      'Present Days',
      'Regular Hours',
      'Overtime Hours',
      'Paid Leave Days',
      'Unpaid Leave Days',
      'Absences',
      'Total Payable Hours',
      'Est Overtime Pay (SAR)'
    ];

    const rows = employees.map(emp => {
      const totals = employeeTotalsMap.get(emp.id);
      const dept = departments.find(d => d.id === emp.departmentId)?.name || emp.departmentId;
      return [
        emp.employeeCode,
        `"${emp.fullName}"`,
        `"${dept}"`,
        `"${emp.role}"`,
        selectedAttendanceMonth,
        stats.scheduledWorkDays,
        totals?.presentDays ?? 0,
        totals?.regularHours ?? 0,
        totals?.overtimeHours ?? 0,
        totals?.paidLeaveDays ?? 0,
        totals?.unpaidLeaveDays ?? 0,
        totals?.absenceDays ?? 0,
        totals?.totalHours ?? 0,
        totals?.estimatedOtPay ?? 0
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Ledger_Summary_${selectedAttendanceMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Module Title & Global Header Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Attendance & Time Ledger
            </h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              canEdit 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {canEdit ? 'Admin Ledger Mode' : 'Read-Only (Locked)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise monthly timesheet matrix (employees × days, Fri/Sat Saudi weekend shaded) with live cell logging, immutable audit trail, and executive report.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveView('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === 'matrix'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Monthly Matrix</span>
          </button>

          <button
            onClick={() => setActiveView('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === 'audit'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 rounded font-mono font-bold">
              {attendanceAuditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeView === 'summary'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Summary & Print</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Month Picker, Quick Months, Actions */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Native Month Selector & Arrow Navigation */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="px-2.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <input
                type="month"
                value={selectedAttendanceMonth}
                onChange={e => {
                  if (e.target.value) setSelectedAttendanceMonth(e.target.value);
                }}
                className="text-xs font-bold font-mono text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleMonthChange(1)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Month Chips */}
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            {['2026-09', '2026-10', '2026-11'].map(m => {
              const isSelected = selectedAttendanceMonth === m;
              const label = new Date(Number(m.split('-')[0]), Number(m.split('-')[1]) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return (
                <button
                  key={m}
                  onClick={() => setSelectedAttendanceMonth(m)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-700 font-bold border border-blue-200' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeView === 'matrix' && canEdit && (
            <button
              onClick={() => bulkFillMonthWorkdays(selectedAttendanceMonth)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
              title="Fill standard 8.0h for all employees on regular workdays (preserves weekend shading)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Fill 8h Workdays</span>
            </button>
          )}

          <button
            onClick={handleExportSummaryCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download CSV timesheet extract"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            title="Print or save PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Month Statistics Strip */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Staff
          </div>
          <div className="mt-0.5 text-lg font-bold font-mono text-slate-900">
            {stats.activeStaffCount}
          </div>
          <div className="text-[10px] text-slate-500">
            {stats.scheduledWorkDays} workdays ({stats.calendarDays}d in {monthTitle})
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Regular Hours Logged
          </div>
          <div className="mt-0.5 text-lg font-bold font-mono text-slate-900 tabular-nums">
            {stats.totalRegularHours}h
          </div>
          <div className="text-[10px] text-slate-500">
            Standard baseline scheduled
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Approved Overtime
          </div>
          <div className="mt-0.5 text-lg font-extrabold font-mono text-emerald-700 tabular-nums">
            +{stats.totalOvertimeHours}h
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">
            Interconnected with payroll
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Attendance Rate
          </div>
          <div className="mt-0.5 text-lg font-bold font-mono text-blue-900 tabular-nums">
            {stats.attendanceRate}%
          </div>
          <div className="text-[10px] text-slate-500">
            Reliability metric
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Absences / Leaves
          </div>
          <div className="mt-0.5 text-lg font-bold font-mono text-amber-700 tabular-nums">
            {stats.totalLeaveDays}L / {stats.totalAbsenceDays}A
          </div>
          <div className="text-[10px] text-slate-500">
            Deducted from payroll
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Weekend Shading
          </div>
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
            <span className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-xs inline-block" />
            <span>Fri & Sat (Saudi Off)</span>
          </div>
          <div className="text-[10px] text-slate-500">
            1.5x / 2.0x overtime rules
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTHLY TIMESHEET MATRIX */}
      {activeView === 'matrix' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search employee in ledger..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 w-56"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Click any cell to log or edit hours. Entries are admin-only and locked at the database level.</span>
            </div>
          </div>

          {/* MATRIX TABLE (Employees × Days) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-container">
            {/* Printable Letterhead (Only visible during print) */}
            <div className="print-only hidden p-4 pb-2 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{company.companyName}</h2>
                  <div className="text-xs text-slate-600">{company.companyNameArabic}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    CR: {company.crNumber} · VAT: {company.vatNumber} · Currency: {company.baseCurrency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Monthly Attendance & Time Ledger
                  </div>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {monthTitle}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600">
                    {/* Fixed Employee column */}
                    <th className="sticky left-0 z-20 bg-slate-100/95 py-2 px-3 border-r border-slate-200 font-semibold min-w-[170px]">
                      Employee
                    </th>

                    {/* Day numbers (1 to 28/29/30/31) */}
                    {monthDays.map(day => (
                      <th
                        key={day.dayNumber}
                        className={`py-2 px-1 text-center font-mono border-r border-slate-200/60 min-w-[34px] ${
                          day.isWeekend 
                            ? 'bg-slate-200/80 text-slate-900 font-bold' 
                            : 'text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{day.dayNumber}</div>
                        <div className="text-[9px] uppercase font-normal text-slate-500">
                          {day.dayName}
                        </div>
                      </th>
                    ))}

                    {/* Per-Employee Totals Columns */}
                    <th className="py-2 px-2.5 text-right font-semibold bg-slate-100/80 border-l border-slate-200 text-slate-800 min-w-[45px]">
                      Days
                    </th>
                    <th className="py-2 px-2.5 text-right font-semibold bg-emerald-50/70 text-emerald-900 min-w-[50px]">
                      OT (h)
                    </th>
                    <th className="py-2 px-2.5 text-right font-semibold bg-amber-50/70 text-amber-900 min-w-[45px]">
                      Leave
                    </th>
                    <th className="py-2 px-2.5 text-right font-semibold bg-blue-50/70 text-blue-900 min-w-[55px]">
                      Total (h)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map(emp => {
                    const rowTotals = employeeTotalsMap.get(emp.id) || {
                      presentDays: 0,
                      regularHours: 0,
                      overtimeHours: 0,
                      leaveDays: 0,
                      paidLeaveDays: 0,
                      unpaidLeaveDays: 0,
                      absenceDays: 0,
                      totalHours: 0,
                      estimatedOtPay: 0
                    };

                    const isCurrentUserRow = currentUser.id === emp.id;

                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-blue-50/30 transition-colors ${
                          isCurrentUserRow ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Employee Sticky Column */}
                        <td className="sticky left-0 z-10 bg-white border-r border-slate-200 py-2 px-2.5 whitespace-nowrap shadow-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={emp.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="truncate">
                              <div className="font-semibold text-slate-900 truncate text-[11px] flex items-center gap-1">
                                <span>{emp.fullName}</span>
                                {isCurrentUserRow && (
                                  <span className="text-[9px] text-blue-600 font-bold">(You)</span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                {emp.employeeCode} · {emp.departmentId.replace('DEP-', '')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Day Cells */}
                        {monthDays.map(day => {
                          const entry = ledgerMap.get(`${emp.id}:${day.dateStr}`);
                          const isWeekend = day.isWeekend;

                          let cellText = '';
                          let cellSub = '';
                          let cellClass = '';

                          if (entry) {
                            if (entry.status === 'weekend') {
                              cellText = entry.overtimeHours > 0 ? `+${entry.overtimeHours}h` : 'OFF';
                              cellClass = entry.overtimeHours > 0 ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-200/60 text-slate-400';
                            } else if (entry.status === 'present') {
                              cellText = entry.regularHours ? `${entry.regularHours}h` : '8h';
                              if (entry.overtimeHours > 0) {
                                cellSub = `+${entry.overtimeHours}`;
                                cellClass = 'bg-emerald-50 text-emerald-900 font-bold';
                              } else {
                                cellClass = 'text-slate-800 font-medium hover:bg-blue-50';
                              }
                            } else if (entry.status === 'remote') {
                              cellText = 'REM';
                              cellClass = 'bg-blue-50 text-blue-800 font-bold';
                            } else if (entry.status === 'paid_leave') {
                              cellText = 'PL';
                              cellClass = 'bg-emerald-100 text-emerald-800 font-bold';
                            } else if (entry.status === 'unpaid_leave') {
                              cellText = 'UL';
                              cellClass = 'bg-amber-100 text-amber-900 font-bold';
                            } else if (entry.status === 'absent') {
                              cellText = 'ABS';
                              cellClass = 'bg-red-100 text-red-900 font-bold';
                            } else if (entry.status === 'holiday') {
                              cellText = 'HOL';
                              cellClass = 'bg-purple-100 text-purple-900 font-bold';
                            }
                          } else {
                            if (isWeekend) {
                              cellText = 'OFF';
                              cellClass = 'bg-slate-200/60 text-slate-400';
                            } else {
                              cellText = '8h';
                              cellClass = 'text-slate-800 hover:bg-blue-50';
                            }
                          }

                          return (
                            <td
                              key={day.dayNumber}
                              onClick={() => {
                                if (canEdit) {
                                  handleCellClick(emp, day);
                                }
                              }}
                              className={`py-1.5 px-0.5 text-center font-mono border-r border-slate-200/50 transition-colors cursor-pointer select-none ${cellClass} ${
                                isWeekend ? 'bg-slate-100/90' : ''
                              }`}
                              title={`${emp.fullName} - ${day.dateStr}: ${cellText}${entry?.notes ? ` (${entry.notes})` : ''} - Click to edit`}
                            >
                              <div className="leading-tight text-[10px]">
                                {cellText}
                              </div>
                              {cellSub && (
                                <div className="text-[9px] text-emerald-700 font-bold leading-none">
                                  {cellSub}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Employee Row Totals */}
                        <td className="py-1.5 px-2 text-right font-mono font-medium text-slate-800 bg-slate-50/60 border-l border-slate-200 tabular-nums">
                          {rowTotals.presentDays}d
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40 tabular-nums">
                          {rowTotals.overtimeHours > 0 ? `+${rowTotals.overtimeHours}h` : '0h'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-medium text-amber-800 bg-amber-50/40 tabular-nums">
                          {rowTotals.leaveDays > 0 ? `${rowTotals.leaveDays}d` : '-'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-extrabold text-blue-900 bg-blue-50/40 tabular-nums">
                          {rowTotals.totalHours}h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Bottom Row: Day Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-[10px]">
                    <td className="sticky left-0 z-10 bg-slate-100 border-r border-slate-200 py-2.5 px-2.5 uppercase tracking-wider">
                      Day Total (Present / OT)
                    </td>

                    {dayTotalsList.map(dt => (
                      <td 
                        key={dt.dateStr}
                        className="py-1.5 px-0.5 text-center font-mono border-r border-slate-200 tabular-nums"
                      >
                        <div>{dt.presentCount}</div>
                        {dt.dayOvertimeHours > 0 && (
                          <div className="text-[9px] text-emerald-700 font-bold">
                            +{dt.dayOvertimeHours}
                          </div>
                        )}
                      </td>
                    ))}

                    <td className="py-2 px-2 text-right font-mono border-l border-slate-200 tabular-nums">
                      {stats.activeStaffCount}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-800 tabular-nums">
                      +{stats.totalOvertimeHours}h
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-800 tabular-nums">
                      {stats.totalLeaveDays}d
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-blue-900 tabular-nums text-xs">
                      {stats.totalRegularHours + stats.totalOvertimeHours}h
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend strip */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-700">Status Legend:</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 rounded-xs" /> Fri/Sat Saudi Weekend</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white border border-slate-300 rounded-xs" /> Present (8h)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 rounded-xs" /> Overtime (+h)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded-xs" /> REM (Remote)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-200 border border-emerald-400 rounded-xs" /> PL (Paid Leave)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded-xs" /> UL (Unpaid Leave)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded-xs" /> ABS (Absent)</span>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Click any cell to edit · All edits committed to immutable audit trail
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: AUDIT TRAIL & CHANGE LOG */}
      {activeView === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Immutable Attendance Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete historical record of all attendance, overtime, and leave modifications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="all">All Actions</option>
                  <option value="UPDATE">Update Record</option>
                  <option value="BULK_FILL">Bulk Fill</option>
                  <option value="CREATE">Create</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No audit log entries matching criteria.
                </div>
              ) : (
                filteredAuditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{log.employeeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({log.employeeId})</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          log.action === 'BULK_FILL' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono">
                      Target Work Date: <strong className="text-slate-900">{log.date}</strong>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      {log.previousState && (
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-slate-500 font-semibold block text-[10px] uppercase">Previous State:</span>
                          <span className="text-slate-600 font-mono">{log.previousState}</span>
                        </div>
                      )}
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">New State:</span>
                        <span className="text-slate-900 font-mono font-semibold">{log.newState}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                      <div>
                        Logged by: <strong className="text-slate-700">{log.performedBy}</strong> ({log.userRole.replace('_', ' ')})
                      </div>
                      {log.reason && (
                        <div className="italic text-slate-600">
                          Justification: "{log.reason}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: EXECUTIVE MONTHLY SUMMARY REPORT (PRINT / PDF) */}
      {activeView === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden p-6 lg:p-8 print-container">
          {/* Executive Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-800">
            <div className="flex items-start gap-4">
              {company.logoUrl ? (
                <img 
                  src={company.logoUrl} 
                  alt="Company Logo" 
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  {company.companyName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{company.companyName}</h1>
                <h2 className="text-sm text-slate-600 font-medium">{company.companyNameArabic}</h2>
                <div className="text-xs text-slate-500 font-mono mt-1 space-x-3">
                  <span>CR No: <strong>{company.crNumber}</strong></span>
                  <span>·</span>
                  <span>VAT No: <strong>{company.vatNumber}</strong></span>
                  <span>·</span>
                  <span>WPS ID: <strong>{company.wpsEmployerCode}</strong></span>
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
                Official Monthly Summary Report
              </div>
              <div className="text-base font-bold text-slate-900 font-mono mt-2">
                Period: {monthTitle}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Report Date: {new Date().toISOString().slice(0, 10)}
              </div>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Scheduled Workdays</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{stats.scheduledWorkDays} Days</div>
              <div className="text-[10px] text-slate-400">Total {stats.calendarDays} calendar days</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Regular Labor Hours</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{stats.totalRegularHours} hrs</div>
              <div className="text-[10px] text-slate-400">Standard shift hours</div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-emerald-800">Approved Overtime</div>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-0.5">+{stats.totalOvertimeHours} hrs</div>
              <div className="text-[10px] text-emerald-700">1.5x KSA labor rate multiplier</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-blue-800">Attendance Adherence</div>
              <div className="text-xl font-bold font-mono text-blue-900 mt-0.5">{stats.attendanceRate}%</div>
              <div className="text-[10px] text-blue-700">Overall workforce reliability</div>
            </div>
          </div>

          {/* Executive Employee Attendance Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden my-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Workdays</th>
                  <th className="py-2.5 px-3 text-center">Present</th>
                  <th className="py-2.5 px-3 text-right">Regular (h)</th>
                  <th className="py-2.5 px-3 text-right">Overtime (h)</th>
                  <th className="py-2.5 px-3 text-center">Leave</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-right">Total Hours</th>
                  <th className="py-2.5 px-3 text-right">Est. OT Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {employees.map(emp => {
                  const totals = employeeTotalsMap.get(emp.id);
                  const dept = departments.find(d => d.id === emp.departmentId)?.name || emp.departmentId;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{emp.employeeCode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{emp.fullName}</td>
                      <td className="py-2 px-3 text-slate-600">{dept}</td>
                      <td className="py-2 px-3 text-center font-mono">{stats.scheduledWorkDays}</td>
                      <td className="py-2 px-3 text-center font-mono font-medium">{totals?.presentDays ?? 0}</td>
                      <td className="py-2 px-3 text-right font-mono">{totals?.regularHours ?? 0}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {totals?.overtimeHours ? `+${totals.overtimeHours}` : '0'}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-amber-800">
                        {totals?.leaveDays ? `${totals.leaveDays}d` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-red-700">
                        {totals?.absenceDays ? `${totals.absenceDays}d` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                        {totals?.totalHours ?? 0}h
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                        {totals?.estimatedOtPay ? formatCurrency(totals.estimatedOtPay) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-3 uppercase text-[10px]">Grand Summary Totals</td>
                  <td className="py-2.5 px-3 text-center font-mono">{stats.scheduledWorkDays}</td>
                  <td className="py-2.5 px-3 text-center font-mono">-</td>
                  <td className="py-2.5 px-3 text-right font-mono">{stats.totalRegularHours}h</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800">+{stats.totalOvertimeHours}h</td>
                  <td className="py-2.5 px-3 text-center font-mono text-amber-800">{stats.totalLeaveDays}d</td>
                  <td className="py-2.5 px-3 text-center font-mono text-red-800">{stats.totalAbsenceDays}d</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-900">
                    {stats.totalRegularHours + stats.totalOvertimeHours}h
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatCurrency(Array.from(employeeTotalsMap.values()).reduce((sum, v) => sum + v.estimatedOtPay, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification & Sign-off Section */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Prepared By (Timekeeper / HR)
              </div>
              <div className="border-b border-slate-300 pb-2">
                <span className="font-semibold text-slate-800">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-500 block">HR & Time Ledger Specialist</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Date: {new Date().toISOString().slice(0, 10)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                2. Verified By (Payroll Manager)
              </div>
              <div className="border-b border-slate-300 pb-2 h-10 flex items-end">
                <span className="text-slate-400 italic">Signature & Date</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Approved for payroll generation
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                3. Company Seal & General Manager
              </div>
              <div className="border border-dashed border-slate-300 rounded-lg h-20 flex items-center justify-center text-slate-400 text-[10px]">
                Official Corporate Stamp
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CELL EDIT DIALOG */}
      {isCellDialogOpen && activeCellData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsCellDialogOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Log Attendance & Hours</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {employees.find(e => e.id === activeCellData.employeeId)?.fullName} · <strong className="font-mono text-slate-800">{activeCellData.date}</strong> ({activeCellData.dayName})
                  {activeCellData.isWeekend && <span className="ml-1 text-purple-700 font-bold">(Saudi Weekend)</span>}
                </div>
              </div>
              <button 
                onClick={() => setIsCellDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="p-5 space-y-4 text-xs">
              {/* Quick Presets */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Attendance Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'present', label: 'Present (8h)' },
                    { id: 'remote', label: 'Remote Work' },
                    { id: 'paid_leave', label: 'Paid Leave' },
                    { id: 'unpaid_leave', label: 'Unpaid Leave' },
                    { id: 'absent', label: 'Absent' },
                    { id: 'weekend', label: 'Weekend Off' },
                    { id: 'holiday', label: 'Holiday' }
                  ].map(st => {
                    const isSelected = activeCellData.status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          const status = st.id as AttendanceStatus;
                          let regularHours = 8;
                          if (status === 'weekend' || status === 'paid_leave' || status === 'unpaid_leave' || status === 'absent' || status === 'holiday') {
                            regularHours = 0;
                          }
                          setActiveCellData(prev => prev ? ({ ...prev, status, regularHours }) : null);
                        }}
                        className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hours Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Regular Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={12}
                    value={activeCellData.regularHours}
                    onChange={e => setActiveCellData(prev => prev ? ({ ...prev, regularHours: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={12}
                    value={activeCellData.overtimeHours}
                    onChange={e => setActiveCellData(prev => prev ? ({ ...prev, overtimeHours: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Check in / Check out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={activeCellData.checkIn || ''}
                    onChange={e => setActiveCellData(prev => prev ? ({ ...prev, checkIn: e.target.value }) : null)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={activeCellData.checkOut || ''}
                    onChange={e => setActiveCellData(prev => prev ? ({ ...prev, checkOut: e.target.value }) : null)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Operational Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Notes / Tasks
                </label>
                <input
                  type="text"
                  value={activeCellData.notes || ''}
                  onChange={e => setActiveCellData(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                  placeholder="e.g. Sprint deploy, site visit, client review..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Mandatory Reason for Audit Trail */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandatory Audit Trail Justification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={activeCellData.reason}
                  onChange={e => setActiveCellData(prev => prev ? ({ ...prev, reason: e.target.value }) : null)}
                  placeholder="e.g. Authorized manager amendment, emergency overtime..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                <span>Security Notice: This entry is committed directly by <strong>{currentUser.fullName} ({userRole.replace('_', ' ')})</strong> and permanently timestamped in the audit log.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCellDialogOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!activeCellData.reason.trim()}
                  className="px-4 py-1.5 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                >
                  Save to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
