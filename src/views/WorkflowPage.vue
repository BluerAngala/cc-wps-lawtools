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

    <!-- 1. 当前工作流步骤（始终在最上方） -->
    <div class="wps-card wps-section mt-2">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-semibold">
          当前步骤 ({{ currentSteps.length }})
        </div>
        <n-button v-if="currentSteps.length > 0" size="tiny" type="error" @click="clearSteps">清空</n-button>
      </div>
      
      <div v-if="currentSteps.length === 0" class="text-gray-400 text-sm py-4 text-center">
        请使用 AI 智能生成、选择预设工作流或手动添加操作
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

    <!-- 执行进度 -->
    <div v-if="isExecuting" class="wps-card wps-section mt-2">
      <n-progress
        type="line"
        :percentage="progressPercent"
        :status="progressStatus"
      />
      <div class="text-sm text-gray-500 mt-2">{{ progressText }}</div>
    </div>

    <!-- 2. AI 智能生成（可折叠） -->
    <div class="wps-card wps-section mt-2">
      <n-collapse :default-expanded-names="['ai-generate']">
        <n-collapse-item title="🤖 AI 智能生成" name="ai-generate">
          <AIWorkflowInput @confirm="handleAIConfirm" />
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 3. 预设工作流（可折叠） -->
    <div class="wps-card wps-section mt-2">
      <n-collapse :default-expanded-names="['presets']">
        <n-collapse-item name="presets">
          <template #header>
            <span>📋 预设工作流</span>
          </template>
          
          <!-- 我的工作流 -->
          <div v-if="userWorkflows.length > 0" class="mb-3">
            <div class="text-xs text-gray-500 mb-2">💾 我的工作流</div>
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
          
          <!-- AI 工作流预设 -->
          <div class="mb-3">
            <div class="text-xs text-gray-500 mb-2">🤖 AI 工作流</div>
            <n-space>
              <n-button
                v-for="preset in aiPresets"
                :key="preset.id"
                :type="selectedPreset === preset.id ? 'primary' : 'default'"
                size="small"
                @click="selectPreset(preset)"
              >
                {{ preset.name }}
              </n-button>
            </n-space>
          </div>
          
          <!-- 文档工作流预设 -->
          <div>
            <div class="text-xs text-gray-500 mb-2">📄 文档工作流</div>
            <n-space>
              <n-button
                v-for="preset in documentPresets"
                :key="preset.id"
                :type="selectedPreset === preset.id ? 'primary' : 'default'"
                size="small"
                @click="selectPreset(preset)"
              >
                {{ preset.name }}
              </n-button>
            </n-space>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 4. 手动添加操作（可折叠） -->
    <div class="wps-card wps-section mt-2">
      <n-collapse :default-expanded-names="['manual-add']">
        <n-collapse-item name="manual-add">
          <template #header>
            <span>🔧 手动添加操作</span>
          </template>
          
          <!-- AI 操作 -->
          <div class="mb-3">
            <div class="text-xs text-gray-500 mb-2">🤖 AI 操作</div>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="action in aiActionList"
                :key="action.type"
                class="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                @click="addAction(action)"
              >
                <span class="text-lg">{{ action.icon }}</span>
                <span class="text-xs text-center">{{ action.name }}</span>
              </div>
            </div>
          </div>
          
          <!-- 文档操作 -->
          <div>
            <div class="text-xs text-gray-500 mb-2">📄 文档操作</div>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="action in documentActionList"
                :key="action.type"
                class="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                @click="addAction(action)"
              >
                <span class="text-lg">{{ action.icon }}</span>
                <span class="text-xs text-center">{{ action.name }}</span>
              </div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 执行结果弹窗 -->
    <ResultModal v-model:show="showResultModal" :result="executionResult" />

    <!-- 步骤编辑弹窗 -->
    <n-modal v-model:show="showEditModal" preset="card" title="编辑步骤参数" style="width: 80%; max-width: 500px">
      <n-form v-if="editingStep" label-placement="top" size="small">
        <!-- 无可编辑参数时的提示 -->
        <div v-if="Object.keys(getStepSchema(editingStep)).length === 0" class="text-gray-400 text-sm py-4 text-center">
          此操作没有可配置的参数
        </div>
        <!-- 非数字类型的表单项 -->
        <template v-for="(prop, key) in getStepSchema(editingStep)" :key="key">
          <n-form-item v-if="prop.type !== 'number'" :label="prop.title || key">
            <!-- 有枚举值的选择器（优先判断） -->
            <n-select
              v-if="prop.enum"
              v-model:value="editingStep.params[key]"
              :options="getEnumOptions(prop)"
              :placeholder="prop.description"
            />
            <!-- 数组类型 + options：多选框组 -->
            <n-checkbox-group
              v-else-if="prop.type === 'array' && prop.options"
              v-model:value="editingStep.params[key]"
            >
              <n-space>
                <n-checkbox
                  v-for="opt in prop.options"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </n-space>
            </n-checkbox-group>
            <!-- 布尔开关 -->
            <div v-else-if="prop.type === 'boolean'" class="flex items-center gap-2">
              <n-switch v-model:value="editingStep.params[key]" />
              <span class="text-xs text-gray-500">{{ prop.description }}</span>
            </div>
            <!-- 多行文本输入 -->
            <n-input
              v-else-if="prop.inputType === 'textarea'"
              v-model:value="editingStep.params[key]"
              type="textarea"
              :placeholder="prop.placeholder || prop.description"
              :rows="3"
            />
            <!-- 字符串输入（默认） -->
            <n-input
              v-else
              v-model:value="editingStep.params[key]"
              :placeholder="prop.placeholder || prop.description"
            />
          </n-form-item>
        </template>
        <!-- 数字类型的表单项（双栏布局） -->
        <n-grid v-if="hasNumberFields(editingStep)" :cols="2" :x-gap="12">
          <template v-for="(prop, key) in getStepSchema(editingStep)" :key="key">
            <n-gi v-if="prop.type === 'number'">
              <n-form-item :label="prop.title || key">
                <n-input-number
                  v-model:value="editingStep.params[key]"
                  :placeholder="prop.description"
                  button-placement="both"
                  class="w-full text-center"
                />
              </n-form-item>
            </n-gi>
          </template>
        </n-grid>
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
  NTag,
  NCheckboxGroup,
  NCheckbox,
  NGrid,
  NGi,
  NCollapse,
  NCollapseItem
} from '../components/naive-components.js'
import { PageLayout, PageHeader } from '../components/common'
import ResultModal from '../components/ResultModal.vue'
import AIWorkflowInput from '../components/AIWorkflowInput.vue'
import {
  workflowEngine,
  actionRegistry,
  registerAllActions,
  cloneWorkflow,
  workflowStorage,
  getPresetList
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
const aiActionList = ref([])
const documentActionList = ref([])
const aiPresets = ref([])
const documentPresets = ref([])
const userWorkflows = ref([])
const showSaveModal = ref(false)
const showResultModal = ref(false)
const saveForm = ref({ name: '', description: '' })

const progressPercent = computed(() => {
  const { current, total, stage } = progressInfo.value
  if (total === 0) return 0
  // 步骤开始时显示该步骤的起始进度，完成后才增加
  if (stage === 'start') {
    return Math.round((current / total) * 100)
  }
  return Math.round(((current + 1) / total) * 100)
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
  const properties = action?.getSchema()?.properties || {}
  // 过滤掉 function 类型（不可在表单中编辑）
  // 保留 array 类型（如果有 options 则显示为多选框）
  const editableProps = {}
  Object.entries(properties).forEach(([key, prop]) => {
    if (prop.type !== 'function') {
      // array 类型只有在有 options 时才可编辑
      if (prop.type === 'array' && !prop.options) {
        return
      }
      editableProps[key] = prop
    }
  })
  return editableProps
}

// 检查是否有数字类型字段
const hasNumberFields = (step) => {
  const schema = getStepSchema(step)
  return Object.values(schema).some(prop => prop.type === 'number')
}

// 获取枚举选项（支持 enumLabels）
const getEnumOptions = (prop) => {
  if (!prop.enum) return []
  return prop.enum.map((value, index) => ({
    label: prop.enumLabels?.[index] || getEnumLabel(value),
    value
  }))
}

// 获取枚举值的友好标签
const getEnumLabel = (value) => {
  const labels = {
    // 审查策略
    full: '全文审查',
    segment: '分段审查',
    // 审查视角
    partyA: '甲方视角',
    partyB: '乙方视角',
    neutral: '中立视角',
    // 审查深度
    quick: '快速',
    standard: '标准',
    deep: '深度',
    // 提取模式
    basic: '基础要素',
    // full 已在上面定义
  }
  return labels[value] || value
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
  const step = JSON.parse(JSON.stringify(currentSteps.value[index]))
  // 确保 params 存在
  if (!step.params) {
    step.params = {}
  }
  editingStep.value = step
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

// 处理 AI 生成的工作流确认
const handleAIConfirm = (steps) => {
  currentSteps.value.push(...steps)
  selectedPreset.value = ''
}

// 初始化
onMounted(() => {
  registerAllActions()
  availableActions.value = actionRegistry.list()
  // 分类操作列表
  aiActionList.value = availableActions.value.filter(a => a.category === 'ai')
  documentActionList.value = availableActions.value.filter(a => a.category !== 'ai')
  // 分类预设工作流
  aiPresets.value = getPresetList('ai')
  documentPresets.value = getPresetList('document')
  loadUserWorkflows()
})
</script>
