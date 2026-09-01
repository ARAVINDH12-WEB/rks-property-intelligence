import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { TopBar } from './components/layout/TopBar.js';
import { OverviewView } from './components/dashboard/OverviewView.js';
import { InventoryView } from './components/inventory/InventoryView.js';
import { ProjectsView } from './components/projects/ProjectsView.js';
import { LocationsView } from './components/locations/LocationsView.js';
import { ImportWizard } from './components/import/ImportWizard.js';
import { ReportsView } from './components/reports/ReportsView.js';
import { AuditLogsView } from './components/audit/AuditLogsView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { TeamMembersView } from './components/team/TeamMembersView.js';
import { SiteVisitsManagementView } from './components/site-visits/SiteVisitsManagementView.js';
import { SiteVisitBookingModal } from './components/site-visits/SiteVisitBookingModal.js';
import { AiConciergeChat } from './components/chat/AiConciergeChat.js';
import { PropertyDetailsModal } from './components/inventory/PropertyDetailsModal.js';
import { PropertyFormModal } from './components/inventory/PropertyFormModal.js';
import { ExportModal } from './components/inventory/ExportModal.js';
import { ConfirmationModal } from './components/common/ConfirmationModal.js';
import { ToastContainer } from './components/common/Toast.js';
import { api } from './services/api.js';
import { Property, Project, Location } from './types/index.js';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    sidebarCollapsed,
    selectedPropertyId,
    setSelectedPropertyId,
    editingProperty,
    setEditingProperty,
    isAddModalOpen,
    setIsAddModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isSiteVisitModalOpen,
    setIsSiteVisitModalOpen,
    siteVisitProperty,
    refreshInventory,
    activeRole,
    showToast,
  } = useApp();

  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [propToDelete, setPropToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    api.getProjects().then((res) => setProjects(res.projects)).catch(() => {});
    api.getLocations().then((res) => setLocations(res.locations)).catch(() => {});
  }, []);

  const handleConfirmDelete = async () => {
    if (!propToDelete) return;
    setIsDeleting(true);
    try {
      const permanent = activeRole === 'ADMIN';
      await api.deleteProperty(propToDelete.id, permanent);
      showToast(
        permanent ? 'Property Deleted' : 'Property Archived',
        `${propToDelete.property_code} updated`,
        'success'
      );
      setPropToDelete(null);
      setSelectedPropertyId(null);
      refreshInventory();
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0C10] text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Command Bar */}
        <TopBar />

        {/* Dynamic Route Content View */}
        <main className="flex-1 px-8 py-8 mt-16 max-w-7xl w-full mx-auto animate-in fade-in">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'properties' && <InventoryView />}
          {activeTab === 'available' && <InventoryView forcedStatusFilter="AVAILABLE" />}
          {activeTab === 'reserved' && <InventoryView forcedStatusFilter="RESERVED" />}
          {activeTab === 'sold' && <InventoryView forcedStatusFilter="SOLD" />}
          {activeTab === 'site-visits' && <SiteVisitsManagementView />}
          {activeTab === 'team' && <TeamMembersView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'locations' && <LocationsView />}
          {activeTab === 'import' && <ImportWizard />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Slide-over Property Details Modal */}
      {selectedPropertyId && (
        <PropertyDetailsModal
          propertyId={selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
          onEdit={(prop) => {
            setEditingProperty(prop);
          }}
          onDeleteRequest={(prop) => setPropToDelete(prop)}
        />
      )}

      {/* Site Visit Booking Modal */}
      {isSiteVisitModalOpen && (
        <SiteVisitBookingModal
          isOpen={isSiteVisitModalOpen}
          property={siteVisitProperty}
          onClose={() => setIsSiteVisitModalOpen(false)}
        />
      )}

      {/* Add / Edit Property Workspace Modal */}
      {(isAddModalOpen || editingProperty) && (
        <PropertyFormModal
          isOpen={isAddModalOpen || !!editingProperty}
          property={editingProperty}
          projects={projects}
          locations={locations}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            refreshInventory();
          }}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          selectedIds={[]}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Archive / Delete Modal */}
      <ConfirmationModal
        isOpen={!!propToDelete}
        title={activeRole === 'ADMIN' ? `Permanently Delete ${propToDelete?.property_code}?` : `Archive ${propToDelete?.property_code}?`}
        message={`Are you sure you want to ${
          activeRole === 'ADMIN' ? 'PERMANENTLY DELETE' : 'archive'
        } property ${propToDelete?.property_code} (${propToDelete?.project_name})?`}
        confirmLabel={activeRole === 'ADMIN' ? 'Delete Permanently' : 'Archive Property'}
        confirmVariant={activeRole === 'ADMIN' ? 'danger' : 'warning'}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPropToDelete(null)}
      />

      {/* AI Property Concierge Floating Chatbot */}
      <AiConciergeChat />

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
