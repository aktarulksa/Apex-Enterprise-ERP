import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee } from '../../types/erp';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Building2, 
  ShieldCheck, 
  Briefcase, 
  Globe, 
  Calendar, 
  CreditCard, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  DollarSign
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

const NATIONALITIES = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Qatar',
  'Egypt',
  'Jordan',
  'Lebanon',
  'Philippines',
  'India',
  'Pakistan',
  'Bangladesh',
  'United Kingdom',
  'United States',
  'Canada',
  'France',
  'Germany'
];

export const EmployeeModule: React.FC = () => {
  const { 
    employees, 
    departments, 
    designations, 
    projects, 
    currentUser, 
    permissions, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    formatCurrency, 
    company 
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');

  // Modals
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Omit<Employee, 'id' | 'employeeCode'>>({
    fullName: '',
    fullNameArabic: '',
    email: '',
    phone: '',
    avatarUrl: '/src/assets/images/avatar_ahmed_alharbi_1791893577005.jpg',
    departmentId: 'DEP-ENG',
    designationId: 'DES-06',
    projectId: 'PRJ-101',
    role: 'employee',
    nationality: 'Saudi Arabia',
    isSaudiNational: true,
    iqamaOrNationalId: '',
    passportNumber: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    contractType: 'unlimited',
    shiftType: 'morning',
    basicSalary: 12000,
    housingAllowance: 3000,
    transportAllowance: 1200,
    foodAllowance: 600,
    otherFixedAllowance: 500,
    bankName: 'Al Rajhi Bank',
    iban: 'SA',
    status: 'active'
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (departmentFilter !== 'all' && emp.departmentId !== departmentFilter) return false;
      if (nationalityFilter !== 'all' && emp.nationality !== nationalityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = emp.fullName.toLowerCase().includes(q) ||
          emp.employeeCode.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.iqamaOrNationalId.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [employees, departmentFilter, nationalityFilter, searchQuery]);

  const handleOpenOnboarding = () => {
    setEditingEmployee(null);
    setFormState({
      fullName: '',
      fullNameArabic: '',
      email: '',
      phone: '+966 5',
      avatarUrl: '/src/assets/images/avatar_david_chen_1791893578060.jpg',
      departmentId: departments[0]?.id || 'DEP-ENG',
      designationId: designations[0]?.id || 'DES-06',
      projectId: projects[0]?.id || 'PRJ-101',
      role: 'employee',
      nationality: 'Saudi Arabia',
      isSaudiNational: true,
      iqamaOrNationalId: '',
      passportNumber: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      contractType: 'unlimited',
      shiftType: 'morning',
      basicSalary: 12000,
      housingAllowance: 3000,
      transportAllowance: 1200,
      foodAllowance: 600,
      otherFixedAllowance: 500,
      bankName: 'Al Rajhi Bank',
      iban: 'SA4480000',
      status: 'active'
    });
    setIsOnboardingModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormState({
      fullName: emp.fullName,
      fullNameArabic: emp.fullNameArabic || '',
      email: emp.email,
      phone: emp.phone,
      avatarUrl: emp.avatarUrl,
      departmentId: emp.departmentId,
      designationId: emp.designationId,
      projectId: emp.projectId || '',
      role: emp.role,
      nationality: emp.nationality,
      isSaudiNational: emp.isSaudiNational,
      iqamaOrNationalId: emp.iqamaOrNationalId,
      passportNumber: emp.passportNumber,
      joiningDate: emp.joiningDate,
      contractType: emp.contractType,
      shiftType: emp.shiftType,
      basicSalary: emp.basicSalary,
      housingAllowance: emp.housingAllowance,
      transportAllowance: emp.transportAllowance,
      foodAllowance: emp.foodAllowance,
      otherFixedAllowance: emp.otherFixedAllowance,
      bankName: emp.bankName,
      iban: emp.iban,
      status: emp.status
    });
    setIsOnboardingModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isSaudi = formState.nationality === 'Saudi Arabia';

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        ...formState,
        isSaudiNational: isSaudi
      });
    } else {
      addEmployee({
        ...formState,
        employeeCode: `EMP-${1000 + employees.length + 1}`,
        isSaudiNational: isSaudi
      });
    }

    setIsOnboardingModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Employee Directory & Onboarding
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personnel profiles with National ID / Iqama, Passport, Department, Designation, Salary, and RBAC tiers.
          </p>
        </div>

        {permissions.canManageEmployees && (
          <button
            onClick={handleOpenOnboarding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Onboard New Employee</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee by name, code, email, ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={nationalityFilter}
            onChange={e => setNationalityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          >
            <option value="all">All Nationalities</option>
            {NATIONALITIES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredEmployees.map(emp => {
          const dept = departments.find(d => d.id === emp.departmentId);
          const des = designations.find(d => d.id === emp.designationId);
          const totalFixed = emp.basicSalary + emp.housingAllowance + emp.transportAllowance + emp.foodAllowance + emp.otherFixedAllowance;

          return (
            <div
              key={emp.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                        {emp.fullName}
                      </h3>
                      {emp.fullNameArabic && (
                        <div className="text-[11px] text-slate-500 font-arabic" dir="rtl">
                          {emp.fullNameArabic}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-blue-700 mt-0.5">
                        {emp.employeeCode} · {emp.role.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-slate-800 truncate">{dept?.name || emp.departmentId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Designation:</span>
                    <span className="font-medium text-slate-800 truncate">{des?.title || emp.designationId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nationality & ID:</span>
                    <span className="font-mono text-slate-800">
                      {emp.nationality} ({emp.iqamaOrNationalId})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Joined:</span>
                    <span className="font-mono text-slate-700">{emp.joiningDate}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                    <span className="text-slate-400">Total Fixed Pay:</span>
                    <span className="font-mono font-bold text-blue-900">
                      {formatCurrency(totalFixed)}
                    </span>
                  </div>
                </div>
              </div>

              {permissions.canManageEmployees && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded"
                    title="Edit Employee & Salary"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(emp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Terminate Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Onboarding & Edit Modal */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsOnboardingModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto p-6 z-10">
            <h2 className="text-base font-bold text-slate-900">
              {editingEmployee ? `Edit Profile: ${editingEmployee.fullName}` : 'Onboard New Employee'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter identity, contract, nationality, bank details, and compensation package.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={e => setFormState(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    placeholder="e.g. Faisal Al-Shammari"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (Arabic) / الاسم بالعربي</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formState.fullNameArabic}
                    onChange={e => setFormState(prev => ({ ...prev, fullNameArabic: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-arabic"
                    placeholder="مثال: فيصل الشمري"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email</label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={e => setFormState(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={formState.phone}
                    onChange={e => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Nationality Dropdown & IDs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality</label>
                  <select
                    value={formState.nationality}
                    onChange={e => {
                      const nat = e.target.value;
                      setFormState(prev => ({
                        ...prev,
                        nationality: nat,
                        isSaudiNational: nat === 'Saudi Arabia'
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {NATIONALITIES.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {formState.nationality === 'Saudi Arabia' ? 'National ID (الهوية)' : 'Iqama Number (الإقامة)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.iqamaOrNationalId}
                    onChange={e => setFormState(prev => ({ ...prev, iqamaOrNationalId: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="10 digits..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={formState.passportNumber}
                    onChange={e => setFormState(prev => ({ ...prev, passportNumber: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Department, Designation, Role */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formState.departmentId}
                    onChange={e => setFormState(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <select
                    value={formState.designationId}
                    onChange={e => setFormState(prev => ({ ...prev, designationId: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Access Tier</label>
                  <select
                    value={formState.role}
                    onChange={e => setFormState(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="super_admin">Super Administrator</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="payroll_officer">Payroll Officer</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="supervisor">Operational Supervisor</option>
                    <option value="employee">Standard Employee</option>
                  </select>
                </div>
              </div>

              {/* Joining Date, Contract, Shift */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formState.joiningDate}
                    onChange={e => setFormState(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Type</label>
                  <select
                    value={formState.contractType}
                    onChange={e => setFormState(prev => ({ ...prev, contractType: e.target.value as any }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unlimited">Unlimited Term</option>
                    <option value="limited">Fixed Term Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Shift</label>
                  <select
                    value={formState.shiftType}
                    onChange={e => setFormState(prev => ({ ...prev, shiftType: e.target.value as any }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="morning">Morning (08:00 - 17:00)</option>
                    <option value="evening">Evening (16:00 - 01:00)</option>
                    <option value="night">Night (22:00 - 07:00)</option>
                    <option value="flexible">Flexible Shift</option>
                  </select>
                </div>
              </div>

              {/* Compensation Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Monthly Compensation Package ({company.baseCurrency})</span>
                  <span className="text-[11px] font-mono text-blue-700">
                    GOSI Status: {formState.isSaudiNational ? 'Saudi 9.75% / 11.75%' : 'Expat 2%'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Basic Salary</label>
                    <input
                      type="number"
                      required
                      value={formState.basicSalary}
                      onChange={e => setFormState(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Housing Allowance</label>
                    <input
                      type="number"
                      value={formState.housingAllowance}
                      onChange={e => setFormState(prev => ({ ...prev, housingAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Transport Allowance</label>
                    <input
                      type="number"
                      value={formState.transportAllowance}
                      onChange={e => setFormState(prev => ({ ...prev, transportAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Food Allowance</label>
                    <input
                      type="number"
                      value={formState.foodAllowance}
                      onChange={e => setFormState(prev => ({ ...prev, foodAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Other Fixed Allowances</label>
                    <input
                      type="number"
                      value={formState.otherFixedAllowance}
                      onChange={e => setFormState(prev => ({ ...prev, otherFixedAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={formState.bankName}
                    onChange={e => setFormState(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN (Saudi Bank Format)</label>
                  <input
                    type="text"
                    required
                    value={formState.iban}
                    onChange={e => setFormState(prev => ({ ...prev, iban: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  {editingEmployee ? 'Update Profile' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Terminate Employee Profile"
        message="Are you sure you want to change this employee's status to Terminated? Their historical timesheets, salary records, and payslips will remain preserved for audit."
        confirmLabel="Terminate Employee"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteEmployee(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
