import { Property, Project, Location, PropertyFilterParams, PaginationMeta, UserRole, Poster } from '../types/index.js';
import { Config } from '../config/index.js';

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('172.') || 
  window.location.hostname.startsWith('10.')
);

// In local browser, use '/api' to route via Vite dev proxy.
// In Vercel / production, explicitly connect to the Railway backend API via HTTPS, ensuring '/api' prefix is always included.
function resolveApiBaseUrl(): string {
  if (isLocal) return '/api';

  let rawUrl = Config.apiUrl.trim();
  
  // Enforce HTTPS protocol for remote production backends to prevent browser mixed-content blocks
  if (rawUrl.startsWith('http://')) {
    rawUrl = rawUrl.replace(/^http:\/\//i, 'https://');
  }

  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

const API_BASE = resolveApiBaseUrl();

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('rks_auth_token');
  const activeRole = (localStorage.getItem('rks_active_role') || 'VIEWER') as UserRole;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-demo-role': activeRole,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function ensureGuestToken(): Promise<void> {
  const existingToken = localStorage.getItem('rks_auth_token');
  if (existingToken) return;

  try {
    const res = await fetch(`${API_BASE}/auth/guest-token`);
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('rks_auth_token', data.token);
        localStorage.setItem('rks_active_role', 'VIEWER');
      }
    }
  } catch {
    // Fail silently
  }
}

