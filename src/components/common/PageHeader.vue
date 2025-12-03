<template>
  <div class="wps-card wps-section">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span v-if="icon" class="text-lg">{{ icon }}</span>
        <span class="text-lg font-semibold">{{ title }}</span>
        <n-tag v-if="loading" type="warning" size="small">{{ loadingText }}</n-tag>
        <slot name="tag" />
      </div>
      <slot name="actions" />
    </div>
    <slot name="description">
      <n-alert v-if="description" type="info" :closable="false" show-icon>
        <template #header>功能说明</template>
        <template #default>{{ description }}</template>
      </n-alert>
    </slot>
  </div>
</template>

<script setup>
import { NTag, NAlert } from 'naive-ui'

defineOptions({
  name: 'PageHeader'
})

defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: '处理中'
  },
  description: {
    type: String,
    default: ''
  }
})
</script>
