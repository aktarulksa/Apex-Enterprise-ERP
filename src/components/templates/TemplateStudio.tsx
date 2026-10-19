import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Printer, 
  Sparkles, 
  Layout, 
  Palette, 
  Eye, 
  Check, 
  QrCode, 
  Building2, 
  Globe 
} from 'lucide-react';

export const TemplateStudio: React.FC = () => {
  const { 
    printConfig, 
    updatePrintConfig, 
    company, 
    employees, 
    payrollPeriods, 
    formatCurrency 
  } = useERP();

  const previewRecord = payrollPeriods[0]?.records[0];
  const previewEmp = employees[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Template Studio & Document Print Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise document layouts, bilingual Arabic typography, and QR verification for single and batch prints.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Test Print Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Sidebar (Hidden during print) */}
        <div className="no-print space-y-4">
          {/* Template Styles */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-600" />
              <span>Design Layout Style</span>
            </h3>

            <div className="space-y-2">
              {[
                { id: 'classic_enterprise', label: 'Classic Corporate Enterprise', desc: 'Standard navy header with two-column balance' },
                { id: 'modern_clean', label: 'Modern Minimalist Executive', desc: 'Clean border lines and airy typographic spacing' },
                { id: 'saudi_wps', label: 'Saudi WPS Compliance Standard', desc: 'Official Wage Protection & MOL regulatory layout' }
              ].map(tmpl => {
                const isSelected = printConfig.templateStyle === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => updatePrintConfig({ templateStyle: tmpl.id as any })}
                    className={`w-full p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{tmpl.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tmpl.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Document Elements</span>
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700 font-medium">Display Company Logo</span>
                <input
                  type="checkbox"
                  checked={printConfig.showCompanyLogo}
                  onChange={e => updatePrintConfig({ showCompanyLogo: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700 font-medium">Bilingual Arabic Headers (En / Ar)</span>
                <input
                  type="checkbox"
                  checked={printConfig.showArabicHeaders}
                  onChange={e => updatePrintConfig({ showArabicHeaders: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700 font-medium">Digital QR Verification Stamp</span>
                <input
                  type="checkbox"
                  checked={printConfig.showQrCode}
                  onChange={e => updatePrintConfig({ showQrCode: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700 font-medium">Include Bank IBAN & Details</span>
                <input
                  type="checkbox"
                  checked={printConfig.showBankDetails}
                  onChange={e => updatePrintConfig({ showBankDetails: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                <span className="text-slate-700 font-medium">Detailed Overtime Breakdown</span>
                <input
                  type="checkbox"
                  checked={printConfig.showOvertimeBreakdown}
                  onChange={e => updatePrintConfig({ showOvertimeBreakdown: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="no-print flex items-center justify-between pb-3 text-xs text-slate-500 font-medium">
              <span>Interactive Live Preview ({printConfig.templateStyle.replace('_', ' ').toUpperCase()})</span>
              <span>A4 Vector Rendering</span>
            </div>

            {/* Template Document Body */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-sm text-xs print-container">
              {/* Header */}
              <div className="flex items-start justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  {printConfig.showCompanyLogo && company.logoUrl && (
                    <img
                      src={company.logoUrl}
                      alt="Logo"
                      className="w-12 h-12 rounded object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {company.companyName}
                    </h2>
                    {printConfig.showArabicHeaders && (
                      <p className="text-[11px] text-slate-600 font-arabic mt-0.5" dir="rtl">
                        {company.companyNameArabic}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1">
                      CR: {company.crNumber} · Riyadh, Kingdom of Saudi Arabia
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Official Salary Statement
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1">
                    October 2026 Payroll
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold uppercase mt-0.5">
                    Verified Paid (WPS)
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Employee</div>
                  <div className="font-bold text-slate-900 mt-0.5">{previewEmp?.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">ID & Code</div>
                  <div className="font-mono text-slate-800 mt-0.5">{previewEmp?.employeeCode} · {previewEmp?.iqamaOrNationalId}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Department</div>
                  <div className="text-slate-800 mt-0.5">{previewEmp?.departmentId.replace('DEP-', '')}</div>
                </div>
                {printConfig.showBankDetails && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Bank IBAN</div>
                    <div className="font-mono text-[10px] text-slate-800 mt-0.5 truncate">{previewEmp?.iban}</div>
                  </div>
                )}
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-4 my-5 text-xs">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">Earnings ({company.baseCurrency})</div>
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Salary:</span>
                    <span className="font-mono">{formatCurrency(previewRecord?.basicSalary || 28000)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Housing Allowance:</span>
                    <span className="font-mono">{formatCurrency(previewRecord?.housingAllowance || 7000)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Transportation:</span>
                    <span className="font-mono">{formatCurrency(previewRecord?.transportAllowance || 2500)}</span>
                  </div>
                  {printConfig.showOvertimeBreakdown && (
                    <div className="flex justify-between text-emerald-800 bg-emerald-50/50 p-1 rounded">
                      <span>Approved Overtime (2.5h):</span>
                      <span className="font-mono font-bold">+SAR 437.50</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Gross Pay:</span>
                    <span className="font-mono">{formatCurrency(37937.50)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">Deductions ({company.baseCurrency})</div>
                  <div className="flex justify-between text-slate-600">
                    <span>GOSI Social Security (9.75%):</span>
                    <span className="font-mono text-red-700">-SAR 3,412.50</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Unpaid Leave / Absences:</span>
                    <span className="font-mono">SAR 0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-slate-100">
                    <span>Total Deductions:</span>
                    <span className="font-mono">-SAR 3,412.50</span>
                  </div>
                </div>
              </div>

              {/* Net Disbursed Salary */}
              <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider">Net Disbursed Take-Home Salary</span>
                <span className="text-xl font-extrabold font-mono">{formatCurrency(34525.00)}</span>
              </div>

              {/* Footer Stamp */}
              {printConfig.showQrCode && (
                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-7 h-7 text-slate-800" />
                    <div>
                      <div className="font-bold text-slate-700">Digital WPS Hash</div>
                      <div className="font-mono text-[9px] text-slate-400">APEX-DOC-VERIFIED-2026</div>
                    </div>
                  </div>
                  <div className="text-right">
                    Corporate Treasury & Human Resources
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
