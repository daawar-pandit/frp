<template>
  <ProxyViewRealtime 
    proxyType="tcp" 
    :proxyClass="TCPProxy"
  />
</template>

<script setup lang="ts">
import { TCPProxy } from '../utils/proxy.js'
import ProxyViewRealtime from './ProxyViewRealtime.vue'
</script>

<style></style>
