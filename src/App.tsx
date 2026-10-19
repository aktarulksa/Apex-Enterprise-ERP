import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';
import { AttendanceLedgerMatrix } from './components/timesheet/AttendanceLedgerMatrix';
import { SalaryModule } from './components/salary/SalaryModule';
import { PayrollModule } from './components/payroll/PayrollModule';
import { PayslipViewer } from './components/payslip/PayslipViewer';
import { LeaveModule } from './components/leave/LeaveModule';
import { LoansModule } from './components/loans/LoansModule';
import { EmployeeModule } from './components/employees/EmployeeModule';
import { OrgStructureModule } from './components/organization/OrgStructureModule';
import { ExpenseModule } from './components/expenses/ExpenseModule';
import { AssetModule } from './components/assets/AssetModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { TemplateStudio } from './components/templates/TemplateStudio';
import { SettingsModule } from './components/settings/SettingsModule';

const ERPAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useERP();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Navigation state passed to payslip viewer if drilled down from payroll
  const [selectedPayslipPeriod, setSelectedPayslipPeriod] = useState<string | undefined>();
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<string | undefined>();

  const renderActiveModule = () => {
    switch (activeTab) {
      // Attendance & Time Ledger Navigation
      case 'attendance_ledger':
      case 'attendance_matrix':
        return <AttendanceLedgerMatrix initialView="matrix" />;
      case 'attendance_audit':
        return <AttendanceLedgerMatrix initialView="audit" />;
      case 'attendance_summary':
      case 'attendance_report':
        return <AttendanceLedgerMatrix initialView="summary" />;

      // Fallback for timesheet routes if navigated directly
      case 'timesheets':
      case 'timesheets_my':
      case 'timesheets_pending':
      case 'timesheets_overtime':
        return <AttendanceLedgerMatrix initialView="matrix" />;

      // Salary Navigation
      case 'salary_structures':
        return <SalaryModule initialTab="structures" />;
      case 'salary_adjustments':
        return <SalaryModule initialTab="adjustments" />;
      case 'salary_eosb':
        return <SalaryModule initialTab="eosb" />;

      // Payroll Automation Navigation
      case 'payroll_dashboard':
      case 'payroll_generate':
      case 'payroll_register':
      case 'payroll_approvals':
      case 'payroll_payments':
        return (
          <PayrollModule
            initialView="dashboard"
            onNavigateToPayslips={(periodId, empId) => {
              setSelectedPayslipPeriod(periodId);
              setSelectedPayslipEmp(empId);
              setActiveTab('payslips');
            }}
          />
        );
      case 'payslips':
        return (
          <PayslipViewer
            initialPeriodId={selectedPayslipPeriod}
            initialEmployeeId={selectedPayslipEmp}
          />
        );

      // Leave & Loans
      case 'leave':
        return <LeaveModule />;
      case 'loans':
        return <LoansModule />;

      // Organization & HR
      case 'employees':
        return <EmployeeModule />;
      case 'departments':
        return <OrgStructureModule initialTab="departments" />;
      case 'projects':
        return <OrgStructureModule initialTab="projects" />;
      case 'designations':
        return <OrgStructureModule initialTab="designations" />;

      // Finance & Assets
      case 'expenses':
        return <ExpenseModule />;
      case 'categories':
        return <ExpenseModule />;
      case 'assets':
        return <AssetModule />;

      // Reporting & Templates
      case 'reports':
        return <ReportsModule />;
      case 'template_studio':
        return <TemplateStudio />;

      // Settings & RBAC
      case 'settings':
        return <SettingsModule initialTab="organization" />;
      case 'rbac':
        return <SettingsModule initialTab="rbac" />;

      default:
        return <AttendanceLedgerMatrix initialView="matrix" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased">
      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Toast Alert Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <ERPAppContent />
    </ERPProvider>
  );
}
