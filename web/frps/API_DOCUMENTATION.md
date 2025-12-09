# API Integration Documentation

## Overview

The dashboard integrates with the frps server through a RESTful API. All API communication is centralized through the `apiClient.ts` utility.

## API Client Utilities

### `apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T>`

Makes a single HTTP request with automatic error handling.

**Features:**
- 10-second request timeout
- Automatic response JSON parsing
- Comprehensive error handling
- Network error detection
- Type-safe response

**Example:**
```typescript
import { apiRequest } from '@/utils/apiClient'

const serverInfo = await apiRequest<ServerInfo>('/api/serverinfo')
console.log(serverInfo.version)
```

**Error Handling:**
```typescript
import { apiRequest, ApiError } from '@/utils/apiClient'

try {
  const data = await apiRequest<T>('/api/endpoint')
} catch (err) {
  if (err instanceof ApiError) {
    console.error(`API Error [${err.status}]: ${err.message}`)
    // Handle specific error
    if (err.status === 401) {
      // Unauthorized
    } else if (err.status === 404) {
      // Not found
    }
  }
}
```

### `apiRequestWithRetry<T>(endpoint: string, options?: RequestInit, maxRetries?: number): Promise<T>`

Makes an HTTP request with automatic retry on failure using exponential backoff.

**Features:**
- Up to 3 retries (configurable)
- Exponential backoff: 1s, 2s, 4s
- Skips retry on client errors (4xx)
- Only retries on server errors (5xx) and network issues

**Example:**
```typescript
// Retry up to 3 times with increasing delays
const data = await apiRequestWithRetry<Proxies>(
  '/api/proxy/tcp',
  {},
  3
)
```

**When to Use:**
- Fetching data that may be temporarily unavailable
- Non-critical operations where best-effort is acceptable
- Network-prone environments

## API Endpoints

### Server Information

**Endpoint:** `GET /api/serverinfo`

**Response Type:**
```typescript
interface ServerInfo {
  version: string
  bindPort: number
  kcpBindPort: number
  quicBindPort: number
  vhostHTTPPort: number
  vhostHTTPSPort: number
  tcpmuxHTTPConnectPort: number
  subdomainHost: string
  maxPoolCount: number
  maxPortsPerClient: number
  allowPortsStr: string
  tlsForce: boolean
  heartbeatTimeout: number
  clientCounts: number
  curConns: number
  totalTrafficIn: number
  totalTrafficOut: number
  proxyTypeCount: {
    tcp?: number
    udp?: number
    http?: number
    https?: number
    stcp?: number
    sudp?: number
    xtcp?: number
  }
}
```

**Usage:**
```typescript
const { data, fetchServerInfo } = useServerInfo()
onMounted(() => fetchServerInfo())
```

### Proxy Lists

**Endpoints:**
- `GET /api/proxy/tcp` - List TCP proxies
- `GET /api/proxy/udp` - List UDP proxies
- `GET /api/proxy/http` - List HTTP proxies
- `GET /api/proxy/https` - List HTTPS proxies
- `GET /api/proxy/stcp` - List STCP proxies
- `GET /api/proxy/sudp` - List SUDP proxies
- `GET /api/proxy/xtcp` - List XTCP proxies
- `GET /api/proxy/tcpmux` - List TCPMux proxies

**Response Format:**
```typescript
// Array of proxy objects
[
  {
    name: string
    type: string
    conf: Record<string, any>
    status: string
    err: string | null
    clientVersion: string
  },
  // ...
]
```

**Usage:**
```typescript
const { data, fetchProxyData } = useProxyData<TCPProxy>('/api/proxy/tcp')
onMounted(() => fetchProxyData())
```

### Traffic Data

**Endpoint:** `GET /api/traffic/{proxyName}`

**Response:**
```typescript
{
  traffic: Array<[timestamp: number, bytes: number]>
}
```

**Usage:**
```typescript
import { fetchProxyTraffic } from '@/composables/useProxyData'

const traffic = await fetchProxyTraffic('my-tcp-proxy')
```

## Error Handling

### ApiError Class

```typescript
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
```

### Error Types

The API client detects and categorizes errors:

| Type | Status | Handling |
|------|--------|----------|
| Network Error | 0 | No connection, check internet |
| Unauthorized | 401 | Invalid credentials |
| Not Found | 404 | Resource doesn't exist |
| Server Error | 5xx | Temporary issue, retry later |
| Invalid Response | 0 | JSON parsing error |
| Timeout | 0 | Request took > 10 seconds |

### Error Messages

User-friendly messages defined in `src/constants/index.ts`:

```typescript
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please check your authentication token.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_RESPONSE: 'Invalid response from server.',
}
```

## Composables

### useServerInfo()

Manages server information state and fetching.

```typescript
const { data, loading, error, fetchServerInfo } = useServerInfo()

// data: Reactive ServerInfo object
// loading: boolean - true while fetching
// error: string | null - error message if fetch failed
// fetchServerInfo: () => Promise<void> - fetch function
```

**Example:**
```typescript
import { useServerInfo } from '@/composables/useServerInfo'

export default {
  setup() {
    const { data, loading, error, fetchServerInfo } = useServerInfo()

    onMounted(async () => {
      await fetchServerInfo()
    })

    return { data, loading, error }
  }
}
```

