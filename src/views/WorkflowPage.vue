<template>
  <PageLayout>
    <!-- 页面标题 -->
    <PageHeader
      title="工作流"
      icon="⚡"
      :loading="isExecuting"
      loading-text="执行中"
      description="选择预设工作流或自定义操作步骤，一键完成文档处理"
    >
      <template #actions>
        <n-space>
          <n-button
            type="info"
            :disabled="currentSteps.length === 0"
            @click="showSaveModal = true"
          >
            保存工作流
          </n-button>
          <n-button
            type="primary"
            :loading="isExecuting"
            :disabled="isExecuting || currentSteps.length === 0"
            @click="executeWorkflow"
          >
            {{ isExecuting ? '执行中...' : '执行工作流' }}
          </n-button>
        </n-space>
      </template>
    </PageHeader>

    <!-- 我的工作流 -->
    <div v-if="userWorkflows.length > 0" class="wps-card wps-section mt-2">
      <div class="text-sm font-semibold mb-3">我的工作流</div>
      <n-space>
        <n-tag
          v-for="wf in userWorkflows"
          :key="wf.id"
          :type="selectedPreset === wf.id ? 'primary' : 'default'"
          closable
          @click="selectPreset(wf)"
          @close="deleteUserWorkflow(wf.id)"
          class="cursor-pointer"
        >
          {{ wf.name }}
        </n-tag>
      </n-space>
    </div>

    <!-- 预设工作流选择 -->
    <div class="wps-card wps-section mt-2">
      <div class="text-sm font-semibold mb-3">预设工作流</div>
      <n-space>
        <n-button
          v-for="preset in presetWorkflows"
          :key="preset.id"
          :type="selectedPreset === preset.id ? 'primary' : 'default'"
          size="small"
          @click="selectPreset(preset)"
        >
          {{ preset.name }}
        </n-button>
        <n-button size="small" @click="clearSteps">清空</n-button>
      </n-space>
    </div>

    <!-- 当前工作流步骤 -->
    <div class="wps-card wps-section mt-2">
      <div class="text-sm font-semibold mb-3">
        当前步骤 ({{ currentSteps.length }})
      </div>
      
      <div v-if="currentSteps.length === 0" class="text-gray-400 text-sm py-4 text-center">
        请选择预设工作流或从下方添加操作
      </div>
      
      <n-space v-else vertical>
        <div
          v-for="(step, index) in currentSteps"
          :key="index"
          class="flex items-center gap-2 p-2 bg-gray-50 rounded"
        >
          <span class="text-gray-400 text-sm w-6">{{ index + 1 }}.</span>
          <span>{{ getActionIcon(step.actionType) }}</span>
          <span class="flex-1 text-sm">{{ step.name || getActionName(step.actionType) }}</span>
          <n-button size="tiny" quaternary @click="editStep(index)">编辑</n-button>
          <n-button size="tiny" quaternary type="error" @click="removeStep(index)">删除</n-button>
        </div>
      </n-space>
    </div>

    <!-- 可用操作列表 -->
    <div class="wps-card wps-section mt-2">
      <div class="text-sm font-semibold mb-3">添加操作</div>
      <div class="grid grid-cols-4 gap-2">
        <div
          v-for="action in availableActions"
          :key="action.type"
          class="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded cursor-pointer hover:bg-blue-50 transition-colors"
          @click="addAction(action)"
        >
          <span class="text-lg">{{ action.icon }}</span>
          <span class="text-xs text-center">{{ action.name }}</span>
        </div>
      </div>
    </div>

    <!-- 执行进度 -->
    <div v-if="isExecuting" class="wps-card wps-section mt-2">
      <div class="text-sm font-semibold mb-3">执行进度</div>
      <n-progress
        type="line"
        :percentage="progressPercent"
        :status="progressStatus"
      />
      <div class="text-sm text-gray-500 mt-2">{{ progressText }}</div>
    </div>

    <!-- 执行结果弹窗 -->
    <ResultModal v-model:show="showResultModal" :result="executionResult" />

    <!-- 步骤编辑弹窗 -->
    <n-modal v-model:show="showEditModal" preset="card" title="编辑步骤参数" style="width: 80%; max-width: 400px">
      <n-form v-if="editingStep" label-placement="top" size="small">
        <n-form-item
          v-for="(prop, key) in getStepSchema(editingStep)"
          :key="key"
          :label="prop.title || key"
        >
          <n-input
            v-if="prop.type === 'string'"
            v-model:value="editingStep.params[key]"
            :placeholder="prop.description"
          />
          <n-input-number
            v-else-if="prop.type === 'number'"
            v-model:value="editingStep.params[key]"
            :placeholder="prop.description"
          />
          <n-switch
            v-else-if="prop.type === 'boolean'"
            v-model:value="editingStep.params[key]"
          />
          <n-select
            v-else-if="prop.enum"
            v-model:value="editingStep.params[key]"
            :options="prop.enum.map(v => ({ label: v, value: v }))"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button size="small" @click="showEditModal = false">取消</n-button>
          <n-button type="primary" size="small" @click="saveStep">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 保存工作流弹窗 -->
    <n-modal v-model:show="showSaveModal" preset="card" title="保存工作流" style="width: 80%; max-width: 400px">
      <n-form label-placement="top" size="small">
        <n-form-item label="工作流名称" required>
          <n-input v-model:value="saveForm.name" placeholder="请输入工作流名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input
            v-model:value="saveForm.description"
            type="textarea"
            placeholder="可选，描述工作流的用途"
            :rows="2"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button size="small" @click="showSaveModal = false">取消</n-button>
          <n-button type="primary" size="small" @click="saveWorkflow">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  NButton,
  NSpace,
  NProgress,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSelect,
  NTag
} from '../components/naive-components.js'
import { PageLayout, PageHeader } from '../components/common'
import ResultModal from '../components/ResultModal.vue'
import {
  workflowEngine,
  actionRegistry,
  registerAllActions,
  presetWorkflows,
  cloneWorkflow,
  workflowStorage
} from '../services/workflow/index.js'

