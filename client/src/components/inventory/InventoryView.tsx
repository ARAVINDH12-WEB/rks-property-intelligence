import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Property, Project, Location } from '../../types/index.js';
import { PropertyTable } from './PropertyTable.js';
import { PropertyCards } from './PropertyCards.js';
import { PropertyMap } from './PropertyMap.js';
import { PropertyCompact } from './PropertyCompact.js';
import { FilterDrawer } from './FilterDrawer.js';
import { BulkActionBar } from './BulkActionBar.js';
import { ConfirmationModal } from '../common/ConfirmationModal.js';
import {
  Table as TableIcon,
  LayoutGrid,
  Map as MapIcon,
  List,
  SlidersHorizontal,
  Plus,
  FileSpreadsheet,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building,
  Calendar,
} from 'lucide-react';

interface InventoryViewProps {
  forcedStatusFilter?: string;
  defaultViewMode?: 'table' | 'cards' | 'map' | 'compact';
}

export const InventoryView: React.FC<InventoryViewProps> = ({ forcedStatusFilter, defaultViewMode }) => {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    filterParams,
    setFilterParams,
    resetFilters,
    setIsAddModalOpen,
    setIsExportModalOpen,
    setActiveTab,
    refreshTrigger,
    refreshInventory,
    activeRole,
    openSiteVisitModal,
    showToast,
  } = useApp();

  useEffect(() => {
    if (defaultViewMode) {
      setViewMode(defaultViewMode);
    }
  }, [defaultViewMode, setViewMode]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Confirmation modal state for archive/delete
  const [propToDelete, setPropToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Projects and Locations for filter dropdowns
  useEffect(() => {
    api.getProjects().then((res) => setProjects(res.projects)).catch(() => {});
    api.getLocations().then((res) => setLocations(res.locations)).catch(() => {});
  }, []);

  // Fetch properties with filters, search, pagination, and sorting
  useEffect(() => {
    setIsLoading(true);

    const mergedParams = {
      ...filterParams,
      q: searchQuery || undefined,
      status: forcedStatusFilter || filterParams.status,
      sort_by: sortField,
      sort_order: sortOrder,
      page: filterParams.page || 1,
      limit: filterParams.limit || 25,
    };

    api
      .getProperties(mergedParams)
      .then((res) => {
        setProperties(res.properties);
        setPagination(res.pagination);
      })
      .catch((err) => {
        showToast('Error loading properties', err.message, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, filterParams, forcedStatusFilter, sortField, sortOrder, refreshTrigger]);

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Pagination page change
  const handlePageChange = (newPage: number) => {
    setFilterParams((prev) => ({ ...prev, page: newPage }));
  };

  // Page limit change
  const handleLimitChange = (newLimit: number) => {
    setFilterParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
    }
  };

  // Delete / Archive confirmation handler
  const handleConfirmDelete = async () => {
    if (!propToDelete) return;
    setIsDeleting(true);
    try {
      const permanent = activeRole === 'ADMIN';
      await api.deleteProperty(propToDelete.id, permanent);
      showToast(
        permanent ? 'Property Permanently Deleted' : 'Property Archived',
        `${propToDelete.property_code} removed from active view`,
        'success'
      );
      setPropToDelete(null);
      refreshInventory();
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Active filter chips list
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filterParams.status && !forcedStatusFilter) {
    activeChips.push({
      key: 'status',
      label: `Status: ${filterParams.status}`,
      clear: () => setFilterParams((prev) => ({ ...prev, status: undefined })),
    });
  }
  if (filterParams.project_id) {
    const proj = projects.find((p) => String(p.id) === String(filterParams.project_id));
    activeChips.push({
      key: 'project',
      label: `Project: ${proj?.name || filterParams.project_id}`,
      clear: () => setFilterParams((prev) => ({ ...prev, project_id: undefined })),
    });
  }
  if (filterParams.location_id) {
    const loc = locations.find((l) => String(l.id) === String(filterParams.location_id));
    activeChips.push({
      key: 'location',
      label: `Location: ${loc?.city || filterParams.location_id}`,
      clear: () => setFilterParams((prev) => ({ ...prev, location_id: undefined })),
    });
  }
  if (filterParams.property_type) {
    activeChips.push({
      key: 'property_type',
      label: `Type: ${filterParams.property_type}`,
      clear: () => setFilterParams((prev) => ({ ...prev, property_type: undefined })),
    });
  }
  if (filterParams.min_area || filterParams.max_area) {
    activeChips.push({
      key: 'area',
      label: `Area: ${filterParams.min_area || 0} - ${filterParams.max_area || 'Max'} sq.ft`,
      clear: () => setFilterParams((prev) => ({ ...prev, min_area: undefined, max_area: undefined })),
    });
  }
  if (filterParams.min_rate || filterParams.max_rate) {
    activeChips.push({
      key: 'rate',
      label: `Rate: ₹${filterParams.min_rate || 0} - ₹${filterParams.max_rate || 'Max'}`,
      clear: () => setFilterParams((prev) => ({ ...prev, min_rate: undefined, max_rate: undefined })),
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">
            {forcedStatusFilter ? `${forcedStatusFilter} Properties` : 'Property Inventory'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage, search, edit valuations, and monitor real-time inventory allocation.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              activeChips.length > 0
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeChips.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                {activeChips.length}
              </span>
            )}
          </button>

          {activeRole !== 'VIEWER' ? (
            <>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <Download className="h-4 w-4 text-cyan-400" />
                <span>Export</span>
              </button>

              <button
                onClick={() => setActiveTab('import')}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Import</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Add Property</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => openSiteVisitModal()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>🚗 Book Free Site Visit</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW SWITCHER & ACTIVE FILTER CHIPS ROW */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-zinc-800/80 py-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#12161F] p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Table</span>
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'compact'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Compact</span>
          </button>
        </div>

        {/* Count Summary */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            Showing <strong className="text-white font-mono">{properties.length}</strong> of{' '}
            <strong className="text-white font-mono">{pagination.total}</strong> units
          </span>
          <button
            onClick={refreshInventory}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-sans">Active Filters:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300"
            >
              <span>{chip.label}</span>
              <button
                onClick={chip.clear}
                className="rounded-full p-0.5 hover:bg-amber-500/20 text-amber-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors ml-1"
          >
            Clear All
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTENT AREA */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-[#12161F]/60 text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-xs font-medium">Fetching PostgreSQL Inventory...</span>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#12161F]/40 p-8 text-center">
          <Building className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">No properties found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            No properties match your current search or filter criteria. Try resetting filters or adding new inventory.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'table' && (
            <PropertyTable
              properties={properties}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSort={handleSort}
              currentSortField={sortField}
              currentSortOrder={sortOrder}
              onDeleteRequest={(prop) => setPropToDelete(prop)}
            />
          )}

          {viewMode === 'cards' && (
            <PropertyCards
              properties={properties}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}

          {viewMode === 'map' && <PropertyMap properties={properties} />}

          {viewMode === 'compact' && (
            <PropertyCompact
              properties={properties}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </>
      )}

      {/* SERVER-SIDE PAGINATION CONTROLS */}
      {!isLoading && properties.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Rows per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-lg border border-zinc-800 bg-[#12161F] px-2 py-1 text-xs text-white outline-none focus:border-amber-500 font-mono"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="ml-2 font-mono text-zinc-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => handlePageChange(pNum)}
                  className={`h-8 w-8 rounded-xl font-mono text-xs font-bold transition-colors ${
                    pagination.page === pNum
                      ? 'bg-amber-500 text-black'
                      : 'border border-zinc-800 bg-[#12161F] text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#12161F] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Toolbar — staff only */}
      {(activeRole === 'ADMIN' || activeRole === 'MANAGER' || activeRole === 'EMPLOYEE') && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          onRefresh={refreshInventory}
          onOpenExport={() => setIsExportModalOpen(true)}
        />
      )}

      {/* Advanced Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        projects={projects}
        locations={locations}
      />

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmationModal
        isOpen={!!propToDelete}
        title={activeRole === 'ADMIN' ? `Permanently Delete ${propToDelete?.property_code}?` : `Archive ${propToDelete?.property_code}?`}
        message={`Are you sure you want to ${
          activeRole === 'ADMIN' ? 'PERMANENTLY DELETE' : 'archive'
        } property ${propToDelete?.property_code} (${propToDelete?.project_name})? ${
          activeRole === 'ADMIN' ? 'This action is destructive and removes all database records.' : 'This will remove the property from active listings.'
        }`}
        confirmLabel={activeRole === 'ADMIN' ? 'Delete Permanently' : 'Archive Property'}
        confirmVariant={activeRole === 'ADMIN' ? 'danger' : 'warning'}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPropToDelete(null)}
      />
    </div>
  );
};
