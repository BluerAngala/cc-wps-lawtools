<template>
  <div class="scheme-selector">
    <div class="scheme-controls">
      <n-select
        v-model:value="currentSchemeId"
        :options="schemeOptions"
        placeholder="选择方案"
        size="small"
        class="scheme-select"
        @update:value="handleSchemeChange"
      >
        <template #empty>
          <n-empty description="暂无方案" size="small" />
        </template>
      </n-select>

      <div class="scheme-buttons">
        <n-button size="small" @click="handleNewScheme" class="btn-action">
          <template #icon><AddIcon /></template>
          新建
        </n-button>
        <n-button size="small" @click="handleEditScheme" :disabled="!currentSchemeId" class="btn-action">
          <template #icon><EditIcon /></template>
          编辑
        </n-button>
        <n-button size="small" @click="handleCopyScheme" :disabled="!currentSchemeId" class="btn-action">
          <template #icon><CopyIcon /></template>
          复制
        </n-button>
        <n-button size="small" @click="handleDeleteScheme" :disabled="!currentSchemeId || schemes.length <= 1" class="btn-action">
          <template #icon><DeleteIcon /></template>
          删除
        </n-button>
      </div>
    </div>

    <!-- 新建/编辑方案对话框 -->
    <n-modal
      v-model:show="showSchemeDialog"
      preset="dialog"
      :title="dialogMode === 'new' ? '新建方案' : dialogMode === 'edit' ? '编辑方案' : '复制方案'"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleDialogConfirm"
    >
      <n-form ref="formRef" :model="schemeForm" :rules="schemeRules" label-placement="top">
        <n-form-item label="方案名称" path="name">
          <n-input
            v-model:value="schemeForm.name"
            placeholder="请输入方案名称，如：采购合同方案"
            maxlength="50"
            show-count
          />
        </n-form-item>
        <n-form-item v-if="dialogMode === 'new'" label="初始化方式" path="initType">
          <n-radio-group v-model:value="schemeForm.initType">
            <n-space vertical>
              <n-radio value="empty">创建空方案</n-radio>
              <n-radio value="copy" :disabled="!currentSchemeId">基于当前方案复制</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  NSelect,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NRadioGroup,
  NRadio,
  NEmpty
} from 'naive-ui'
import {
  Add as AddIcon,
  CreateOutline as EditIcon,
  CopyOutline as CopyIcon,
  TrashOutline as DeleteIcon
} from '@vicons/ionicons5'

const props = defineProps({
  schemes: {
    type: Array,
    required: true
  },
  activeSchemeId: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'keyword' // 'keyword' | 'review'
  }
})

const emit = defineEmits(['update:activeSchemeId', 'scheme-change', 'scheme-create', 'scheme-update', 'scheme-delete'])

// 当前选中的方案ID
const currentSchemeId = ref(props.activeSchemeId)

// 方案选项
const schemeOptions = computed(() => {
  return props.schemes.map(scheme => ({
    label: `${scheme.name} (${scheme.rules?.length || 0}条)`,
    value: scheme.id
  }))
})

// 对话框相关
const showSchemeDialog = ref(false)
const dialogMode = ref('new') // 'new' | 'edit' | 'copy'
const formRef = ref(null)
const schemeForm = ref({
  name: '',
  initType: 'empty' // 'empty' | 'copy'
})

const schemeRules = {
  name: [
    { required: true, message: '请输入方案名称', trigger: 'blur' },
    { min: 2, max: 50, message: '方案名称长度为2-50个字符', trigger: 'blur' }
  ]
}

// 方案切换
const handleSchemeChange = (schemeId) => {
  emit('update:activeSchemeId', schemeId)
  emit('scheme-change', schemeId)
}

// 新建方案
const handleNewScheme = () => {
  dialogMode.value = 'new'
  schemeForm.value = {
    name: '',
    initType: 'empty'
  }
  showSchemeDialog.value = true
}

// 编辑方案
const handleEditScheme = () => {
  const currentScheme = props.schemes.find(s => s.id === currentSchemeId.value)
  if (!currentScheme) return

  dialogMode.value = 'edit'
  schemeForm.value = {
    name: currentScheme.name
  }
  showSchemeDialog.value = true
}

// 复制方案
const handleCopyScheme = () => {
  const currentScheme = props.schemes.find(s => s.id === currentSchemeId.value)
  if (!currentScheme) return

  dialogMode.value = 'copy'
  schemeForm.value = {
    name: `${currentScheme.name} - 副本`
  }
  showSchemeDialog.value = true
}

// 删除方案
const handleDeleteScheme = async () => {
  if (props.schemes.length <= 1) {
    window.$message?.warning('至少需要保留一个方案')
    return
  }

  try {
    await window.$messageBox.confirm(
      '确定要删除当前方案吗？此操作不可恢复。',
      '删除方案',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('scheme-delete', currentSchemeId.value)
  } catch {
    // 用户取消
  }
}

// 对话框确认
const handleDialogConfirm = async () => {
  try {
    await formRef.value?.validate()

    if (dialogMode.value === 'new') {
      // 新建方案
      const newScheme = {
        id: `scheme_${Date.now()}`,
        name: schemeForm.value.name,
        type: props.type,
        rules: schemeForm.value.initType === 'copy' && currentSchemeId.value
          ? JSON.parse(JSON.stringify(props.schemes.find(s => s.id === currentSchemeId.value)?.rules || []))
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      emit('scheme-create', newScheme)
    } else if (dialogMode.value === 'edit') {
      // 编辑方案
      emit('scheme-update', currentSchemeId.value, { name: schemeForm.value.name })
    } else if (dialogMode.value === 'copy') {
      // 复制方案
      const currentScheme = props.schemes.find(s => s.id === currentSchemeId.value)
      const newScheme = {
        id: `scheme_${Date.now()}`,
        name: schemeForm.value.name,
        type: props.type,
        rules: JSON.parse(JSON.stringify(currentScheme?.rules || [])),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      emit('scheme-create', newScheme)
    }

    showSchemeDialog.value = false
    return true
  } catch (error) {
    console.error('表单验证失败:', error)
    return false
  }
}

// 监听 props 变化
watch(() => props.activeSchemeId, (newId) => {
  currentSchemeId.value = newId
})
</script>

<style scoped>
.scheme-selector {
  width: 100%;
}

.mb-3 {
  margin-bottom: 12px;
}

.scheme-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scheme-select {
  width: 100%;
}

.scheme-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 70px;
}

/* 响应式调整 */
@media (max-width: 400px) {
  .scheme-buttons {
    flex-direction: column;
  }
  
  .btn-action {
    width: 100%;
  }
}
</style>
