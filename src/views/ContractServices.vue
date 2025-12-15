<template>
  <PageLayout>
    <!-- 页面说明 -->
    <n-alert type="info" :closable="false" show-icon class="mb-4">
      <div class="text-sm leading-relaxed">
        <p class="mb-2">本页面提供以下功能：</p>
        <p>• <strong>AI提取合同信息</strong>：智能识别合同名称、甲乙方、金额等关键要素</p>
        <p>• <strong>智能文档处理</strong>：支持关键词批注、AI合同审查等多种模式</p>
        <p>• <strong>执行工作流</strong>：一键完成添加编号、重命名、导出PDF等操作</p>
      </div>
    </n-alert>

    <!-- 折叠面板（手风琴模式） -->
    <n-collapse :default-expanded-names="['extractor']" accordion class="mt-4">
      <!-- AI合同信息提取 -->
      <n-collapse-item name="extractor">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>🤖</span>
              <span>AI提取合同信息</span>
              <n-tag v-if="contractService.isTaskProcessing('extractText')" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="contractService.isTaskProcessing('extractText')"
              :disabled="contractService.isTaskProcessing('extractText')"
              @click.stop="executeExtraction(configs.extractor)"
            >
              {{ contractService.isTaskProcessing('extractText') ? '提取中...' : '开始提取' }}
            </n-button>
          </div>
        </template>
        <ContractExtractor
          :processing="contractService.isTaskProcessing('extractText')"
          :extracted-data="extractedData"
          :submitting="submitting"
          :extractor-config="configs.extractor"
          @submit-data="submitExtractedData"
          @update:extracted-data="extractedData = $event"
          @update-config="updateExtractorConfig"
        />
      </n-collapse-item>

      <!-- 智能文档处理 -->
      <n-collapse-item name="smart">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>⚡</span>
              <span>智能文档处理</span>
              <n-tag v-if="smartProcessing || smartAIProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="smartProcessing || smartAIProcessing"
              :disabled="smartProcessing || smartAIProcessing"
              @click.stop="triggerSmartProcess"
            >
              {{ smartProcessing || smartAIProcessing ? '处理中...' : '开始处理' }}
            </n-button>
          </div>
        </template>
        <SmartCommenter
          ref="smartCommenterRef"
          :processing="contractService.isTaskProcessing('keywordComment') || contractService.isTaskProcessing('contractReview') || contractService.isTaskProcessing('contractReviewNew')"
          :keyword-config="configs.keyword"
          :review-config="configs.review"
          :mode-descriptions="smartModeDescriptions"
          @execute="executeSmartComment"
          @update-config="updateSmartConfig"
        />
      </n-collapse-item>

      <!-- 执行工作流 -->
      <n-collapse-item name="batch">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>📄</span>
              <span>执行工作流</span>
              <n-tag v-if="batchProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="batchProcessing"
              :disabled="batchProcessing || !batchActionEnabled"
              @click.stop="handleBatchProcess"
            >
              {{ batchProcessing ? '处理中...' : '开始处理' }}
            </n-button>
          </div>
        </template>
        <div class="p-4">
          <n-alert type="info" :closable="false" show-icon class="mb-4">
            <template #header>工作流说明</template>
            <template #default>勾选需要执行的操作，系统会自动完成。</template>
          </n-alert>

          <n-form label-placement="left" label-width="auto" size="small" class="mb-4">
            <n-form-item label="添加合同编号">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.addContractNumber" size="small" />
                <span class="text-sm text-gray-600">添加合同编号到页眉</span>
              </n-space>
            </n-form-item>
            <n-form-item label="合同编号" v-if="batchOptions.addContractNumber">
              <n-input
                v-model:value="batchOptions.contractNumber"
                placeholder="请输入合同编号"
                size="small"
                clearable
              />
            </n-form-item>
            <n-form-item label="文档重命名">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.rename" size="small" />
                <span class="text-sm text-gray-600">为文档添加「已修订」前缀</span>
              </n-space>
            </n-form-item>
            <n-form-item label="导出PDF">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.exportPdf" size="small" />
                <span class="text-sm text-gray-600">生成包含批注的PDF文件</span>
              </n-space>
            </n-form-item>
            <n-form-item label="删除原文件" v-if="batchOptions.rename">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.deleteOriginal" size="small" />
                <span class="text-sm text-gray-600">重命名后删除原始文件</span>
              </n-space>
            </n-form-item>
          </n-form>

        </div>
      </n-collapse-item>
    </n-collapse>

    <!-- 工作流结果弹窗 -->
    <n-modal
      v-model:show="showBatchResultModal"
      preset="card"
      :title="batchResult?.success ? '工作流执行完成' : '工作流执行结果'"
      style="width: 80%; max-width: 500px; max-height: 80vh;"
      :bordered="false"
    >
      <div class="space-y-3">
        <div class="text-sm text-gray-600 mb-3">{{ batchResult?.summary }}</div>
        <div v-for="(step, index) in batchResult?.steps" :key="index" class="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
          <span :class="step.success ? 'text-green-500' : 'text-red-500'">{{ step.success ? '✓' : '✗' }}</span>
          <div class="flex-1">
            <div class="font-medium text-sm">{{ step.name }}</div>
            <div class="text-xs text-gray-500">{{ step.message }}</div>
            <div 
              v-if="step.path" 
              class="text-xs text-blue-500 mt-1 cursor-pointer hover:underline break-all"
              @dblclick="copyToClipboard(step.path)"
              title="双击复制路径"
            >
              📁 {{ step.path }}
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <n-button type="primary" size="small" @click="showBatchResultModal = false">确定</n-button>
        </div>
      </div>
    </n-modal>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NCollapse, NCollapseItem, NTag, NAlert, NForm, NFormItem, NSwitch, NSpace, NInput, NModal } from '../components/naive-components.js'
