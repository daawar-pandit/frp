# FRP Dashboard - Best Practices & Code Quality

## Overview

This document outlines the best practices and code quality standards implemented in the FRP Dashboard frontend.

## Architecture

### 1. **Composables (Vue 3 Composition API)**

All reusable logic is extracted into composables in `src/composables/`:

#### `useServerInfo.ts`
- Manages server information state
- Handles data fetching with error handling
- Provides typed interfaces for API responses
- Implements proper error feedback via ElMessage

**Usage:**
```typescript
const { data, loading, error, fetchServerInfo } = useServerInfo()

onMounted(async () => {
  await fetchServerInfo()
})
```

#### `useProxyData.ts`
- Generic composable for fetching proxy list data
- Works with any proxy type (TCP, UDP, HTTP, etc.)
- Provides `refresh()` method for manual refetch
- Type-safe with generic types

**Usage:**
```typescript
const { data, loading, error, fetchProxyData } = useProxyData<TCPProxy>('/api/proxy/tcp')

onMounted(() => fetchProxyData())
```

### 2. **API Layer (`src/utils/apiClient.ts`)**

Centralized API request handling with:

- **Error Handling**: Custom `ApiError` class for type-safe error handling
- **Request Timeout**: 10-second default timeout with customizable durations
- **Retry Logic**: `apiRequestWithRetry()` with exponential backoff
- **Response Validation**: Checks HTTP status codes and JSON parsing

**Key Functions:**
- `apiRequest<T>(endpoint, options)`: Single API request
- `apiRequestWithRetry<T>(endpoint, options, maxRetries)`: Request with retries

### 3. **TypeScript Types**

**`src/composables/useServerInfo.ts`:**
```typescript
interface ServerInfo {
  version: string
  bindPort: number
  kcpBindPort: number
  // ... more fields
}

interface ApiResponse {
  // Response format from server
}
```

Benefits:
- Full IDE autocomplete
- Compile-time type checking
- Self-documenting code

### 4. **Constants (`src/constants/index.ts`)**

Centralized configuration:
- Proxy type constants (`PROXY_TYPES`)
- API error messages (`API_ERRORS`)
- Request timeout settings (`REQUEST_TIMEOUT`)
- Refresh intervals (`REFRESH_INTERVALS`)

Avoids magic strings throughout the codebase.

### 5. **State Management**

Uses Vue 3's `reactive()` with:
- **Atomic Updates**: `Object.assign()` for bulk state updates
- **Loading States**: `loading` ref tracks API call status
- **Error States**: `error` ref stores error messages
- **Type Safety**: All state properties are typed

## Component Design Patterns

### Single Responsibility
Each component handles one concern:
- **ServerOverview.vue**: Dashboard home page
- **ProxyView.vue**: Reusable proxy table display
- **Traffic.vue**: Traffic detail dialog
- **Specific Proxy Components**: TCP, UDP, HTTP, etc.

### Props & Events
- Props use TypeScript types for type safety
- Components emit custom events for parent communication
- `:destroy-on-close="true"` for dialog cleanup

### Lifecycle Management
Components properly manage:
- `onMounted()`: Initial data fetch
- `onBeforeUnmount()`: Cleanup and abort pending requests
- Auto-refresh intervals with cleanup

## Error Handling

### Three-Tier Error Handling:

1. **API Layer** (`apiClient.ts`):
   - Network errors
   - HTTP errors (401, 404, 500, etc.)
   - Timeout errors
   - Invalid JSON responses

2. **Composable Layer**:
   - Stores error state in `error` ref
   - Shows user-friendly messages via ElMessage
   - Logs to console for debugging

3. **Component Layer**:
   - Displays error state in UI
   - Provides retry buttons if needed
   - Falls back to empty state gracefully

### Example Error Handling:
```typescript
try {
  const response = await apiRequest<ServerInfo>('/api/serverinfo')
  Object.assign(data, response)
} catch (err) {
  error.value = err instanceof ApiError ? err.message : 'Unknown error'
  ElMessage.error(error.value)
}
```

## Performance Considerations

### 1. **Lazy Loading**
- Components lazy-load proxy lists only when needed
- Charts only render when data is available

### 2. **Batch Updates**
- `Object.assign()` updates entire objects atomically
- `nextTick()` ensures DOM updates after state changes

### 3. **Refresh Strategy**
```typescript
const REFRESH_INTERVALS = {
  SERVER_INFO: 5000,     // 5 seconds
  PROXY_LIST: 5000,      // 5 seconds
  TRAFFIC_DATA: 2000,    // 2 seconds (more frequent)
}
```

### 4. **Request Cancellation**
- Implement AbortController in components to cancel pending requests on unmount
- Prevents "setState after unmount" errors

## Development Workflow

### Adding a New API Endpoint

1. **Define the type** in `src/composables/`:
```typescript
export interface MyData {
  id: string
  name: string
}
```

2. **Create a composable**:
```typescript
export function useMyData() {
  const data = reactive<MyData>({})
  const error = ref<string | null>(null)
  
  const fetchData = async () => {
    try {
      const response = await apiRequest<MyData>('/api/mydata')
      Object.assign(data, response)
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Unknown error'
    }
  }
  
  return { data, error, fetchData }
}
```

3. **Use in a component**:
```typescript
const { data, error, fetchData } = useMyData()

onMounted(() => fetchData())
```

## Testing Recommendations

### Unit Tests
- Test composables in isolation
- Mock API responses
- Verify error handling paths

### Integration Tests
- Test component + composable interaction
- Verify API calls happen at right times

### E2E Tests
- Test full user workflows
- Verify UI displays correct data

## Future Improvements

1. **Response Caching**
   - Cache `/api/serverinfo` for 5 seconds
   - Reduce unnecessary API calls

2. **Request Deduplication**
   - Prevent multiple simultaneous requests to same endpoint
   - Queue up requests and share response

3. **Error Recovery**
   - Implement retry with exponential backoff
   - User-triggered manual retry buttons

4. **Loading Indicators**
   - Show skeleton loaders while data loads
   - Smooth transitions between states

5. **Real-time Updates**
   - Consider WebSocket for live updates
   - Replace polling with push notifications

## Code Review Checklist

Before committing changes:
- ✅ All TypeScript types are defined
- ✅ Error handling is present (try/catch or .catch())
- ✅ Loading states are managed
- ✅ Components clean up resources (onBeforeUnmount)
- ✅ No console errors or warnings
- ✅ API endpoints use `apiRequest()` utility
- ✅ Constants used instead of magic strings
- ✅ JSDoc comments on public functions
- ✅ Props are typed and documented

## References

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 Best Practices](https://vuejs.org/guide/best-practices/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
