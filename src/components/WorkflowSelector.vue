<template>
  <div :class="compact ? 'p-2' : 'p-3'">
    <!-- 分类筛选 -->
    <n-space class="mb-2" :size="6">
      <n-tag
        v-for="cat in categoryOptions"
        :key="cat.value"
        :type="selectedCategory === cat.value ? 'primary' : 'default'"
        :bordered="selectedCategory !== cat.value"
        size="small"
        class="cursor-pointer"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </n-tag>
      <n-button v-if="showCreate" size="tiny" type="info" @click="openCreateModal">
        + 新建
      </n-button>
    </n-space>

    <!-- 用户工作流 -->
    <div v-if="showUserWorkflows && userWorkflows.length > 0" class="mb-2">
      <div class="text-xs text-gray-500 mb-1">我的工作流</div>
      <div class="space-y-1 max-h-32 overflow-y-auto">
        <div
          v-for="wf in filteredUserWorkflows"
          :key="wf.id"
          class="flex items-center gap-2 px-2 py-1 border rounded cursor-pointer transition-colors text-sm"
          :class="selectedId === wf.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
          @click="selectWorkflow(wf)"
        >
          <n-radio :checked="selectedId === wf.id" size="small" @click.stop />
          <span class="flex-1 truncate">{{ wf.name }}</span>
          <n-button size="tiny" quaternary @click.stop="editWorkflow(wf)">编辑</n-button>
          <n-button size="tiny" quaternary type="error" @click.stop="deleteWorkflow(wf.id)">删除</n-button>
        </div>
      </div>
    </div>

    <!-- 预设工作流 -->
    <div>
      <div class="text-xs text-gray-500 mb-1">预设工作流</div>
      <div class="space-y-1" :class="compact ? 'max-h-40' : 'max-h-52'" style="overflow-y: auto;">
        <div
          v-for="preset in filteredPresets"
          :key="preset.id"
          class="flex items-center gap-2 px-2 py-1 border rounded cursor-pointer transition-colors"
          :class="selectedId === preset.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
          @click="selectWorkflow(preset)"
        >
          <n-radio :checked="selectedId === preset.id" size="small" @click.stop />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <span class="text-sm truncate">{{ preset.name }}</span>
              <n-tag size="tiny" :type="preset.category === 'ai' ? 'info' : 'success'">
                {{ preset.category === 'ai' ? 'AI' : '文档' }}
              </n-tag>
            </div>
            <div v-if="!compact" class="text-xs text-gray-400 truncate">{{ preset.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤预览 -->
    <div v-if="selectedWorkflow" class="mt-2 p-2 bg-gray-50 rounded">
      <div class="text-xs font-medium text-gray-600 mb-1">执行步骤：</div>
      <div class="flex flex-wrap gap-1">
        <n-tag v-for="(step, idx) in selectedWorkflow.steps" :key="idx" size="tiny" type="default">
          {{ idx + 1 }}. {{ step.name }}
        </n-tag>
      </div>
    </div>

    <!-- 执行进度 -->
    <div v-if="isExecuting" class="mt-2 p-2 bg-gray-50 rounded">
      <div class="flex items-center gap-2 mb-1">
        <n-spin size="small" />
        <span class="text-xs text-gray-600">{{ progressText }}</span>
      </div>
      <n-progress type="line" :percentage="progressPercent" :show-indicator="false" status="info" />
    </div>

    <!-- 结果弹窗 -->
    <n-modal
      v-model:show="showResultModal"
      preset="card"
      :title="execResult?.success ? '执行完成' : '执行结果'"
      style="width: 85%; max-width: 480px; max-height: 75vh;"
      :bordered="false"
    >
      <div class="space-y-2">
        <div class="text-sm text-gray-600">{{ execResult?.summary }}</div>
        <div v-for="(step, index) in execResult?.steps" :key="index" class="flex items-start gap-2 py-1 border-b border-gray-100 last:border-0">
          <span :class="step.success ? 'text-green-500' : 'text-red-500'" class="text-sm">{{ step.success ? '✓' : '✗' }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ step.name }}</div>
            <div class="text-xs text-gray-500 truncate">{{ step.message }}</div>
          </div>
        </div>
        <div class="flex justify-end pt-2">
          <n-button type="primary" size="small" @click="showResultModal = false">确定</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 工作流配置弹窗 -->
    <WorkflowConfigModal
      v-model:show="showConfigModal"
      :workflow="editingWorkflow"
      @save="handleSaveWorkflow"
      @execute="handleExecuteFromModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { NTag, NRadio, NButton, NSpace, NProgress, NSpin, NModal } from 'naive-ui'
import WorkflowConfigModal from './WorkflowConfigModal.vue'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { getPresetList, workflowStorage } from '../services/workflow'

const props = defineProps({
  category: { type: String, default: null }, // 'ai' | 'document' | null
  compact: { type: Boolean, default: false },
  showCreate: { type: Boolean, default: true },
  showUserWorkflows: { type: Boolean, default: true },
  defaultSelected: { type: String, default: null }
})

const emit = defineEmits(['complete', 'select'])

// 工作流执行
const { execute, isExecuting, progress } = useWorkflowExecution()

// 状态
const selectedCategory = ref('all')
const selectedId = ref(null)
const userWorkflows = ref([])
const showResultModal = ref(false)
const execResult = ref(null)
const showConfigModal = ref(false)
const editingWorkflow = ref(null)

// 分类选项
const categoryOptions = computed(() => {
  if (props.category) {
    return [{ label: props.category === 'ai' ? 'AI工作流' : '文档操作', value: props.category }]
  }
  return [
    { label: '全部', value: 'all' },
    { label: 'AI工作流', value: 'ai' },
    { label: '文档操作', value: 'document' }
  ]
})

// 预设工作流
const allPresets = computed(() => getPresetList())

// 过滤后的预设
const filteredPresets = computed(() => {
  let presets = allPresets.value
  const cat = props.category || (selectedCategory.value !== 'all' ? selectedCategory.value : null)
  if (cat) {
    presets = presets.filter(p => p.category === cat)
  }
  return presets
})

// 过滤后的用户工作流
const filteredUserWorkflows = computed(() => {
  const cat = props.category || (selectedCategory.value !== 'all' ? selectedCategory.value : null)
  if (!cat) return userWorkflows.value
  return userWorkflows.value.filter(w => w.category === cat)
})

// 选中的工作流
const selectedWorkflow = computed(() => {
  if (!selectedId.value) return null
  return allPresets.value.find(p => p.id === selectedId.value) ||
         userWorkflows.value.find(w => w.id === selectedId.value) ||
         null
})

// 进度文本
const progressText = computed(() => {
  if (!progress.value.stepName) return '准备执行...'
  return `${progress.value.stage} ${progress.value.stepName} (${progress.value.current}/${progress.value.total})`
})

// 进度百分比
const progressPercent = computed(() => {
  if (!progress.value.total) return 0
  return Math.round((progress.value.current / progress.value.total) * 100)
})

// 是否可执行
const canExecute = computed(() => !!selectedId.value)

// 按钮文本
const buttonText = computed(() => {
  if (isExecuting.value) return '执行中...'
  return '开始执行'
})

// 选择工作流
const selectWorkflow = (wf) => {
  selectedId.value = wf.id
  emit('select', wf)
}

// 加载用户工作流
const loadUserWorkflows = () => {
  userWorkflows.value = workflowStorage.getAll()
}

// 打开新建弹窗
const openCreateModal = () => {
  editingWorkflow.value = null
  showConfigModal.value = true
}

// 编辑工作流
const editWorkflow = (wf) => {
  editingWorkflow.value = wf
  showConfigModal.value = true
}

// 删除工作流
const deleteWorkflow = (id) => {
  workflowStorage.delete(id)
  loadUserWorkflows()
  if (selectedId.value === id) {
    selectedId.value = null
    emit('select', null)
  }
  window.$message?.success('已删除')
}

// 保存工作流
const handleSaveWorkflow = (workflow) => {
  const toSave = {
    ...workflow,
    id: workflow.id || workflowStorage.generateId(),
    category: workflow.category || 'document'
  }
  workflowStorage.save(toSave)
  loadUserWorkflows()
  showConfigModal.value = false
  window.$message?.success('工作流已保存')
}

// 从弹窗执行工作流
const handleExecuteFromModal = async (workflow) => {
  showConfigModal.value = false
  await executeWorkflow(workflow)
}

// 执行工作流
const executeWorkflow = async (workflow) => {
  if (!workflow) return

  try {
    const result = await execute(workflow)

    // 转换结果格式
    const steps = (result.steps || []).map(s => ({
      name: s.step?.name || s.step?.actionType || '未知步骤',
      success: s.result?.success ?? false,
      message: s.result?.message || ''
    }))

    const successCount = steps.filter(s => s.success).length
    const failCount = steps.filter(s => !s.success).length

    execResult.value = {
      success: result.success,
      steps,
      summary: `共执行 ${steps.length} 个步骤，成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ''}`
    }
    showResultModal.value = true
    emit('complete', result)
  } catch (error) {
    execResult.value = {
      success: false,
      steps: [{ name: '执行工作流', success: false, message: error.message || '执行失败' }],
      summary: '工作流执行出错'
    }
    showResultModal.value = true
    emit('complete', { success: false, message: error.message })
  }
}

// 触发执行（供外部调用）
const triggerExecute = async () => {
  if (isExecuting.value || !selectedWorkflow.value) return
  await executeWorkflow(selectedWorkflow.value)
}

// 初始化
onMounted(() => {
  loadUserWorkflows()
  if (props.defaultSelected) {
    selectedId.value = props.defaultSelected
  }
  if (props.category) {
    selectedCategory.value = props.category
  }
})

// 监听 category 变化
watch(() => props.category, (cat) => {
  if (cat) selectedCategory.value = cat
})

defineExpose({
  triggerExecute,
  isProcessing: isExecuting,
  buttonText,
  canExecute,
  selectedWorkflow
})
</script>
