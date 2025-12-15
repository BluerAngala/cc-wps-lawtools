<template>
  <n-modal
    :show="show"
    preset="card"
    :title="title"
    style="width: 80%; max-width: 500px; max-height: 80vh"
    @update:show="$emit('update:show', $event)"
  >
    <div v-if="result">
      <div class="text-sm text-gray-600 mb-4">{{ result.message }}</div>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="(item, index) in result.steps"
          :key="index"
          class="flex items-start gap-2 p-2 bg-gray-50 rounded"
        >
          <span :class="item.result.success ? 'text-green-500' : 'text-red-500'">
            {{ item.result.success ? '✓' : '✗' }}
          </span>
          <div class="flex-1">
            <div class="text-sm font-medium">{{ item.step.name || item.step.actionType }}</div>
            <div class="text-xs text-gray-500">{{ item.result.message }}</div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" size="small" @click="$emit('update:show', false)">确定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import { NModal, NButton } from './naive-components.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  result: {
    type: Object,
    default: null
  }
})

defineEmits(['update:show'])

const title = computed(() => {
  if (!props.result) return '执行结果'
  return props.result.success ? '✓ 执行完成' : '✗ 执行失败'
})
</script>
