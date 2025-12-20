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
    <n-collapse :default-expanded-names="[]" accordion class="mt-4">
      <!-- AI合同信息提取 -->
      <n-collapse-item name="extractor">
        <template #header>
          <CollapseHeader
            title="AI提取合同信息"
            icon="🤖"
            :processing="extracting"
            :button-text="extracting ? '提取中...' : '开始提取'"
            @execute="executeExtraction"
          />
        </template>
        <ContractExtractor
          :processing="extracting"
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
          <CollapseHeader
            title="关键词修订批注"
            icon="🔍"
            :processing="keywordProcessing"
            :button-text="keywordProcessing ? '处理中...' : '开始处理'"
            @execute="keywordCommenterRef?.triggerExecute()"
          />
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
          <CollapseHeader
            title="AI全流程审查"
            icon="⚖️"
            :processing="aiFullReviewRef?.isProcessing?.value"
            :button-text="aiFullReviewRef?.buttonText?.value || '开始任务'"
            @execute="aiFullReviewRef?.triggerExecute()"
          />
        </template>
        <AIFullReview ref="aiFullReviewRef" />
      </n-collapse-item>

      <!-- AI+律师共同审查 -->
      <n-collapse-item name="aiLawyerReview">
        <template #header>
          <CollapseHeader
            title="AI+律师共同审查"
            icon="👨‍⚖️"
            :processing="aiLawyerReviewRef?.isProcessing?.value"
            :button-text="aiLawyerReviewRef?.buttonText?.value || '开始任务'"
            @execute="aiLawyerReviewRef?.triggerExecute()"
          />
        </template>
        <AILawyerReview ref="aiLawyerReviewRef" />
      </n-collapse-item>

      <!-- 执行工作流 -->
      <n-collapse-item name="batch">
        <template #header>
          <CollapseHeader
            title="执行工作流"
            icon="📄"
            :processing="batchWorkflowRef?.isProcessing"
            :button-text="batchWorkflowRef?.buttonText || '开始处理'"
            :disabled="!batchWorkflowRef?.canExecute"
            @execute="batchWorkflowRef?.triggerExecute()"
          />
        </template>
        <BatchWorkflow ref="batchWorkflowRef" />
      </n-collapse-item>
    </n-collapse>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NCollapse, NCollapseItem, NAlert } from '../components/naive-components.js'
import { PageLayout } from '../components/common'
import CollapseHeader from '../components/CollapseHeader.vue'
import ContractExtractor from '../components/ContractExtractor.vue'
import KeywordCommenter from '../components/KeywordCommenter.vue'
import AIFullReview from '../components/AIFullReview.vue'
import AILawyerReview from '../components/AILawyerReview.vue'
import BatchWorkflow from '../components/BatchWorkflow.vue'
import { contractService } from '../services/contract/contractService.js'

// 响应式数据
const extractedData = ref(null)
const submitting = ref(false)
const configs = ref({ extractor: {}, keyword: {} })
const extracting = ref(false)

// 组件引用
const keywordCommenterRef = ref(null)
const aiFullReviewRef = ref(null)
const aiLawyerReviewRef = ref(null)
const batchWorkflowRef = ref(null)

// 关键词处理状态
const keywordProcessing = computed(() => contractService.isTaskProcessing('keywordComment'))

// 提取合同信息
const executeExtraction = async () => {
  if (extracting.value) {
    window.$message?.warning('正在提取中，请稍候...')
    return
  }
  extracting.value = true
  try {
    await contractService.executeTask('extractText', configs.value.extractor, async (result) => {
      const processedData = await contractService.processExtractedData(result)
      if (processedData) extractedData.value = processedData
    })
  } finally {
    extracting.value = false
  }
}

// 关键词批注
const executeKeywordComment = (config) => {
  contractService.executeTask('keywordComment', config)
}

// 配置更新
const updateExtractorConfig = (configForm) => {
  if (configForm?.extractTags) {
    configs.value.extractor = { extractTags: configForm.extractTags.value }
  }
}

const updateKeywordConfig = (configForm) => {
  if (configForm?.keywordList) {
    configs.value.keyword = { keywordList: configForm.keywordList }
  }
}

// 提交提取数据
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
    window.$message?.error(error.message || '提交数据失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  configs.value = contractService.loadConfig()
})

onUnmounted(() => {
  contractService.cleanup()
})
</script>
