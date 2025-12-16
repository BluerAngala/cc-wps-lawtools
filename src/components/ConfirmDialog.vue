<template>
  <n-modal
    :show="show"
    preset="dialog"
    title="确认执行修改"
    positive-text="确认执行"
    negative-text="取消"
    @positive-click="handleConfirm"
    @negative-click="handleCancel"
    @close="handleCancel"
  >
    <div class="space-y-4">
      <!-- 操作统计 -->
      <n-alert type="info" :closable="false" show-icon>
        <template #header>即将执行以下操作</template>
        <div class="grid grid-cols-3 gap-4 mt-2 text-center">
          <div class="bg-blue-50 rounded p-2">
            <div class="text-lg font-bold text-blue-600">{{ stats.commentCount }}</div>
            <div class="text-xs text-gray-500">批注</div>
          </div>
          <div class="bg-orange-50 rounded p-2">
            <div class="text-lg font-bold text-orange-600">{{ stats.revisionCount }}</div>
            <div class="text-xs text-gray-500">修订</div>
          </div>
          <div class="bg-gray-50 rounded p-2">
            <div class="text-lg font-bold text-gray-700">{{ stats.totalCount }}</div>
            <div class="text-xs text-gray-500">总计</div>
          </div>
        </div>
      </n-alert>

      <!-- 警告提示 -->
      <n-alert v-if="stats.revisionCount > 0" type="warning" :closable="false" show-icon>
        修订操作将直接修改文档内容，请确认后执行。
      </n-alert>

      <!-- 操作列表预览 -->
      <div v-if="suggestions.length > 0" class="max-h-200px overflow-auto">
        <div class="text-sm text-gray-500 mb-2">操作详情：</div>
        <div v-for="(item, index) in suggestions" :key="item.id" class="text-sm py-1 border-b border-gray-100 last:border-0">
          <n-space align="center">
            <span class="text-gray-400">{{ index + 1 }}.</span>
            <n-tag :type="item.actionType === 'revision' ? 'warning' : 'info'" size="tiny">
              {{ item.actionType === 'revision' ? '修订' : '批注' }}
            </n-tag>
            <span class="truncate max-w-250px">{{ item.position || item.keyword || '未知位置' }}</span>
          </n-space>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import { NModal, NAlert, NSpace, NTag } from 'naive-ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  suggestions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

// 统计信息
const stats = computed(() => {
  const commentCount = props.suggestions.filter(s => s.actionType === 'comment').length
  const revisionCount = props.suggestions.filter(s => s.actionType === 'revision').length
  return {
    commentCount,
    revisionCount,
    totalCount: props.suggestions.length
  }
})

const handleConfirm = () => {
  emit('confirm')
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>

<style scoped>
.max-h-200px {
  max-height: 200px;
}
.max-w-250px {
  max-width: 250px;
}
</style>
