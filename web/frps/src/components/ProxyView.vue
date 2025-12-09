<template>
  <div class="space-y-4">
    <!-- Header Actions -->
    <div class="flex items-center justify-between pb-4 border-b border-border">
      <h2 class="text-xl font-semibold capitalize flex items-center text-primary">
         <span class="mr-2">{{ proxyType }}</span>
         <span class="text-sm font-normal text-secondary bg-surface px-2 py-0.5 rounded border border-border">{{ proxies.length }}</span>
         <!-- Live indicator - green when connected -->
         <span v-if="connectionState === 'connected'" class="ml-3 flex items-center text-xs text-green-600 dark:text-green-400">
           <span class="relative flex h-2 w-2 mr-1">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
           </span>
           LIVE
         </span>
         <!-- Reconnecting indicator - yellow/orange -->
         <span v-else-if="connectionState === 'connecting' || connectionState === 'error'" class="ml-3 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
           <span class="relative flex h-2 w-2 mr-1">
             <span class="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
           </span>
           RECONNECTING
         </span>
         <!-- Disconnected indicator - red -->
         <span v-else-if="connectionState === 'disconnected'" class="ml-3 flex items-center text-xs text-red-600 dark:text-red-400">
           <span class="relative flex h-2 w-2 mr-1">
             <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
           </span>
           OFFLINE
         </span>
      </h2>
      <div class="flex items-center space-x-3">
          <el-popconfirm
            title="Clear all offline proxies?"
            confirm-button-text="Yes"
            cancel-button-text="No"
            @confirm="clearOfflineProxies"
            width="220"
          >
            <template #reference>
              <button class="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded transition-colors duration-200">
                Clear Offline
              </button>
            </template>
          </el-popconfirm>
          
          <button 
            @click="$emit('refresh')" 
            class="px-3 py-1.5 text-sm text-primary hover:bg-black/5 dark:hover:bg-white/10 border border-border rounded transition-colors duration-200 flex items-center"
          >
            <el-icon class="mr-1"><Refresh /></el-icon>
            Refresh
          </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
        <el-table
        :data="proxies"
        :default-sort="{ prop: 'name', order: 'ascending' }"
        row-key="name"
        style="width: 100%"
        class="custom-table"
        :header-cell-style="{ background: 'transparent', color: 'var(--text-secondary)' }"
        :row-class-name="tableRowClassName"
        >
        <el-table-column type="expand">
            <template #default="props">
            <div class="p-4 bg-gray-50 dark:bg-slate-800/50">
                <ProxyViewExpand :row="props.row" :proxyType="proxyType" />
            </div>
            </template>
        </el-table-column>
        <el-table-column label="Name" prop="name" sortable min-width="150">
            <template #default="{ row }">
                <span class="font-medium text-primary">{{ row.name }}</span>
            </template>
        </el-table-column>
        <el-table-column label="Port" prop="port" sortable width="100">
             <template #default="{ row }">
                <span class="font-mono text-sm bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{{ row.port }}</span>
            </template>
        </el-table-column>
        <el-table-column label="Conns" prop="conns" sortable width="100" align="center">
        </el-table-column>
        <el-table-column
            label="In"
            prop="trafficIn"
            :formatter="formatTrafficIn"
            sortable
            min-width="100"
        >
        </el-table-column>
        <el-table-column
            label="Out"
            prop="trafficOut"
            :formatter="formatTrafficOut"
            sortable
            min-width="100"
        >
        </el-table-column>
        <el-table-column label="Version" prop="clientVersion" sortable min-width="100">
             <template #default="{ row }">
                <span class="text-xs text-secondary">{{ row.clientVersion }}</span>
            </template>
        </el-table-column>
        
        <el-table-column label="Latency" prop="latencyRttMs" sortable width="100" align="center">
            <template #default="{ row }">
                <span 
                    class="font-mono text-sm px-1.5 py-0.5 rounded"
                    :class="getLatencyClass(row.latencyRttMs)"
                >
                    {{ formatLatency(row.latencyRttMs) }}
                </span>
            </template>
        </el-table-column>
        
        <el-table-column label="Jitter" prop="jitterMs" sortable width="80" align="center">
            <template #default="{ row }">
                <span class="font-mono text-sm text-secondary">
                    {{ row.jitterMs > 0 ? row.jitterMs.toFixed(1) + ' ms' : '-' }}
                </span>
            </template>
        </el-table-column>
        
        <el-table-column label="Speed ↓/↑" width="130" align="center">
            <template #default="{ row }">
                <div class="text-xs font-mono">
                    <span class="text-green-600 dark:text-green-400">{{ formatSpeed(row.speedInMbps) }}</span>
                    <span class="text-secondary mx-1">/</span>
                    <span class="text-blue-600 dark:text-blue-400">{{ formatSpeed(row.speedOutMbps) }}</span>
                </div>
            </template>
        </el-table-column>
        
        <el-table-column label="Status" prop="status" sortable width="100" align="center">
            <template #default="scope">
            <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                :class="scope.row.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'"
            >
                {{ scope.row.status }}
            </span>
            </template>
        </el-table-column>
        <el-table-column label="Actions" width="100" align="center">
            <template #default="scope">
            <el-button
                size="small"
                circle
                @click="dialogVisibleName = scope.row.name; dialogVisible = true"
            >
                <el-icon><TrendCharts /></el-icon>
            </el-button>
            </template>
        </el-table-column>
        </el-table>
    </div>

    <!-- Traffic Dialog -->
    <el-dialog
        v-model="dialogVisible"
        :destroy-on-close="true"
        :title="`${dialogVisibleName} Traffic`"
        width="700px"
        class="custom-dialog"
    >
        <Traffic :proxyName="dialogVisibleName" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import * as Humanize from 'humanize-plus'
