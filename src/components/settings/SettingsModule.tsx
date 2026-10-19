import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CorporateIdentity, UserRole } from '../../types/erp';
import { 
  Building2, 
  Coins, 
  Clock, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  Landmark, 
  CheckCircle2, 
  Lock,
  Layers,
  Calendar
} from 'lucide-react';
import { DEFAULT_ROLE_PERMISSIONS } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';

interface SettingsModuleProps {
  initialTab?: 'organization' | 'currency' | 'rbac' | 'schedules';
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ initialTab = 'organization' }) => {
  const { 
    company, 
    updateCompany, 
    resetAllData, 
    permissions, 
    userRole,
    currentUser 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'organization' | 'currency' | 'rbac' | 'schedules'>(initialTab);
  const [formState, setFormState] = useState<CorporateIdentity>({ ...company });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(formState);
  };

  const roleList: UserRole[] = ['super_admin', 'hr_manager', 'payroll_officer', 'finance_manager', 'supervisor', 'employee'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Organization Identity, Currency & Security Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure legal entity credentials, global base operating currency, working schedules, and RBAC matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'super_admin' && (
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Seed Data</span>
            </button>
          )}

          {permissions.canManageSettings && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply Globally</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'organization'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Corporate Identity & Legal Entity
        </button>

        <button
          onClick={() => setActiveTab('currency')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'currency'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Base Operating Currency (Global Auto-Sync)
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'schedules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Working Schedules & GOSI Rules
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'rbac'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Role-Based Access Control (RBAC) Matrix
        </button>
      </div>

      {/* TAB 1: CORPORATE IDENTITY */}
      {activeTab === 'organization' && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Legal Entity & Headquarters Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name (English)</label>
                <input
                  type="text"
                  required
                  value={formState.companyName}
                  onChange={e => setFormState(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name (Arabic) / الاسم التجاري</label>
                <input
                  type="text"
                  dir="rtl"
                  value={formState.companyNameArabic}
                  onChange={e => setFormState(prev => ({ ...prev, companyNameArabic: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-arabic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commercial Registration (CR #)</label>
                <input
                  type="text"
                  required
                  value={formState.crNumber}
                  onChange={e => setFormState(prev => ({ ...prev, crNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">VAT / Tax Registration #</label>
                <input
                  type="text"
                  required
                  value={formState.vatNumber}
                  onChange={e => setFormState(prev => ({ ...prev, vatNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Structure</label>
                <input
                  type="text"
                  value={formState.legalEntity}
                  onChange={e => setFormState(prev => ({ ...prev, legalEntity: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Company Email</label>
                <input
                  type="email"
                  value={formState.companyEmail}
                  onChange={e => setFormState(prev => ({ ...prev, companyEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Phone Number</label>
                <input
                  type="tel"
                  value={formState.companyPhone}
                  onChange={e => setFormState(prev => ({ ...prev, companyPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Headquarters Address</label>
              <input
                type="text"
                value={formState.headquarters}
                onChange={e => setFormState(prev => ({ ...prev, headquarters: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Corporate Bank Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Corporate Bank Account Details (WPS Integration)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Bank Name</label>
                <input
                  type="text"
                  required
                  value={formState.bankName}
                  onChange={e => setFormState(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate IBAN</label>
                <input
                  type="text"
                  required
                  value={formState.bankIban}
                  onChange={e => setFormState(prev => ({ ...prev, bankIban: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={formState.bankSwift}
                  onChange={e => setFormState(prev => ({ ...prev, bankSwift: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: BASE OPERATING CURRENCY (AUTO-SYNC RULE) */}
      {activeTab === 'currency' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Base Operating Currency Configuration</span>
            </h3>
            <p className="text-slate-500 mt-1">
              Selecting your organization base currency auto-cascades throughout <strong>all modules</strong>: Compensation structures, Payslip print engine, Ledger accounting, IT Assets, and Financial Reports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR / ر.س)', defaultDesc: 'Default statutory currency for Kingdom of Saudi Arabia' },
              { code: 'USD', symbol: '$', name: 'US Dollar ($)', defaultDesc: 'International global trade reserve currency' },
              { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED / د.إ)', defaultDesc: 'United Arab Emirates operating currency' },
              { code: 'EUR', symbol: '€', name: 'Euro (€)', defaultDesc: 'European Single Market operating currency' }
            ].map(curr => {
              const isSelected = formState.baseCurrency === curr.code;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...formState,
                      baseCurrency: curr.code as any,
                      currencySymbol: curr.symbol
                    };
                    setFormState(updated);
                    updateCompany(updated);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-slate-900">{curr.code}</span>
                    <span className="font-mono text-sm font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {curr.symbol}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 mt-2">{curr.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{curr.defaultDesc}</div>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-900">
                Active Organization Currency: {company.baseCurrency} ({company.currencySymbol})
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                All payslips, payroll totals, overtime costs, loans, and assets are synchronized.
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          </div>
        </div>
      )}

      {/* TAB 3: WORKING SCHEDULES & GOSI */}
      {activeTab === 'schedules' && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Working Schedules & Saudi Overtime Policy</span>
            </h3>
            <p className="text-slate-500 mt-1">
              Configure baseline hours used to derive daily and hourly wages per Saudi Labor Law.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Monthly Days</label>
              <input
                type="number"
                value={formState.standardMonthlyWorkingDays}
                onChange={e => setFormState(prev => ({ ...prev, standardMonthlyWorkingDays: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Usually 30 days in KSA</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Daily Hours</label>
              <input
                type="number"
                value={formState.standardDailyWorkingHours}
                onChange={e => setFormState(prev => ({ ...prev, standardDailyWorkingHours: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Usually 8 hours per day</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Overtime Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={formState.defaultOvertimeMultiplier}
                onChange={e => setFormState(prev => ({ ...prev, defaultOvertimeMultiplier: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Article 107: 1.5x wage</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Holiday / Weekend Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={formState.holidayOvertimeMultiplier}
                onChange={e => setFormState(prev => ({ ...prev, holidayOvertimeMultiplier: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Official holidays: 2.0x</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">GOSI Social Security Contribution Percentages</h4>
            <p className="text-slate-500 mb-3">Statutory contribution rates on (Basic + Housing) wage base.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Saudi Employee Share (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.gosiSaudiEmployeePercent}
                  onChange={e => setFormState(prev => ({ ...prev, gosiSaudiEmployeePercent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standard: 9.75%</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Saudi Employer Share (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.gosiSaudiCompanyPercent}
                  onChange={e => setFormState(prev => ({ ...prev, gosiSaudiCompanyPercent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standard: 11.75%</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expatriate Occupational Hazard (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.gosiNonSaudiCompanyPercent}
                  onChange={e => setFormState(prev => ({ ...prev, gosiNonSaudiCompanyPercent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standard: 2.0% (Company paid)</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Role-Based Access Control (RBAC) Governance Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Active permission privileges enforced across all ERP operations. Separation of duties strictly enforced.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Role Tier</th>
                  <th className="py-2.5 px-3 text-center">View Timesheets</th>
                  <th className="py-2.5 px-3 text-center">Approve Timesheets</th>
                  <th className="py-2.5 px-3 text-center">Manage Salary</th>
                  <th className="py-2.5 px-3 text-center">Generate Payroll</th>
                  <th className="py-2.5 px-3 text-center">Approve Payroll</th>
                  <th className="py-2.5 px-3 text-center">Finalize / Lock</th>
                  <th className="py-2.5 px-3 text-center">Disburse Payment</th>
                  <th className="py-2.5 px-3 text-center">Manage Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roleList.map(roleKey => {
                  const perm = DEFAULT_ROLE_PERMISSIONS[roleKey];
                  const isCurrentRole = userRole === roleKey;

                  return (
                    <tr key={roleKey} className={isCurrentRole ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{perm.label}</span>
                          {isCurrentRole && (
                            <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">{perm.description}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">{perm.canViewAllTimesheets ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{perm.canApproveTimesheets ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{perm.canManageSalary ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{perm.canGeneratePayroll ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-700">{perm.canApprovePayroll ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-700">{perm.canFinalizePayroll ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{perm.canRecordPayment ? '✓' : '—'}</td>
                      <td className="py-2.5 px-3 text-center">{perm.canManageEmployees ? '✓' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmModal
        isOpen={resetConfirmOpen}
        title="Reset Entire ERP to Factory Seed State"
        message="This will re-initialize all timesheets, salary structures, payroll runs, loans, and settings to the clean enterprise factory baseline. Proceed?"
        confirmLabel="Reset Everything"
        isDestructive={true}
        onConfirm={() => {
          resetAllData();
          setResetConfirmOpen(false);
          setFormState({ ...company });
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};