ensureGuestToken();

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const primaryEndpoint = `${API_BASE}${url}`;
  const headers = {
    ...getHeaders(),
    ...(options.headers || {}),
  };

  let res: Response;
  try {
    res = await fetch(primaryEndpoint, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    // If direct cross-origin fetch failed (e.g. ad-blocker, CORS, or carrier filter), try same-origin proxy '/api'
    if (API_BASE !== '/api') {
      try {
        console.warn(`Primary request to ${primaryEndpoint} failed (${networkErr?.message}). Retrying via same-origin /api...`);
        res = await fetch(`/api${url}`, {
          ...options,
          headers,
        });
      } catch {
        throw networkErr;
      }
    } else {
      throw networkErr;
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed with status ' + res.status }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<any> {
    const res = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem('rks_auth_token', res.token);
      localStorage.setItem('rks_active_role', res.user?.role || 'ADMIN');
    }
    return res;
  },

  async verify2FA(userId: number, token: string, isBackupCode: boolean = false): Promise<any> {
    const res = await request<any>('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ userId, token, isBackupCode }),
    });
    if (res.token) {
      localStorage.setItem('rks_auth_token', res.token);
      localStorage.setItem('rks_active_role', res.user?.role || 'ADMIN');
    }
    return res;
  },

  async getGuestToken(): Promise<{ token: string; role: string }> {
    return request<{ token: string; role: string }>('/auth/guest-token');
  },

  async customerLogin(name: string, phone: string): Promise<{ message: string; customer: any }> {
    try {
      return await request<{ message: string; customer: any }>('/auth/customer-login', {
        method: 'POST',
        body: JSON.stringify({ name, phone }),
      });
    } catch {
      return { message: 'Welcome!', customer: { id: 0, name, phone } };
    }
  },

  async postLead(data: { name: string; phone: string; email?: string; source?: string; notes?: string; property_id?: number; property_code?: string; status?: string }): Promise<any> {
    return request<any>('/leads', { method: 'POST', body: JSON.stringify(data) });
  },

  async postLeadsBatch(leads: Array<any>, duplicateMode: 'skip' | 'merge' | 'import' = 'skip'): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    failed: number;
    total: number;
    errors: Array<{ row: number; name?: string; phone?: string; error: string }>;
  }> {
    return request<any>('/leads/batch', {
      method: 'POST',
      body: JSON.stringify({ leads, duplicateMode }),
    });
  },

  async getLeads(params?: { status?: string; q?: string; limit?: number; offset?: number }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return request<any>(`/leads${qs ? '?' + qs : ''}`);
  },

  async updateLeadStatus(id: number, status: string, notes?: string): Promise<any> {
    return request<any>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });
  },

  async deleteLead(id: number): Promise<any> {
    return request<any>(`/leads/${id}`, { method: 'DELETE' });
  },

  async register(data: { name: string; email: string; password: string; phone?: string }): Promise<{ token: string; user: any; message: string }> {
    const res = await request<{ token: string; user: any; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      localStorage.setItem('rks_auth_token', res.token);
      localStorage.setItem('rks_active_role', res.user.role);
    }
    return res;
  },

  async getUsers(): Promise<{ users: any[] }> {
    return request<{ users: any[] }>('/auth/users');
  },

  async createStaffMember(data: { name: string; email: string; password?: string; role: string; phone?: string }): Promise<{ user: any; message: string }> {
    return request<{ user: any; message: string }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  },

  async updateUser(id: number, data: { name?: string; email?: string; phone?: string; role?: string; password?: string }): Promise<{ user: any; message: string }> {
    return request<{ user: any; message: string }>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: any }> {
    return request<{ user: any }>('/auth/me');
  },

  // Properties
  async getProperties(params: PropertyFilterParams = {}): Promise<{ properties: Property[]; pagination: PaginationMeta }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    return request<{ properties: Property[]; pagination: PaginationMeta }>(`/properties?${query.toString()}`);
  },

  async getPublicStats(): Promise<{
    totalPlots: number;
    availablePlots: number;
    startingRate: number;
    completedVisits: number;
    cityCounts: Record<string, number>;
    categoryCounts?: Record<string, number>;
    locations: string[];
    featuredPlots: Property[];
    settings?: Record<string, string>;
  }> {
    return request<any>('/properties/public-stats');
  },

  async getProperty(id: number): Promise<{ property: Property }> {
    return request<{ property: Property }>(`/properties/${id}`);
  },

  async createProperty(data: any): Promise<{ message: string; property: Property }> {
    return request<{ message: string; property: Property }>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProperty(id: number, data: any): Promise<{ message: string; property: Property }> {
    return request<{ message: string; property: Property }>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async inlineEdit(id: number, field: string, value: any): Promise<{ message: string; property: Property }> {
    return request<{ message: string; property: Property }>(`/properties/${id}/inline`, {
      method: 'PATCH',
      body: JSON.stringify({ field, value }),
    });
  },

  async updateStatus(id: number, status: string, notes?: string): Promise<{ message: string; property: Property }> {
    return request<{ message: string; property: Property }>(`/properties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async bulkAction(ids: number[], action: string, value: any): Promise<{ message: string; affectedCount: number }> {
    return request<{ message: string; affectedCount: number }>('/properties/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action, value }),
    });
  },

  async duplicateProperty(id: number): Promise<{ message: string; property: Property }> {
    return request<{ message: string; property: Property }>(`/properties/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async deleteProperty(id: number, permanent: boolean = false): Promise<{ message: string }> {
    return request<{ message: string }>(`/properties/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  // Projects & Locations
  async getProjects(): Promise<{ projects: Project[] }> {
    return request<{ projects: Project[] }>('/projects');
  },

  async createProject(data: any): Promise<{ message: string; project: Project }> {
    return request<{ message: string; project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getLocations(): Promise<{ locations: Location[] }> {
    return request<{ locations: Location[] }>('/locations');
  },

  async createLocation(data: any): Promise<{ message: string; location: Location }> {
    return request<{ message: string; location: Location }>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reports
  async getReports(): Promise<any> {
    return request<any>('/reports');
  },

  // Audit Logs
  async getAuditLogs(params: any = {}): Promise<any> {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/audit-logs?${query}`);
  },

  // Import
  async parseAndValidateSpreadsheet(file: File, mapping?: Record<string, string>): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping && Object.keys(mapping).length > 0) {
      formData.append('mapping', JSON.stringify(mapping));
    }

    const activeRole = sessionStorage.getItem('rks_active_role') || localStorage.getItem('rks_active_role') || 'ADMIN';
    const token = sessionStorage.getItem('rks_auth_token') || localStorage.getItem('rks_auth_token');

    const headers: Record<string, string> = { 'x-demo-role': activeRole };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const primaryEndpoint = `${API_BASE}/import/parse-and-validate`;
    let res: Response;
    try {
      res = await fetch(primaryEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (networkErr: any) {
      // If direct cross-origin fetch failed, retry via same-origin proxy '/api'
      if (API_BASE !== '/api') {
        try {
          console.warn(`Primary import request to ${primaryEndpoint} failed. Retrying via same-origin /api...`);
          res = await fetch('/api/import/parse-and-validate', {
            method: 'POST',
            headers,
            body: formData,
          });
        } catch {
          throw networkErr;
        }
      } else {
        throw networkErr;
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed with status ' + res.status }));
      throw new Error(err.error || 'Upload failed');
    }

    return res.json();
  },

  async uploadSpreadsheet(file: File): Promise<any> {
    return this.parseAndValidateSpreadsheet(file);
  },

  async validateImport(fileKey: string, mapping: any): Promise<any> {
    return request('/import/validate', {
      method: 'POST',
      body: JSON.stringify({ fileKey, mapping }),
    });
  },

  async commitImport(rows: any[], filename: string): Promise<any> {
    return request('/import/commit', {
      method: 'POST',
      body: JSON.stringify({ rows, filename }),
    });
  },

  // Site Visits
  async getSiteVisits(params: any = {}): Promise<{ site_visits: any[]; stats: any }> {
    const query = new URLSearchParams(params).toString();
    return request<{ site_visits: any[]; stats: any }>(`/site-visits?${query}`);
  },

  async bookSiteVisit(data: any): Promise<{ message: string; bookingReference: string; booking: any }> {
    return request<{ message: string; bookingReference: string; booking: any }>('/site-visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSiteVisitStatus(id: number, data: { status: string; assigned_agent_name?: string; notes?: string }): Promise<any> {
    return request(`/site-visits/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSiteVisit(id: number): Promise<any> {
    return request(`/site-visits/${id}`, {
      method: 'DELETE',
    });
  },

  // AI Concierge Chat (Grounded RAG)
  async sendAiChatMessage(data: {
    message: string;
    history?: any[];
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    current_property_id?: number | null;
    locale?: string;
    session_id?: string;
  }): Promise<{
    reply: string;
    suggestedActions: string[];
    detectedIntent?: string;
    language?: string;
    requiresHuman: boolean;
    escalationReason: string | null;
    whatsappAlertSent?: boolean;
    leadCaptured?: boolean;
    whatsappNotification?: any;
  }> {
    return request('/ai-chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Offers & Promotions
  async getOffers(): Promise<{ offers: any[]; viewRole: string; count: number }> {
    return request<{ offers: any[]; viewRole: string; count: number }>('/offers');
  },

  async getOffer(id: number): Promise<{ offer: any }> {
    return request<{ offer: any }>(`/offers/${id}`);
  },

  async createOffer(data: any): Promise<{ message: string; offer: any }> {
    return request<{ message: string; offer: any }>('/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOffer(id: number, data: any): Promise<{ message: string; offer: any }> {
    return request<{ message: string; offer: any }>(`/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteOffer(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/offers/${id}`, {
      method: 'DELETE',
    });
  },

  // Site Settings & Dynamic Configuration
  async getSettings(): Promise<{ settings: Record<string, string>; timestamp: string }> {
    return request<{ settings: Record<string, string>; timestamp: string }>('/settings');
  },

  async updateSettings(settings: Record<string, string>): Promise<{ message: string; updatedKeys: string[] }> {
    return request<{ message: string; updatedKeys: string[] }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  async updateSetting(key: string, value: string): Promise<{ message: string; key: string; value: string }> {
    return request<{ message: string; key: string; value: string }>(`/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async getWhatsAppConfig(): Promise<{ whatsapp_number: string; default_message: string }> {
    return request<{ whatsapp_number: string; default_message: string }>('/settings/whatsapp');
  },

  async updateWhatsAppNumber(whatsapp_number: string): Promise<{ message: string; whatsapp_number: string }> {
    return request<{ message: string; whatsapp_number: string }>('/settings/whatsapp', {
      method: 'PUT',
      body: JSON.stringify({ whatsapp_number }),
    });
  },

  // Export helper URL
  getExportUrl(format: 'xlsx' | 'csv' = 'xlsx', ids?: number[], filters?: PropertyFilterParams): string {
    const params = new URLSearchParams();
    params.set('format', format);
    if (ids && ids.length > 0) {
      params.set('ids', ids.join(','));
    }
    if (filters) {
      if (filters.status) params.set('status', filters.status);
      if (filters.project_id) params.set('project_id', filters.project_id);
      if (filters.location_id) params.set('location_id', filters.location_id);
    }
    return `${API_BASE}/export?${params.toString()}`;
  },

  // Posters & Banners
  async getPosters(): Promise<{ posters: Poster[] }> {
    return request<{ posters: Poster[] }>('/posters');
  },

  async getAdminPosters(): Promise<{ posters: Poster[] }> {
    return request<{ posters: Poster[] }>('/posters/admin');
  },

  async createPoster(data: Partial<Poster>): Promise<{ message: string; poster: Poster }> {
    return request<{ message: string; poster: Poster }>('/posters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePoster(id: number, data: Partial<Poster>): Promise<{ message: string; poster: Poster }> {
    return request<{ message: string; poster: Poster }>(`/posters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async togglePoster(id: number): Promise<{ message: string; poster: Poster }> {
    return request<{ message: string; poster: Poster }>(`/posters/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  async deletePoster(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/posters/${id}`, {
      method: 'DELETE',
    });
  },
};
