export type Locale = 'en' | 'ta';

export const COOKIE_NAME = 'locale';

export function getCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (match) {
    const val = decodeURIComponent(match[2]).toLowerCase();
    if (val === 'ta' || val === 'en') return val;
  }
  return null;
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return;
  // 1 year expiry
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
  try {
    localStorage.setItem('preferred_language', locale);
  } catch {
    // localStorage might be unavailable
  }
}

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname === '/ta' || pathname.startsWith('/ta/')) {
    return 'ta';
  }
  return 'en';
}

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  // 1. Check path prefix first
  const pathLocale = getLocaleFromPath(window.location.pathname);
  if (pathLocale === 'ta') return 'ta';

  // 2. Check cookie
  const cookieLocale = getCookieLocale();
  if (cookieLocale) return cookieLocale;

  // 3. Check localStorage
  try {
    const stored = localStorage.getItem('preferred_language');
    if (stored === 'ta' || stored === 'en') return stored;
  } catch {
    // Ignore storage issues
  }

  // 4. Accept-Language / navigator language detection
  const navLangs = navigator.languages || [navigator.language || ''];
  for (const lang of navLangs) {
    const lower = lang.toLowerCase();
    if (lower.startsWith('ta')) {
      return 'ta';
    }
  }

  return 'en';
}

export function switchLocalePath(currentPath: string, targetLocale: Locale): string {
  // Normalize search/hash if present
  const [pathOnly, queryAndHash] = currentPath.split(/(?=[?#])/);
  const extra = queryAndHash || '';

  const isCurrentTa = pathOnly === '/ta' || pathOnly.startsWith('/ta/');

  if (targetLocale === 'ta') {
    if (isCurrentTa) return currentPath;
    if (pathOnly === '/') return `/ta${extra}`;
    return `/ta${pathOnly}${extra}`;
  } else {
    // Target is 'en'
    if (!isCurrentTa) return currentPath;
    if (pathOnly === '/ta') return `/${extra}`;
    const stripped = pathOnly.replace(/^\/ta/, '');
    return `${stripped || '/'}${extra}`;
  }
}

export function getLocalizedPath(basePath: string, locale: Locale): string {
  if (locale === 'ta') {
    if (basePath === '/' || basePath === '') return '/ta';
    if (basePath.startsWith('/ta')) return basePath;
    return `/ta${basePath.startsWith('/') ? '' : '/'}${basePath}`;
  }
  // English
  if (basePath === '/ta') return '/';
  if (basePath.startsWith('/ta/')) return basePath.replace(/^\/ta/, '') || '/';
  return basePath.startsWith('/') ? basePath : `/${basePath}`;
}
