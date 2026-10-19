import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LeaveRequest } from '../../types/erp';
import { 
  CalendarCheck, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  User
} from 'lucide-react';

export const LeaveModule: React.FC = () => {
  const { 
    leaves, 
    employees, 
    currentUser, 
    userRole, 
    permissions, 
    addLeaveRequest, 
    approveLeaveRequest, 
    rejectLeaveRequest 
  } = useERP();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const [formState, setFormState] = useState<{
    employeeId: string;
    leaveType: 'annual' | 'sick' | 'unpaid' | 'emergency' | 'maternity' | 'hajj';
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }>({
    employeeId: currentUser.id,
    leaveType: 'annual',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    totalDays: 1,
    reason: ''
  });

  // Calculate days difference
  const handleDateChange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    let diffDays = 1;
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const diffTime = e.getTime() - s.getTime();
      diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
    setFormState(prev => ({ ...prev, startDate: start, endDate: end, totalDays: diffDays }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === formState.employeeId) || currentUser;
    const isPaid = formState.leaveType !== 'unpaid';

    addLeaveRequest({
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      leaveType: formState.leaveType,
      startDate: formState.startDate,
      endDate: formState.endDate,
      totalDays: formState.totalDays,
      isPaid,
      reason: formState.reason
    });

    setIsApplyModalOpen(false);
    setFormState({
      employeeId: currentUser.id,
      leaveType: 'annual',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      totalDays: 1,
      reason: ''
    });
  };

  // Only Super Admin & HR Manager can approve or reject leaves per prompt requirements
  const canApprove = userRole === 'super_admin' || userRole === 'hr_manager';

  const filteredLeaves = leaves.filter(l => {
    if (!permissions.canViewAllTimesheets && l.employeeId !== currentUser.id) {
      return false;
    }
    if (filterType !== 'all' && l.leaveType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual vacation, sick leave, and unpaid absence tracking with direct payroll deduction integration.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Role Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Governance policy: Leave approvals and rejections are restricted to <strong>Super Admin & HR Manager</strong> only.
          </span>
        </div>
        <span className="font-semibold text-blue-900 capitalize">
          Current Access: {userRole.replace('_', ' ')} {canApprove ? '(Approver)' : '(Viewer)'}
        </span>
      </div>

      {/* Leave Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Leave Type</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3 text-right">Days</th>
                <th className="py-3 px-3">Compensation</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  const isPending = leave.status === 'pending';

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{emp?.fullName || leave.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="capitalize font-medium text-slate-800">
                          {leave.leaveType} Leave
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {leave.startDate} → {leave.endDate}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                        {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                      </td>

                      <td className="py-3 px-3">
                        {leave.isPaid ? (
                          <span className="text-[11px] text-emerald-700 font-semibold">Paid Leave</span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            Unpaid (Deducts in Payroll)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          leave.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : leave.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {leave.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {canApprove && isPending && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveLeaveRequest(leave.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Approve Leave Request"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectLeaveRequest(leave.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject Leave Request"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsApplyModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Submit Leave Application</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select leave category, dates, and mandatory reason.
            </p>

            <form onSubmit={handleApply} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employee</label>
                {canApprove ? (
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Leave Category</label>
                <select
                  value={formState.leaveType}
                  onChange={e => setFormState(prev => ({ ...prev, leaveType: e.target.value as any }))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="annual">Annual Vacation Leave (Paid)</option>
                  <option value="sick">Sick Leave (Statutory Paid)</option>
                  <option value="unpaid">Unpaid Leave (Direct Payroll Deduction)</option>
                  <option value="emergency">Emergency / Compassionate Leave (Paid)</option>
                  <option value="hajj">Hajj Pilgrimage Leave (Once in service, Paid)</option>
                  <option value="maternity">Maternity / Paternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formState.startDate}
                    onChange={e => handleDateChange(e.target.value, formState.endDate)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formState.endDate}
                    onChange={e => handleDateChange(formState.startDate, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                <span>Calculated Total Duration:</span>
                <strong className="font-mono text-blue-700">{formState.totalDays} Day{formState.totalDays > 1 ? 's' : ''}</strong>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Absence</label>
                <textarea
                  required
                  rows={2}
                  value={formState.reason}
                  onChange={e => setFormState(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Detail reason for time-off..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
