<template>
  <div class="p-3">
    <n-alert type="info" :closable="false" show-icon class="mb-3">
      <template #header>工作流说明</template>
      <template #default>选择预设工作流方案执行，或自定义操作组合。</template>
    </n-alert>

    <!-- 工作流模式切换 -->
    <n-tabs v-model:value="activeTab" type="segment" size="small" class="mb-3">
      <n-tab name="preset">预设方案</n-tab>
      <n-tab name="custom">自定义</n-tab>
    </n-tabs>

    <!-- 预设工作流方案 -->
    <div v-if="activeTab === 'preset'">
      <!-- 分类筛选 -->
      <n-space class="mb-2" :size="8">
        <n-tag
          v-for="cat in categories"
          :key="cat.value"
          :type="selectedCategory === cat.value ? 'primary' : 'default'"
          :bordered="selectedCategory !== cat.value"
          size="small"
          class="cursor-pointer"
          @click="selectedCategory = cat.value"
        >
          {{ cat.label }}
        </n-tag>
      </n-space>

      <!-- 选中的工作流步骤预览（放在列表上方） -->
      <div v-if="selectedPreset" class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
        <div class="text-xs font-medium text-blue-600 mb-1">{{ selectedPreset.name }} - 执行步骤：</div>
        <div class="flex flex-wrap gap-1">
          <n-tag v-for="(step, idx) in selectedPreset.steps" :key="idx" size="tiny" type="info">
            {{ idx + 1 }}. {{ step.name }}
          </n-tag>
        </div>
      </div>

      <!-- 工作流列表 -->
      <div class="space-y-1 max-h-52 overflow-y-auto">
        <div
          v-for="preset in filteredPresets"
          :key="preset.id"
          class="border rounded px-3 py-2 cursor-pointer transition-colors"
          :class="selectedPresetId === preset.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
          @click="selectPreset(preset.id)"
        >
          <div class="flex items-center gap-2">
            <n-radio :checked="selectedPresetId === preset.id" @click.stop />
            <span class="text-sm font-medium">{{ preset.name }}</span>
            <n-tag size="tiny" :type="preset.category === 'ai' ? 'info' : 'success'">
              {{ preset.category === 'ai' ? 'AI' : '文档' }}
            </n-tag>
          </div>
          <div class="text-xs text-gray-500 mt-1 pl-6">{{ preset.description }}</div>
        </div>
      </div>
    </div>

    <!-- 自定义工作流 -->
    <div v-else>
      <!-- 选中的自定义工作流步骤预览（放在列表上方） -->
      <div v-if="selectedCustomWorkflow" class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
        <div class="text-xs font-medium text-blue-600 mb-1">{{ selectedCustomWorkflow.name }} - 执行步骤：</div>
        <div class="flex flex-wrap gap-1">
          <n-tag v-for="(step, idx) in selectedCustomWorkflow.steps" :key="idx" size="tiny" type="info">
            {{ idx + 1 }}. {{ step.name }}
          </n-tag>
        </div>
      </div>

      <!-- 我的工作流 -->
      <div v-if="userWorkflows.length > 0" class="mb-3">
        <div class="text-xs text-gray-500 mb-2">我的工作流</div>
        <div class="space-y-1 max-h-40 overflow-y-auto">
          <div
            v-for="wf in userWorkflows"
            :key="wf.id"
            class="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer transition-colors"
            :class="selectedCustomId === wf.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
            @click="selectCustomWorkflow(wf)"
          >
            <n-radio :checked="selectedCustomId === wf.id" @click.stop />
            <span class="flex-1 text-sm">{{ wf.name }}</span>
            <n-button size="tiny" quaternary @click.stop="editWorkflow(wf)">编辑</n-button>
            <n-button size="tiny" quaternary type="error" @click.stop="deleteWorkflow(wf.id)">删除</n-button>
          </div>
        </div>
      </div>

      <!-- 新建工作流按钮 -->
      <n-button type="info" size="small" block @click="openCreateModal">
        + 新建工作流
      </n-button>
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
import { NAlert, NTabs, NTab, NTag, NRadio, NSpace, NModal, NButton, NSpin, NProgress } from 'naive-ui'
import WorkflowConfigModal from './WorkflowConfigModal.vue'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { getPresetList, workflowStorage } from '../services/workflow'

// 工作流执行
const { execute, isExecuting, progress } = useWorkflowExecution()

const processing = ref(false)
const result = ref(null)
const showResultModal = ref(false)
const activeTab = ref('preset')

// 预设工作流
const selectedCategory = ref('all')
const selectedPresetId = ref(null)

// 自定义工作流
const userWorkflows = ref([])
const selectedCustomId = ref(null)
const showConfigModal = ref(false)
const editingWorkflow = ref(null)

const categories = [
  { label: '全部', value: 'all' },
  { label: 'AI工作流', value: 'ai' },
  { label: '文档操作', value: 'document' }
]

// 获取所有预设工作流
const allPresets = computed(() => getPresetList())

// 根据分类筛选
const filteredPresets = computed(() => {
  if (selectedCategory.value === 'all') return allPresets.value
  return allPresets.value.filter(p => p.category === selectedCategory.value)
})

// 选中的预设
const selectedPreset = computed(() => {
  if (!selectedPresetId.value) return null
  return allPresets.value.find(p => p.id === selectedPresetId.value)
})

// 选中的自定义工作流
const selectedCustomWorkflow = computed(() => {
  if (!selectedCustomId.value) return null
  return userWorkflows.value.find(w => w.id === selectedCustomId.value)
})

const selectPreset = (id) => {
  selectedPresetId.value = id
}

const selectCustomWorkflow = (wf) => {
  selectedCustomId.value = wf.id
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
  if (selectedCustomId.value === id) {
    selectedCustomId.value = null
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

const canExecute = computed(() => {
  if (activeTab.value === 'preset') {
    return !!selectedPresetId.value
  }
  return !!selectedCustomId.value
})

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

  if (activeTab.value === 'preset') {
    if (!selectedPreset.value) {
      window.$message?.warning('请选择一个工作流方案')
      return
    }
    await executeWorkflow(selectedPreset.value)
  } else {
    if (!selectedCustomWorkflow.value) {
      window.$message?.warning('请选择一个自定义工作流')
      return
    }
    await executeWorkflow(selectedCustomWorkflow.value)
  }
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
