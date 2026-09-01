import { Property, Project, Location, PropertyFilterParams, PaginationMeta, UserRole } from '../types/index.js';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('rks_auth_token');
  const activeRole = (localStorage.getItem('rks_active_role') || 'ADMIN') as UserRole;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-demo-role': activeRole,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed with status ' + res.status }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem('rks_auth_token', res.token);
      localStorage.setItem('rks_active_role', res.user.role);
    }
    return res;
  },

  async customerLogin(name: string, phone: string): Promise<{ message: string; customer: any }> {
    try {
      return await request<{ message: string; customer: any }>('/auth/customer-login', {
        method: 'POST',
        body: JSON.stringify({ name, phone }),
      });
    } catch {
      // Non-blocking — if server fails, still allow customer in
      return { message: 'Welcome!', customer: { id: 0, name, phone } };
    }
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

    const res = await fetch(`${API_BASE}/import/parse-and-validate`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }

    return res.json();
  },

  // Legacy alias kept for compat
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

  // AI Concierge Chat
  async sendAiChatMessage(data: {
    message: string;
    history?: any[];
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    current_property_id?: number | null;
  }): Promise<{
    reply: string;
    suggestedActions: string[];
    requiresHuman: boolean;
    escalationReason: string | null;
    whatsappAlertSent: boolean;
    whatsappNotification?: any;
  }> {
    return request('/ai-chat', {
      method: 'POST',
      body: JSON.stringify(data),
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
};
