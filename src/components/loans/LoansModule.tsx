import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LoanAdvance } from '../../types/erp';
import { 
  CreditCard, 
  Plus, 
  CheckCircle, 
  DollarSign, 
  Clock, 
  CheckCheck,
  TrendingDown
} from 'lucide-react';

export const LoansModule: React.FC = () => {
  const { 
    loans, 
    employees, 
    currentUser, 
    permissions, 
    addLoanRequest, 
    approveLoanRequest, 
    formatCurrency, 
    company 
  } = useERP();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [formState, setFormState] = useState<{
    employeeId: string;
    loanType: 'salary_advance' | 'personal_loan' | 'emergency_loan';
    principalAmount: number;
    monthlyInstallment: number;
    startDate: string;
    purpose: string;
  }>({
    employeeId: currentUser.id,
    loanType: 'salary_advance',
    principalAmount: 5000,
    monthlyInstallment: 1000,
    startDate: new Date().toISOString().slice(0, 7),
    purpose: ''
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === formState.employeeId) || currentUser;

    addLoanRequest({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      loanType: formState.loanType,
      principalAmount: Number(formState.principalAmount),
      monthlyInstallment: Number(formState.monthlyInstallment),
      startDate: formState.startDate,
      purpose: formState.purpose
    });

    setIsRequestModalOpen(false);
  };

  const filteredLoans = loans.filter(l => {
    if (!permissions.canApproveLoans && l.employeeId !== currentUser.id) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Employee Loans & Salary Advance Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approved advances automatically deducted once per payroll period until full recovery.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Request Loan / Advance</span>
        </button>
      </div>

      {/* Loans Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3">Loan ID</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Principal</th>
                <th className="py-3 px-3 text-right">Monthly Installment</th>
                <th className="py-3 px-3 text-right">Total Recovered</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No active loans or salary advances.
                  </td>
                </tr>
              ) : (
                filteredLoans.map(loan => {
                  const emp = employees.find(e => e.id === loan.employeeId);
                  const isPending = loan.status === 'pending';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                        {loan.id}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{emp?.fullName || loan.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
                      </td>

                      <td className="py-3 px-3 capitalize text-slate-700">
                        {loan.loanType.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatCurrency(loan.principalAmount)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold tabular-nums">
                        {formatCurrency(loan.monthlyInstallment)}/mo
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-700 tabular-nums">
                        {formatCurrency(loan.totalPaid)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(loan.balanceRemaining)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          loan.status === 'repaid'
                            ? 'bg-slate-100 text-slate-600'
                            : loan.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {loan.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {permissions.canApproveLoans && isPending && (
                          <button
                            onClick={() => approveLoanRequest(loan.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve Loan</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsRequestModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Request Salary Advance or Personal Loan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Specify requested amount and recurring monthly payroll installment.
            </p>

            <form onSubmit={handleApply} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employee</label>
                {permissions.canApproveLoans ? (
                  <select
                    value={formState.employeeId}
                    onChange={e => setFormState(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={currentUser.fullName}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formState.loanType}
                  onChange={e => setFormState(prev => ({ ...prev, loanType: e.target.value as any }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="salary_advance">Salary Advance (Short Term)</option>
                  <option value="personal_loan">Company Personal Loan</option>
                  <option value="emergency_loan">Emergency Relief Advance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Principal Amount ({company.baseCurrency})
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={formState.principalAmount}
                    onChange={e => setFormState(prev => ({ ...prev, principalAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Monthly Deductible ({company.baseCurrency})
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={formState.monthlyInstallment}
                    onChange={e => setFormState(prev => ({ ...prev, monthlyInstallment: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deduction Start Period</label>
                <input
                  type="month"
                  required
                  value={formState.startDate}
                  onChange={e => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Purpose & Justification</label>
                <textarea
                  required
                  rows={2}
                  value={formState.purpose}
                  onChange={e => setFormState(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Detail justification for advance..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Submit Loan Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
