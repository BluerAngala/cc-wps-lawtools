<template>
  <div class="p-2.5 h-screen overflow-y-auto scrollbar-none">
    <!-- 主控制面板 -->
    <div class="wps-card wps-section">
      <!-- 操作按钮 -->
      <div class="flex-center">
        <div class="flex gap-4">
          <n-button type="success" @click="saveConfig">
            <template #icon><DocumentIcon /></template>
            保存配置
          </n-button>
          <n-button type="warning" @click="resetConfig">
            <template #icon><RefreshIcon /></template>
            重置配置
          </n-button>
          <n-button type="error" @click="clearCache">
            <template #icon><DeleteIcon /></template>
            清除缓存
          </n-button>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <!-- AI合同信息抽取组件 -->
      <ContractExtractor
        :processing="contractService.isTaskProcessing('extractText')"
        :extracted-data="extractedData"
        :submitting="submitting"
        @execute="executeExtraction"
        @submit-data="submitExtractedData"
        @update:extracted-data="extractedData = $event"
        @update-config="updateExtractorConfig"
      />

      <!-- 智能文档处理组件 -->
      <SmartCommenter
        :processing="contractService.isTaskProcessing('keywordComment') || contractService.isTaskProcessing('contractReview')"
        @execute="executeSmartComment"
        @update-config="updateSmartConfig"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { NButton } from 'naive-ui'
import {
  DocumentOutline as DocumentIcon,
  Refresh as RefreshIcon,
  TrashOutline as DeleteIcon
} from '@vicons/ionicons5'
import ContractExtractor from '../components/ContractExtractor.vue'
import SmartCommenter from '../components/SmartCommenter.vue'
import { contractService } from '../services/contract/contractService.js'

console.log('合同审查组件已加载')

// 响应式数据
const extractedData = ref(null) // 存储抽取的合同信息
const submitting = ref(false) // 提交状态
const configs = ref({
  extractor: {},
  smart: {}
})

// 统一的配置更新方法
const updateConfig = (type, config) => {
  configs.value[type] = config
  contractService.saveConfig(configs.value)
}

// 组件事件处理方法（极简版）
const executeExtraction = (config) => {
  contractService.executeTask('extractText', config, (result) => {
    const processedData = contractService.processExtractedData(result)
    if (processedData) {
      extractedData.value = processedData
    }
  })
}

const executeSmartComment = (config) => {
  if (config.mode === 'keyword') {
    // 关键词模式：直接执行关键词处理
    contractService.executeTask('keywordComment', config)
  } else if (config.mode === 'review') {
    // AI预审模式：开发中
    window.$message?.warning('AI预审模式开发中，敬请期待！')
  }
}

const updateExtractorConfig = (config) => updateConfig('extractor', config)
const updateSmartConfig = (config) => updateConfig('smart', config)

// 配置管理方法（简化）
const saveConfig = () => contractService.saveConfig(configs.value)
const resetConfig = () => {
  configs.value = contractService.resetConfig()
}
const clearCache = () => contractService.clearCache()

const loadConfig = () => {
  configs.value = contractService.loadConfig()
}

// 提交抽取的数据（简化）
const submitExtractedData = async () => {
  if (!extractedData.value) return

  submitting.value = true
  try {
    await contractService.submitExtractedData(extractedData.value)
  } finally {
    submitting.value = false
  }
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('合同审查组件已挂载')
  loadConfig()
})

// 组件卸载时清理资源
onUnmounted(() => {
  contractService.cleanup()
})
</script>
