<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <div class="p-2.5 h-screen overflow-y-auto scrollbar-none bg-white">
      <slot />
    </div>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider } from 'naive-ui'

const themeOverrides = {
  common: {
    baseColor: '#fff',
    primaryColor: '#18a058'
  }
}

defineOptions({
  name: 'PageLayout'
})
</script>
