<template>
  <ProxyViewRealtime 
    proxyType="https" 
    :proxyClass="HTTPSProxy"
    :needsServerInfo="true"
  />
</template>

<script setup lang="ts">
import { HTTPSProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
