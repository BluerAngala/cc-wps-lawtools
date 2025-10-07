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

      <!-- 关键词批注组件 -->
      <KeywordCommenter
        :processing="contractService.isTaskProcessing('keywordComment')"
        @execute="executeKeywordComment"
        @update-config="updateKeywordConfig"
      />

      <!-- AI合同预审组件 -->
      <ContractReviewer
        :processing="contractService.isTaskProcessing('contractReview')"
        @execute="executeContractReview"
        @update-config="updateReviewConfig"
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
import KeywordCommenter from '../components/KeywordCommenter.vue'
import ContractReviewer from '../components/ContractReviewer.vue'
import { contractService } from '../utils/contractService.js'

console.log('合同审查组件已加载')

// 响应式数据
const extractedData = ref(null) // 存储抽取的合同信息
const submitting = ref(false) // 提交状态
const configs = ref({
  extractor: {},
  keyword: {},
  review: {}
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

const executeKeywordComment = (config) => {
  contractService.executeTask('keywordComment', config)
}

const executeContractReview = (config) => {
  contractService.executeTask('contractReview', config)
}

const updateExtractorConfig = (config) => updateConfig('extractor', config)
const updateKeywordConfig = (config) => updateConfig('keyword', config)
const updateReviewConfig = (config) => updateConfig('review', config)

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
