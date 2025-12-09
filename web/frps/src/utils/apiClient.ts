import { REQUEST_TIMEOUT, API_ERRORS } from '../constants'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/**
 * Make API request with error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`

  try {
    const response = await fetchWithTimeout(url, {
      credentials: 'include',
      ...options,
    })

    // Handle HTTP error responses
    if (!response.ok) {
      let errorMessage: string = API_ERRORS.SERVER_ERROR
      switch (response.status) {
        case 401:
          errorMessage = API_ERRORS.UNAUTHORIZED
          break
        case 404:
          errorMessage = API_ERRORS.NOT_FOUND
          break
        case 500:
        case 502:
        case 503:
          errorMessage = API_ERRORS.SERVER_ERROR
          break
      }
      throw new ApiError(response.status, errorMessage)
    }

    const data = await response.json()
    return data as T
  } catch (err) {
    // Handle specific error types
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new ApiError(0, API_ERRORS.NETWORK_ERROR, err)
    }
    if (err instanceof SyntaxError) {
      throw new ApiError(0, API_ERRORS.INVALID_RESPONSE, err)
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, `Request timeout after ${REQUEST_TIMEOUT}ms`, err)
    }
    if (err instanceof ApiError) {
      throw err
    }
    throw new ApiError(0, API_ERRORS.SERVER_ERROR, err as Error)
  }
}

/**
 * Retry request with exponential backoff
 */
export async function apiRequestWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: ApiError | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options)
    } catch (err) {
      lastError = err instanceof ApiError ? err : new ApiError(0, String(err))

      // Don't retry on client errors
      if (lastError.status >= 400 && lastError.status < 500) {
        throw lastError
      }

      // Wait before retrying with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new ApiError(0, API_ERRORS.SERVER_ERROR)
}
