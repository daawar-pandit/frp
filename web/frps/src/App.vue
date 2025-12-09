<template>
  <div class="flex h-screen bg-background text-primary font-sans transition-colors duration-300">
    <!-- Sidebar -->
    <aside class="w-64 bg-surface border-r border-border flex flex-col transition-colors duration-300 flex-shrink-0">
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center px-6 border-b border-border bg-black">
        <img :src="logoUrl" alt="CGA Logo" class="h-10 object-contain" />
      </div>

      <!-- Menu -->
      <el-menu
        :default-active="activePath"
        class="flex-1 border-r-0 bg-transparent custom-menu"
        :collapse="false"
        @select="handleSelect"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>Overview</span>
        </el-menu-item>

        <el-sub-menu index="/proxies">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>Proxies</span>
          </template>
          <el-menu-item index="/proxies/tcp">TCP</el-menu-item>
          <el-menu-item index="/proxies/udp">UDP</el-menu-item>
          <el-menu-item index="/proxies/http">HTTP</el-menu-item>
          <el-menu-item index="/proxies/https">HTTPS</el-menu-item>
          <el-menu-item index="/proxies/tcpmux">TCPMUX</el-menu-item>
          <el-menu-item index="/proxies/stcp">STCP</el-menu-item>
          <el-menu-item index="/proxies/sudp">SUDP</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="">
          <el-icon><QuestionFilled /></el-icon>
          <span>Help</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden bg-background">
      <!-- Header -->
      <header class="h-16 bg-surface border-b border-border flex items-center justify-between px-6 transition-colors duration-300 flex-shrink-0">
        <div class="flex items-center">
            <h1 class="text-xl font-semibold capitalize">{{ currentRouteName }}</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Theme Toggle -->
          <button 
            @click="toggleDark()" 
            class="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Toggle Theme"
          >
            <el-icon v-if="isDark" class="text-yellow-400 text-xl"><Sunny /></el-icon>
            <el-icon v-else class="text-gray-600 dark:text-gray-300 text-xl"><Moon /></el-icon>
          </button>
          
          <a href="https://github.com/fatedier/frp" target="_blank" class="flex items-center text-sm font-medium hover:text-accent transition-colors">
            <span class="mr-1">GitHub</span>
            <el-icon><TopRight /></el-icon>
          </a>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-6 relative">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { 
  Odometer, 
  Connection, 
  QuestionFilled, 
  Moon, 
  Sunny,
  TopRight
} from '@element-plus/icons-vue'
import { useSharedMetricsStream, destroySharedMetricsStream } from './composables/useMetricsStream'

const logoUrl = 'https://res.cloudinary.com/ddrdnh4tg/image/upload/v1765274072/cga-logo_to86pf.svg'

const router = useRouter()
const route = useRoute()
const isDark = useDark()
const toggleDark = useToggle(isDark)

// Initialize the shared metrics stream at app level
const metricsStream = useSharedMetricsStream(1000)

const activePath = computed(() => route.path)

const currentRouteName = computed(() => {
    if (route.name) return route.name.toString().replace(/([A-Z])/g, " $1").trim()
    return 'Dashboard'
})

const handleSelect = (key: string) => {
  if (key === '') {
    window.open('https://github.com/fatedier/frp')
  } else {
    router.push(key)
  }
}

// Connect SSE on app mount, disconnect on unmount
onMounted(() => {
  metricsStream.connect()
})

onUnmounted(() => {
  destroySharedMetricsStream()
})
</script>

<style>
/* CSS Variables are defined in tailwind.css via basic CSS */
/* We can override specific Element Plus variables here to match our Tailwind theme */
.custom-menu {
    border-right: none !important;
    --el-menu-bg-color: transparent !important;
    --el-menu-text-color: var(--text-secondary) !important;
    --el-menu-hover-bg-color: rgba(0, 0, 0, 0.05) !important;
    --el-menu-active-color: var(--accent-color) !important;
    --el-menu-item-height: 50px;
}

html.dark .custom-menu {
    --el-menu-hover-bg-color: rgba(255, 255, 255, 0.05) !important;
}

.custom-menu .el-menu-item.is-active {
    background-color: var(--el-menu-hover-bg-color);
    font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
