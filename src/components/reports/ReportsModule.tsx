import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  FileSpreadsheet, 
  Printer, 
  FileDown, 
  Clock, 
  TrendingUp, 
  Building, 
  DollarSign, 
  CreditCard,
  Users,
  Search,
  Filter
} from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const { 
    timesheets, 
    payrollPeriods, 
    departments, 
    employees, 
    salaryStructures, 
    loans, 
    formatCurrency, 
    company 
  } = useERP();

  const [reportType, setReportType] = useState<'timesheet' | 'salary_dept' | 'payroll_register' | 'overtime'>('payroll_register');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(payrollPeriods[0]?.id || 'PR-2026-10');

  const activePayroll = useMemo(() => {
    return payrollPeriods.find(p => p.id === selectedPeriod) || payrollPeriods[0];
  }, [payrollPeriods, selectedPeriod]);

  // Department Salary Aggregates
  const departmentBreakdown = useMemo(() => {
    return departments.map(d => {
      const deptEmployees = employees.filter(e => e.departmentId === d.id);
      const totalBasic = deptEmployees.reduce((acc, e) => acc + e.basicSalary, 0);
      const totalFixed = deptEmployees.reduce((acc, e) => {
        return acc + e.basicSalary + e.housingAllowance + e.transportAllowance + e.foodAllowance + e.otherFixedAllowance;
      }, 0);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        headCount: deptEmployees.length,
        totalBasic,
        totalFixed
      };
    });
  }, [departments, employees]);

  // Overtime Breakdown
  const overtimeSummary = useMemo(() => {
    const approvedOtTimesheets = timesheets.filter(t => t.overtimeHours > 0 && t.status === 'approved');
    const totalOtHours = approvedOtTimesheets.reduce((acc, t) => acc + t.overtimeHours, 0);
    return {
      count: approvedOtTimesheets.length,
      totalHours: Math.round(totalOtHours * 100) / 100,
      records: approvedOtTimesheets
    };
  }, [timesheets]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'payroll_register' && activePayroll) {
      headers = ['Employee Code', 'Name', 'Department', 'Basic Salary', 'Gross Pay', 'Total Deductions', 'Net Salary', 'Payment Status'];
      rows = activePayroll.records.map(r => [
        r.employeeCode,
        `"${r.employeeName}"`,
        r.department,
        r.basicSalary.toString(),
        r.grossEarnings.toString(),
        r.totalDeductions.toString(),
        r.netSalary.toString(),
        r.paymentStatus
      ]);
    } else if (reportType === 'salary_dept') {
      headers = ['Department Code', 'Department Name', 'Headcount', 'Total Basic Salary', 'Total Fixed Compensation'];
      rows = departmentBreakdown.map(d => [
        d.code,
        `"${d.name}"`,
        d.headCount.toString(),
        d.totalBasic.toString(),
        d.totalFixed.toString()
      ]);
    } else {
      headers = ['Date', 'Employee', 'Check-In', 'Check-Out', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Late (min)', 'Status'];
      rows = timesheets.map(t => [
        t.workDate,
        `"${t.employeeName}"`,
        t.checkIn,
        t.checkOut,
        t.regularHours.toString(),
        t.overtimeHours.toString(),
        t.totalHours.toString(),
        t.lateMinutes.toString(),
        t.status
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Reporting & Analytics Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries across timesheet hours, overtime liabilities, and department salary registers in {company.baseCurrency}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Report Segmented Tabs */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType('payroll_register')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            reportType === 'payroll_register'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Monthly Payroll Register
        </button>

        <button
          onClick={() => setReportType('salary_dept')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            reportType === 'salary_dept'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Department Salary Costs
        </button>

        <button
          onClick={() => setReportType('overtime')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            reportType === 'overtime'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overtime Cost Analysis
        </button>

        <button
          onClick={() => setReportType('timesheet')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            reportType === 'timesheet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Labor Hours & Attendance Summary
        </button>
      </div>

      {/* REPORT CONTENT WRAPPER */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs print-container">
        {/* Printable Letterhead */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt=""
                className="w-12 h-12 rounded object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">{company.companyName}</h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                CR: {company.crNumber} · VAT: {company.vatNumber} · Currency: {company.baseCurrency}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Report Generated: {new Date().toISOString().slice(0, 10)}</div>
            <div className="text-slate-700 font-bold uppercase mt-1">
              {reportType.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* 1. PAYROLL REGISTER */}
        {reportType === 'payroll_register' && activePayroll && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Register for: {activePayroll.periodName} ({activePayroll.status.toUpperCase()})
              </h3>
              <div className="no-print">
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                >
                  {payrollPeriods.map(p => (
                    <option key={p.id} value={p.id}>{p.periodName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3 text-right">Basic</th>
                    <th className="py-2.5 px-3 text-right">Allowances</th>
                    <th className="py-2.5 px-3 text-right">Overtime</th>
                    <th className="py-2.5 px-3 text-right">Gross Pay</th>
                    <th className="py-2.5 px-3 text-right">Deductions</th>
                    <th className="py-2.5 px-3 text-right">Net Salary</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePayroll.records.map(rec => {
                    const fixed = rec.housingAllowance + rec.transportAllowance + rec.foodAllowance + rec.otherAllowances;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono text-slate-700">{rec.employeeCode}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{rec.employeeName}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">{formatCurrency(rec.basicSalary)}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">{formatCurrency(fixed)}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">
                          {rec.overtimePay > 0 ? `+${formatCurrency(rec.overtimePay)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(rec.grossEarnings)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-red-700 tabular-nums">
                          -{formatCurrency(rec.totalDeductions)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-blue-900 tabular-nums">
                          {formatCurrency(rec.netSalary)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            rec.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rec.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-xs">
                    <td colSpan={2} className="py-2.5 px-3 text-slate-900">Summary Totals ({activePayroll.records.length} Employees)</td>
                    <td colSpan={3}></td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">{formatCurrency(activePayroll.totalGross)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-red-700 tabular-nums">-{formatCurrency(activePayroll.totalDeductions)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-900 tabular-nums text-sm">{formatCurrency(activePayroll.totalNet)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 2. DEPARTMENT SALARY COSTS */}
        {reportType === 'salary_dept' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Department-Wise Personnel Compensation Breakdown
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Operating Department</th>
                  <th className="py-2.5 px-3 text-center">Headcount</th>
                  <th className="py-2.5 px-3 text-right">Total Basic Salary</th>
                  <th className="py-2.5 px-3 text-right">Total Fixed Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentBreakdown.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{dept.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{dept.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{dept.headCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCurrency(dept.totalBasic)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(dept.totalFixed)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-3 text-slate-900">Grand Total</td>
                  <td className="py-2.5 px-3 text-center font-mono">{employees.length}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {formatCurrency(departmentBreakdown.reduce((a, b) => a + b.totalBasic, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-900 text-sm tabular-nums">
                    {formatCurrency(departmentBreakdown.reduce((a, b) => a + b.totalFixed, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 3. OVERTIME ANALYSIS */}
        {reportType === 'overtime' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Approved Overtime Hours & Financial Exposure
              </h3>
              <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
                Total Overtime Logged: {overtimeSummary.totalHours} Hours
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3 text-right">Regular Hrs</th>
                  <th className="py-2.5 px-3 text-right">Overtime Hrs</th>
                  <th className="py-2.5 px-3">Project / Cost Center</th>
                  <th className="py-2.5 px-3">Supervisor Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overtimeSummary.records.map(ts => (
                  <tr key={ts.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-slate-700">{ts.workDate}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{ts.employeeName}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-600">{ts.shift}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{ts.regularHours}h</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      +{ts.overtimeHours}h
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{ts.projectId || 'General'}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">{ts.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. TIMESHEET SUMMARY */}
        {reportType === 'timesheet' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Employee Working Hours & Attendance Ledger
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Check In/Out</th>
                  <th className="py-2.5 px-3 text-right">Total Hours</th>
                  <th className="py-2.5 px-3 text-right">Lateness</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timesheets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-slate-700">{t.workDate}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{t.employeeName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{t.checkIn} → {t.checkOut}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {t.totalHours}h
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {t.lateMinutes > 0 ? <span className="text-amber-700">{t.lateMinutes}m</span> : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="capitalize font-medium text-slate-600">{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
