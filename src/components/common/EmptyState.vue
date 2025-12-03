<template>
  <div class="wps-card wps-section">
    <n-empty :description="description" class="py-8">
      <template #icon>
        <slot name="icon">
          <span class="text-4xl">{{ icon }}</span>
        </slot>
      </template>
      <template v-if="$slots.action" #extra>
        <slot name="action" />
      </template>
    </n-empty>
  </div>
</template>

<script setup>
import { NEmpty } from 'naive-ui'

defineOptions({
  name: 'EmptyState'
})

defineProps({
  description: {
    type: String,
    default: '暂无数据'
  },
  icon: {
    type: String,
    default: '📭'
  }
})
</script>
