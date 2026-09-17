// Centralized Application Configuration
export const Config = {
  // Primary Backend API URL
  apiUrl: (import.meta as any).env?.VITE_API_URL || 'https://rks-property-intelligence-production.up.railway.app',

  // Supabase Storage Credentials (for direct image uploads)
  supabase: {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // Brand Metadata
  appName: 'RKS Property Hub',
  defaultLanguage: 'en',
};
