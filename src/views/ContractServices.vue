<template>
  <PageLayout>
    <div class="p-4">
      <!-- 页面说明 -->
      <n-alert type="info" :closable="false" show-icon class="mb-4">
        <div class="text-sm leading-relaxed">
          选择下方功能卡片开始使用，点击卡片打开对应功能面板。
        </div>
      </n-alert>

      <!-- 功能卡片网格 -->
      <div class="grid grid-cols-2 gap-3">
      <div
        v-for="item in featureCards"
        :key="item.key"
        class="feature-card"
        :class="{ 'is-processing': item.processing }"
        @click="openModal(item.key)"
      >
        <div class="card-icon">{{ item.icon }}</div>
        <div class="card-title">{{ item.title }}</div>
        <div class="card-desc">{{ item.desc }}</div>
        <n-spin v-if="item.processing" size="small" class="card-spin" />
      </div>
    </div>

    <!-- AI提取合同信息弹窗 -->
    <n-modal v-model:show="modals.extractor" preset="card" title="🤖 AI提取合同信息" class="feature-modal" :mask-closable="false">
      <ContractExtractor
        :processing="extracting"
        :extracted-data="extractedData"
        :submitting="submitting"
        :extractor-config="configs.extractor"
        @submit-data="submitExtractedData"
        @update:extracted-data="extractedData = $event"
        @update-config="updateExtractorConfig"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="modals.extractor = false">关闭</n-button>
          <n-button type="primary" :loading="extracting" @click="executeExtraction">
            {{ extracting ? '提取中...' : '开始提取' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 关键词修订批注弹窗 -->
    <n-modal v-model:show="modals.keyword" preset="card" title="🔍 关键词修订批注" class="feature-modal" :mask-closable="false">
      <KeywordCommenter
        ref="keywordCommenterRef"
        :processing="keywordProcessing"
        :keyword-config="configs.keyword"
        @execute="executeKeywordComment"
        @update-config="updateKeywordConfig"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="modals.keyword = false">关闭</n-button>
          <n-button type="primary" :loading="keywordProcessing" @click="keywordCommenterRef?.triggerExecute()">
            {{ keywordProcessing ? '处理中...' : '开始处理' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- AI全流程审查弹窗 -->
    <n-modal v-model:show="modals.aiFullReview" preset="card" title="⚖️ AI全流程审查" class="feature-modal" :mask-closable="false">
      <AIFullReview ref="aiFullReviewRef" @state-change="handleAIFullReviewStateChange" />
      <template #footer>
        <n-space justify="end">
          <n-button @click="modals.aiFullReview = false">关闭</n-button>
          <n-button 
            v-if="aiFullReviewState === 'complete' && aiFullReviewRef?.selectedSuggestionCount?.value > 0"
            type="primary" 
            :disabled="aiFullReviewRef?.applyingModifications?.value"
            :loading="aiFullReviewRef?.applyingModifications?.value"
            @click="aiFullReviewRef?.handleApplyModifications()"
          >
            {{ aiFullReviewRef?.applyingModifications?.value ? '执行中...' : `应用批注 (${aiFullReviewRef?.selectedSuggestionCount?.value || 0})` }}
          </n-button>
          <n-button 
            v-if="aiFullReviewState !== 'complete'"
            type="primary" 
            :loading="aiFullReviewProcessing" 
            @click="aiFullReviewRef?.triggerExecute()"
          >
            {{ aiFullReviewRef?.buttonText?.value || '开始任务' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- AI+律师共同审查弹窗 -->
    <n-modal v-model:show="modals.aiLawyerReview" preset="card" title="👨‍⚖️ AI+律师共同审查" class="feature-modal" :mask-closable="false">
      <AILawyerReview ref="aiLawyerReviewRef" @state-change="handleAILawyerReviewStateChange" />
      <template #footer>
        <n-space justify="end">
          <n-button @click="modals.aiLawyerReview = false">关闭</n-button>
          <n-button 
            v-if="aiLawyerReviewState === 'complete' && aiLawyerReviewRef?.selectedSuggestionCount?.value > 0"
            type="primary" 
            :disabled="aiLawyerReviewRef?.applyingModifications?.value"
            :loading="aiLawyerReviewRef?.applyingModifications?.value"
            @click="aiLawyerReviewRef?.handleApplyModifications()"
          >
            {{ aiLawyerReviewRef?.applyingModifications?.value ? '执行中...' : `应用批注 (${aiLawyerReviewRef?.selectedSuggestionCount?.value || 0})` }}
          </n-button>
          <n-button 
            v-if="aiLawyerReviewState !== 'complete'"
            type="primary" 
            :loading="aiLawyerReviewProcessing" 
            @click="aiLawyerReviewRef?.triggerExecute()"
          >
            {{ aiLawyerReviewRef?.buttonText?.value || '开始任务' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 执行工作流弹窗 -->
    <n-modal v-model:show="modals.batch" preset="card" title="📄 执行工作流" class="feature-modal" :mask-closable="false">
      <BatchWorkflow ref="batchWorkflowRef" />
      <template #footer>
        <div class="flex justify-between items-center">
          <n-button type="info" size="small" @click="batchWorkflowRef?.openCreateModal()">+ 新建工作流</n-button>
          <n-space>
            <n-button @click="modals.batch = false">关闭</n-button>
            <n-button type="primary" :disabled="!batchWorkflowRef?.canExecute" :loading="batchWorkflowRef?.isProcessing" @click="batchWorkflowRef?.triggerExecute()">
              {{ batchWorkflowRef?.buttonText || '开始处理' }}
            </n-button>
          </n-space>
        </div>
      </template>
    </n-modal>

    <!-- 更多功能定制弹窗 -->
    <n-modal v-model:show="modals.custom" preset="card" title="🎨 更多功能定制" class="feature-modal" :mask-closable="false">
      <div class="flex flex-col items-center py-8">
        <img :src="logoCard" alt="联系客服" class=" h-[200px]" />
        <div class="text-center text-sm text-gray-600 mt-4">
          <p class="mb-1">扫描二维码联系我</p>
          <p class="text-xs text-gray-500">定制专属功能，满足您的个性化需求</p>
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="modals.custom = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { NAlert, NModal, NButton, NSpace, NSpin } from 'naive-ui'
import { PageLayout } from '../components/common'
import ContractExtractor from '../components/ContractExtractor.vue'
import KeywordCommenter from '../components/KeywordCommenter.vue'
import AIFullReview from '../components/AIFullReview.vue'
import AILawyerReview from '../components/AILawyerReview.vue'
import BatchWorkflow from '../components/BatchWorkflow.vue'
import { contractService } from '../services/contract/contractService.js'
import logoCard from '../assets/logo_card.png'

// 弹窗状态
const modals = reactive({
  extractor: false,
  keyword: false,
  aiFullReview: false,
  aiLawyerReview: false,
  batch: false,
  custom: false
})

// 响应式数据
const extractedData = ref(null)
const submitting = ref(false)
const configs = ref({ extractor: {}, keyword: {} })
const extracting = ref(false)
const aiFullReviewProcessing = ref(false)
const aiFullReviewState = ref('idle') // 跟踪AI全流程审查状态
const aiLawyerReviewProcessing = ref(false)
const aiLawyerReviewState = ref('idle') // 跟踪AI+律师审查状态

// 组件引用
const keywordCommenterRef = ref(null)
const aiFullReviewRef = ref(null)
const aiLawyerReviewRef = ref(null)
const batchWorkflowRef = ref(null)

// 关键词处理状态
const keywordProcessing = computed(() => contractService.isTaskProcessing('keywordComment'))

// 功能卡片配置
const featureCards = computed(() => [
  { key: 'extractor', icon: '🤖', title: 'AI提取合同信息', desc: '智能识别合同关键要素', processing: extracting.value },
  { key: 'keyword', icon: '🔍', title: '关键词修订批注', desc: '匹配关键词添加批注', processing: keywordProcessing.value },
  { key: 'aiFullReview', icon: '⚖️', title: 'AI全流程审查', desc: 'AI自动生成审查清单', processing: aiFullReviewProcessing.value },
  { key: 'aiLawyerReview', icon: '👨‍⚖️', title: 'AI+律师共同审查', desc: 'AI清单+律师规则整合', processing: aiLawyerReviewProcessing.value },
  { key: 'batch', icon: '📄', title: '执行工作流', desc: '一键完成批量操作', processing: batchWorkflowRef.value?.isProcessing },
  { key: 'custom', icon: '🎨', title: '更多功能定制', desc: '联系客服定制专属功能', processing: false }
])

// 打开弹窗
const openModal = (key) => {
  modals[key] = true
}

// 状态变化处理
const handleAIFullReviewStateChange = (state) => {
  aiFullReviewProcessing.value = state === 'generating' || state === 'reviewing'
  aiFullReviewState.value = state
}

const handleAILawyerReviewStateChange = (state) => {
  aiLawyerReviewProcessing.value = state === 'generating' || state === 'reviewing'
  aiLawyerReviewState.value = state
}

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

<style scoped>
.feature-card {
  position: relative;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feature-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.feature-card.is-processing {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.card-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: #6b7280;
}

.card-spin {
  position: absolute;
  top: 12px;
  right: 12px;
}
</style>

<style>
/* 弹窗全局样式 */
.feature-modal {
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
}

.feature-modal .n-card-header {
  padding: 12px 16px;
}

.feature-modal .n-card-header__main {
  font-size: 15px;
}

.feature-modal .n-card__content {
  max-height: calc(80vh - 110px);
  overflow-y: auto;
  padding: 8px 28px;
  font-size: 13px;
}

.feature-modal .n-card__footer {
  padding: 10px 16px;
}

/* 细滚动条 */
.feature-modal .n-card__content::-webkit-scrollbar {
  width: 6px;
}

.feature-modal .n-card__content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.feature-modal .n-card__content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.feature-modal .n-card__content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 弹窗内组件字体调整 */
.feature-modal .n-alert {
  font-size: 12px;
  padding: 8px 12px;
}

.feature-modal .n-button {
  font-size: 13px;
}

.feature-modal .n-input {
  font-size: 13px;
}

.feature-modal .n-select {
  font-size: 13px;
}

.feature-modal .n-tag {
  font-size: 11px;
}
</style>