// 响应式数据
const selectedPreset = ref('')
const currentSteps = ref([])
const isExecuting = ref(false)
const executionResult = ref(null)
const progressInfo = ref({ current: 0, total: 0, stage: '', stepName: '' })
const showEditModal = ref(false)
const editingStep = ref(null)
const editingIndex = ref(-1)
const availableActions = ref([])
const userWorkflows = ref([])
const showSaveModal = ref(false)
const showResultModal = ref(false)
const saveForm = ref({ name: '', description: '' })

const progressPercent = computed(() => {
  if (progressInfo.value.total === 0) return 0
  return Math.round(((progressInfo.value.current + 1) / progressInfo.value.total) * 100)
})

const progressStatus = computed(() => {
  if (!isExecuting.value && executionResult.value) {
    return executionResult.value.success ? 'success' : 'error'
  }
  return 'default'
})

const progressText = computed(() => {
  const { current, total, stage, stepName } = progressInfo.value
  if (stage === 'start') {
    return `正在执行: ${stepName} (${current + 1}/${total})`
  }
  if (stage === 'complete') {
    return `已完成: ${stepName} (${current + 1}/${total})`
  }
  return ''
})

// 方法
const getActionIcon = (type) => {
  const action = actionRegistry.get(type)
  return action?.icon || '⚙️'
}

const getActionName = (type) => {
  const action = actionRegistry.get(type)
  return action?.name || type
}

const getStepSchema = (step) => {
  const action = actionRegistry.get(step.actionType)
  return action?.getSchema()?.properties || {}
}

const selectPreset = (preset) => {
  selectedPreset.value = preset.id
  const cloned = cloneWorkflow(preset)
  currentSteps.value = cloned.steps
  executionResult.value = null
}

const clearSteps = () => {
  selectedPreset.value = ''
  currentSteps.value = []
  executionResult.value = null
}

const addAction = (action) => {
  const schema = action.getSchema()
  const params = {}

  // 初始化默认参数
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]) => {
      if (prop.default !== undefined) {
        params[key] = prop.default
      } else if (prop.type === 'string') {
        params[key] = ''
      } else if (prop.type === 'number') {
        params[key] = 0
      } else if (prop.type === 'boolean') {
        params[key] = false
      }
    })
  }

  currentSteps.value.push({
    actionType: action.type,
    name: action.name,
    params
  })
  selectedPreset.value = ''
}

const removeStep = (index) => {
  currentSteps.value.splice(index, 1)
  selectedPreset.value = ''
}

const editStep = (index) => {
  editingIndex.value = index
  editingStep.value = JSON.parse(JSON.stringify(currentSteps.value[index]))
  showEditModal.value = true
}

const saveStep = () => {
  if (editingIndex.value >= 0 && editingStep.value) {
    currentSteps.value[editingIndex.value] = editingStep.value
  }
  showEditModal.value = false
  editingStep.value = null
  editingIndex.value = -1
}

// 保存工作流
const saveWorkflow = () => {
  if (!saveForm.value.name.trim()) {
    window.$message?.warning('请输入工作流名称')
    return
  }

  const workflow = {
    id: workflowStorage.generateId(),
    name: saveForm.value.name.trim(),
    description: saveForm.value.description.trim(),
    steps: JSON.parse(JSON.stringify(currentSteps.value))
  }

  const success = workflowStorage.save(workflow)
  if (success) {
    window.$message?.success('工作流已保存')
    loadUserWorkflows()
    showSaveModal.value = false
    saveForm.value = { name: '', description: '' }
  } else {
    window.$message?.error('保存失败')
  }
}

// 删除用户工作流
const deleteUserWorkflow = (id) => {
  workflowStorage.delete(id)
  loadUserWorkflows()
  if (selectedPreset.value === id) {
    clearSteps()
  }
  window.$message?.success('已删除')
}

// 加载用户工作流
const loadUserWorkflows = () => {
  userWorkflows.value = workflowStorage.getAll()
}

const executeWorkflow = async () => {
  if (currentSteps.value.length === 0) {
    window.$message?.warning('请先添加工作流步骤')
    return
  }

  isExecuting.value = true
  executionResult.value = null
  progressInfo.value = { current: 0, total: currentSteps.value.length, stage: '', stepName: '' }

  try {
    const workflow = {
      id: 'custom',
      name: '自定义工作流',
      steps: currentSteps.value
    }

    const result = await workflowEngine.execute(workflow, {
      onProgress: (info) => {
        progressInfo.value = info
      }
    })

    executionResult.value = result
    showResultModal.value = true
  } catch (error) {
    executionResult.value = {
      success: false,
      message: error.message || '执行失败',
      steps: []
    }
    showResultModal.value = true
  } finally {
    isExecuting.value = false
  }
}

// 初始化
onMounted(() => {
  registerAllActions()
  availableActions.value = actionRegistry.list()
  loadUserWorkflows()
})
</script>
