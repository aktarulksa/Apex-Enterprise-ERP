import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ExpenseClaim, AccountingCategory } from '../../types/erp';
import { 
  Receipt, 
  Plus, 
  CheckCircle, 
  XCircle, 
  FolderPlus, 
  ShieldCheck, 
  DollarSign,
  Tag
} from 'lucide-react';

export const ExpenseModule: React.FC = () => {
  const { 
    expenses, 
    accountingCategories, 
    employees, 
    currentUser, 
    userRole, 
    permissions, 
    addExpenseClaim, 
    approveExpenseClaim, 
    rejectExpenseClaim, 
    addAccountingCategory, 
    formatCurrency, 
    company 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'claims' | 'categories'>('claims');

  // Modals
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    employeeId: currentUser.id,
    categoryId: accountingCategories[0]?.id || 'CAT-01',
    amount: 500,
    expenseDate: new Date().toISOString().slice(0, 10),
    description: ''
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    code: '',
    type: 'expense' as const,
    description: ''
  });

  const canApprove = permissions.canApproveExpenses;

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === claimForm.employeeId) || currentUser;
    addExpenseClaim({
      employeeId: emp.id,
      employeeName: emp.fullName,
      categoryId: claimForm.categoryId,
      amount: Number(claimForm.amount),
      currency: company.baseCurrency,
      expenseDate: claimForm.expenseDate,
      description: claimForm.description
    });
    setClaimModalOpen(false);
    setClaimForm({
      employeeId: currentUser.id,
      categoryId: accountingCategories[0]?.id || 'CAT-01',
      amount: 500,
      expenseDate: new Date().toISOString().slice(0, 10),
      description: ''
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addAccountingCategory(catForm);
    setCategoryModalOpen(false);
    setCatForm({ name: '', code: '', type: 'expense', description: '' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Corporate Expenses & Accounting Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational claims, accounting categories, and executive approvals in {company.baseCurrency}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'claims' && (
            <button
              onClick={() => setClaimModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Expense Claim</span>
            </button>
          )}

          {activeTab === 'categories' && permissions.canManageSettings && (
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create Accounting Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'claims'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Expense Claims ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Accounting Categories ({accountingCategories.length})
        </button>
      </div>

      {/* CLAIMS TAB */}
      {activeTab === 'claims' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions (Admin/Finance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No expense claims submitted.
                    </td>
                  </tr>
                ) : (
                  expenses.map(exp => {
                    const emp = employees.find(e => e.id === exp.employeeId);
                    const cat = accountingCategories.find(c => c.id === exp.categoryId);
                    const isPending = exp.status === 'pending';

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-mono text-slate-700">{exp.expenseDate}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">
                          {emp?.fullName || exp.employeeName}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {cat?.name || exp.categoryId}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            exp.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : exp.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {canApprove && isPending && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => approveExpenseClaim(exp.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Approve Claim (Admin only)"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => rejectExpenseClaim(exp.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Reject Claim (Admin only)"
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
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountingCategories.map(cat => (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {cat.code}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {cat.type}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2">{cat.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setClaimModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Submit Corporate Expense</h3>
            <form onSubmit={handleCreateClaim} className="mt-4 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Employee</label>
                <select
                  value={claimForm.employeeId}
                  onChange={e => setClaimForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Accounting Category</label>
                <select
                  value={claimForm.categoryId}
                  onChange={e => setClaimForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                >
                  {accountingCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount ({company.baseCurrency})</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={claimForm.amount}
                    onChange={e => setClaimForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={claimForm.expenseDate}
                    onChange={e => setClaimForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Expense Purpose & Description</label>
                <textarea
                  required
                  rows={2}
                  value={claimForm.description}
                  onChange={e => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detail business justification..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setClaimModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setCategoryModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10 text-xs">
            <h3 className="text-sm font-bold text-slate-900">New Accounting Category</h3>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Code</label>
                <input
                  type="text"
                  required
                  value={catForm.code}
                  onChange={e => setCatForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="e.g. ACC-6900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={e => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Research & Development Hardware"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={catForm.description}
                  onChange={e => setCatForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCategoryModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