import type { TableColumnCtx } from 'element-plus'
import type { BaseProxy } from '../utils/proxy.js'
import type { ConnectionState } from '../composables/useMetricsStream'
import { ElMessage } from 'element-plus'
import { apiUrl } from '../utils/api'
import ProxyViewExpand from './ProxyViewExpand.vue'
import Traffic from './Traffic.vue'
import { ref } from 'vue'
import { Refresh, TrendCharts } from '@element-plus/icons-vue'

defineProps<{
  proxies: BaseProxy[]
  proxyType: string
  connectionState?: ConnectionState
}>()

const emit = defineEmits(['refresh'])

const dialogVisible = ref(false)
const dialogVisibleName = ref("")

const formatTrafficIn = (row: BaseProxy, _: TableColumnCtx<BaseProxy>) => {
  return Humanize.fileSize(row.trafficIn)
}

const formatTrafficOut = (row: BaseProxy, _: TableColumnCtx<BaseProxy>) => {
  return Humanize.fileSize(row.trafficOut)
}

const getLatencyClass = (rtt: number | undefined) => {
  if (rtt === undefined || rtt === 0) return 'bg-gray-100 dark:bg-slate-700'
  if (rtt < 50) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (rtt < 100) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const formatLatency = (rtt: number | undefined) => {
  if (rtt === undefined || rtt === 0) return '-'
  return `${rtt.toFixed(1)} ms`
}

const formatSpeed = (mbps: number | undefined) => {
  if (mbps === undefined || mbps < 0.01) return '0'
  if (mbps < 1) return `${(mbps * 1000).toFixed(0)} kbps`
  return `${mbps.toFixed(1)} Mbps`
}

const tableRowClassName = () => {
  // Optional: add custom classes to rows based on status
  return ''
}

const clearOfflineProxies = () => {
  fetch(apiUrl('/api/proxies?status=offline'), {
    method: 'DELETE',
    credentials: 'include',
  })
    .then((res) => {
      if (res.ok) {
        ElMessage({
          message: 'Successfully cleared offline proxies',
          type: 'success',
        })
        emit('refresh')
      } else {
        ElMessage({
          message: 'Failed to clear offline proxies: ' + res.status + ' ' + res.statusText,
          type: 'warning',
        })
      }
    })
    .catch((err) => {
      ElMessage({
        message: 'Failed to clear offline proxies: ' + err.message,
        type: 'warning',
      })
    })
}
</script>

<style>
/* Deep overrides for Element table to match theme */
.custom-table {
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: transparent;
    --el-table-row-hover-bg-color: var(--bg-secondary);
    --el-table-border-color: var(--border-color);
    --el-table-text-color: var(--text-primary);
    --el-table-header-text-color: var(--text-secondary);
}

html.dark .custom-table {
    --el-table-row-hover-bg-color: rgba(255,255,255,0.05);
}

.custom-dialog .el-dialog__header {
    margin-right: 0;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 15px;
}
</style>
