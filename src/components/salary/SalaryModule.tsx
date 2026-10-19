import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SalaryStructure, SalaryAdjustment } from '../../types/erp';
import { 
  DollarSign, 
  History, 
  Plus, 
  Edit3, 
  Calculator, 
  Award, 
  TrendingUp, 
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { calculateSaudiEOSB, EosbCalculationInput, EosbCalculationResult } from '../../services/saudiCompliance';

interface SalaryModuleProps {
  initialTab?: 'structures' | 'adjustments' | 'eosb';
}

export const SalaryModule: React.FC<SalaryModuleProps> = ({ initialTab = 'structures' }) => {
  const { 
    salaryStructures, 
    salaryAdjustments, 
    employees, 
    currentUser, 
    permissions, 
    updateSalaryStructure, 
    addSalaryAdjustment, 
    formatCurrency, 
    company 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'structures' | 'adjustments' | 'eosb'>(initialTab);
  
  // Edit Structure Modal
  const [editingStructure, setEditingStructure] = useState<{
    isOpen: boolean;
    employeeId: string;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    foodAllowance: number;
    otherAllowances: number;
    overtimeMultiplier: number;
  }>({
    isOpen: false,
    employeeId: '',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    foodAllowance: 0,
    otherAllowances: 0,
    overtimeMultiplier: 1.5
  });

  // New Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjForm, setAdjForm] = useState<{
    employeeId: string;
    period: string;
    type: 'bonus' | 'commission' | 'arrears' | 'deduction_penalty' | 'manual_adjustment';
    amount: number;
    reason: string;
  }>({
    employeeId: employees[0]?.id || '',
    period: new Date().toISOString().slice(0, 7),
    type: 'bonus',
    amount: 1000,
    reason: ''
  });

  // EOSB Calculator State
  const [eosbInput, setEosbInput] = useState<EosbCalculationInput>({
    basicSalary: 14000,
    housingAllowance: 3500,
    totalServiceYears: 4,
    totalServiceMonths: 6,
    totalServiceDays: 10,
    terminationReason: 'company_termination'
  });

  const [eosbResult, setEosbResult] = useState<EosbCalculationResult>(() => calculateSaudiEOSB(eosbInput));

  const handleCalculateEosb = (e: React.FormEvent) => {
    e.preventDefault();
    setEosbResult(calculateSaudiEOSB(eosbInput));
  };

  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    const hourlyRate = Math.round((editingStructure.basicSalary / (30 * 8)) * 100) / 100;
    updateSalaryStructure(editingStructure.employeeId, {
      basicSalary: Number(editingStructure.basicSalary),
      housingAllowance: Number(editingStructure.housingAllowance),
      transportAllowance: Number(editingStructure.transportAllowance),
      foodAllowance: Number(editingStructure.foodAllowance),
      otherAllowances: Number(editingStructure.otherAllowances),
      overtimeMultiplier: Number(editingStructure.overtimeMultiplier),
      hourlyRate
    });
    setEditingStructure(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    addSalaryAdjustment({
      employeeId: adjForm.employeeId,
      period: adjForm.period,
      type: adjForm.type,
      amount: Number(adjForm.amount),
      reason: adjForm.reason,
      approvedBy: currentUser.fullName
    });
    setIsAdjModalOpen(false);
    setAdjForm({
      employeeId: employees[0]?.id || '',
      period: new Date().toISOString().slice(0, 7),
      type: 'bonus',
      amount: 1000,
      reason: ''
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Salary Structure & Compensation Module
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Effective-dated earnings, GOSI social security rates, allowances, adjustments, and Saudi labor law EOSB calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canManageSalary && (
            <button
              onClick={() => setIsAdjModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Salary Adjustment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'structures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Salary Structures ({salaryStructures.length})
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'adjustments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Salary History & Adjustments ({salaryAdjustments.length})
        </button>

        <button
          onClick={() => setActiveTab('eosb')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'eosb'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Saudi Labor Law EOSB Calculator
        </button>
      </div>

      {/* TAB 1: SALARY STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3 text-right">Basic Salary</th>
                  <th className="py-3 px-3 text-right">Housing</th>
                  <th className="py-3 px-3 text-right">Transport</th>
                  <th className="py-3 px-3 text-right">Other Allowances</th>
                  <th className="py-3 px-3 text-right">Total Fixed</th>
                  <th className="py-3 px-3 text-right">Hourly Rate</th>
                  <th className="py-3 px-3">GOSI Rule</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {salaryStructures.map(str => {
                  const emp = employees.find(e => e.id === str.employeeId);
                  const totalFixed = str.basicSalary + str.housingAllowance + str.transportAllowance + str.foodAllowance + str.otherAllowances;

                  return (
                    <tr key={str.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{emp?.fullName || str.employeeId}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp?.employeeCode} · {emp?.nationality}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatCurrency(str.basicSalary)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatCurrency(str.housingAllowance)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatCurrency(str.transportAllowance)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatCurrency(str.foodAllowance + str.otherAllowances)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 tabular-nums">
                        {formatCurrency(totalFixed)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                        {formatCurrency(str.hourlyRate)}/h
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={str.deductionRulesSummary}>
                          {emp?.isSaudiNational ? 'Saudi GOSI 9.75% / 11.75%' : 'Expat 2% Hazard'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {permissions.canManageSalary && (
                          <button
                            onClick={() => {
                              setEditingStructure({
                                isOpen: true,
                                employeeId: str.employeeId,
                                basicSalary: str.basicSalary,
                                housingAllowance: str.housingAllowance,
                                transportAllowance: str.transportAllowance,
                                foodAllowance: str.foodAllowance,
                                otherAllowances: str.otherAllowances,
                                overtimeMultiplier: str.overtimeMultiplier
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Structure</span>
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
      )}

      {/* TAB 2: SALARY HISTORY & ADJUSTMENTS */}
      {activeTab === 'adjustments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Reason / Audit Trail</th>
                  <th className="py-3 px-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {salaryAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No adjustments logged.
                    </td>
                  </tr>
                ) : (
                  salaryAdjustments.map(adj => {
                    const emp = employees.find(e => e.id === adj.employeeId);
                    const isPositive = adj.type !== 'deduction_penalty';

                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-mono font-medium text-slate-800">
                          {adj.period}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">{emp?.fullName || adj.employeeId}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize text-[11px] font-medium text-slate-700">
                            {adj.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                          <span className={isPositive ? 'text-emerald-700' : 'text-red-700'}>
                            {isPositive ? '+' : '-'}{formatCurrency(adj.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                          {adj.reason}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {adj.approvedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SAUDI EOSB GRATUITY CALCULATOR */}
      {activeTab === 'eosb' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Saudi Labor Law End of Service Parameters (Article 84 & 85)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Statutory calculation based on last drawn monthly salary and length of continuous service.
            </p>

            <form onSubmit={handleCalculateEosb} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Basic Salary ({company.baseCurrency})
                  </label>
                  <input
                    type="number"
                    value={eosbInput.basicSalary}
                    onChange={e => setEosbInput(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Housing Allowance ({company.baseCurrency})
                  </label>
                  <input
                    type="number"
                    value={eosbInput.housingAllowance}
                    onChange={e => setEosbInput(prev => ({ ...prev, housingAllowance: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Length of Continuous Service
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Years</span>
                    <input
                      type="number"
                      min={0}
                      value={eosbInput.totalServiceYears}
                      onChange={e => setEosbInput(prev => ({ ...prev, totalServiceYears: Number(e.target.value) }))}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Months</span>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={eosbInput.totalServiceMonths}
                      onChange={e => setEosbInput(prev => ({ ...prev, totalServiceMonths: Number(e.target.value) }))}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Days</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={eosbInput.totalServiceDays}
                      onChange={e => setEosbInput(prev => ({ ...prev, totalServiceDays: Number(e.target.value) }))}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Separation
                </label>
                <select
                  value={eosbInput.terminationReason}
                  onChange={e => setEosbInput(prev => ({ ...prev, terminationReason: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="company_termination">Employer Termination / Non-Renewal (100% Entitlement)</option>
                  <option value="end_of_contract">End of Fixed-Term Contract (100% Entitlement)</option>
                  <option value="resignation">Employee Resignation (Article 85 Reduction Tiers Apply)</option>
                  <option value="mutual_consent">Mutual Consent (100% Entitlement)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
              >
                Calculate Statutory Gratuity
              </button>
            </form>
          </div>

          {/* Results Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Calculated Statutory Award
                </span>
                <span className="text-[11px] font-mono text-blue-700 font-medium">
                  {eosbResult.legalArticleReference}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {formatCurrency(eosbResult.finalGratuityAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Net statutory end of service severance award due to employee.
                </p>
              </div>

              <div className="mt-5 space-y-2">
                <div className="text-xs font-semibold text-slate-700">Detailed Calculation Steps:</div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-600 font-mono">
                  {eosbResult.breakdown.map((line, idx) => (
                    <div key={idx} className="leading-relaxed">
                      • {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
              Note: EOSB is separate from monthly payroll and is disbursed upon final settlement alongside any unused leave encashment per Saudi Labor Law.
            </div>
          </div>
        </div>
      )}

      {/* Edit Structure Modal */}
      {editingStructure.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setEditingStructure(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Edit Employee Salary Structure</h3>
            <p className="text-xs text-slate-500 mt-1">
              Modifying salary takes effect on future payroll calculations.
            </p>

            <form onSubmit={handleSaveStructure} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Basic Salary ({company.baseCurrency})
                </label>
                <input
                  type="number"
                  required
                  value={editingStructure.basicSalary}
                  onChange={e => setEditingStructure(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Housing Allowance
                  </label>
                  <input
                    type="number"
                    value={editingStructure.housingAllowance}
                    onChange={e => setEditingStructure(prev => ({ ...prev, housingAllowance: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Transport Allowance
                  </label>
                  <input
                    type="number"
                    value={editingStructure.transportAllowance}
                    onChange={e => setEditingStructure(prev => ({ ...prev, transportAllowance: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Food Allowance
                  </label>
                  <input
                    type="number"
                    value={editingStructure.foodAllowance}
                    onChange={e => setEditingStructure(prev => ({ ...prev, foodAllowance: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Other Fixed
                  </label>
                  <input
                    type="number"
                    value={editingStructure.otherAllowances}
                    onChange={e => setEditingStructure(prev => ({ ...prev, otherAllowances: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Overtime Multiplier (Standard: 1.5x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingStructure.overtimeMultiplier}
                  onChange={e => setEditingStructure(prev => ({ ...prev, overtimeMultiplier: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStructure(prev => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsAdjModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Register One-Off Salary Adjustment</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add bonus, commission, arrears, or penalty deduction to an upcoming payroll.
            </p>

            <form onSubmit={handleSaveAdjustment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employee</label>
                <select
                  value={adjForm.employeeId}
                  onChange={e => setAdjForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payroll Period (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={adjForm.period}
                    onChange={e => setAdjForm(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjForm.type}
                    onChange={e => setAdjForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="bonus">Bonus (+)</option>
                    <option value="commission">Commission (+)</option>
                    <option value="arrears">Arrears (+)</option>
                    <option value="deduction_penalty">Penalty Deduction (-)</option>
                    <option value="manual_adjustment">Manual Adjustment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount ({company.baseCurrency})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjForm.amount}
                  onChange={e => setAdjForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mandatory Justification / Reason
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjForm.reason}
                  onChange={e => setAdjForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for adjustment, authorization reference..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
