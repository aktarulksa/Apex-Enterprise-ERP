import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Department, Project, Designation } from '../../types/erp';
import { 
  Building, 
  Layers, 
  Briefcase, 
  Plus, 
  Trash2, 
  FolderPlus,
  CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface OrgStructureProps {
  initialTab?: 'departments' | 'projects' | 'designations';
}

export const OrgStructureModule: React.FC<OrgStructureProps> = ({ initialTab = 'departments' }) => {
  const { 
    departments, 
    projects, 
    designations, 
    employees, 
    permissions, 
    addDepartment, 
    deleteDepartment, 
    addProject, 
    deleteProject, 
    addDesignation, 
    deleteDesignation 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'departments' | 'projects' | 'designations'>(initialTab);

  // New Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', operatingDivision: '' });

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ code: '', name: '', costCenter: '', clientName: '' });

  const [desigModalOpen, setDesigModalOpen] = useState(false);
  const [desigForm, setDesigForm] = useState({ title: '', departmentId: departments[0]?.id || '', grade: 'T-1' });

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'dept' | 'project' | 'desig'; id: string } | null>(null);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    addDepartment(deptForm);
    setDeptModalOpen(false);
    setDeptForm({ code: '', name: '', operatingDivision: '' });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({ ...projectForm, status: 'active' });
    setProjectModalOpen(false);
    setProjectForm({ code: '', name: '', costCenter: '', clientName: '' });
  };

  const handleAddDesig = (e: React.FormEvent) => {
    e.preventDefault();
    addDesignation(desigForm);
    setDesigModalOpen(false);
    setDesigForm({ title: '', departmentId: departments[0]?.id || '', grade: 'T-1' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Organization Structure & Resource Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise operating departments, client projects, cost centers, and job designations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'departments' && permissions.canManageSettings && (
            <button
              onClick={() => setDeptModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Department</span>
            </button>
          )}

          {activeTab === 'projects' && permissions.canManageSettings && (
            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}

          {activeTab === 'designations' && permissions.canManageSettings && (
            <button
              onClick={() => setDesigModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Job Title</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Operating Departments ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Enterprise Projects & Cost Centers ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab('designations')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeTab === 'designations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Job Titles & Designations ({designations.length})
        </button>
      </div>

      {/* DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => {
            const headCount = employees.filter(e => e.departmentId === d.id).length;
            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {d.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{d.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{d.operatingDivision}</p>
                    </div>

                    {permissions.canManageSettings && departments.length > 1 && (
                      <button
                        onClick={() => setDeleteTarget({ type: 'dept', id: d.id })}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned Staff:</span>
                  <strong className="text-slate-800 font-mono">{headCount} employee{headCount !== 1 ? 's' : ''}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {p.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Client: {p.clientName}</p>
                  </div>

                  {permissions.canManageSettings && (
                    <button
                      onClick={() => setDeleteTarget({ type: 'project', id: p.id })}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cost Center:</span>
                <strong className="text-slate-800 font-mono">{p.costCenter}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DESIGNATIONS TAB */}
      {activeTab === 'designations' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                <th className="py-3 px-3">Job Title & Designation</th>
                <th className="py-3 px-3">Parent Department</th>
                <th className="py-3 px-3">Grade Level</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {designations.map(des => {
                const dept = departments.find(d => d.id === des.departmentId);
                return (
                  <tr key={des.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-medium text-slate-900">{des.title}</td>
                    <td className="py-3 px-3 text-slate-600">{dept?.name || des.departmentId}</td>
                    <td className="py-3 px-3 font-mono text-blue-700">{des.grade}</td>
                    <td className="py-3 px-3 text-right">
                      {permissions.canManageSettings && (
                        <button
                          onClick={() => setDeleteTarget({ type: 'desig', id: des.id })}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Department Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setDeptModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Create Operating Department</h3>
            <form onSubmit={handleAddDept} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={e => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="e.g. SEC"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Cyber Security & Trust"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Operating Division</label>
                <input
                  type="text"
                  required
                  value={deptForm.operatingDivision}
                  onChange={e => setDeptForm(prev => ({ ...prev, operatingDivision: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Technology & Risk"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDeptModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setProjectModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Create Enterprise Project</h3>
            <form onSubmit={handleAddProject} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Code</label>
                <input
                  type="text"
                  required
                  value={projectForm.code}
                  onChange={e => setProjectForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="e.g. PRJ-ARAMCO-01"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={e => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Smart Refinery Cloud Migration"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Cost Center</label>
                <input
                  type="text"
                  required
                  value={projectForm.costCenter}
                  onChange={e => setProjectForm(prev => ({ ...prev, costCenter: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="e.g. CC-ENG-501"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={projectForm.clientName}
                  onChange={e => setProjectForm(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Saudi Aramco"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setProjectModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {desigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setDesigModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 z-10">
            <h3 className="text-sm font-bold text-slate-900">Create Job Title & Designation</h3>
            <form onSubmit={handleAddDesig} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={desigForm.title}
                  onChange={e => setDesigForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  placeholder="e.g. Principal Cloud Security Architect"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Parent Department</label>
                <select
                  value={desigForm.departmentId}
                  onChange={e => setDesigForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Grade Level</label>
                <input
                  type="text"
                  required
                  value={desigForm.grade}
                  onChange={e => setDesigForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="e.g. T-5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDesigModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded">Create Designation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Remove Organization Node"
        message="Are you sure you want to remove this item? This may affect linked employees or timesheet filters."
        confirmLabel="Remove"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTarget) {
            if (deleteTarget.type === 'dept') deleteDepartment(deleteTarget.id);
            if (deleteTarget.type === 'project') deleteProject(deleteTarget.id);
            if (deleteTarget.type === 'desig') deleteDesignation(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
