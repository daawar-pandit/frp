import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiUrl } from '../utils/api'

/**
 * Generic composable for fetching proxy data
 */
export function useProxyData<T>(endpoint: string) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = reactive<T[]>([])

  /**
   * Fetch proxy data from API endpoint
   */
  const fetchProxyData = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(endpoint), {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      const proxyArray = Array.isArray(json) ? json : json.proxies || json.visitors || []

      // Replace entire array while maintaining reactivity
      data.length = 0
      data.push(...proxyArray)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMsg
      console.error(`Failed to fetch ${endpoint}:`, errorMsg)
      ElMessage.error(`Failed to fetch data: ${errorMsg}`)
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh data from API
   */
  const refresh = (): Promise<void> => fetchProxyData()

  return {
    data,
    loading,
    error,
    fetchProxyData,
    refresh,
  }
}

/**
 * Fetch traffic data for a proxy
 */
export async function fetchProxyTraffic(
  proxyName: string
): Promise<Array<[number, number]> | null> {
  try {
    const response = await fetch(apiUrl(`/api/traffic/${proxyName}`), {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    return json.traffic || null
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error(`Failed to fetch traffic for ${proxyName}:`, errorMsg)
    ElMessage.error(`Failed to fetch traffic: ${errorMsg}`)
    return null
  }
}
