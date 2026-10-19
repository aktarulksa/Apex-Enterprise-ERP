import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ITAsset } from '../../types/erp';
import { 
  Laptop, 
  Plus, 
  Edit3, 
  CheckCircle, 
  User, 
  Tag, 
  FolderPlus,
  ShieldCheck
} from 'lucide-react';

export const AssetModule: React.FC = () => {
  const { 
    assets, 
    assetCategories, 
    employees, 
    permissions, 
    addAsset, 
    updateAsset, 
    addAssetCategory, 
    formatCurrency, 
    company 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'assets' | 'categories'>('assets');
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState<Omit<ITAsset, 'id'>>({
    assetTag: `APEX-HW-${Date.now().toString().slice(-4)}`,
    name: '',
    categoryId: assetCategories[0]?.id || 'AC-01',
    serialNumber: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: 6500,
    assignedEmployeeId: employees[0]?.id,
    status: 'assigned',
    specifications: ''
  });

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    addAsset(assetForm);
    setAssetModalOpen(false);
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    addAssetCategory({ name: catName, code: catCode });
    setCatModalOpen(false);
    setCatName('');
    setCatCode('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hardware & IT Asset Procurement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procured enterprise hardware inventory, employee assignments, and asset tagging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'assets' && permissions.canManageSettings && (
            <button
              onClick={() => setAssetModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Hardware Asset</span>
            </button>
          )}

          {activeTab === 'categories' && permissions.canManageSettings && (
            <button
              onClick={() => setCatModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'assets'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Hardware Assets ({assets.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Asset Categories ({assetCategories.length})
        </button>
      </div>

      {/* ASSETS TABLE */}
      {activeTab === 'assets' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-3 px-3">Asset Tag</th>
                  <th className="py-3 px-3">Device Name & Specs</th>
                  <th className="py-3 px-3">Serial Number</th>
                  <th className="py-3 px-3">Assigned Employee</th>
                  <th className="py-3 px-3 text-right">Procurement Cost</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map(ast => {
                  const emp = employees.find(e => e.id === ast.assignedEmployeeId);
                  const cat = assetCategories.find(c => c.id === ast.categoryId);

                  return (
                    <tr key={ast.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-medium text-blue-700">
                        {ast.assetTag}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{ast.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{ast.specifications}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {ast.serialNumber}
                      </td>

                      <td className="py-3 px-3">
                        {emp ? (
                          <div className="font-medium text-slate-800">
                            {emp.fullName} ({emp.employeeCode})
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned (In IT Locker)</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(ast.purchaseCost)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          ast.status === 'assigned'
                            ? 'bg-blue-50 text-blue-700'
                            : ast.status === 'available'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {ast.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES GRID */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {assetCategories.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                {c.code}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-2">{c.name}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {assets.filter(a => a.categoryId === c.id).length} devices registered
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Asset Modal */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setAssetModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Register Hardware Asset</h3>
            <form onSubmit={handleSaveAsset} className="mt-4 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Asset Tag</label>
                <input
                  type="text"
                  required
                  value={assetForm.assetTag}
                  onChange={e => setAssetForm(prev => ({ ...prev, assetTag: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Device Name / Model</label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={e => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Dell XPS 15 9530 i9 32GB"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={assetForm.categoryId}
                    onChange={e => setAssetForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    {assetCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={assetForm.serialNumber}
                    onChange={e => setAssetForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cost ({company.baseCurrency})</label>
                  <input
                    type="number"
                    required
                    value={assetForm.purchaseCost}
                    onChange={e => setAssetForm(prev => ({ ...prev, purchaseCost: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Employee</label>
                  <select
                    value={assetForm.assignedEmployeeId || ''}
                    onChange={e => setAssetForm(prev => ({ ...prev, assignedEmployeeId: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="">Unassigned</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Technical Specifications</label>
                <textarea
                  rows={2}
                  value={assetForm.specifications}
                  onChange={e => setAssetForm(prev => ({ ...prev, specifications: e.target.value }))}
                  placeholder="CPU, RAM, GPU, OS, configuration notes..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAssetModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setCatModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-5 z-10 text-xs">
            <h3 className="text-sm font-bold text-slate-900">New Asset Category</h3>
            <form onSubmit={handleSaveCat} className="mt-4 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Code</label>
                <input
                  type="text"
                  required
                  value={catCode}
                  onChange={e => setCatCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="e.g. HW-SRV"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Servers & Cloud Racks"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCatModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