### useProxyData<T>()

Generic composable for fetching proxy lists.

```typescript
const { data, loading, error, fetchProxyData, refresh } = useProxyData<TCPProxy>(
  '/api/proxy/tcp'
)

// data: Reactive T[] - array of proxies
// loading: boolean - true while fetching
// error: string | null - error message if fetch failed
// fetchProxyData: () => Promise<void> - fetch function
// refresh: () => Promise<void> - alias for fetchProxyData()
```

**Example:**
```typescript
import { useProxyData } from '@/composables/useProxyData'
import { TCPProxy } from '@/utils/proxy'

export default {
  setup() {
    const { data, loading, error, fetchProxyData } = useProxyData<TCPProxy>(
      '/api/proxy/tcp'
    )

    onMounted(() => fetchProxyData())

    return { data, loading, error }
  }
}
```

## Authentication

The dashboard uses HTTP Basic Authentication configured in `conf/frps_dev.toml`:

```toml
[common]
authentication_method = http_basic
http_basic_auth_user = admin
http_basic_auth_passwd = admin
```

Credentials are automatically included in all requests via:
```typescript
fetch(url, {
  credentials: 'include',  // Include auth cookies
})
```

## Configuration

### Development (Port 5174)

Vite proxy forwards API requests:
```typescript
// vite.config.mts
'/api': {
  target: 'http://127.0.0.1:7500',
  changeOrigin: true,
  headers: {
    'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64')
  }
}
```

### Production (Served from /static/)

API paths are resolved relative to dashboard location:
```typescript
// src/utils/api.ts
export function apiUrl(path: string): string {
  // Returns empty string in dev (Vite proxy handles it)
  // Returns relative path in prod (..)
}
```

## Request/Response Cycle

### Typical Flow

```
Component
  ↓
useComposable() [useServerInfo, useProxyData]
  ↓
apiRequest<T>() [in composable]
  ↓
fetchWithTimeout() [10s timeout]
  ↓
HTTP Fetch API
  ↓
Error Handling [network, HTTP status, JSON parsing]
  ↓
ElMessage [user notification]
  ↓
Reactive State Update
  ↓
Component Re-render
```

### Example: Complete Flow

```typescript
// 1. Setup composable in component
const { data, loading, error, fetchServerInfo } = useServerInfo()

// 2. Trigger fetch on mount
onMounted(() => fetchServerInfo())

// 3. In composable: error handling
try {
  const response = await apiRequest<ServerInfo>('/api/serverinfo')
  Object.assign(data, response)  // Update reactive state
} catch (err) {
  error.value = err instanceof ApiError ? err.message : 'Unknown error'
  ElMessage.error(error.value)   // Show user message
}

// 4. Component template shows result
<div v-if="loading">Loading...</div>
<div v-else-if="error" class="error">{{ error }}</div>
<div v-else>{{ data.version }}</div>
```

## Testing API Integration

### Manual Testing

1. **Start frps server:**
   ```bash
   ./frps -c conf/frps_dev.toml
   ```

2. **Check API directly:**
   ```bash
   curl -u admin:admin http://localhost:7500/api/serverinfo
   ```

3. **Open dashboard:**
   - Dev: http://localhost:5174/
   - Should display server info

### Testing Error Handling

1. **Stop frps server** and refresh dashboard
2. **Check browser console** for error messages
3. **Verify ElMessage** shows user-friendly error

### Testing Retry Logic

```typescript
// In component
const data = await apiRequestWithRetry<ServerInfo>(
  '/api/serverinfo',
  {},
  3  // Try up to 3 times
)
```

## Performance Considerations

### Request Deduplication

Multiple simultaneous requests to the same endpoint are not currently deduplicated. Consider adding:

```typescript
const requestCache = new Map()

export async function apiRequestDeduped<T>(endpoint: string) {
  if (requestCache.has(endpoint)) {
    return requestCache.get(endpoint)
  }

  const promise = apiRequest<T>(endpoint)
  requestCache.set(endpoint, promise)

  try {
    return await promise
  } finally {
    requestCache.delete(endpoint)
  }
}
```

### Response Caching

Cache responses for endpoints that rarely change:

```typescript
const responseCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5000  // 5 seconds

export async function apiRequestCached<T>(endpoint: string) {
  const cached = responseCache.get(endpoint)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }

  const data = await apiRequest<T>(endpoint)
  responseCache.set(endpoint, { data, timestamp: Date.now() })
  return data
}
```

## Debugging

### Enable Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh dashboard
4. See all API requests

### Check Request Headers
```
Authorization: Basic YWRtaW46YWRtaW4=
Content-Type: application/json
```

### Monitor API Calls

In browser console:
```javascript
// Intercept fetch to log requests
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('API Request:', args[0])
  return originalFetch.apply(this, args)
}
```

## References

- API Endpoints: `/api/serverinfo`, `/api/proxy/{type}`, `/api/traffic/{name}`
- Implementation: `src/utils/apiClient.ts`
- Composables: `src/composables/`
- Configuration: `vite.config.mts`, `conf/frps_dev.toml`
