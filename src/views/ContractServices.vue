<template>
  <PageLayout>
    <!-- 页面说明 -->
    <n-alert type="info" :closable="false" show-icon class="mb-4">
      <div class="text-sm leading-relaxed">
        <p class="mb-2">本页面提供以下功能：</p>
        <p>• <strong>AI提取合同信息</strong>：智能识别合同名称、甲乙方、金额等关键要素</p>
        <p>• <strong>关键词修订批注</strong>：匹配关键词并添加固定的批注或修订</p>
        <p>• <strong>AI全流程审查</strong>：AI 自动生成审查清单并执行审查，生成修改建议</p>
        <p>• <strong>AI+律师共同审查</strong>：AI 清单 + 律师规则，AI 建议 + 律师意见</p>
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

      <!-- 关键词修订批注 -->
      <n-collapse-item name="keyword">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>🔍</span>
              <span>关键词修订批注</span>
              <n-tag v-if="keywordProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="keywordProcessing"
              :disabled="keywordProcessing"
              @click.stop="triggerKeywordProcess"
            >
              {{ keywordProcessing ? '处理中...' : '开始处理' }}
            </n-button>
          </div>
        </template>
        <KeywordCommenter
          ref="keywordCommenterRef"
          :processing="keywordProcessing"
          :keyword-config="configs.keyword"
          @execute="executeKeywordComment"
          @update-config="updateKeywordConfig"
        />
      </n-collapse-item>

      <!-- AI全流程审查 -->
      <n-collapse-item name="aiFullReview">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>⚖️</span>
              <span>AI全流程审查</span>
              <n-tag v-if="aiFullReviewProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="aiFullReviewProcessing"
              :disabled="aiFullReviewProcessing"
              @click.stop="triggerAIFullReview"
            >
              {{ getAIFullReviewButtonText }}
            </n-button>
          </div>
        </template>
        <AIFullReview
          ref="aiFullReviewRef"
          :processing="aiFullReviewProcessing"
          @state-change="handleAIFullReviewStateChange"
        />
      </n-collapse-item>

      <!-- AI+律师共同审查 -->
      <n-collapse-item name="aiLawyerReview">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>👨‍⚖️</span>
              <span>AI+律师共同审查</span>
              <n-tag v-if="aiLawyerReviewProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="aiLawyerReviewProcessing"
              :disabled="aiLawyerReviewProcessing"
              @click.stop="triggerAILawyerReview"
            >
              {{ getAILawyerReviewButtonText }}
            </n-button>
          </div>
        </template>
        <AILawyerReview
          ref="aiLawyerReviewRef"
          :processing="aiLawyerReviewProcessing"
          :review-config="configs.review"
          @state-change="handleAILawyerReviewStateChange"
          @update-config="updateReviewConfig"
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
import KeywordCommenter from '../components/KeywordCommenter.vue'
import AIFullReview from '../components/AIFullReview.vue'
import AILawyerReview from '../components/AILawyerReview.vue'
import { contractService } from '../services/contract/contractService.js'
import { appConfig } from '../utils/appConfig.js'
import { wpsFileService } from '../services/wps'

// 响应式数据
const extractedData = ref(null)
const submitting = ref(false)
const batchProcessing = ref(false)
const batchResult = ref(null)
const showBatchResultModal = ref(false)
const configs = ref({
  extractor: {},
  keyword: {},
  review: {}
})
const batchOptions = ref({
  addContractNumber: false,
  contractNumber: '',
  rename: true,
  exportPdf: false,
  deleteOriginal: true
})

// 组件引用
const keywordCommenterRef = ref(null)
const aiFullReviewRef = ref(null)
const aiLawyerReviewRef = ref(null)

// 各模块处理状态
const keywordProcessing = computed(() => contractService.isTaskProcessing('keywordComment'))
const aiFullReviewProcessing = computed(() => aiFullReviewRef.value?.isProcessing?.value ?? false)
const aiLawyerReviewProcessing = computed(() => aiLawyerReviewRef.value?.isProcessing?.value ?? false)

