/**
 * Proxy type constants
 */
export const PROXY_TYPES = {
  TCP: 'tcp',
  UDP: 'udp',
  HTTP: 'http',
  HTTPS: 'https',
  STCP: 'stcp',
  SUDP: 'sudp',
  XTCP: 'xtcp',
} as const

/**
 * All available proxy types in array form
 */
export const PROXY_TYPE_ARRAY = Object.values(PROXY_TYPES)

/**
 * API error messages
 */
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please check your authentication token.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_RESPONSE: 'Invalid response from server.',
} as const

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 10000

/**
 * Refresh intervals in milliseconds
 */
export const REFRESH_INTERVALS = {
  SERVER_INFO: 5000,
  PROXY_LIST: 5000,
  TRAFFIC_DATA: 2000,
} as const
