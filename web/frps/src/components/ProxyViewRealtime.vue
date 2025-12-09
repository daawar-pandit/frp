<template>
  <ProxyView 
    :proxies="proxies" 
    :proxyType="proxyType" 
    @refresh="forceRefresh"
    :connectionState="metricsStream.connectionState.value"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef } from 'vue'
import { useSharedMetricsStream } from '../composables/useMetricsStream'
import { apiUrl } from '../utils/api'
import ProxyView from './ProxyView.vue'

const props = defineProps<{
  proxyType: string
  proxyClass: any
  // For HTTP/HTTPS/TCPMux proxies that need port info
  needsServerInfo?: boolean
}>()

const metricsStream = useSharedMetricsStream(1000)
// Use shallowRef so we can control reactivity more precisely
const proxies = shallowRef<any[]>([])
const fullProxyData = ref<Map<string, any>>(new Map())
const serverInfo = ref<{ port: number; subdomainHost: string }>({ port: 0, subdomainHost: '' })

// Fetch server info for HTTP/HTTPS/TCPMux proxies
const fetchServerInfo = async () => {
  if (!props.needsServerInfo) return
  
  try {
    const response = await fetch(apiUrl('/api/serverinfo'), { credentials: 'include' })
    if (!response.ok) return
    
    const json = await response.json()
    
    // Determine which port to use based on proxy type
    let port = 0
    if (props.proxyType === 'http') {
      port = json.vhostHTTPPort || 0
    } else if (props.proxyType === 'https') {
      port = json.vhostHTTPSPort || 0
    } else if (props.proxyType === 'tcpmux') {
      port = json.tcpmuxHTTPConnectPort || 0
    }
    
    serverInfo.value = {
      port,
      subdomainHost: json.subdomainHost || '',
    }
  } catch (e) {
    console.error('Failed to fetch server info:', e)
  }
}

// Fetch full proxy data (with conf) on mount and refresh
const fetchFullData = async () => {
  try {
    const response = await fetch(apiUrl(`/api/proxy/${props.proxyType}`), {
      credentials: 'include',
    })
    if (!response.ok) return
    
    const json = await response.json()
    const proxyArray = Array.isArray(json) ? json : json.proxies || []
    
    // Store full data keyed by name
    fullProxyData.value.clear()
    for (const proxyStats of proxyArray) {
      fullProxyData.value.set(proxyStats.name, proxyStats)
    }
    
    updateProxies()
  } catch (e) {
    console.error(`Failed to fetch ${props.proxyType} proxies:`, e)
  }
}

// Merge stream metrics with full proxy data
const updateProxies = () => {
  const streamProxies = metricsStream.getProxiesByType(props.proxyType)
  
  // If no stream data yet and no existing data, nothing to do
  if (streamProxies.length === 0) {
    return
  }
  
  // Create a map of existing proxies by name for efficient lookup
  const existingProxiesMap = new Map<string, any>()
  for (const proxy of proxies.value) {
    existingProxiesMap.set(proxy.name, proxy)
  }
  
  const newProxies: any[] = []
  let hasChanges = false
  
  for (const streamProxy of streamProxies) {
    // Get full data if available, otherwise use stream data
    const fullData = fullProxyData.value.get(streamProxy.name) || {}
    
    // Merge: full data as base, stream metrics as overlay
    // Important: Map both sets of property names for compatibility
    const mergedData = {
      ...fullData,
      name: streamProxy.name,
      // Properties expected by the constructor
      curConns: streamProxy.curConns,
      todayTrafficIn: streamProxy.trafficIn,
      todayTrafficOut: streamProxy.trafficOut,
      status: streamProxy.status,
      latencyRttMs: streamProxy.latencyRttMs,
      jitterMs: streamProxy.jitterMs,
      speedInMbps: streamProxy.speedInMbps,
      speedOutMbps: streamProxy.speedOutMbps,
    }
    
    // Check if proxy already exists
    const existingProxy = existingProxiesMap.get(streamProxy.name)
    
    if (existingProxy) {
      // Check if any value changed
      const connsChanged = existingProxy.conns !== streamProxy.curConns
      const trafficInChanged = existingProxy.trafficIn !== streamProxy.trafficIn
      const trafficOutChanged = existingProxy.trafficOut !== streamProxy.trafficOut
      const statusChanged = existingProxy.status !== streamProxy.status
      const latencyChanged = existingProxy.latencyRttMs !== streamProxy.latencyRttMs
      const jitterChanged = existingProxy.jitterMs !== streamProxy.jitterMs
      const speedInChanged = existingProxy.speedInMbps !== streamProxy.speedInMbps
      const speedOutChanged = existingProxy.speedOutMbps !== streamProxy.speedOutMbps
      
      const anyChange = connsChanged || trafficInChanged || trafficOutChanged || 
                       statusChanged || latencyChanged || jitterChanged ||
                       speedInChanged || speedOutChanged
      
      if (anyChange) {
        hasChanges = true
        
        // Create a new object to force el-table reactivity
        // This preserves the expand state while allowing cell updates
        const updatedProxy = Object.create(Object.getPrototypeOf(existingProxy))
        Object.assign(updatedProxy, existingProxy)
        
        // Update the new object with fresh values
        updatedProxy.conns = streamProxy.curConns
        updatedProxy.trafficIn = streamProxy.trafficIn
        updatedProxy.trafficOut = streamProxy.trafficOut
        updatedProxy.status = streamProxy.status
        updatedProxy.latencyRttMs = streamProxy.latencyRttMs
        updatedProxy.jitterMs = streamProxy.jitterMs
        updatedProxy.speedInMbps = streamProxy.speedInMbps
        updatedProxy.speedOutMbps = streamProxy.speedOutMbps
        updatedProxy.curConns = streamProxy.curConns
        updatedProxy.todayTrafficIn = streamProxy.trafficIn
        updatedProxy.todayTrafficOut = streamProxy.trafficOut
        
        newProxies.push(updatedProxy)
      } else {
        // No change, keep existing proxy
        newProxies.push(existingProxy)
      }
    } else {
      // Create new proxy instance
      hasChanges = true
      let newProxy
      if (props.proxyClass) {
        if (props.needsServerInfo) {
          newProxy = new props.proxyClass(mergedData, serverInfo.value.port, serverInfo.value.subdomainHost)
        } else {
          newProxy = new props.proxyClass(mergedData)
        }
      } else {
        newProxy = mergedData
      }
      newProxies.push(newProxy)
    }
  }
  
  // Check if any proxies were removed
  if (proxies.value.length !== newProxies.length) {
    hasChanges = true
  }
  
  // Update array if there are changes
  if (hasChanges) {
    proxies.value = newProxies
  }
}

// Force refresh - fetch full data again
const forceRefresh = () => {
  fetchFullData()
}

// Watch for stream updates and merge with existing data
watch(
  () => metricsStream.lastUpdate.value,
  () => {
    updateProxies()
  }
)

// Connect to stream on mount
onMounted(async () => {
  // SSE connection is managed by App.vue
  
  if (props.needsServerInfo) {
    await fetchServerInfo()
  }
  
  // Fetch full proxy config data
  await fetchFullData()
})
</script>
