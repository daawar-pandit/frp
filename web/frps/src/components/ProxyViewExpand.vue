<template>
  <div class="proxy-expand-container">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm">
      <div class="expand-item">
        <span class="expand-label">Name</span>
        <span class="expand-value">{{ row.name }}</span>
      </div>
      <div class="expand-item">
        <span class="expand-label">Type</span>
        <span class="expand-value uppercase">{{ row.type }}</span>
      </div>
      <div class="expand-item">
        <span class="expand-label">Encryption</span>
        <span class="expand-value">{{ row.encryption }}</span>
      </div>
      <div class="expand-item">
        <span class="expand-label">Compression</span>
        <span class="expand-value">{{ row.compression }}</span>
      </div>
      <div class="expand-item">
        <span class="expand-label">Last Start</span>
        <span class="expand-value">{{ row.lastStartTime }}</span>
      </div>
      <div class="expand-item">
        <span class="expand-label">Last Close</span>
        <span class="expand-value">{{ row.lastCloseTime }}</span>
      </div>

      <!-- HTTP/HTTPS Specific -->
      <template v-if="proxyType === 'http' || proxyType === 'https'">
        <div class="expand-item">
            <span class="expand-label">Domains</span>
            <span class="expand-value">{{ row.customDomains }}</span>
        </div>
        <div class="expand-item">
            <span class="expand-label">SubDomain</span>
            <span class="expand-value">{{ row.subdomain }}</span>
        </div>
        <div class="expand-item">
            <span class="expand-label">Locations</span>
            <span class="expand-value">{{ row.locations }}</span>
        </div>
        <div class="expand-item">
            <span class="expand-label">HostRewrite</span>
            <span class="expand-value">{{ row.hostHeaderRewrite }}</span>
        </div>
      </template>

      <!-- TCPMUX Specific -->
      <template v-else-if="proxyType === 'tcpmux'">
        <div class="expand-item">
            <span class="expand-label">Multiplexer</span>
            <span class="expand-value">{{ row.multiplexer }}</span>
        </div>
         <div class="expand-item">
            <span class="expand-label">RouteByHTTPUser</span>
            <span class="expand-value">{{ row.routeByHTTPUser }}</span>
        </div>
         <div class="expand-item">
            <span class="expand-label">Domains</span>
            <span class="expand-value">{{ row.customDomains }}</span>
        </div>
         <div class="expand-item">
            <span class="expand-label">SubDomain</span>
            <span class="expand-value">{{ row.subdomain }}</span>
        </div>
      </template>

      <!-- Formatting for others (TCP/UDP usually have Addr?) -->
      <template v-else>
         <div class="expand-item">
            <span class="expand-label">Addr</span>
            <span class="expand-value">{{ row.addr }}</span>
        </div>
      </template>
    </div>

    <!-- Annotations -->
    <div v-if="row.annotations && row.annotations.size > 0" class="mt-6 border-t border-border pt-4">
      <h4 class="text-secondary font-medium mb-3">Annotations</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="item in annotationsArray()" :key="item.key" class="flex justify-between">
           <span class="text-secondary">{{ item.key }}</span>
           <span class="text-primary">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  row: any
  proxyType: string
}>()

// annotationsArray returns an array of key-value pairs from the annotations map.
const annotationsArray = (): Array<{ key: string; value: string }> => {
  const array: Array<{ key: string; value: any }> = [];
  if (props.row.annotations) {
    props.row.annotations.forEach((value: any, key: string) => {
      array.push({ key, value });
    });
  }
  return array;
}
</script>

<style scoped>
.expand-item {
    @apply flex flex-col;
}
.expand-label {
    @apply text-xs text-secondary mb-1;
}
.expand-value {
    @apply text-sm text-primary font-medium break-all;
}
</style>
