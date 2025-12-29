<template>
  <div>
    <div class="text-xs text-blue-500 mb-2">选择预设工作流方案执行</div>

    <!-- 选中的工作流详情（固定在顶部） -->
    <div v-if="selectedWorkflow" class="mb-3 p-2 bg-gray-50 border border-gray-200 rounded">
      <div class="flex items-center justify-between mb-1">
        <div class="text-sm font-medium text-gray-800">{{ selectedWorkflow.name }}</div>
        <div v-if="selectedWorkflow.isUser" class="flex gap-1">
          <n-button size="tiny" type="info" secondary @click="editWorkflow(selectedWorkflow)">编辑</n-button>
          <n-button size="tiny" type="error" secondary @click="deleteWorkflow(selectedWorkflow.id)">删除</n-button>
        </div>
      </div>
      <div class="flex flex-wrap gap-1">
        <n-tag v-for="(step, idx) in selectedWorkflow.steps" :key="idx" size="tiny">
          {{ idx + 1 }}. {{ step.name }}
        </n-tag>
      </div>
    </div>
    <div v-else class="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-center text-xs text-gray-400">
      请从下方选择一个工作流
    </div>

    <!-- 工作流列表（可滚动） -->
    <div class="workflow-list overflow-y-auto" style="max-height: 240px;">
      <!-- 用户自定义工作流 -->
      <template v-if="userWorkflows.length > 0">
        <div class="text-xs text-gray-400 mb-1">💾 我的工作流</div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <div
            v-for="wf in userWorkflows"
            :key="'user_' + wf.id"
            class="workflow-card"
            :class="{ 'is-selected': selectedWorkflowId === 'user_' + wf.id }"
            @click="selectedWorkflowId = 'user_' + wf.id"
          >
            <span class="card-name">{{ wf.name }}</span>
          </div>
        </div>
      </template>

      <!-- AI 工作流 -->
      <template v-if="aiPresets.length > 0">
        <div class="text-xs text-gray-400 mb-1">🤖 AI 工作流</div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <div
            v-for="wf in aiPresets"
            :key="'preset_' + wf.id"
            class="workflow-card"
            :class="{ 'is-selected': selectedWorkflowId === 'preset_' + wf.id }"
            @click="selectedWorkflowId = 'preset_' + wf.id"
          >
            <span class="card-name">{{ wf.name }}</span>
          </div>
        </div>
      </template>

      <!-- 文档工作流 -->
      <template v-if="docPresets.length > 0">
        <div class="text-xs text-gray-400 mb-1">📄 文档工作流</div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="wf in docPresets"
            :key="'preset_' + wf.id"
            class="workflow-card"
            :class="{ 'is-selected': selectedWorkflowId === 'preset_' + wf.id }"
            @click="selectedWorkflowId = 'preset_' + wf.id"
          >
            <span class="card-name">{{ wf.name }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 执行中遮罩 -->
    <div v-if="processing" class="mt-3 p-3 bg-gray-50 rounded">
      <div class="flex items-center gap-2 mb-2">
        <n-spin size="small" />
        <span class="text-sm text-gray-600">{{ progressText }}</span>
      </div>
      <n-progress type="line" :percentage="progressPercent" :show-indicator="false" status="info" />
    </div>

    <!-- 结果弹窗 -->
    <n-modal
      v-model:show="showResultModal"
      preset="card"
      :title="result?.success ? '工作流执行完成' : '工作流执行结果'"
      style="width: 80%; max-width: 500px; max-height: 80vh;"
      :bordered="false"
    >
      <div class="space-y-3">
        <div class="text-sm text-gray-600 mb-3">{{ result?.summary }}</div>
        <div v-for="(step, index) in result?.steps" :key="index" class="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
          <span :class="step.success ? 'text-green-500' : 'text-red-500'">{{ step.success ? '✓' : '✗' }}</span>
          <div class="flex-1">
            <div class="font-medium text-sm">{{ step.name }}</div>
            <div class="text-xs text-gray-500">{{ step.message }}</div>
            <div
              v-if="step.path"
              class="text-xs text-blue-500 mt-1 cursor-pointer hover:underline break-all"
              @dblclick="copyPath(step.path)"
              title="双击复制路径"
            >
              📁 {{ step.path }}
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
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
import { ref, computed, onMounted } from 'vue'
import { NTag, NModal, NButton, NSpin, NProgress } from 'naive-ui'
import WorkflowConfigModal from './WorkflowConfigModal.vue'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { getPresetList, workflowStorage } from '../services/workflow'

// 工作流执行
const { execute, isExecuting, progress } = useWorkflowExecution()

const processing = ref(false)
const result = ref(null)
const showResultModal = ref(false)

// 统一的工作流选择
const selectedWorkflowId = ref(null)
const userWorkflows = ref([])
const showConfigModal = ref(false)
const editingWorkflow = ref(null)

// 获取所有预设工作流
const allPresets = computed(() => getPresetList())

// AI 工作流
const aiPresets = computed(() => allPresets.value.filter(p => p.category === 'ai'))

// 文档工作流
const docPresets = computed(() => allPresets.value.filter(p => p.category !== 'ai'))

// 选中的工作流对象
const selectedWorkflow = computed(() => {
  if (!selectedWorkflowId.value) return null

  if (selectedWorkflowId.value.startsWith('user_')) {
    const id = selectedWorkflowId.value.replace('user_', '')
    const wf = userWorkflows.value.find(w => w.id === id)
    return wf ? { ...wf, isUser: true } : null
  }

  if (selectedWorkflowId.value.startsWith('preset_')) {
    const id = selectedWorkflowId.value.replace('preset_', '')
    return allPresets.value.find(p => p.id === id) || null
  }

  return null
})

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
  // 处理带前缀的 id
  const realId = id.startsWith?.('user_') ? id.replace('user_', '') : id
  workflowStorage.delete(realId)
  loadUserWorkflows()
  if (selectedWorkflowId.value === `user_${realId}`) {
    selectedWorkflowId.value = null
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
  // 自动选中新保存的工作流
  selectedWorkflowId.value = `user_${toSave.id}`
  window.$message?.success('工作流已保存')
}

// 从弹窗执行工作流
const handleExecuteFromModal = async (workflow) => {
  showConfigModal.value = false
  await executeWorkflow(workflow)
}

// 进度
const progressText = computed(() => {
  if (!progress.value.stepName) return '准备执行...'
  return `${progress.value.stage} ${progress.value.stepName} (${progress.value.current}/${progress.value.total})`
})

const progressPercent = computed(() => {
  if (!progress.value.total) return 0
  return Math.round((progress.value.current / progress.value.total) * 100)
})

const isProcessing = computed(() => processing.value || isExecuting.value)

const canExecute = computed(() => !!selectedWorkflowId.value)

const buttonText = computed(() => {
  if (isProcessing.value) return '处理中...'
  return '开始处理'
})

// 执行工作流
const executeWorkflow = async (workflow) => {
  processing.value = true
  result.value = null

  try {
    const execResult = await execute(workflow)

    // 转换结果格式
    const steps = (execResult.steps || []).map(s => ({
      name: s.step?.name || s.step?.actionType || '未知步骤',
      success: s.result?.success ?? false,
      message: s.result?.message || '',
      path: s.result?.data?.pdfFullPath || s.result?.data?.newFilePath || null
    }))

    const successCount = steps.filter(s => s.success).length
    const failCount = steps.filter(s => !s.success).length

    result.value = {
      success: execResult.success,
      steps,
      summary: `共执行 ${steps.length} 个步骤，成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ''}`
    }
    showResultModal.value = true
  } catch (error) {
    result.value = {
      success: false,
      steps: [{ name: '执行工作流', success: false, message: error.message || '处理失败' }],
      summary: '工作流执行出错'
    }
    showResultModal.value = true
  } finally {
    processing.value = false
  }
}

// 触发执行
const triggerExecute = async () => {
  if (isProcessing.value) return

  if (!selectedWorkflow.value) {
    window.$message?.warning('请选择一个工作流方案')
    return
  }
  await executeWorkflow(selectedWorkflow.value)
}

const copyPath = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    window.$message?.success('路径已复制到剪贴板')
  } catch {
    window.$message?.error('复制失败')
  }
}

// 初始化
onMounted(() => {
  loadUserWorkflows()
})

// 暴露给父组件的属性和方法
defineExpose({
  triggerExecute,
  openCreateModal,
  // 直接暴露 computed 的 value，让父组件更容易访问
  get isProcessing() {
    return isProcessing.value
  },
  get buttonText() {
    return buttonText.value
  },
  get canExecute() {
    return canExecute.value
  }
})
</script>

<style scoped>
.workflow-card {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.workflow-card:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.workflow-card.is-selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.card-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}
</style>