// AI 审查按钮文本
const aiFullReviewState = ref('idle')
const aiLawyerReviewState = ref('idle')

const getAIFullReviewButtonText = computed(() => {
  const state = aiFullReviewState.value
  if (state === 'generating') return '生成中...'
  if (state === 'reviewing') return '审查中...'
  if (state === 'ready') return '开始审查'
  if (state === 'complete') return '重新审查'
  return '开始任务'
})

const getAILawyerReviewButtonText = computed(() => {
  const state = aiLawyerReviewState.value
  if (state === 'generating') return '生成中...'
  if (state === 'reviewing') return '审查中...'
  if (state === 'ready') return '开始审查'
  if (state === 'complete') return '重新审查'
  return '开始任务'
})

const batchActionEnabled = computed(() => 
  batchOptions.value.addContractNumber || 
  batchOptions.value.rename || 
  batchOptions.value.exportPdf
)

// 触发各模块执行
const triggerKeywordProcess = () => {
  keywordCommenterRef.value?.triggerExecute()
}

const triggerAIFullReview = () => {
  aiFullReviewRef.value?.triggerExecute()
}

const triggerAILawyerReview = () => {
  aiLawyerReviewRef.value?.triggerExecute()
}

// 状态变化处理
const handleAIFullReviewStateChange = (state) => {
  aiFullReviewState.value = state
}

const handleAILawyerReviewStateChange = (state) => {
  aiLawyerReviewState.value = state
}

// 配置更新
const updateConfig = (type, config) => {
  configs.value[type] = config
  saveConfigToAppConfig(false)
}

const saveConfigToAppConfig = (showMessage = true) => {
  const allConfig = appConfig.getConfig()
  if (configs.value.extractor) allConfig.extractor = configs.value.extractor
  if (configs.value.keyword) allConfig.keyword = configs.value.keyword
  if (configs.value.review) allConfig.review = configs.value.review
  
  const success = appConfig.saveConfig(allConfig)
  if (showMessage) {
    window.$message?.[success ? 'success' : 'error'](success ? '配置已保存' : '保存配置失败')
  }
  return success
}

// 组件事件处理
const executeExtraction = (config = {}) => {
  contractService.executeTask('extractText', config, async (result) => {
    const processedData = await contractService.processExtractedData(result)
    if (processedData) extractedData.value = processedData
  })
}

const executeKeywordComment = (config) => {
  contractService.executeTask('keywordComment', config)
}

const updateExtractorConfig = (configForm) => {
  if (configForm?.extractTags) {
    updateConfig('extractor', { extractTags: configForm.extractTags.value })
  }
}

const updateKeywordConfig = (configForm) => {
  if (configForm?.keywordList) {
    updateConfig('keyword', { keywordList: configForm.keywordList })
  }
}

const updateReviewConfig = (configForm) => {
  if (configForm?.reviewKeywordList && Array.isArray(configForm.reviewKeywordList)) {
    const contractReviewRules = configForm.reviewKeywordList.map(item => ({
      reviewRules: item.keyword || '',
      reviewRequirements: item.comment || '',
      actionType: item.actionType || 'comment'
    }))
    updateConfig('review', { contractReviewRules })
  }
}

// 一键处理工作流
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
  const steps = []

  try {
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
      if (result.success && deleteOriginal && result.deleteResult) {
        steps.push({
          name: '删除原文件',
          success: result.deleteResult.success,
          message: result.deleteResult.success ? '原文件已删除' : 
            (result.deleteResult.unsupported ? '当前环境不支持自动删除' : '删除失败')
        })
      }
    }

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

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    window.$message?.success('路径已复制到剪贴板')
  } catch {
    window.$message?.error('复制失败')
  }
}

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

onMounted(() => {
  loadConfig()
})

onUnmounted(() => {
  contractService.cleanup()
})
</script>
