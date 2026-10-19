import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Clock, 
  DollarSign, 
  CreditCard, 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  Building, 
  Layers, 
  Briefcase, 
  Receipt, 
  Laptop, 
  Printer, 
  Settings, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  Calculator,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: Array<{
    id: string;
    label: string;
    badge?: number;
    requiresAdmin?: boolean;
    requiresSupervisor?: boolean;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    activeTab, 
    setActiveTab, 
    company, 
    timesheets, 
    leaves, 
    expenses, 
    payrollPeriods, 
    userRole,
    currentUser
  } = useERP();

  // Pending counts for live badges (unboxed text)
  const pendingTimesheetsCount = timesheets.filter(t => t.status === 'submitted').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const pendingExpensesCount = expenses.filter(e => e.status === 'pending').length;
  const calculatedPayrollCount = payrollPeriods.filter(p => p.status === 'calculated' || p.status === 'pending_approval').length;

  // Track expanded menu categories
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    attendance_ledger: true,
    salary: true,
    payroll: true,
    leave_loans: true,
    organization: true,
    finance: true,
    templates: true,
    settings: true
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navSections: Array<{ key: string; title: string; icon: React.ElementType; items: Array<{ id: string; label: string; badge?: number }> }> = [
    {
      key: 'attendance_ledger',
      title: 'Attendance & Time Ledger',
      icon: CalendarCheck,
      items: [
        { id: 'attendance_ledger', label: 'Monthly Timesheet Matrix' },
        { id: 'attendance_audit', label: 'Audit Trail & Log' },
        { id: 'attendance_summary', label: 'Monthly Summary Report' }
      ]
    },
    {
      key: 'salary',
      title: 'Salary Management',
      icon: DollarSign,
      items: [
        { id: 'salary_structures', label: 'Salary Structures' },
        { id: 'salary_adjustments', label: 'Salary History & Adjustments' },
        { id: 'salary_eosb', label: 'Saudi EOSB Gratuity' }
      ]
    },
    {
      key: 'payroll',
      title: 'Payroll Automation',
      icon: CreditCard,
      items: [
        { id: 'payroll_dashboard', label: 'Payroll Dashboard' },
        { id: 'payroll_generate', label: 'Generate Payroll' },
        { id: 'payroll_register', label: 'Payroll Register' },
        { id: 'payroll_approvals', label: 'Payroll Approvals', badge: calculatedPayrollCount },
        { id: 'payslips', label: 'Employee Payslips & Statements' },
        { id: 'payroll_payments', label: 'Payment Records (WPS)' },
        { id: 'reports', label: 'Payroll Analytics' }
      ]
    },
    {
      key: 'leave_loans',
      title: 'Leave & Loans',
      icon: CalendarCheck,
      items: [
        { id: 'leave', label: 'Leave & Time-Off', badge: pendingLeavesCount },
        { id: 'loans', label: 'Loans & Advances' }
      ]
    },
    {
      key: 'organization',
      title: 'Organization & HR',
      icon: Users,
      items: [
        { id: 'employees', label: 'Employee Directory' },
        { id: 'departments', label: 'Operating Departments' },
        { id: 'projects', label: 'Enterprise Projects' },
        { id: 'designations', label: 'Job Titles & Designations' }
      ]
    },
    {
      key: 'finance',
      title: 'Corporate Finance',
      icon: Receipt,
      items: [
        { id: 'expenses', label: 'Expenses & Claims', badge: pendingExpensesCount },
        { id: 'categories', label: 'Accounting Categories' },
        { id: 'assets', label: 'IT & Hardware Assets' }
      ]
    },
    {
      key: 'templates',
      title: 'Template & Print Engine',
      icon: Printer,
      items: [
        { id: 'template_studio', label: 'Template Studio' }
      ]
    },
    {
      key: 'settings',
      title: 'System & Security',
      icon: Settings,
      items: [
        { id: 'settings', label: 'Organization & Currency' },
        { id: 'rbac', label: 'Role-Based Access (RBAC)' }
      ]
    }
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            {company.logoUrl ? (
              <img 
                src={company.logoUrl} 
                alt="Logo" 
                className="w-7 h-7 rounded object-cover border border-slate-700" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-none">
                Apex Enterprise ERP
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                KSA Labor & Payroll
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-3.5 py-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                <span className="capitalize">{userRole.replace('_', ' ')}</span>
                <span>·</span>
                <span className="font-mono">{currentUser.employeeCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navSections.map(section => {
            const isExpanded = expandedSections[section.key] ?? true;
            const SectionIcon = section.icon;

            return (
              <div key={section.key} className="py-0.5">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <SectionIcon className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 pl-6 space-y-0.5 border-l border-slate-800 ml-4">
                    {section.items.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left ${
                            isActive
                              ? 'bg-blue-600 text-white font-medium shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span 
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer info & base currency */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60 shrink-0">
          <div className="flex items-center justify-between">
            <span>Operating Currency:</span>
            <strong className="text-white font-mono">{company.baseCurrency} ({company.currencySymbol})</strong>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 truncate">
            CR #{company.crNumber} · Riyadh
          </div>
        </div>
      </aside>
    </>
  );
};
