<template>
  <div>
    <!-- 操作栏 -->
    <div class="flex items-center justify-between mb-2">
      <n-space align="center" :size="8">
        <span class="text-sm font-semibold">📝 修改建议</span>
        <n-tag size="small" type="info">{{ selectedCount }}/{{ suggestions.length }} 项已选</n-tag>
      </n-space>
      <n-space :size="4">
        <n-button size="tiny" @click="handleSelectAll">全选</n-button>
        <n-button size="tiny" @click="handleDeselectAll">取消全选</n-button>
      </n-space>
    </div>

    <!-- 建议列表 -->
    <div class="space-y-1">
      <div
        v-for="item in suggestions"
        :key="item.id"
        class="border border-gray-200 rounded px-2 py-1"
      >
        <div class="flex items-center gap-2 cursor-pointer" @click="toggleExpand(item.id)">
          <span class="text-gray-400 text-xs">{{ expandedId === item.id ? '▼' : '▶' }}</span>
          <n-checkbox
            :checked="item.selected"
            @update:checked="handleToggle(item.id, $event)"
            @click.stop
          />
          <n-tag :type="getSeverityType(item.severity)" size="tiny">
            {{ getSeverityText(item.severity) }}
          </n-tag>
          <n-tag :type="item.actionType === 'revision' ? 'warning' : 'info'" size="tiny">
            {{ item.actionType === 'revision' ? '修订' : '批注' }}
          </n-tag>
          <span v-if="showSource" class="text-xs text-gray-400">
            [{{ item.source === 'lawyer' ? '律师' : 'AI' }}]
          </span>
          <span class="text-sm truncate flex-1">{{ item.position || '未知位置' }}</span>
        </div>
        <div v-if="expandedId === item.id" class="mt-2 pl-5 pb-2 space-y-2">
          <!-- 相关条款 -->
          <div v-if="item.keyword" class="text-sm">
            <span class="text-gray-500">相关条款：</span>
            <span class="text-gray-700">{{ item.keyword }}</span>
          </div>
          <!-- 修改内容 -->
          <div class="text-sm">
            <span class="text-gray-500">{{ item.actionType === 'revision' ? '修订内容：' : '批注内容：' }}</span>
            <div class="mt-1 p-2 bg-gray-50 rounded text-gray-700">{{ item.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <n-empty v-if="suggestions.length === 0" description="暂无修改建议" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NButton, NSpace, NTag, NCheckbox, NEmpty } from 'naive-ui'

const props = defineProps({
  suggestions: {
    type: Array,
    default: () => []
  },
  showSource: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggleSelect', 'selectAll', 'deselectAll'])

// 展开状态
const expandedId = ref(null)

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

// 已选数量
const selectedCount = computed(() => props.suggestions.filter(s => s.selected).length)

// 严重程度
const getSeverityType = (severity) => {
  const map = { high: 'error', medium: 'warning', low: 'info' }
  return map[severity] || 'default'
}

const getSeverityText = (severity) => {
  const map = { high: '高风险', medium: '中风险', low: '低风险' }
  return map[severity] || '未知'
}

// 事件处理
const handleToggle = (id, selected) => {
  emit('toggleSelect', id, selected)
}

const handleSelectAll = () => {
  emit('selectAll')
}

const handleDeselectAll = () => {
  emit('deselectAll')
}
</script>
