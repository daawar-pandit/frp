import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiUrl } from '../utils/api'

/**
 * Server information interface
 */
export interface ServerInfo {
  version: string
  bindPort: number
  kcpBindPort: number
  quicBindPort: number
  vhostHTTPPort: number
  vhostHTTPSPort: number
  tcpmuxHTTPConnectPort: number
  subdomainHost: string
  maxPoolCount: number
  maxPortsPerClient: string | number
  allowPortsStr: string
  tlsForce: boolean
  heartbeatTimeout: number
  clientCounts: number
  curConns: number
  proxyCounts: number
  totalTrafficIn?: number
  totalTrafficOut?: number
}

/**
 * API Response interface
 */
interface ApiResponse {
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
  proxyTypeCount: Record<string, number>
}

/**
 * Composable for managing server info state and fetching
 */
export function useServerInfo() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const data = reactive<ServerInfo>({
    version: '',
    bindPort: 0,
    kcpBindPort: 0,
    quicBindPort: 0,
    vhostHTTPPort: 0,
    vhostHTTPSPort: 0,
    tcpmuxHTTPConnectPort: 0,
    subdomainHost: '',
    maxPoolCount: 0,
    maxPortsPerClient: '',
    allowPortsStr: '',
    tlsForce: false,
    heartbeatTimeout: 0,
    clientCounts: 0,
    curConns: 0,
    proxyCounts: 0,
    totalTrafficIn: 0,
    totalTrafficOut: 0,
  })

  /**
   * Calculate total proxy count from type counts
   */
  const calculateProxyCount = (proxyTypeCount: Record<string, number>): number => {
    const proxyTypes = ['tcp', 'udp', 'http', 'https', 'stcp', 'sudp', 'xtcp']
    return proxyTypes.reduce((total, type) => total + (proxyTypeCount[type] ?? 0), 0)
  }

  /**
   * Fetch server info from API
   */
  const fetchServerInfo = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl('/api/serverinfo'), {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json: ApiResponse = await response.json()

      // Update reactive state
      Object.assign(data, {
        version: json.version,
        bindPort: json.bindPort,
        kcpBindPort: json.kcpBindPort,
        quicBindPort: json.quicBindPort,
        vhostHTTPPort: json.vhostHTTPPort,
        vhostHTTPSPort: json.vhostHTTPSPort,
        tcpmuxHTTPConnectPort: json.tcpmuxHTTPConnectPort,
        subdomainHost: json.subdomainHost,
        maxPoolCount: json.maxPoolCount,
        maxPortsPerClient: json.maxPortsPerClient === 0 ? 'no limit' : json.maxPortsPerClient,
        allowPortsStr: json.allowPortsStr || '',
        tlsForce: json.tlsForce || false,
        heartbeatTimeout: json.heartbeatTimeout,
        clientCounts: json.clientCounts,
        curConns: json.curConns,
        totalTrafficIn: json.totalTrafficIn,
        totalTrafficOut: json.totalTrafficOut,
        proxyCounts: json.proxyTypeCount ? calculateProxyCount(json.proxyTypeCount) : 0,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMsg
      console.error('Failed to fetch server info:', errorMsg)
      ElMessage.error(`Failed to fetch server info: ${errorMsg}`)
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    fetchServerInfo,
  }
}
