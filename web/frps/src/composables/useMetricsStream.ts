import { ref, reactive } from 'vue'
import { apiUrl } from '../utils/api'

/**
 * Proxy metrics from SSE stream
 */
export interface ProxyMetrics {
  name: string
  type: string
  status: string
  curConns: number
  trafficIn: number
  trafficOut: number
  latencyRttMs: number
  jitterMs: number
  speedInMbps: number
  speedOutMbps: number
}

/**
 * Server metrics from SSE stream
 */
export interface ServerMetrics {
  totalTrafficIn: number
  totalTrafficOut: number
  curConns: number
  clientCounts: number
}

/**
 * SSE event data structure
 */
interface MetricsEvent {
  type: string
  timestamp: number
  server: ServerMetrics
  proxies: ProxyMetrics[]
}

/**
 * Connection state
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Composable for real-time metrics streaming via SSE
 */
export function useMetricsStream(intervalMs: number = 1000) {
  const connectionState = ref<ConnectionState>('disconnected')
  const lastUpdate = ref<number>(0)
  const error = ref<string | null>(null)
  const serverMetrics = reactive<ServerMetrics>({
    totalTrafficIn: 0,
    totalTrafficOut: 0,
    curConns: 0,
    clientCounts: 0,
  })
  const proxyMetrics = reactive<Map<string, ProxyMetrics>>(new Map())
  
  let eventSource: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let staleCheckInterval: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 50 // Increased - we should keep trying
  const baseReconnectDelay = 1000 // 1 second base
  const maxReconnectDelay = 5000 // Cap at 5 seconds
  const staleThresholdMs = 5000 // Consider stale if no update in 5 seconds

  /**
   * Get metrics for proxies of a specific type
   */
  const getProxiesByType = (type: string): ProxyMetrics[] => {
    const result: ProxyMetrics[] = []
    proxyMetrics.forEach((proxy) => {
      if (proxy.type === type) {
        result.push(proxy)
      }
    })
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get metrics for a specific proxy by name
   */
  const getProxyByName = (name: string): ProxyMetrics | undefined => {
    return proxyMetrics.get(name)
  }

  /**
   * Check if the connection is stale and reconnect if needed
   */
  const checkStaleConnection = () => {
    if (connectionState.value !== 'connected') return
    
    const now = Date.now()
    const timeSinceUpdate = now - lastUpdate.value
    
    if (lastUpdate.value > 0 && timeSinceUpdate > staleThresholdMs) {
      console.warn(`SSE connection stale (no data for ${timeSinceUpdate}ms), reconnecting...`)
      reconnect()
    }
  }

  /**
   * Start stale connection checker
   */
  const startStaleChecker = () => {
    if (staleCheckInterval) {
      clearInterval(staleCheckInterval)
    }
    // Check every 3 seconds
    staleCheckInterval = setInterval(checkStaleConnection, 3000)
  }

  /**
   * Stop stale connection checker
   */
  const stopStaleChecker = () => {
    if (staleCheckInterval) {
      clearInterval(staleCheckInterval)
      staleCheckInterval = null
    }
  }

  /**
   * Connect to SSE stream
   */
  const connect = () => {
    if (eventSource) {
      eventSource.close()
    }

    connectionState.value = 'connecting'
    error.value = null

    const url = apiUrl(`/api/stream/metrics?interval=${intervalMs}ms`)
    eventSource = new EventSource(url, { withCredentials: true })

    eventSource.onopen = () => {
      connectionState.value = 'connected'
      reconnectAttempts = 0
      error.value = null
      console.log('SSE connected')
      // Start checking for stale connections
      startStaleChecker()
    }

    eventSource.onmessage = (event) => {
      try {
        const data: MetricsEvent = JSON.parse(event.data)
        lastUpdate.value = Date.now() // Use local time for stale detection

        // Update server metrics
        if (data.server) {
          Object.assign(serverMetrics, data.server)
        }

        // Update proxy metrics
        if (data.proxies) {
          // Create a set of current proxy names
          const currentNames = new Set(data.proxies.map(p => p.name))
          
          // Remove proxies that no longer exist
          proxyMetrics.forEach((_, name) => {
            if (!currentNames.has(name)) {
              proxyMetrics.delete(name)
            }
          })

          // Update or add proxies
          for (const proxy of data.proxies) {
            proxyMetrics.set(proxy.name, proxy)
          }
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e)
      }
    }

    eventSource.onerror = (e) => {
      console.error('SSE error:', e)
      connectionState.value = 'error'
      error.value = 'Connection lost'
      
      stopStaleChecker()
      eventSource?.close()
      eventSource = null

      // Attempt to reconnect with capped exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        // Cap the delay at maxReconnectDelay
        const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts), maxReconnectDelay)
        reconnectAttempts++
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
        reconnectTimeout = setTimeout(connect, delay)
      } else {
        // After max attempts, wait longer then reset and try again
        console.warn('Max reconnection attempts reached, will retry in 10 seconds')
        connectionState.value = 'disconnected'
        error.value = 'Connection failed - retrying...'
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts = 0
          connect()
        }, 10000)
      }
    }
  }

  /**
   * Disconnect from SSE stream
   */
  const disconnect = () => {
    stopStaleChecker()
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    connectionState.value = 'disconnected'
    reconnectAttempts = 0
  }

  /**
   * Force reconnect
   */
  const reconnect = () => {
    console.log('Force reconnecting SSE...')
    stopStaleChecker()
    reconnectAttempts = 0
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    connect()
  }

  // Note: Cleanup is NOT registered here for the shared instance
  // Individual components should not disconnect the shared stream

  return {
    // State
    connectionState,
    lastUpdate,
    error,
    serverMetrics,
    proxyMetrics,
    
    // Methods
    connect,
    disconnect,
    reconnect,
    getProxiesByType,
    getProxyByName,
  }
}

/**
 * Singleton instance for shared metrics stream
 */
let sharedInstance: ReturnType<typeof useMetricsStream> | null = null

export function useSharedMetricsStream(intervalMs: number = 1000) {
  if (!sharedInstance) {
    sharedInstance = useMetricsStream(intervalMs)
  }
  return sharedInstance
}

/**
 * Cleanup the shared instance - call this only when the app is unmounting
 */
export function destroySharedMetricsStream() {
  if (sharedInstance) {
    sharedInstance.disconnect()
    sharedInstance = null
  }
}
