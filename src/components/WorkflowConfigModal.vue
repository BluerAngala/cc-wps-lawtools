<template>
  <n-modal
    :show="show"
    preset="card"
    :title="modalTitle"
    style="width: 90%; max-width: 600px; max-height: 85vh;"
    :bordered="false"
    @update:show="$emit('update:show', $event)"
  >
    <div class="flex flex-col gap-3" style="max-height: 60vh; overflow-y: auto;">
      <!-- 工作流名称 -->
      <n-form-item label="工作流名称" :show-feedback="false">
        <n-input v-model:value="form.name" placeholder="请输入工作流名称" size="small" />
      </n-form-item>

      <!-- 当前步骤列表 -->
      <div class="border rounded p-2 bg-gray-50">
        <div class="text-xs font-medium text-gray-600 mb-2">
          当前步骤 ({{ form.steps.length }})
        </div>
        <div v-if="form.steps.length === 0" class="text-gray-400 text-xs py-2 text-center">
          请从下方添加操作步骤
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="(step, index) in form.steps"
            :key="index"
            class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
          >
            <span class="text-gray-400 text-xs w-5">{{ index + 1 }}.</span>
            <span class="text-sm">{{ getActionIcon(step.actionType) }}</span>
            <span class="flex-1 text-xs">{{ step.name }}</span>
            <n-button size="tiny" quaternary @click="editStep(index)">编辑</n-button>
            <n-button size="tiny" quaternary type="error" @click="removeStep(index)">删除</n-button>
          </div>
        </div>
      </div>

      <!-- 可用操作列表 -->
      <div>
        <div class="text-xs font-medium text-gray-600 mb-2">添加操作</div>
        <!-- AI 操作 -->
        <div class="mb-2">
          <div class="text-xs text-gray-400 mb-1">🤖 AI 操作</div>
          <div class="grid grid-cols-4 gap-1">
            <div
              v-for="action in aiActions"
              :key="action.type"
              class="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors"
              @click="addAction(action)"
            >
              <span class="text-base">{{ action.icon }}</span>
              <span class="text-xs text-center leading-tight">{{ action.name }}</span>
            </div>
          </div>
        </div>
        <!-- 文档操作 -->
        <div>
          <div class="text-xs text-gray-400 mb-1">📄 文档操作</div>
          <div class="grid grid-cols-4 gap-1">
            <div
              v-for="action in documentActions"
              :key="action.type"
              class="flex flex-col items-center gap-1 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors"
              @click="addAction(action)"
            >
              <span class="text-base">{{ action.icon }}</span>
              <span class="text-xs text-center leading-tight">{{ action.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <n-space justify="space-between">
        <n-button size="small" @click="$emit('update:show', false)">取消</n-button>
        <n-space>
          <n-button size="small" type="info" :disabled="!canExecute" @click="handleExecute">
            仅执行
          </n-button>
          <n-button size="small" type="primary" :disabled="!canSave" @click="handleSave">
            保存
          </n-button>
        </n-space>
      </n-space>
    </template>

    <!-- 步骤参数编辑弹窗 -->
    <n-modal v-model:show="showStepEdit" preset="card" title="编辑步骤参数" style="width: 80%; max-width: 450px;">
      <n-form v-if="editingStep" label-placement="top" size="small">
        <div v-if="Object.keys(getStepSchema(editingStep)).length === 0" class="text-gray-400 text-xs py-3 text-center">
          此操作没有可配置的参数
        </div>
        <template v-for="(prop, key) in getStepSchema(editingStep)" :key="key">
          <n-form-item v-if="prop.type !== 'number'" :label="prop.title || key">
            <n-select
              v-if="prop.enum"
              v-model:value="editingStep.params[key]"
              :options="getEnumOptions(prop)"
              :placeholder="prop.description"
              size="small"
            />
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
            <div v-else-if="prop.type === 'boolean'" class="flex items-center gap-2">
              <n-switch v-model:value="editingStep.params[key]" size="small" />
              <span class="text-xs text-gray-500">{{ prop.description }}</span>
            </div>
            <n-input
              v-else-if="prop.inputType === 'textarea'"
              v-model:value="editingStep.params[key]"
              type="textarea"
              :placeholder="prop.placeholder || prop.description"
              :rows="2"
              size="small"
            />
            <n-input
              v-else
              v-model:value="editingStep.params[key]"
              :placeholder="prop.placeholder || prop.description"
              size="small"
            />
          </n-form-item>
        </template>
        <n-grid v-if="hasNumberFields(editingStep)" :cols="2" :x-gap="12">
          <template v-for="(prop, key) in getStepSchema(editingStep)" :key="key">
            <n-gi v-if="prop.type === 'number'">
              <n-form-item :label="prop.title || key">
                <n-input-number
                  v-model:value="editingStep.params[key]"
                  :placeholder="prop.description"
                  button-placement="both"
                  size="small"
                  class="w-full"
                />
              </n-form-item>
            </n-gi>
          </template>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button size="small" @click="showStepEdit = false">取消</n-button>
          <n-button type="primary" size="small" @click="saveStepEdit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  NSpace,
  NSelect,
  NSwitch,
  NCheckbox,
  NCheckboxGroup,
  NGrid,
  NGi
} from 'naive-ui'
import { actionRegistry, registerAllActions } from '../services/workflow/index.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  workflow: { type: Object, default: null },
  title: { type: String, default: '' }
})

