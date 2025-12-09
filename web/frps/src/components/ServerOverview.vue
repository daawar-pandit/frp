<template>
  <div>
    <el-row>
      <el-col :md="12">
        <div class="source">
          <el-form
            label-position="left"
            label-width="220px"
            class="server_info"
          >
            <el-form-item label="Version">
              <span style="font-size: 14px;">{{ data.version }}</span>
            </el-form-item>
            <el-form-item label="BindPort">
              <span style="font-size: 14px;">{{ data.bindPort }}</span>
            </el-form-item>
            <el-form-item label="KCP Bind Port" v-if="data.kcpBindPort != 0">
              <span style="font-size: 14px;">{{ data.kcpBindPort }}</span>
            </el-form-item>
            <el-form-item label="QUIC Bind Port" v-if="data.quicBindPort != 0">
              <span style="font-size: 14px;">{{ data.quicBindPort }}</span>
            </el-form-item>
            <el-form-item label="HTTP Port" v-if="data.vhostHTTPPort != 0">
              <span style="font-size: 14px;">{{ data.vhostHTTPPort }}</span>
            </el-form-item>
            <el-form-item label="HTTPS Port" v-if="data.vhostHTTPSPort != 0">
              <span style="font-size: 14px;">{{ data.vhostHTTPSPort }}</span>
            </el-form-item>
            <el-form-item
              label="TCPMux HTTPConnect Port"
              v-if="data.tcpmuxHTTPConnectPort != 0"
            >
              <span style="font-size: 14px;">{{ data.tcpmuxHTTPConnectPort }}</span>
            </el-form-item>
            <el-form-item
              label="Subdomain Host"
              v-if="data.subdomainHost != ''"
            >
              <LongSpan :content="data.subdomainHost" :length="30"></LongSpan>
            </el-form-item>
            <el-form-item label="Max PoolCount">
              <span style="font-size: 14px;">{{ data.maxPoolCount }}</span>
            </el-form-item>
            <el-form-item label="Max Ports Per Client">
              <span style="font-size: 14px;">{{ data.maxPortsPerClient }}</span>
            </el-form-item>
            <el-form-item label="Allow Ports" v-if="data.allowPortsStr != ''">
              <LongSpan :content="data.allowPortsStr" :length="30"></LongSpan>
            </el-form-item>
            <el-form-item label="TLS Force" v-if="data.tlsForce === true">
              <span style="font-size: 14px;">{{ data.tlsForce }}</span>
            </el-form-item>
            <el-form-item label="HeartBeat Timeout">
              <span style="font-size: 14px;">{{ data.heartbeatTimeout }}</span>
            </el-form-item>
            <el-form-item label="Client Counts">
              <span style="font-size: 14px;">{{ data.clientCounts }}</span>
            </el-form-item>
            <el-form-item label="Current Connections">
              <span style="font-size: 14px;">{{ data.curConns }}</span>
            </el-form-item>
            <el-form-item label="Proxy Counts">
              <span style="font-size: 14px;">{{ data.proxyCounts }}</span>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :md="12">
        <div
          id="traffic"
          style="width: 400px; height: 250px; margin-bottom: 30px"
        ></div>
        <div id="proxies" style="width: 400px; height: 250px"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { DrawTrafficChart, DrawProxyChart } from '../utils/chart'
import { useServerInfo } from '../composables/useServerInfo'
import LongSpan from './LongSpan.vue'

// Use the composable for server info management
const { data, fetchServerInfo } = useServerInfo()

/**
 * Initialize charts after server info is fetched
 */
const initializeCharts = () => {
  nextTick(() => {
    DrawTrafficChart('traffic', data.totalTrafficIn || 0, data.totalTrafficOut || 0)
    DrawProxyChart('proxies', {
      proxyTypeCount: {
        tcp: 0,
        udp: 0,
        http: 0,
        https: 0,
        stcp: 0,
        sudp: 0,
        xtcp: 0,
      },
    })
  })
}

/**
 * Load initial data on component mount
 */
onMounted(async () => {
  await fetchServerInfo()
  initializeCharts()
})
</script>

<style>
.source {
  border-radius: 4px;
  transition: 0.2s;
  padding-left: 24px;
  padding-right: 24px;
}

.server_info {
  margin-left: 40px;
}

.server_info .el-form-item__label {
  color: #99a9bf;
  height: 40px;
  line-height: 40px;
}

.server_info .el-form-item__content {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

.server_info .el-form-item {
  margin-right: 0;
  margin-bottom: 0;
  width: 100%;
}
</style>
