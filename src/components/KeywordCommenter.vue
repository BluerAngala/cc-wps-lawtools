<template>
  <div class="relative">
    <!-- 执行中遮罩 -->
    <div v-if="processing" class="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded">
      <n-spin size="large" />
      <div class="mt-3 text-sm font-medium text-gray-600">正在处理关键词...</div>
      <n-progress class="w-48 mt-2" type="line" status="info" :percentage="100" :show-indicator="false" :processing="true" />
    </div>

    <n-space vertical :size="8">
      <!-- 功能说明 -->
      <div class="text-xs text-blue-500">匹配关键词并添加固定的批注或修订内容</div>

      <!-- 方案选择器 -->
      <SchemeSelector
        :schemes="schemes"
        :active-scheme-id="activeSchemeId"
        type="keyword"
        @update:active-scheme-id="handleSchemeChange"
        @scheme-change="handleSchemeChange"
        @scheme-create="handleSchemeCreate"
        @scheme-update="handleSchemeUpdate"
        @scheme-delete="handleSchemeDelete"
      />

      <!-- 配置表单 -->
      <ConfigForm
        :config="configForm"
        mode="keyword"
        @update-config="handleConfigUpdate"
      />
    </n-space>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { NSpace, NSpin, NProgress } from 'naive-ui'
import SchemeSelector from './SchemeSelector.vue'
import ConfigForm from './ConfigForm.vue'
import { appConfig } from '../utils/appConfig.js'

const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  },
  keywordConfig: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['execute', 'update-config'])

// 方案管理
const schemes = ref([])
const activeSchemeId = ref(null)

// 配置表单
const configForm = reactive({
  keywordList: { type: 'keywordList', value: [] }
})

// 加载方案
const loadSchemes = () => {
  const data = appConfig.getSchemes('keyword')
  schemes.value = data.schemes
  activeSchemeId.value = data.activeSchemeId

  // 加载当前方案的规则
  const activeScheme = data.schemes.find(s => s.id === data.activeSchemeId)
  if (activeScheme) {
    configForm.keywordList.value = activeScheme.rules || []
  }
}

// 方案切换
const handleSchemeChange = (schemeId) => {
  activeSchemeId.value = schemeId
  appConfig.setActiveScheme('keyword', schemeId)

  const scheme = schemes.value.find(s => s.id === schemeId)
  if (scheme) {
    configForm.keywordList.value = scheme.rules || []
    emit('update-config', { keywordList: scheme.rules || [] })
  }
}

// 创建方案
const handleSchemeCreate = (newScheme) => {
  appConfig.createScheme('keyword', newScheme)
  loadSchemes()
  window.$message?.success(`方案"${newScheme.name}"创建成功`)
}

// 更新方案
const handleSchemeUpdate = (schemeId, updates) => {
  appConfig.updateScheme('keyword', schemeId, updates)
  loadSchemes()
  window.$message?.success('方案更新成功')
}

// 删除方案
const handleSchemeDelete = (schemeId) => {
  const success = appConfig.deleteScheme('keyword', schemeId)
  if (success) {
    loadSchemes()
    window.$message?.success('方案删除成功')
  } else {
    window.$message?.error('删除失败，至少需要保留一个方案')
  }
}

// 配置更新
const handleConfigUpdate = (data) => {
  configForm.keywordList.value = data.keywordList.value
  // 自动保存到当前方案
  appConfig.updateScheme('keyword', activeSchemeId.value, { rules: data.keywordList.value })
  emit('update-config', { keywordList: data.keywordList.value })
}

// 执行关键词批注
const triggerExecute = () => {
  emit('execute', {
    mode: 'keyword',
    keywordList: configForm.keywordList.value
  })
}

// 监听 props 变化
watch(
  () => props.keywordConfig,
  (newConfig) => {
    if (newConfig?.keywordList) {
      configForm.keywordList.value = newConfig.keywordList
    }
  },
  { deep: true }
)

onMounted(() => {
  loadSchemes()
})

const buttonText = '开始处理'
const isProcessing = props.processing

defineExpose({
  triggerExecute,
  buttonText,
  isProcessing
})
</script>
