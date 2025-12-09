// API base URL helper for development and production environments
// In production: dashboard is served from /static/, API is at /api/
// In development: Vite dev server proxies /api/ to the frps backend

export function getBaseUrl(): string {
  // Check if we're in development mode (Vite dev server)
  // In dev mode, the Vite proxy handles /api requests
  // In production, we need to go up one level from /static/ to reach /api/
  if (typeof window !== 'undefined') {
    // If served from /static/, we need to go up one level
    if (window.location.pathname.startsWith('/static')) {
      return '..'
    }
  }
  // In development or when served from root, use root path
  return ''
}

export function apiUrl(path: string): string {
  const base = getBaseUrl()
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
