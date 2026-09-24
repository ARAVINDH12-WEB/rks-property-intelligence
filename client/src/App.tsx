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
import { LeadsView } from './components/leads/LeadsView.js';
import { SiteVisitsManagementView } from './components/site-visits/SiteVisitsManagementView.js';
import { OffersView } from './components/offers/OffersView.js';
import { SiteVisitBookingModal } from './components/site-visits/SiteVisitBookingModal.js';
import { AiConciergeChat } from './components/chat/AiConciergeChat.js';
import { PropertyDetailsModal } from './components/inventory/PropertyDetailsModal.js';
import { PropertyFormModal } from './components/inventory/PropertyFormModal.js';
import { ExportModal } from './components/inventory/ExportModal.js';
import { ConfirmationModal } from './components/common/ConfirmationModal.js';
import { ToastContainer } from './components/common/Toast.js';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setLocaleCookie } from './utils/locale.js';
import { AuthGatewayView } from './components/auth/AuthGatewayView.js';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton.js';
import { api } from './services/api.js';
import { Property, Project, Location } from './types/index.js';
import { LandingPageView } from './components/landing/LandingPageView.js';
import { PropertyListingPage } from './components/landing/PropertyListingPage.js';
import { CityLandingPage } from './components/landing/CityLandingPage.js';
import { AboutPage } from './components/landing/AboutPage.js';
import { ContactPage } from './components/landing/ContactPage.js';
import { LegalPage } from './components/landing/LegalPage.js';
import { NotFoundPage } from './components/common/NotFoundPage.js';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    sidebarCollapsed,
    setSidebarCollapsed,
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
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0A0C10] text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-0 md:pl-20' : 'pl-0 md:pl-64'
        }`}
      >
        {/* Top Command Bar */}
        <TopBar />

        {/* Dynamic Route Content View */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 mt-16 max-w-7xl w-full mx-auto animate-in fade-in">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'properties' && <InventoryView />}
          {activeTab === 'available' && <InventoryView forcedStatusFilter="AVAILABLE" />}
          {activeTab === 'reserved' && <InventoryView forcedStatusFilter="RESERVED" />}
          {activeTab === 'sold' && <InventoryView forcedStatusFilter="SOLD" />}
          {activeTab === 'offers' && <OffersView />}
          {activeTab === 'site-visits' && <SiteVisitsManagementView />}
          {activeTab === 'team' && <TeamMembersView />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'locations' && <LocationsView />}
          {activeTab === 'import' && <ImportWizard />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

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

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
};

import {
  RealEstateOfflineBanner,
  RealEstateSlowNetworkBanner,
  RealEstatePermissionDeniedModal,
  RealEstateSessionExpiredModal,
  RealEstateErrorBoundary,
} from './components/common/UIStates.js';

const AppContent: React.FC = () => {
  const {
    isLoggedIn,
    setIsLoggedIn,
    setActiveRole,
    isOffline,
    isSlowNetwork,
    isSessionExpired,
    setIsSessionExpired,
    isPermissionDenied,
    setIsPermissionDenied,
    logoutToGateway,
    isSiteVisitModalOpen,
    setIsSiteVisitModalOpen,
    siteVisitProperty,
    selectedPropertyId,
    setSelectedPropertyId,
    setEditingProperty,
  } = useApp();
  const location = useLocation();
  const { i18n } = useTranslation();

  // Route-based language synchronization
  useEffect(() => {
    const isTaRoute = location.pathname === '/ta' || location.pathname.startsWith('/ta/');
    const targetLocale = isTaRoute ? 'ta' : 'en';
    if (i18n.language !== targetLocale) {
      i18n.changeLanguage(targetLocale);
    }
    setLocaleCookie(targetLocale);
  }, [location.pathname, i18n]);

  return (
    <>
      <RealEstateOfflineBanner isOffline={isOffline} />
      <RealEstateSlowNetworkBanner isSlow={isSlowNetwork} />

      <RealEstatePermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />

      <RealEstateSessionExpiredModal
        isOpen={isSessionExpired}
        onReLogin={() => {
          setIsSessionExpired(false);
          logoutToGateway();
        }}
      />

      <Routes>
        {/* English public routes */}
        <Route path="/" element={<LandingPageView />} />
        <Route path="/properties" element={<PropertyListingPage />} />
        <Route path="/plots/chennai" element={<CityLandingPage city="Chennai" slug="chennai" />} />
        <Route path="/plots/trichy" element={<CityLandingPage city="Trichy" slug="trichy" />} />
        <Route path="/plots/coimbatore" element={<CityLandingPage city="Coimbatore" slug="coimbatore" />} />
        <Route path="/plots/hosur" element={<CityLandingPage city="Hosur" slug="hosur" />} />
        <Route path="/plots/bangalore-corridor" element={<CityLandingPage city="Hosur Road Corridor" slug="bangalore-corridor" />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/legal" element={<LegalPage />} />

        {/* Tamil mirrored public routes */}
        <Route path="/ta" element={<LandingPageView />} />
        <Route path="/ta/properties" element={<PropertyListingPage />} />
        <Route path="/ta/plots/chennai" element={<CityLandingPage city="Chennai" slug="chennai" />} />
        <Route path="/ta/plots/trichy" element={<CityLandingPage city="Trichy" slug="trichy" />} />
        <Route path="/ta/plots/coimbatore" element={<CityLandingPage city="Coimbatore" slug="coimbatore" />} />
        <Route path="/ta/plots/hosur" element={<CityLandingPage city="Hosur" slug="hosur" />} />
        <Route path="/ta/plots/bangalore-corridor" element={<CityLandingPage city="Hosur Road Corridor" slug="bangalore-corridor" />} />
        <Route path="/ta/about" element={<AboutPage />} />
        <Route path="/ta/contact" element={<ContactPage />} />
        <Route path="/ta/legal" element={<LegalPage />} />

        {/* Admin & Dashboard */}
        <Route path="/admin" element={
          !isLoggedIn ? (
            <AuthGatewayView
              onLoginSuccess={(role) => {
                setActiveRole(role);
                setIsLoggedIn(true);
              }}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />

        <Route path="/dashboard/*" element={
          isLoggedIn ? <MainLayout /> : <Navigate to="/admin" replace />
        } />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Slide-over Property Details Modal accessible across public & admin pages */}
      {selectedPropertyId && (
        <PropertyDetailsModal
          propertyId={selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
          onEdit={(prop) => {
            setEditingProperty(prop);
          }}
        />
      )}

      {/* Global Site Visit Booking Modal accessible across public & admin views */}
      {isSiteVisitModalOpen && (
        <SiteVisitBookingModal
          isOpen={isSiteVisitModalOpen}
          property={siteVisitProperty}
          onClose={() => setIsSiteVisitModalOpen(false)}
        />
      )}

      <WhatsAppFloatingButton />
      <AiConciergeChat />
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <RealEstateErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </RealEstateErrorBoundary>
  );
}
