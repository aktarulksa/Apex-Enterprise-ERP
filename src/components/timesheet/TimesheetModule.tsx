import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { TimesheetEntry } from '../../types/erp';
import { 
  Clock, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Lock, 
  FileDown, 
  Printer, 
  Search, 
  Calendar,
  AlertTriangle,
  User,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import { calculateTimesheetHours, calculateLateArrivalMinutes, calculateEarlyDepartureMinutes } from '../../services/payrollCalculator';
import { ConfirmModal } from '../common/ConfirmModal';

interface TimesheetModuleProps {
  initialFilter?: 'all' | 'my' | 'pending' | 'overtime';
}

export const TimesheetModule: React.FC<TimesheetModuleProps> = ({ initialFilter = 'all' }) => {
  const { 
    timesheets, 
    employees, 
    currentUser, 
    permissions, 
    addTimesheet, 
    updateTimesheet, 
    deleteTimesheet,
    submitTimesheet,
    approveTimesheet,
    rejectTimesheet,
    bulkApproveTimesheets,
    formatCurrency,
    company
  } = useERP();

  // Filters
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'pending' | 'overtime'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [rejectModalState, setRejectModalState] = useState<{ isOpen: boolean; id: string; reason: string }>({
    isOpen: false,
    id: '',
    reason: ''
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for creating/editing timesheet
  const [formState, setFormState] = useState<{
    employeeId: string;
    workDate: string;
    shift: 'morning' | 'evening' | 'night' | 'custom';
    scheduledStart: string;
    scheduledEnd: string;
    checkIn: string;
    checkOut: string;
    breakMinutes: number;
    employeeRemarks: string;
  }>({
    employeeId: currentUser.id,
    workDate: new Date().toISOString().slice(0, 10),
    shift: 'morning',
    scheduledStart: '08:00',
    scheduledEnd: '17:00',
    checkIn: '08:00',
    checkOut: '17:00',
    breakMinutes: 60,
    employeeRemarks: ''
  });

  // Dynamic preview calculations for modal
  const previewCalc = useMemo(() => {
    const { totalHours, regularHours, overtimeHours } = calculateTimesheetHours(
      formState.checkIn,
      formState.checkOut,
      formState.breakMinutes,
      8
    );
    const lateMinutes = calculateLateArrivalMinutes(formState.checkIn, formState.scheduledStart);
    const earlyMinutes = calculateEarlyDepartureMinutes(formState.checkOut, formState.scheduledEnd);
    return { totalHours, regularHours, overtimeHours, lateMinutes, earlyMinutes };
  }, [formState]);

  // Filtered dataset
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(t => {
      // Role scoping: ordinary employees can ONLY view their own records
      if (!permissions.canViewAllTimesheets && t.employeeId !== currentUser.id) {
        return false;
      }

      if (filterMode === 'my' && t.employeeId !== currentUser.id) return false;
      if (filterMode === 'pending' && t.status !== 'submitted') return false;
      if (filterMode === 'overtime' && (t.overtimeHours <= 0 || t.status !== 'approved')) return false;

      if (departmentFilter !== 'all' && t.department !== departmentFilter) return false;
      if (dateFilter && t.workDate !== dateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emp = employees.find(e => e.id === t.employeeId);
        const nameMatch = (emp?.fullName || t.employeeName).toLowerCase().includes(q);
        const codeMatch = (emp?.employeeCode || '').toLowerCase().includes(q);
        const idMatch = t.id.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !idMatch) return false;
      }

      return true;
    });
  }, [timesheets, filterMode, searchQuery, departmentFilter, dateFilter, currentUser, permissions, employees]);

  // Handle Form Submit
  const handleSaveTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === formState.employeeId) || currentUser;

    const { totalHours, regularHours, overtimeHours } = calculateTimesheetHours(
      formState.checkIn,
      formState.checkOut,
      formState.breakMinutes,
      8
    );
    const lateMinutes = calculateLateArrivalMinutes(formState.checkIn, formState.scheduledStart);
    const earlyDepartureMinutes = calculateEarlyDepartureMinutes(formState.checkOut, formState.scheduledEnd);

    addTimesheet({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      department: targetEmp.departmentId,
      designation: targetEmp.designationId,
      projectId: targetEmp.projectId,
      workDate: formState.workDate,
      shift: formState.shift,
      scheduledStart: formState.scheduledStart,
      scheduledEnd: formState.scheduledEnd,
      checkIn: formState.checkIn,
      checkOut: formState.checkOut,
      breakMinutes: formState.breakMinutes,
      regularHours,
      overtimeHours,
      lateMinutes,
      earlyDepartureMinutes,
      totalHours,
      status: 'submitted',
      employeeRemarks: formState.employeeRemarks,
      submittedBy: currentUser.fullName
    });

    setIsEntryModalOpen(false);
  };

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTimesheets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTimesheets.map(t => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Timesheet ID', 'Date', 'Employee Code', 'Employee Name', 'Shift', 'Check-In', 'Check-Out', 'Break (min)', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Late (min)', 'Status'];
    const rows = filteredTimesheets.map(t => {
      const emp = employees.find(e => e.id === t.employeeId);
      return [
        t.id,
        t.workDate,
        emp?.employeeCode || t.employeeId,
        `"${emp?.fullName || t.employeeName}"`,
        t.shift,
        t.checkIn,
        t.checkOut,
        t.breakMinutes,
        t.regularHours,
        t.overtimeHours,
        t.totalHours,
        t.lateMinutes,
        t.status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timesheets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Primary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Employee Timesheet & Attendance Module
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift logging, cross-midnight calculations, break deductions, and automated overtime tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={() => {
              setFormState({
                employeeId: currentUser.id,
                workDate: new Date().toISOString().slice(0, 10),
                shift: 'morning',
                scheduledStart: '08:00',
                scheduledEnd: '17:00',
                checkIn: '08:00',
                checkOut: '17:00',
                breakMinutes: 60,
                employeeRemarks: ''
              });
              setIsEntryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Timesheet</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Timesheets ({timesheets.length})
          </button>

          <button
            onClick={() => setFilterMode('my')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'my'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Timesheets ({timesheets.filter(t => t.employeeId === currentUser.id).length})
          </button>

          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'pending'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Approvals ({timesheets.filter(t => t.status === 'submitted').length})
          </button>

          <button
            onClick={() => setFilterMode('overtime')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'overtime'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved Overtime ({timesheets.filter(t => t.overtimeHours > 0 && t.status === 'approved').length})
          </button>
        </div>

        {/* Bulk Approval Action */}
        {permissions.canApproveTimesheets && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => {
                bulkApproveTimesheets(selectedIds);
                setSelectedIds([]);
              }}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Bulk Approve Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Secondary Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee name, code, or timesheet ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            <option value="DEP-EXEC">Executive Leadership</option>
            <option value="DEP-HR">Human Resources</option>
            <option value="DEP-ENG">Enterprise Engineering</option>
            <option value="DEP-FIN">Corporate Finance</option>
            <option value="DEP-OPS">Field Operations</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Timesheet Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredTimesheets.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Date & Shift</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Check-In / Out</th>
                <th className="py-3 px-3 text-right">Regular Hrs</th>
                <th className="py-3 px-3 text-right">Overtime</th>
                <th className="py-3 px-3 text-right">Lateness</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No timesheets found matching your query</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting filters or log a new timesheet record.</p>
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map(t => {
                  const emp = employees.find(e => e.id === t.employeeId);
                  const isPending = t.status === 'submitted';
                  const isApproved = t.status === 'approved';
                  const isRejected = t.status === 'rejected';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t.id)}
                          onChange={() => toggleSelectOne(t.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-medium text-slate-800">{t.workDate}</div>
                        <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                          <span>{t.shift} shift</span>
                          {t.shift === 'night' && <span className="text-[10px] text-purple-600 font-bold">(Overnight)</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-medium text-slate-800">{emp?.fullName || t.employeeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {emp?.employeeCode} · {t.department.replace('DEP-', '')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="text-slate-800">{t.checkIn} → {t.checkOut}</div>
                        <div className="text-[10px] text-slate-400">{t.breakMinutes}m break deduction</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700 tabular-nums">
                        {t.regularHours.toFixed(2)}h
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {t.overtimeHours > 0 ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{t.overtimeHours.toFixed(2)}h
                          </span>
                        ) : (
                          <span className="text-slate-400">0.00h</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {t.lateMinutes > 0 ? (
                          <span className="text-amber-700 font-medium">
                            {t.lateMinutes}m late
                          </span>
                        ) : (
                          <span className="text-slate-400">On-time</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Submitted
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            Rejected
                          </span>
                        )}
                        {t.status === 'draft' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approval Actions */}
                          {permissions.canApproveTimesheets && isPending && (
                            <>
                              <button
                                onClick={() => approveTimesheet(t.id)}
                                title="Approve Timesheet"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectModalState({ isOpen: true, id: t.id, reason: '' })}
                                title="Reject & Return for Correction"
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Submit Action for Draft */}
                          {t.status === 'draft' && (
                            <button
                              onClick={() => submitTimesheet(t.id)}
                              className="px-2 py-1 text-[11px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                              Submit
                            </button>
                          )}

                          {/* Delete permitted records */}
                          {(!t.isLocked || permissions.canManageSettings) && (
                            <button
                              onClick={() => setDeleteConfirmId(t.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete record"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Timesheet Modal */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsEntryModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Log Employee Timesheet Entry
                </h2>
              </div>
              <button 
                onClick={() => setIsEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTimesheet} className="p-5 space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee
                </label>
                {permissions.canManageSettings || permissions.canApproveTimesheets ? (
                  <select
                    value={formState.employeeId}
                    onChange={e => setFormState(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.fullName} ({emp.departmentId.replace('DEP-', '')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.employeeCode} - ${currentUser.fullName}`}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Date & Shift */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.workDate}
                    onChange={e => setFormState(prev => ({ ...prev, workDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Shift
                  </label>
                  <select
                    value={formState.shift}
                    onChange={e => {
                      const shift = e.target.value as any;
                      let scheduledStart = '08:00';
                      let scheduledEnd = '17:00';
                      if (shift === 'night') {
                        scheduledStart = '22:00';
                        scheduledEnd = '07:00';
                      } else if (shift === 'evening') {
                        scheduledStart = '16:00';
                        scheduledEnd = '01:00';
                      }
                      setFormState(prev => ({ ...prev, shift, scheduledStart, scheduledEnd }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="morning">Morning Shift (08:00 - 17:00)</option>
                    <option value="evening">Evening Shift (16:00 - 01:00)</option>
                    <option value="night">Night Shift (22:00 - 07:00)</option>
                    <option value="custom">Custom Shift</option>
                  </select>
                </div>
              </div>

              {/* Check In / Out and Break */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Check-In
                  </label>
                  <input
                    type="time"
                    required
                    value={formState.checkIn}
                    onChange={e => setFormState(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Check-Out
                  </label>
                  <input
                    type="time"
                    required
                    value={formState.checkOut}
                    onChange={e => setFormState(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Break Duration
                  </label>
                  <select
                    value={formState.breakMinutes}
                    onChange={e => setFormState(prev => ({ ...prev, breakMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes</option>
                    <option value={0}>0 minutes</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Live Calculation Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Engine Calculated Hours</span>
                  <span className="font-mono text-blue-700">{previewCalc.totalHours} Total Hours</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-600">
                  <div>Regular: <strong className="text-slate-800">{previewCalc.regularHours}h</strong></div>
                  <div>Overtime: <strong className="text-emerald-700">+{previewCalc.overtimeHours}h</strong></div>
                  <div>Lateness: <strong className="text-amber-700">{previewCalc.lateMinutes}m</strong></div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Remarks / Work Summary
                </label>
                <textarea
                  rows={2}
                  value={formState.employeeRemarks}
                  onChange={e => setFormState(prev => ({ ...prev, employeeRemarks: e.target.value }))}
                  placeholder="Detail tasks performed or reasons for overtime..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Save & Submit Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setRejectModalState({ isOpen: false, id: '', reason: '' })}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Return Timesheet for Correction</h3>
            <p className="text-xs text-slate-500 mt-1">Please provide mandatory supervisor remarks explaining what needs correction.</p>
            <textarea
              rows={3}
              value={rejectModalState.reason}
              onChange={e => setRejectModalState(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Overtime not pre-approved by PMO, please adjust checkout..."
              className="w-full mt-3 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectModalState({ isOpen: false, id: '', reason: '' })}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                disabled={!rejectModalState.reason.trim()}
                onClick={() => {
                  rejectTimesheet(rejectModalState.id, rejectModalState.reason);
                  setRejectModalState({ isOpen: false, id: '', reason: '' });
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Timesheet Record"
        message="Are you sure you want to delete this timesheet entry? This action is traceable and cannot be undone."
        confirmLabel="Delete Record"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteTimesheet(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
