import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { PayrollPeriod, PayrollRecord } from '../../types/erp';
import { 
  CreditCard, 
  CheckCircle, 
  Lock, 
  FileText, 
  FileDown, 
  Building, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  DollarSign, 
  Send, 
  Eye, 
  RotateCcw,
  Landmark,
  Coins
} from 'lucide-react';
import { generateSaudiWpsSif } from '../../services/saudiCompliance';
import { ConfirmModal } from '../common/ConfirmModal';

interface PayrollModuleProps {
  initialView?: 'dashboard' | 'generate' | 'register' | 'approvals' | 'payments';
  onNavigateToPayslips?: (periodId: string, employeeId?: string) => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({ 
  initialView = 'dashboard',
  onNavigateToPayslips
}) => {
  const { 
    payrollPeriods, 
    employees, 
    timesheets, 
    company, 
    currentUser, 
    userRole, 
    permissions, 
    generatePayrollForPeriod, 
    approvePayrollPeriod, 
    finalizePayrollPeriod, 
    recordPayrollPayment, 
    reversePayrollPeriod, 
    formatCurrency, 
    showToast 
  } = useERP();

  // Active Selected Period
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    return payrollPeriods[0]?.id || 'PR-2026-10';
  });

  const selectedPeriod = useMemo(() => {
    return payrollPeriods.find(p => p.id === selectedPeriodId) || payrollPeriods[0];
  }, [payrollPeriods, selectedPeriodId]);

  // Generation Wizard State
  const [generatePeriodCode, setGeneratePeriodCode] = useState<string>('2026-10');
  const [generatePeriodName, setGeneratePeriodName] = useState<string>('October 2026 Monthly Payroll');

  // Disburse Modal State
  const [disburseModal, setDisburseModal] = useState<{
    isOpen: boolean;
    periodId: string;
    method: 'wps_bank_transfer' | 'bank_transfer' | 'cash' | 'cheque';
    reference: string;
  }>({
    isOpen: false,
    periodId: '',
    method: 'wps_bank_transfer',
    reference: `WPS-ALRAJHI-${Date.now().toString().slice(-6)}`
  });

  // Reversal Modal State
  const [reversalModal, setReversalModal] = useState<{
    isOpen: boolean;
    periodId: string;
    reason: string;
  }>({
    isOpen: false,
    periodId: '',
    reason: ''
  });

  // Confirmation dialogs
  const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null);
  const [finalizeConfirmId, setFinalizeConfirmId] = useState<string | null>(null);

  // Search in record table
  const [recordSearch, setRecordSearch] = useState('');

  // Warning & Validation analysis for active period
  const validationAlerts = useMemo(() => {
    if (!selectedPeriod) return [];
    const alerts: Array<{ type: 'warning' | 'error'; message: string }> = [];

    // Check for employees with zero net salary
    const zeroNet = selectedPeriod.records.filter(r => r.netSalary <= 0);
    if (zeroNet.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${zeroNet.length} employee(s) have SAR 0 or negative net salary after deductions.`
      });
    }

    // Check for missing bank IBANs
    const missingIban = selectedPeriod.records.filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return !emp?.iban || emp.iban.length < 15;
    });
    if (missingIban.length > 0) {
      alerts.push({
        type: 'error',
        message: `${missingIban.length} employee(s) do not have a valid bank IBAN for Saudi WPS transfer.`
      });
    }

    // Check for unapproved pending timesheets in this period
    const [year, month] = selectedPeriod.period.split('-');
    const pendingTs = timesheets.filter(t => t.workDate.startsWith(`${year}-${month}`) && t.status === 'submitted');
    if (pendingTs.length > 0) {
      alerts.push({
        type: 'warning',
        message: `There are ${pendingTs.length} pending timesheets for ${selectedPeriod.period} awaiting supervisor approval. Unapproved overtime is excluded from payroll.`
      });
    }

    return alerts;
  }, [selectedPeriod, employees, timesheets]);

  // Filtered records in table
  const filteredRecords = useMemo(() => {
    if (!selectedPeriod) return [];
    if (!recordSearch.trim()) return selectedPeriod.records;
    const q = recordSearch.toLowerCase();
    return selectedPeriod.records.filter(r => 
      r.employeeName.toLowerCase().includes(q) || 
      r.employeeCode.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  }, [selectedPeriod, recordSearch]);

  // Handle Generate Run
  const handleTriggerGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    const newRun = generatePayrollForPeriod(generatePeriodCode, generatePeriodName);
    setSelectedPeriodId(newRun.id);
  };

  // Export WPS SIF Bank File
  const handleExportWpsSif = () => {
    if (!selectedPeriod) return;
    const wpsRecords = selectedPeriod.records.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return {
        nationalId: emp?.iqamaOrNationalId || '1000000000',
        iban: emp?.iban || company.bankIban,
        employeeName: r.employeeName,
        basicSalary: r.basicSalary,
        housingAllowance: r.housingAllowance,
        otherAllowance: r.transportAllowance + r.foodAllowance + r.otherAllowances + r.overtimePay,
        deductions: r.totalDeductions,
        netSalary: r.netSalary
      };
    });

    const sifText = generateSaudiWpsSif(
      company.crNumber,
      company.bankIban,
      selectedPeriod.period,
      wpsRecords
    );

    const blob = new Blob([sifText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WPS_${company.crNumber}_${selectedPeriod.period.replace('-', '')}.SIF`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Saudi WPS SIF wage protection file exported successfully for ${selectedPeriod.periodName}.`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Monthly Payroll Processing & Automation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interconnected calculation of timesheet overtime, GOSI social security, unpaid leaves, and salary advances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector Dropdown */}
          <select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 shadow-xs"
          >
            {payrollPeriods.map(p => (
              <option key={p.id} value={p.id}>
                {p.periodName} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>

          {permissions.canGeneratePayroll && (
            <button
              onClick={() => {
                generatePayrollForPeriod(selectedPeriod?.period || '2026-10');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recalculate Run</span>
            </button>
          )}
        </div>
      </div>

      {selectedPeriod && (
        <>
          {/* Status & Lifecycle Progression Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedPeriod.periodName}
                  </h2>
                  <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    selectedPeriod.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedPeriod.status === 'finalized'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : selectedPeriod.status === 'approved'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {selectedPeriod.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Period: <strong className="font-mono text-slate-700">{selectedPeriod.startDate} → {selectedPeriod.endDate}</strong></span>
                  <span>·</span>
                  <span>Prepared by: <strong className="text-slate-700">{selectedPeriod.preparedBy}</strong></span>
                  {selectedPeriod.paymentReference && (
                    <>
                      <span>·</span>
                      <span>Ref: <strong className="font-mono text-emerald-800">{selectedPeriod.paymentReference}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons depending on status */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedPeriod.status === 'calculated' && permissions.canApprovePayroll && (
                  <button
                    onClick={() => setApproveConfirmId(selectedPeriod.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Payroll</span>
                  </button>
                )}

                {selectedPeriod.status === 'approved' && permissions.canFinalizePayroll && (
                  <button
                    onClick={() => setFinalizeConfirmId(selectedPeriod.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Finalize & Lock Run</span>
                  </button>
                )}

                {selectedPeriod.status === 'finalized' && permissions.canRecordPayment && (
                  <button
                    onClick={() => setDisburseModal({
                      isOpen: true,
                      periodId: selectedPeriod.id,
                      method: 'wps_bank_transfer',
                      reference: `WPS-${company.crNumber.slice(0, 4)}-${Date.now().toString().slice(-4)}`
                    })}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Disburse & Record Payment</span>
                  </button>
                )}

                {/* Reversal button for Super Admin */}
                {userRole === 'super_admin' && (selectedPeriod.status === 'finalized' || selectedPeriod.status === 'approved') && (
                  <button
                    onClick={() => setReversalModal({ isOpen: true, periodId: selectedPeriod.id, reason: '' })}
                    className="px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                    title="Authorize administrative reversal"
                  >
                    Reverse Run
                  </button>
                )}

                {/* Export WPS SIF */}
                <button
                  onClick={handleExportWpsSif}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
                  title="Download Saudi Wage Protection System SIF format"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export WPS .SIF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Warnings / Exception Banner */}
          {validationAlerts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pre-Approval Verification Checks & Exceptions ({validationAlerts.length})</span>
              </div>
              <ul className="text-xs text-amber-800 space-y-1 pl-6 list-disc">
                {validationAlerts.map((alt, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {alt.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Aggregate KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Gross Earnings
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
                {formatCurrency(selectedPeriod.totalGross)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {selectedPeriod.totalEmployees} Active staff
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Approved Overtime Pay
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold font-mono text-emerald-700 tabular-nums">
                {formatCurrency(selectedPeriod.totalOvertimePay)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                From approved timesheets
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Deductions
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold font-mono text-red-700 tabular-nums">
                {formatCurrency(selectedPeriod.totalDeductions)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                GOSI, Unpaid Leave, Loans
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Net Disbursable Salary
              </div>
              <div className="mt-1 text-base sm:text-lg font-extrabold font-mono text-blue-900 tabular-nums">
                {formatCurrency(selectedPeriod.totalNet)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Payable via bank / WPS
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Employer GOSI Share
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold font-mono text-indigo-900 tabular-nums">
                {formatCurrency(selectedPeriod.totalGosiCompany)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Company liability
              </div>
            </div>
          </div>

          {/* Search Filter for Records */}
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Search employee in this payroll run..."
              value={recordSearch}
              onChange={e => setRecordSearch(e.target.value)}
              className="max-w-xs px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-xs text-slate-500">
              Showing {filteredRecords.length} of {selectedPeriod.records.length} records
            </span>
          </div>

          {/* Itemized Payroll Records Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3 text-right">Basic</th>
                    <th className="py-3 px-3 text-right">Allowances</th>
                    <th className="py-3 px-3 text-right">Overtime Pay</th>
                    <th className="py-3 px-3 text-right">Gross Pay</th>
                    <th className="py-3 px-3 text-right">Unpaid Leave</th>
                    <th className="py-3 px-3 text-right">GOSI (Emp)</th>
                    <th className="py-3 px-3 text-right">Loan Ded.</th>
                    <th className="py-3 px-3 text-right">Total Ded.</th>
                    <th className="py-3 px-3 text-right">Net Salary</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map(rec => {
                    const emp = employees.find(e => e.id === rec.employeeId);
                    const fixedAllowances = rec.housingAllowance + rec.transportAllowance + rec.foodAllowance + rec.otherAllowances;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">{rec.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.employeeCode} · {rec.isSaudi ? 'Saudi National' : 'Expatriate'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-800 tabular-nums">
                          {formatCurrency(rec.basicSalary)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                          {formatCurrency(fixedAllowances)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {rec.overtimePay > 0 ? (
                            <span className="text-emerald-700 font-semibold">
                              +{formatCurrency(rec.overtimePay)} ({rec.approvedOvertimeHours}h)
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(rec.grossEarnings)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {rec.unpaidLeaveDeduction > 0 ? (
                            <span className="text-amber-800 font-medium">
                              -{formatCurrency(rec.unpaidLeaveDeduction)} ({rec.unpaidLeaveDays}d)
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                          {rec.gosiEmployeeDeduction > 0 ? (
                            <span>-{formatCurrency(rec.gosiEmployeeDeduction)}</span>
                          ) : (
                            <span className="text-slate-400">0.00</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {rec.loanInstallmentDeduction > 0 ? (
                            <span className="text-purple-700 font-semibold">
                              -{formatCurrency(rec.loanInstallmentDeduction)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-red-700 tabular-nums">
                          -{formatCurrency(rec.totalDeductions)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-900 tabular-nums">
                          {formatCurrency(rec.netSalary)}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {onNavigateToPayslips && (
                            <button
                              onClick={() => onNavigateToPayslips(selectedPeriod.id, rec.employeeId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                              title="View and print employee payslip"
                            >
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>Payslip</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Disburse Payment Modal */}
      {disburseModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setDisburseModal(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Record Payroll Bank Disbursement</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mark this payroll period as Paid and trace the treasury payment transaction.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                recordPayrollPayment(
                  disburseModal.periodId,
                  disburseModal.method,
                  disburseModal.reference
                );
                setDisburseModal(prev => ({ ...prev, isOpen: false }));
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Channel
                </label>
                <select
                  value={disburseModal.method}
                  onChange={e => setDisburseModal(prev => ({ ...prev, method: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="wps_bank_transfer">Saudi WPS Corporate Bank Transfer (Al Rajhi / SNB)</option>
                  <option value="bank_transfer">Direct Electronic Funds Transfer (EFT)</option>
                  <option value="cheque">Corporate Cheque</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Reference / Transaction ID
                </label>
                <input
                  type="text"
                  required
                  value={disburseModal.reference}
                  onChange={e => setDisburseModal(prev => ({ ...prev, reference: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1 font-mono">
                <div>Company CR: {company.crNumber}</div>
                <div>Company IBAN: {company.bankIban}</div>
                <div>Disbursable Total: {formatCurrency(selectedPeriod?.totalNet || 0)}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisburseModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administrative Reversal Modal */}
      {reversalModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setReversalModal(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Administrative Payroll Reversal</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Unlock finalized payroll run for recalculation. A mandatory audit log entry will be permanently recorded.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                reversePayrollPeriod(reversalModal.periodId, reversalModal.reason);
                setReversalModal(prev => ({ ...prev, isOpen: false }));
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Reversal Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalModal.reason}
                  onChange={e => setReversalModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Executive retroactive bonus adjustment required before WPS transmission..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reversalModal.reason.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Authorize Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={approveConfirmId !== null}
        title="Approve Monthly Payroll Run"
        message="Are you sure you want to approve this payroll period? All earnings, approved overtime, and deductions will be certified for final lock."
        confirmLabel="Approve Payroll"
        onConfirm={() => {
          if (approveConfirmId) {
            approvePayrollPeriod(approveConfirmId);
            setApproveConfirmId(null);
          }
        }}
        onCancel={() => setApproveConfirmId(null)}
      />

      <ConfirmModal
        isOpen={finalizeConfirmId !== null}
        title="Finalize & Lock Payroll"
        message="Finalizing will lock all payroll calculations against further modification. Payslips will become active for employee self-service."
        confirmLabel="Finalize & Lock"
        onConfirm={() => {
          if (finalizeConfirmId) {
            finalizePayrollPeriod(finalizeConfirmId);
            setFinalizeConfirmId(null);
          }
        }}
        onCancel={() => setFinalizeConfirmId(null)}
      />
    </div>
  );
};