import { PageLayout } from '../components/common'

import ContractExtractor from '../components/ContractExtractor.vue'
import SmartCommenter from '../components/SmartCommenter.vue'
import { contractService } from '../services/contract/contractService.js'
import { appConfig } from '../utils/appConfig.js'
import { wpsFileService } from '../services/wps'



// 响应式数据
const extractedData = ref(null) // 存储提取的合同信息
const submitting = ref(false) // 提交状态
const batchProcessing = ref(false) // 一键处理状态
const batchResult = ref(null) // 一键处理结果
const showBatchResultModal = ref(false) // 工作流结果弹窗
const configs = ref({
  extractor: {},
  keyword: {},
  review: {},
  smart: {}
})
const batchOptions = ref({
  addContractNumber: false,
  contractNumber: '',
  rename: true,
  exportPdf: false,
  deleteOriginal: true
})
const smartCommenterRef = ref(null)
const smartProcessing = computed(
  () =>
    contractService.isTaskProcessing('keywordComment') ||
    contractService.isTaskProcessing('contractReview') ||
    contractService.isTaskProcessing('contractReviewNew')
)
const smartAIProcessing = computed(() => smartCommenterRef.value?.isAIProcessing?.value ?? false)
const batchActionEnabled = computed(() => 
  batchOptions.value.addContractNumber || 
  batchOptions.value.rename || 
  batchOptions.value.exportPdf
)

// 智能文档处理模式描述配置
const smartModeDescriptions = {
  keyword: '匹配关键词并添加固定的批注修订',
  aiReview: 'AI根据合同类型的通用审查清单自动完成审查，添加批注',
  aiLawyer: '在AI预审模式基础上，加上自定义的审查规则，完成审查并且添加批注'
}

const triggerSmartProcess = () => {
  if (smartCommenterRef.value?.triggerExecute) {
    smartCommenterRef.value.triggerExecute()
  }
}

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
const executeExtraction = (config = {}) => {
  contractService.executeTask('extractText', config, async (result) => {
    const processedData = await contractService.processExtractedData(result)
    if (processedData) {
      extractedData.value = processedData
    }
  })
}

const executeSmartComment = (config) => {
  if (config.mode === 'keyword') {
    // 关键词模式：直接执行关键词处理
    contractService.executeTask('keywordComment', config)
  }
  // AI审查模式（aiReview和aiLawyer）已在SmartCommenter组件内部处理，不需要在这里处理
}

const updateExtractorConfig = (configForm) => {
  // 保存提取配置
  if (configForm && configForm.extractTags) {
    updateConfig('extractor', { extractTags: configForm.extractTags.value })
  }
}

