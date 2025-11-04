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
        :extractor-config="configs.extractor"
        @execute="executeExtraction"
        @submit-data="submitExtractedData"
        @update:extracted-data="extractedData = $event"
        @update-config="updateExtractorConfig"
      />

      <!-- 智能文档处理组件 -->
      <SmartCommenter
        :processing="contractService.isTaskProcessing('keywordComment') || contractService.isTaskProcessing('contractReview')"
        :keyword-config="configs.keyword"
        :review-config="configs.review"
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
import { appConfig } from '../utils/appConfig.js'

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
  // 静默保存（不显示提示）
  saveConfigToAppConfig(false)
}

// 保存配置到 appConfig
const saveConfigToAppConfig = (showMessage = true) => {
  const allConfig = appConfig.getConfig()
  
  // 更新对应的配置项
  if (configs.value.extractor) {
    allConfig.extractor = configs.value.extractor
  }
  if (configs.value.keyword) {
    allConfig.keyword = configs.value.keyword
  }
  if (configs.value.review) {
    allConfig.review = configs.value.review
  }
  
  const success = appConfig.saveConfig(allConfig)
  
  // 只在需要时显示消息
  if (showMessage) {
    if (success) {
      window.$message?.success('配置已保存')
    } else {
      window.$message?.error('保存配置失败')
    }
  }
  
  return success
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

const updateExtractorConfig = (configForm) => {
  // 保存提取配置
  if (configForm.extractTags) {
    updateConfig('extractor', { extractTags: configForm.extractTags.value })
  }
}

const updateSmartConfig = (configForm) => {
  // 保存关键词配置
  if (configForm.keywordList) {
    updateConfig('keyword', { keywordList: configForm.keywordList })
  }
  
  // 保存审查配置（转换为标准格式）
  if (configForm.reviewKeywordList) {
    const contractReviewRules = configForm.reviewKeywordList.map(item => ({
      reviewRules: item.keyword,
      reviewRequirements: item.comment,
      actionType: item.actionType
    }))
    updateConfig('review', { contractReviewRules })
  }
}

// 配置管理方法（简化）
const saveConfig = () => {
  // 显式保存，显示提示消息
  saveConfigToAppConfig(true)
}

const resetConfig = () => {
  appConfig.reset()
  // 重新加载配置
  loadConfig()
  window.$message?.success('配置已重置为默认值')
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
