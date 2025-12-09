<template>
  <ProxyViewRealtime 
    proxyType="http" 
    :proxyClass="HTTPProxy"
    :needsServerInfo="true"
  />
</template>

<script setup lang="ts">
import { HTTPProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
