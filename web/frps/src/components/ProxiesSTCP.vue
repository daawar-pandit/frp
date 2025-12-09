<template>
  <ProxyViewRealtime 
    proxyType="stcp" 
    :proxyClass="STCPProxy"
  />
</template>

<script setup lang="ts">
import { STCPProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
