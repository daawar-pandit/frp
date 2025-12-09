<template>
  <ProxyViewRealtime 
    proxyType="tcpmux" 
    :proxyClass="TCPMuxProxy"
    :needsServerInfo="true"
  />
</template>

<script setup lang="ts">
import { TCPMuxProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
