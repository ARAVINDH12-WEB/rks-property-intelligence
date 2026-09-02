import React, { useState } from 'react';
import { Property, PropertyStatus } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR, formatDate } from '../../utils/formatters.js';
import {
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  Check,
  X,
  Building,
} from 'lucide-react';

interface PropertyTableProps {
  properties: Property[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (field: string) => void;
  currentSortField: string;
  currentSortOrder: 'asc' | 'desc';
  onDeleteRequest: (prop: Property) => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  properties,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  currentSortField,
  currentSortOrder,
  onDeleteRequest,
}) => {
  const {
    setSelectedPropertyId,
    setEditingProperty,
    activeRole,
    showToast,
    refreshInventory,
  } = useApp();

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: number; field: string; value: any } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isSavingInline, setIsSavingInline] = useState(false);

  const canEdit = activeRole === 'ADMIN' || activeRole === 'MANAGER' || activeRole === 'EMPLOYEE';

  const handleStartInline = (prop: Property, field: string, currentValue: any) => {
    if (!canEdit) return;
    setEditingCell({ id: prop.id, field, value: currentValue });
  };

  const handleSaveInline = async () => {
    if (!editingCell) return;
    setIsSavingInline(true);
    try {
      await api.inlineEdit(editingCell.id, editingCell.field, editingCell.value);
      showToast('Property updated successfully', `${editingCell.field.replace('_', ' ').toUpperCase()} modified`, 'success');
      setEditingCell(null);
      refreshInventory();
    } catch (err: any) {
      showToast('Inline update failed', err.message, 'error');
    } finally {
      setIsSavingInline(false);
    }
  };

  const handleQuickStatusChange = async (id: number, status: PropertyStatus) => {
    try {
      await api.updateStatus(id, status);
      showToast(`Status changed to ${status}`, 'Inventory status updated', 'success');
      setActiveMenuId(null);
      refreshInventory();
    } catch (err: any) {
      showToast('Failed to change status', err.message, 'error');
    }
  };

  const handleDuplicate = async (prop: Property) => {
    try {
      await api.duplicateProperty(prop.id);
      showToast('Property duplicated', `Draft copy created for ${prop.property_code}`, 'success');
      setActiveMenuId(null);
      refreshInventory();
    } catch (err: any) {
      showToast('Duplication failed', err.message, 'error');
    }
  };

  const allSelected = properties.length > 0 && selectedIds.length === properties.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const statuses: PropertyStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED', 'HOLD', 'UPCOMING'];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F]/95 shadow-sm dark:shadow-xl backdrop-blur-md">
      <table className="w-full text-left text-sm text-slate-800 dark:text-zinc-300">
        <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0A0C10]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          <tr>
            {canEdit && (
              <th className="w-10 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-500 focus:ring-amber-500/30 accent-amber-500 cursor-pointer"
                />
              </th>
            )}

            <th
              onClick={() => onSort('property_code')}
              className="cursor-pointer px-4 py-3.5 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Property ID</span>
                <ArrowUpDown className={`h-3 w-3 ${currentSortField === 'property_code' ? 'text-amber-500 dark:text-amber-400' : 'opacity-40'}`} />
              </div>
            </th>

            <th className="px-4 py-3.5">Property / Plot</th>

            <th
              onClick={() => onSort('project_name')}
              className="cursor-pointer px-4 py-3.5 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Project</span>
                <ArrowUpDown className={`h-3 w-3 ${currentSortField === 'project_name' ? 'text-amber-500 dark:text-amber-400' : 'opacity-40'}`} />
              </div>
            </th>

            <th
              onClick={() => onSort('location_name')}
              className="cursor-pointer px-4 py-3.5 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Location</span>
                <ArrowUpDown className={`h-3 w-3 ${currentSortField === 'location_name' ? 'text-amber-500 dark:text-amber-400' : 'opacity-40'}`} />
              </div>
            </th>

            <th className="px-4 py-3.5">Type</th>

            <th
              onClick={() => onSort('area_sqft')}
              className="cursor-pointer px-4 py-3.5 text-right hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Area (Sq.Ft)</span>
                <ArrowUpDown className={`h-3 w-3 ${currentSortField === 'area_sqft' ? 'text-amber-500 dark:text-amber-400' : 'opacity-40'}`} />
              </div>
            </th>

            <th
              onClick={() => onSort('rate_per_sqft')}
              className="cursor-pointer px-4 py-3.5 text-right hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Rate / Sq.Ft</span>
                <ArrowUpDown className={`h-3 w-3 ${currentSortField === 'rate_per_sqft' ? 'text-amber-500 dark:text-amber-400' : 'opacity-40'}`} />
              </div>
            </th>

            <th
              onClick={() => onSort('total_price')}
              className="cursor-pointer px-4 py-3.5 text-right hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Total Price</span>
                <ArrowUpDown className={`h-3 w-3 ${currentSortField === 'total_price' ? 'text-amber-500 dark:text-amber-400' : 'opacity-40'}`} />
              </div>
            </th>

            <th className="px-4 py-3.5 text-center">Status</th>

            <th className="px-4 py-3.5 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60 font-sans">
          {properties.map((prop) => {
            const isSelected = selectedIds.includes(prop.id);
            return (
              <tr
                key={prop.id}
                className={`group transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40 ${
                  isSelected ? 'bg-amber-500/5' : ''
                }`}
              >
                {/* Selection Checkbox — staff only */}
                {canEdit && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(prop.id)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-500 focus:ring-amber-500/30 accent-amber-500 cursor-pointer"
                    />
                  </td>
                )}

                {/* Property ID */}
                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                  <button
                    onClick={() => setSelectedPropertyId(prop.id)}
                    className="hover:text-amber-500 dark:hover:text-amber-400 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{prop.property_code}</span>
                  </button>
                </td>

                {/* Plot / Unit Name */}
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-zinc-200 truncate max-w-[140px]">
                    {prop.plot_number || prop.unit_number || 'Plot Unit'}
                  </div>
                  {prop.facing && (
                    <div className="text-[11px] text-slate-500 dark:text-zinc-500">{prop.facing} Facing</div>
                  )}
                </td>

                {/* Project */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[160px]">
                    {prop.project_name || 'Project'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono">{prop.project_code}</div>
                </td>

                {/* Location */}
                <td className="px-4 py-3">
                  <div className="text-slate-700 dark:text-zinc-300 truncate max-w-[140px]">{prop.city || 'Chennai'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-500 truncate max-w-[140px]">{prop.location_name}</div>
                </td>

                {/* Property Type */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 text-xs text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/50">
                    {prop.property_type}
                  </span>
                </td>

                {/* Area Sq.Ft (Inline Editable) */}
                <td className="px-4 py-3 text-right font-mono">
                  {editingCell?.id === prop.id && editingCell?.field === 'area_sqft' ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        className="w-24 rounded border border-amber-500 bg-black px-1.5 py-0.5 text-right text-xs text-white outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveInline}
                        disabled={isSavingInline}
                        className="p-0.5 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCell(null)}
                        className="p-0.5 text-rose-400 hover:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleStartInline(prop, 'area_sqft', prop.area_sqft)}
                      title={canEdit ? 'Click to edit Area' : undefined}
                      className={`font-semibold text-zinc-200 ${
                        canEdit ? 'cursor-pointer hover:text-amber-400 hover:underline' : ''
                      }`}
                    >
                      {Number(prop.area_sqft).toLocaleString('en-IN')}
                    </span>
                  )}
                </td>

                {/* Rate per Sq.Ft (Inline Editable) */}
                <td className="px-4 py-3 text-right font-mono">
                  {editingCell?.id === prop.id && editingCell?.field === 'rate_per_sqft' ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        className="w-24 rounded border border-amber-500 bg-black px-1.5 py-0.5 text-right text-xs text-amber-400 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveInline}
                        disabled={isSavingInline}
                        className="p-0.5 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCell(null)}
                        className="p-0.5 text-rose-400 hover:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleStartInline(prop, 'rate_per_sqft', prop.rate_per_sqft)}
                      title={canEdit ? 'Click to edit Rate / Sq.Ft' : undefined}
                      className={`font-semibold text-amber-400/90 ${
                        canEdit ? 'cursor-pointer hover:text-amber-300 hover:underline' : ''
                      }`}
                    >
                      ₹{Number(prop.rate_per_sqft).toLocaleString('en-IN')}
                    </span>
                  )}
                </td>

                {/* Total Price (Highlighted Hero Value) */}
                <td className="px-4 py-3 text-right font-mono">
                  <div className="font-bold text-white text-sm">
                    {formatCurrencyINR(prop.total_price)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-sans">
                    {formatCurrencyINR(prop.total_price, true)}
                  </div>
                </td>

                {/* Status Badge + Quick Switch Dropdown */}
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <button
                      onClick={() => {
                        if (canEdit) {
                          setActiveMenuId(activeMenuId === prop.id ? null : prop.id);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <StatusBadge status={prop.status} size="sm" />
                    </button>

                    {/* Quick status dropdown */}
                    {activeMenuId === prop.id && canEdit && (
                      <div className="absolute left-0 top-8 z-50 w-44 rounded-xl border border-zinc-700 bg-[#12161F] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                          Set Availability
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {statuses.map((st) => (
                            <button
                              key={st}
                              onClick={() => handleQuickStatusChange(prop.id, st)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                                prop.status === st
                                  ? 'bg-amber-500/10 text-amber-400 font-bold'
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <StatusBadge status={st} size="sm" showDot={false} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </td>

                {/* Updated At */}
                <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                  <div>{formatDate(prop.updated_at)}</div>
                  <div className="text-[10px] text-zinc-500 truncate max-w-[90px]">
                    {prop.updated_by_name || 'System'}
                  </div>
                </td>

                {/* Actions Dropdown */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setSelectedPropertyId(prop.id)}
                      title="View Details"
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => setEditingProperty(prop)}
                        title="Edit Property"
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}

                    {canEdit && (
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === prop.id ? null : prop.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === prop.id && (
                          <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-zinc-700 bg-[#12161F] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in">
                            <button
                              onClick={() => {
                                setSelectedPropertyId(prop.id);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Full Details</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingProperty(prop);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-amber-400"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit Workspace</span>
                            </button>

                            <button
                              onClick={() => handleDuplicate(prop)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Duplicate Property</span>
                            </button>

                            <div className="my-1 border-t border-zinc-800" />

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteRequest(prop);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              <span>Archive / Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
