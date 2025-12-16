<template>
  <div class="flex items-center justify-between w-full pr-2">
    <div class="flex items-center gap-2">
      <span>{{ icon }}</span>
      <span>{{ title }}</span>
      <n-tag v-if="processing" type="warning" size="small">处理中</n-tag>
    </div>
    <n-button
      type="primary"
      size="small"
      :loading="processing"
      :disabled="processing || disabled"
      @click.stop="$emit('execute')"
    >
      {{ buttonText }}
    </n-button>
  </div>
</template>

<script setup>
import { NButton, NTag } from 'naive-ui'

defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '📋' },
  processing: { type: Boolean, default: false },
  buttonText: { type: String, default: '开始' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['execute'])
</script>
