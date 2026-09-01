import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { User, UserRole } from '../../types/index.js';
import { formatDateTime } from '../../utils/formatters.js';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Key,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
  Building,
} from 'lucide-react';

export const TeamMembersView: React.FC = () => {
  const { activeRole, showToast, refreshTrigger } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Member Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    password: 'rks_password123',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = () => {
    setIsLoading(true);
    api
      .getUsers()
      .then((res) => setUsers(res.users))
      .catch((err) => console.error('Error fetching users:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Required Fields Missing', 'Please enter full name and email', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createStaffMember(formData);
      showToast('Team Member Added!', res.message, 'success');
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        password: 'rks_password123',
      });
      fetchUsers();
    } catch (err: any) {
      showToast('Failed to Add Member', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove team member ${name}?`)) return;

    try {
      await api.deleteUser(id);
      showToast('Member Removed', `${name} account deactivated`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    }
  };

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    MANAGER: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    EMPLOYEE: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    VIEWER: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  const canManageTeam = activeRole === 'ADMIN' || activeRole === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <span>Organizational Directory</span>
            <span>•</span>
            <span>Staff & Member Access</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white font-sans flex items-center gap-3">
            <span>Team Members & Roles</span>
            <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/20">
              {users.length} Active Accounts
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage inventory permissions, register new sales executives, and onboard team members.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {canManageTeam && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all"
            >
              <UserPlus className="h-4 w-4 stroke-[3]" />
              <span>+ Add New Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Team Table */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-[#12161F]/60 text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Loading Directory...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#12161F] shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300 font-sans">
            <thead className="border-b border-zinc-800 bg-[#0A0C10] font-bold uppercase text-[10px] text-zinc-400">
              <tr>
                <th className="px-4 py-3.5">Member</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Contact Email</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Joined Date</th>
                {activeRole === 'ADMIN' && <th className="px-4 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3.5 flex items-center gap-3">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">{u.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">ID: #{u.id}</div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                        roleBadgeColors[u.role] || 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      <span>{u.role}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-zinc-300">{u.email}</td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400">{u.phone || '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-zinc-500">
                    {(u as any).created_at ? formatDateTime((u as any).created_at) : 'Active'}
                  </td>

                  {activeRole === 'ADMIN' && (
                    <td className="px-4 py-3.5 text-right">
                      {u.id !== 1 && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#0D1017] shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#12161F] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Team Member</h3>
                  <p className="text-xs text-zinc-400">Assign roles and generate credentials</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Work Email <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="suresh@rks.com"
                  className="w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Mobile Number (+91)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98400 55667"
                  className="w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Assign Permission Role <span className="text-amber-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="EMPLOYEE">EMPLOYEE — Sales & Inventory Officer</option>
                  <option value="MANAGER">MANAGER — Portfolio & Pricing Manager</option>
                  {activeRole === 'ADMIN' && <option value="ADMIN">ADMIN — Master Director Access</option>}
                  <option value="VIEWER">VIEWER — Read-only Stakeholder</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Initial Temporary Password
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-[#12161F] px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Add Team Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
