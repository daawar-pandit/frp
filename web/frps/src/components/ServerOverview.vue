<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- Tunnel Health -->
        <div
          class="bg-surface rounded-xl border border-border p-6 shadow-sm transition-colors duration-300"
        >
          <h2 class="text-lg font-semibold mb-4 text-primary flex items-center">
            <el-icon class="mr-2"><Connection /></el-icon>
            Tunnel Health
            <!-- Live indicator -->
            <span
              v-if="metricsStream.connectionState.value === 'connected'"
              class="ml-3 flex items-center text-xs text-green-600 dark:text-green-400"
            >
              <span class="relative flex h-2 w-2 mr-1">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                ></span>
              </span>
              LIVE
            </span>
          </h2>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-secondary text-sm mb-1">Status</p>
              <p
                class="text-3xl font-bold"
                :class="
                  tunnelHealth.allTunnelsOnline
                    ? 'text-green-500'
                    : 'text-red-500'
                "
              >
                {{ tunnelHealth.onlineTunnels }} /
                {{ tunnelHealth.totalTunnels }}
              </p>
              <p class="text-sm text-secondary mt-2">
                {{
                  tunnelHealth.allTunnelsOnline
                    ? 'All Tunnels Online'
                    : `${tunnelHealth.offlineTunnels} Tunnel(s) Offline`
                }}
              </p>
            </div>
            <div
              class="w-6 h-6 rounded-full animate-pulse"
              :class="
                tunnelHealth.allTunnelsOnline
                  ? 'bg-green-500 shadow-lg shadow-green-500/50'
                  : 'bg-red-500 shadow-lg shadow-red-500/50'
              "
            ></div>
          </div>
        </div>
        <!-- Server Info Card -->
        <div
          class="bg-surface rounded-xl border border-border p-6 shadow-sm transition-colors duration-300"
        >
          <h2 class="text-lg font-semibold mb-4 text-primary flex items-center">
            <el-icon class="mr-2"><InfoFilled /></el-icon>
            Server Information
          </h2>
          <div class="space-y-0 text-sm">
            <div class="info-row">
              <span class="info-label">Version</span>
              <span class="info-value">{{ data.version }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bind Port</span>
              <span class="info-value">{{ data.bindPort }}</span>
            </div>
            <div class="info-row" v-if="data.kcpBindPort != 0">
              <span class="info-label">KCP Bind Port</span>
              <span class="info-value">{{ data.kcpBindPort }}</span>
            </div>
            <div class="info-row" v-if="data.quicBindPort != 0">
              <span class="info-label">QUIC Bind Port</span>
              <span class="info-value">{{ data.quicBindPort }}</span>
            </div>
            <div class="info-row" v-if="data.vhostHTTPPort != 0">
              <span class="info-label">HTTP Port</span>
              <span class="info-value">{{ data.vhostHTTPPort }}</span>
            </div>
            <div class="info-row" v-if="data.vhostHTTPSPort != 0">
              <span class="info-label">HTTPS Port</span>
              <span class="info-value">{{ data.vhostHTTPSPort }}</span>
            </div>
            <div class="info-row" v-if="data.tcpmuxHTTPConnectPort != 0">
              <span class="info-label">TCPMux HTTPConnect Port</span>
              <span class="info-value">{{ data.tcpmuxHTTPConnectPort }}</span>
            </div>
            <div class="info-row" v-if="data.subdomainHost != ''">
              <span class="info-label">Subdomain Host</span>
              <span class="info-value">
                <LongSpan :content="data.subdomainHost" :length="30"></LongSpan>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Max PoolCount</span>
              <span class="info-value">{{ data.maxPoolCount }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Max Ports Per Client</span>
              <span class="info-value">{{ data.maxPortsPerClient }}</span>
            </div>
            <div class="info-row" v-if="data.allowPortsStr != ''">
              <span class="info-label">Allow Ports</span>
              <span class="info-value">
                <LongSpan :content="data.allowPortsStr" :length="30"></LongSpan>
              </span>
            </div>
            <div class="info-row" v-if="data.tlsForce === true">
              <span class="info-label">TLS Force</span>
              <span class="info-value">{{ data.tlsForce }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">HeartBeat Timeout</span>
              <span class="info-value">{{ data.heartbeatTimeout }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Client Counts</span>
              <span class="info-value highlight">{{
                metricsStream.serverMetrics.clientCounts || data.clientCounts
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Current Connections</span>
              <span class="info-value highlight">{{
                metricsStream.serverMetrics.curConns || data.curConns
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Proxy Counts</span>
              <span class="info-value highlight">{{
                tunnelHealth.totalTunnels || data.proxyCounts
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Card -->
      <div class="space-y-6">
        <!-- Traffic -->
        <div
          class="bg-surface rounded-xl border border-border p-6 shadow-sm transition-colors duration-300"
        >
          <h2 class="text-lg font-semibold mb-4 text-primary flex items-center">
            <el-icon class="mr-2"><TrendCharts /></el-icon>
            Traffic
          </h2>
          <div id="traffic" class="w-full h-64"></div>
        </div>

        <!-- Proxies -->
        <div
          class="bg-surface rounded-xl border border-border p-6 shadow-sm transition-colors duration-300"
        >
          <h2 class="text-lg font-semibold mb-4 text-primary flex items-center">
            <el-icon class="mr-2"><PieChart /></el-icon>
            Proxies
          </h2>
          <div id="proxies" class="w-full h-64"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, reactive, watch } from 'vue'
import { DrawTrafficChart, DrawProxyChart } from '../utils/chart'
import { useServerInfo } from '../composables/useServerInfo'
import { useSharedMetricsStream } from '../composables/useMetricsStream'
// apiUrl removed - using SSE stream instead
import LongSpan from './LongSpan.vue'
import {
  InfoFilled,
  TrendCharts,
  PieChart,
  Connection,
} from '@element-plus/icons-vue'
import type { TunnelHealth } from '../utils/proxy'

// Use the composable for server info management
const { data, fetchServerInfo } = useServerInfo()

// Connect to real-time metrics stream
const metricsStream = useSharedMetricsStream(1000)

// Tunnel health state - computed from real-time stream
const tunnelHealth = reactive<TunnelHealth>({
  totalTunnels: 0,
  onlineTunnels: 0,
  offlineTunnels: 0,
  allTunnelsOnline: true,
})

// Compute tunnel health from SSE proxy metrics in real-time
const updateTunnelHealth = () => {
  let total = 0
  let online = 0

  metricsStream.proxyMetrics.forEach((proxy) => {
    total++
    if (proxy.status === 'online') {
      online++
    }
  })

  tunnelHealth.totalTunnels = total
  tunnelHealth.onlineTunnels = online
  tunnelHealth.offlineTunnels = total - online
  tunnelHealth.allTunnelsOnline = total > 0 && online === total
}

// Watch for stream updates and recompute tunnel health
watch(
  () => metricsStream.lastUpdate.value,
  () => {
    updateTunnelHealth()
  },
)

// Watch server metrics from stream and update charts
watch(
  () => metricsStream.serverMetrics,
  (newMetrics) => {
    // Update traffic chart
    nextTick(() => {
      DrawTrafficChart(
        'traffic',
        newMetrics.totalTrafficIn || 0,
        newMetrics.totalTrafficOut || 0,
      )
    })
  },
  { deep: true },
)

// Compute proxy type counts from stream
const computeProxyTypeCounts = () => {
  const counts: Record<string, number> = {
    tcp: 0,
    udp: 0,
    http: 0,
    https: 0,
    stcp: 0,
    sudp: 0,
    xtcp: 0,
    tcpmux: 0,
  }

  metricsStream.proxyMetrics.forEach((proxy) => {
    if (counts[proxy.type] !== undefined) {
      counts[proxy.type]++
    }
  })

  return counts
}

// Watch proxy metrics and update proxy type chart
watch(
  () => metricsStream.lastUpdate.value,
  () => {
    nextTick(() => {
      const proxyTypeCounts = computeProxyTypeCounts()
      DrawProxyChart('proxies', { proxyTypeCount: proxyTypeCounts })
      
    })
  },
)

/**
 * Initialize charts after server info is fetched
 */
const initializeCharts = () => {
  nextTick(() => {
    DrawTrafficChart(
      'traffic',
      data.totalTrafficIn || 0,
      data.totalTrafficOut || 0,
    )
    DrawProxyChart('proxies', {
      proxyTypeCount: {
        tcp: 0,
        udp: 0,
        http: 0,
        https: 0,
        stcp: 0,
        sudp: 0,
        xtcp: 0,
        ...data.proxyTypeCount,
      },
    })
  })
}

onMounted(async () => {
  // SSE connection is managed by App.vue

  // Fetch initial server info
  await fetchServerInfo()

  // Initialize tunnel health from stream (if already connected)
  updateTunnelHealth()

  // Initialize charts
  initializeCharts()
})
</script>

<style scoped>
.info-row {
  @apply flex justify-between py-3 border-b border-border first:pt-0 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 px-2 rounded-sm transition-colors;
}
.info-label {
  @apply text-secondary font-medium;
}
.info-value {
  @apply text-primary font-medium;
}
.highlight {
  @apply text-accent font-semibold;
}
</style>