const emit = defineEmits(['update:show', 'save', 'execute', 'cancel'])

// 表单数据
const form = ref({ name: '', description: '', steps: [] })

// 操作列表
const aiActions = ref([])
const documentActions = ref([])

// 步骤编辑
const showStepEdit = ref(false)
const editingStep = ref(null)
const editingIndex = ref(-1)

// 计算属性
const modalTitle = computed(() => {
  if (props.title) return props.title
  return props.workflow ? '编辑工作流' : '新建工作流'
})

const canSave = computed(() => form.value.name.trim() && form.value.steps.length > 0)
const canExecute = computed(() => form.value.steps.length > 0)

// 监听 workflow 变化，加载数据
watch(() => props.workflow, (wf) => {
  if (wf) {
    form.value = {
      name: wf.name || '',
      description: wf.description || '',
      steps: JSON.parse(JSON.stringify(wf.steps || []))
    }
  } else {
    form.value = { name: '', description: '', steps: [] }
  }
}, { immediate: true })

// 监听 show 变化，重置表单
watch(() => props.show, (visible) => {
  if (visible && !props.workflow) {
    form.value = { name: '', description: '', steps: [] }
  }
})

// 获取操作图标
const getActionIcon = (type) => {
  const action = actionRegistry.get(type)
  return action?.icon || '⚙️'
}

// 获取步骤 schema
const getStepSchema = (step) => {
  const action = actionRegistry.get(step.actionType)
  const properties = action?.getSchema()?.properties || {}
  const editableProps = {}
  Object.entries(properties).forEach(([key, prop]) => {
    if (prop.type !== 'function') {
      if (prop.type === 'array' && !prop.options) return
      editableProps[key] = prop
    }
  })
  return editableProps
}

// 检查是否有数字字段
const hasNumberFields = (step) => {
  const schema = getStepSchema(step)
  return Object.values(schema).some(prop => prop.type === 'number')
}

// 获取枚举选项
const getEnumOptions = (prop) => {
  if (!prop.enum) return []
  const labels = {
    full: '全文审查', segment: '分段审查',
    partyA: '甲方视角', partyB: '乙方视角', neutral: '中立视角',
    quick: '快速', standard: '标准', deep: '深度',
    basic: '基础要素'
  }
  return prop.enum.map((value, index) => ({
    label: prop.enumLabels?.[index] || labels[value] || value,
    value
  }))
}

// 添加操作
const addAction = (action) => {
  const schema = action.getSchema()
  const params = {}
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
  form.value.steps.push({
    actionType: action.type,
    name: action.name,
    params
  })
}

// 删除步骤
const removeStep = (index) => {
  form.value.steps.splice(index, 1)
}

// 编辑步骤
const editStep = (index) => {
  editingIndex.value = index
  editingStep.value = JSON.parse(JSON.stringify(form.value.steps[index]))
  if (!editingStep.value.params) editingStep.value.params = {}
  showStepEdit.value = true
}

// 保存步骤编辑
const saveStepEdit = () => {
  if (editingIndex.value >= 0 && editingStep.value) {
    form.value.steps[editingIndex.value] = editingStep.value
  }
  showStepEdit.value = false
  editingStep.value = null
  editingIndex.value = -1
}

// 保存工作流
const handleSave = () => {
  if (!canSave.value) return
  const workflow = {
    id: props.workflow?.id || null,
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    steps: JSON.parse(JSON.stringify(form.value.steps))
  }
  emit('save', workflow)
}

// 仅执行
const handleExecute = () => {
  if (!canExecute.value) return
  const workflow = {
    id: 'temp_' + Date.now(),
    name: form.value.name.trim() || '临时工作流',
    steps: JSON.parse(JSON.stringify(form.value.steps))
  }
  emit('execute', workflow)
}

// 初始化
onMounted(() => {
  registerAllActions()
  const actions = actionRegistry.list()
  aiActions.value = actions.filter(a => a.category === 'ai')
  documentActions.value = actions.filter(a => a.category !== 'ai')
})
</script>
