import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Building2, 
  UserCheck, 
  Calendar, 
  Menu, 
  X, 
  ChevronDown,
  Globe,
  Coins
} from 'lucide-react';
import { formatHijriDate } from '../../services/saudiCompliance';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { 
    company, 
    employees, 
    currentUser, 
    userRole, 
    switchUserPersona, 
    setActiveTab, 
    activeTab 
  } = useERP();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Current Gregorian & Hijri dates
  const todayIso = new Date().toISOString().slice(0, 10);
  const hijriStr = company.enableHijriDisplay ? formatHijriDate(todayIso) : '';

  // Tab readable title
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'attendance_ledger':
      case 'attendance_matrix': return 'Attendance & Time Ledger Matrix';
      case 'attendance_audit': return 'Attendance Audit Trail & Log';
      case 'attendance_summary':
      case 'attendance_report': return 'Monthly Attendance Summary Report';
      case 'timesheets': return 'Attendance & Time Ledger';
      case 'salary_structures': return 'Employee Salary Structures';
      case 'salary_adjustments': return 'Salary Adjustments & History';
      case 'salary_eosb': return 'Saudi End-of-Service (EOSB) Calculator';
      case 'payroll_dashboard': return 'Payroll Automation Overview';
      case 'payroll_generate': return 'Generate Monthly Payroll Run';
      case 'payroll_register': return 'Payroll Register & Records';
      case 'payroll_approvals': return 'Payroll Review & Approvals';
      case 'payslips': return 'Employee Payslips & Verification';
      case 'payroll_payments': return 'WPS & Payment Records';
      case 'reports': return 'Reporting & Analytics Intelligence';
      case 'employees': return 'Employee Directory & Onboarding';
      case 'departments': return 'Departments & Operating Divisions';
      case 'projects': return 'Enterprise Projects & Cost Centers';
      case 'designations': return 'Job Titles & Designations';
      case 'leave': return 'Leave & Time-Off Management';
      case 'loans': return 'Loans & Salary Advance Registry';
      case 'expenses': return 'Corporate Expenses & Claims';
      case 'categories': return 'Accounting Categories';
      case 'assets': return 'Hardware & IT Asset Procurement';
      case 'template_studio': return 'Template Studio & Print Engine';
      case 'settings': return 'Corporate Identity & Organization Settings';
      case 'rbac': return 'Role-Based Access Control (RBAC)';
      default: return 'Automated Timesheet, Salary & Payroll';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Mobile toggle & Breadcrumb Trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5 truncate">
          <div className="flex items-center gap-2 shrink-0">
            {company.logoUrl ? (
              <img 
                src={company.logoUrl} 
                alt={company.companyName} 
                className="w-7 h-7 rounded object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
            )}
            <span className="font-semibold text-slate-900 text-sm hidden sm:inline whitespace-nowrap">
              {company.companyName.split(' ')[0]} ERP
            </span>
          </div>

          <span className="text-slate-300 text-xs hidden sm:inline">/</span>

          <span className="text-sm font-medium text-slate-700 truncate">
            {getTabTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Zone 2: Date & Base Operating Currency Indicator */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/70">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-slate-700 font-medium">{todayIso}</span>
          {hijriStr && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-medium">{hijriStr}</span>
            </>
          )}
        </div>

        <button 
          onClick={() => setActiveTab('settings')}
          title="Click to configure Base Operating Currency"
          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-md hover:bg-emerald-100 transition-colors"
        >
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">Base: {company.baseCurrency}</span>
          <span className="text-emerald-600 text-[10px] uppercase font-bold">({company.currencySymbol})</span>
        </button>
      </div>

      {/* Zone 3: Operational Persona Switcher & Active User */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowPersonaMenu(!showPersonaMenu)}
          className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left"
          aria-expanded={showPersonaMenu}
        >
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.fullName}
            className="w-7 h-7 rounded-full object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center gap-1">
              {currentUser.fullName}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
              {userRole.replace('_', ' ')}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showPersonaMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPersonaMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Operational Role / Persona
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Experience full ERP workflows as different system roles:
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {employees.map(emp => {
                  const isSelected = emp.id === currentUser.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        switchUserPersona(emp.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/70 text-blue-900 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <img 
                        src={emp.avatarUrl} 
                        alt={emp.fullName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate flex-1">
                        <div className="text-xs truncate flex items-center justify-between">
                          <span>{emp.fullName}</span>
                          {isSelected && <span className="text-[10px] text-blue-600 font-bold shrink-0">ACTIVE</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {emp.role.replace('_', ' ').toUpperCase()} · {emp.departmentId.replace('DEP-', '')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 rounded-b-xl flex items-center justify-between text-[11px] text-slate-500">
                <span>Current ID: <strong className="font-mono text-slate-700">{currentUser.employeeCode}</strong></span>
                <button
                  onClick={() => {
                    setActiveTab('rbac');
                    setShowPersonaMenu(false);
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  View RBAC Matrix
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
