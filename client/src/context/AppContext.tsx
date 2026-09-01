import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, User, UserRole, PropertyFilterParams } from '../types/index.js';
import { api } from '../services/api.js';

export type NavigationTab =
  | 'overview'
  | 'properties'
  | 'available'
  | 'reserved'
  | 'sold'
  | 'site-visits'
  | 'team'
  | 'projects'
  | 'locations'
  | 'import'
  | 'reports'
  | 'audit'
  | 'settings';

export type ViewMode = 'table' | 'cards' | 'map' | 'compact';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPropertyId: number | null;
  setSelectedPropertyId: (id: number | null) => void;
  editingProperty: Property | null;
  setEditingProperty: (prop: Property | null) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isSiteVisitModalOpen: boolean;
  setIsSiteVisitModalOpen: (open: boolean) => void;
  siteVisitProperty: Property | null;
  openSiteVisitModal: (prop?: Property | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  logoutToGateway: () => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: User;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean | ((prev: boolean) => boolean)) => void;
  filterParams: PropertyFilterParams;
  setFilterParams: React.Dispatch<React.SetStateAction<PropertyFilterParams>>;
  resetFilters: () => void;
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  refreshInventory: () => void;
  refreshTrigger: number;
  badgeCounts: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    siteVisits: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem('rks_view_mode') as ViewMode) || 'table';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const [siteVisitProperty, setSiteVisitProperty] = useState<Property | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openSiteVisitModal = (prop?: Property | null) => {
    setSiteVisitProperty(prop || null);
    setIsSiteVisitModalOpen(true);
  };

  // Theme Management
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('rks_theme') as 'dark' | 'light') || 'dark';
  });

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('rks_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // View Mode Persist
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('rks_view_mode', mode);
  };

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem('rks_auth_session');
  });

  // Role Management
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    return (sessionStorage.getItem('rks_active_role') as UserRole) || 'VIEWER';
  });

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    sessionStorage.setItem('rks_active_role', role);
    localStorage.setItem('rks_active_role', role);
    showToast(`Switched active role to ${role}`, 'Permissions updated dynamically', 'info');
    refreshInventory();
  };

  const logoutToGateway = () => {
    sessionStorage.removeItem('rks_auth_session');
    sessionStorage.removeItem('rks_auth_token');
    sessionStorage.setItem('rks_active_role', 'VIEWER');
    localStorage.removeItem('rks_auth_session');
    localStorage.removeItem('rks_auth_token');
    localStorage.setItem('rks_active_role', 'VIEWER');
    setActiveRoleState('VIEWER');
    setIsLoggedIn(false);
    showToast('Logged Out', 'Returned to Portal Login Gateway', 'info');
  };

  const [savedUser, setSavedUser] = useState<any>(() => {
    try {
      const stored = sessionStorage.getItem('rks_auth_session') || localStorage.getItem('rks_auth_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const currentUser: User = {
    id: savedUser?.id || (activeRole === 'ADMIN' ? 1 : 999),
    name: savedUser?.name || (activeRole === 'ADMIN' ? 'Rajesh Kumar S (Director)' : 'Guest Customer'),
    email: savedUser?.email || (activeRole === 'ADMIN' ? 'admin@rks.com' : 'customer@rks.com'),
    role: activeRole,
    phone: savedUser?.phone || '+91 98400 11223',
    avatar_url: savedUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  // Filters State
  const [filterParams, setFilterParams] = useState<PropertyFilterParams>({});

  const resetFilters = () => {
    setFilterParams({});
    setSearchQuery('');
  };

  // Badge Counts from DB
  const [badgeCounts, setBadgeCounts] = useState({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    siteVisits: 0,
  });

  const refreshInventory = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Load KPI Badge counts on boot and on refresh
  useEffect(() => {
    api.getReports().then((data) => {
      if (data && data.kpis) {
        setBadgeCounts((prev) => ({
          ...prev,
          total: data.kpis.total_properties || 0,
          available: data.kpis.available_count || 0,
          reserved: data.kpis.reserved_count || 0,
          sold: data.kpis.sold_count || 0,
        }));
      }
    }).catch(() => {});

    api.getSiteVisits().then((data) => {
      if (data && data.stats) {
        setBadgeCounts((prev) => ({
          ...prev,
          siteVisits: (data.stats.requested_count || 0) + (data.stats.confirmed_count || 0),
        }));
      }
    }).catch(() => {});
  }, [refreshTrigger]);

  // Toast System
  const showToast = (title: string, description?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      } else if (e.key.toLowerCase() === 'n' && (activeRole === 'ADMIN' || activeRole === 'MANAGER' || activeRole === 'EMPLOYEE')) {
        e.preventDefault();
        setIsAddModalOpen(true);
      } else if (e.key === 'Escape') {
        setSelectedPropertyId(null);
        setEditingProperty(null);
        setIsAddModalOpen(false);
        setIsExportModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRole]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
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
        openSiteVisitModal,
        isLoggedIn,
        setIsLoggedIn,
        logoutToGateway,
        activeRole,
        setActiveRole,
        currentUser,
        theme,
        setTheme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        filterParams,
        setFilterParams,
        resetFilters,
        toasts,
        showToast,
        removeToast,
        refreshInventory,
        refreshTrigger,
        badgeCounts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
