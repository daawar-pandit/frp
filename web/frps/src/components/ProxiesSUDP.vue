<template>
  <ProxyViewRealtime 
    proxyType="sudp" 
    :proxyClass="SUDPProxy"
  />
</template>

<script setup lang="ts">
import { SUDPProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
