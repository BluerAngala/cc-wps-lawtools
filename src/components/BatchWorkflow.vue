<template>
  <div class="p-3">
    <n-alert type="info" :closable="false" show-icon class="mb-3">
      <template #header>工作流说明</template>
      <template #default>选择预设工作流方案执行，支持关键词搜索。</template>
    </n-alert>

    <!-- 工作流选择器 -->
    <n-select
      v-model:value="selectedWorkflowId"
      :options="workflowOptions"
      placeholder="输入关键词搜索工作流..."
      filterable
      clearable
      size="small"
      class="mb-3"
    />

    <!-- 选中的工作流步骤预览 -->
    <div v-if="selectedWorkflow" class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
      <div class="flex items-center justify-between mb-1">
        <div class="text-xs font-medium text-blue-600">{{ selectedWorkflow.name }} - 执行步骤：</div>
        <div class="flex gap-1">
          <n-tag size="tiny" :type="selectedWorkflow.isUser ? 'warning' : (selectedWorkflow.category === 'ai' ? 'info' : 'success')">
            {{ selectedWorkflow.isUser ? '自定义' : (selectedWorkflow.category === 'ai' ? 'AI' : '文档') }}
          </n-tag>
          <template v-if="selectedWorkflow.isUser">
            <n-button size="tiny" quaternary @click="editWorkflow(selectedWorkflow)">编辑</n-button>
            <n-button size="tiny" quaternary type="error" @click="deleteWorkflow(selectedWorkflow.id)">删除</n-button>
          </template>
        </div>
      </div>
      <div class="flex flex-wrap gap-1">
        <n-tag v-for="(step, idx) in selectedWorkflow.steps" :key="idx" size="tiny" type="info">
          {{ idx + 1 }}. {{ step.name }}
        </n-tag>
      </div>
    </div>

    <!-- 新建工作流按钮 -->
    <n-button type="info" size="small" block @click="openCreateModal">
      + 新建自定义工作流
    </n-button>

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
import { NAlert, NTag, NSelect, NModal, NButton, NSpin, NProgress } from 'naive-ui'
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

// 合并所有工作流选项（预设 + 用户自定义）
const workflowOptions = computed(() => {
  const options = []

  // 用户自定义工作流分组
  if (userWorkflows.value.length > 0) {
    options.push({
      type: 'group',
      label: '💾 我的工作流',
      key: 'user',
      children: userWorkflows.value.map(wf => ({
        label: wf.name,
        value: `user_${wf.id}`,
        description: wf.description
      }))
    })
  }

  // AI 工作流分组
  const aiPresets = allPresets.value.filter(p => p.category === 'ai')
  if (aiPresets.length > 0) {
    options.push({
      type: 'group',
      label: '🤖 AI 工作流',
      key: 'ai',
      children: aiPresets.map(p => ({
        label: p.name,
        value: `preset_${p.id}`,
        description: p.description
      }))
    })
  }

  // 文档工作流分组
  const docPresets = allPresets.value.filter(p => p.category !== 'ai')
  if (docPresets.length > 0) {
    options.push({
      type: 'group',
      label: '📄 文档工作流',
      key: 'document',
      children: docPresets.map(p => ({
        label: p.name,
        value: `preset_${p.id}`,
        description: p.description
      }))
    })
  }

  return options
})

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
