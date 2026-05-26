<template>
  <div class="wps-card wps-section">
    <n-space vertical>
      <div class="flex items-center gap-2">
        <n-spin size="small" />
        <span class="text-sm font-semibold">{{ stage }}</span>
      </div>
      <n-progress v-if="showProgress" :percentage="percentage" type="line" status="info" />
      <div v-if="showProgress" class="text-xs text-gray-500">进度: {{ current }} / {{ total }}</div>
    </n-space>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NSpace, NSpin, NProgress } from 'naive-ui'

defineOptions({
  name: 'ProcessingStatus'
})

const props = defineProps({
  stage: {
    type: String,
    default: '正在处理...'
  },
  current: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
})

const showProgress = computed(() => props.current > 0 && props.total > 0)

const percentage = computed(() => {
  if (props.total <= 0) return 0
  return Math.round((props.current / props.total) * 100)
})
</script>