const updateSmartConfig = (configForm) => {
  // 保存关键词配置
  if (configForm && configForm.keywordList) {
    updateConfig('keyword', { keywordList: configForm.keywordList })
  }
  
  // 保存审查配置（转换为标准格式）
  if (configForm && configForm.reviewKeywordList && Array.isArray(configForm.reviewKeywordList)) {
    const contractReviewRules = configForm.reviewKeywordList.map(item => ({
      reviewRules: item.keyword || '',
      reviewRequirements: item.comment || '',
      actionType: item.actionType || 'comment'
    }))
    updateConfig('review', { contractReviewRules })
  }
}



// 一键处理：添加合同编号 + 重命名 + 导出PDF
const handleBatchProcess = async () => {
  if (batchProcessing.value) return

  const { addContractNumber, contractNumber, rename, exportPdf, deleteOriginal } = batchOptions.value

  if (!addContractNumber && !rename && !exportPdf) {
    window.$message?.warning('请至少选择一个操作')
    return
  }

  if (addContractNumber && !contractNumber?.trim()) {
    window.$message?.warning('请输入合同编号')
    return
  }

  batchProcessing.value = true
  batchResult.value = null
  const steps = [] // 记录每个步骤的执行结果

  try {
    // 1. 添加合同编号到页眉
    if (addContractNumber) {
      const result = await wpsFileService.addHeader({
        text: `文件编号：${contractNumber.trim()}`,
        fontSize: 12,
        alignment: '右对齐'
      })
      steps.push({
        name: '添加合同编号',
        success: result.success,
        message: result.success ? `编号"${contractNumber.trim()}"已添加到页眉` : result.message
      })
    }

    // 2. 文档重命名
    if (rename) {
      const result = await wpsFileService.renameDocument({
        prefix: '「已修订」',
        deleteOriginal: deleteOriginal
      })
      steps.push({
        name: '文档重命名',
        success: result.success,
        message: result.success ? `已重命名为"${result.newFileName}"` : result.message
      })
      // 删除原文件结果
      if (result.success && deleteOriginal && result.deleteResult) {
        steps.push({
          name: '删除原文件',
          success: result.deleteResult.success,
          message: result.deleteResult.success ? '原文件已删除' : 
            (result.deleteResult.unsupported ? '当前环境不支持自动删除' : '删除失败')
        })
      }
    }

    // 3. 导出PDF
    if (exportPdf) {
      const result = await wpsFileService.exportPDF()
      steps.push({
        name: '导出PDF',
        success: result.success,
        message: result.success ? `已导出: ${result.pdfFileName}` : result.message,
        path: result.success ? result.pdfFullPath : null
      })
    }

    const successCount = steps.filter(s => s.success).length
    const failCount = steps.filter(s => !s.success).length
    batchResult.value = { 
      success: failCount === 0, 
      steps,
      summary: `共执行 ${steps.length} 个操作，成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ''}`
    }
    showBatchResultModal.value = true
  } catch (error) {
    batchResult.value = { 
      success: false, 
      steps: [{ name: '执行工作流', success: false, message: error.message || '处理失败' }],
      summary: '工作流执行出错'
    }
    showBatchResultModal.value = true
  } finally {
    batchProcessing.value = false
  }
}

const loadConfig = () => {
  configs.value = contractService.loadConfig()
}

// 复制路径到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    window.$message?.success('路径已复制到剪贴板')
  } catch {
    window.$message?.error('复制失败')
  }
}

// 提交提取的数据（简化）
const submitExtractedData = async () => {
  if (!extractedData.value) {
    window.$message?.warning('没有可提交的数据')
    return
  }

  submitting.value = true
  try {
    const result = await contractService.submitExtractedData(extractedData.value)
    if (result?.success) {
      window.$message?.success(result.message || '数据提交成功！')
    }
  } catch (error) {
    console.error('提交数据失败:', error)
    window.$message?.error(error.message || '提交数据失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 组件挂载时的初始化
onMounted(() => {
  
  loadConfig()
})

// 组件卸载时清理资源
onUnmounted(() => {
  contractService.cleanup()
})
</script>
