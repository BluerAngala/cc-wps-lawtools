<template>
  <n-config-provider>
    <div class="p-2.5 h-screen overflow-y-auto scrollbar-none">
      <slot />
    </div>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider } from 'naive-ui'

defineOptions({
  name: 'PageLayout'
})
</script>
