<template>
  <ProxyViewRealtime 
    proxyType="udp" 
    :proxyClass="UDPProxy"
  />
</template>

<script setup lang="ts">
import { UDPProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
