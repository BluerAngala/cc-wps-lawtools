<template>
  <div class="relative ai-lawyer-review-container">
    <div v-if="isProcessing" class="ai-lawyer-review-loading-overlay">
      <n-spin size="large" />
      <div class="mt-3 text-sm font-medium text-gray-600">{{ progressText }}</div>
      <n-progress class="w-48 mt-2" type="line" status="info" :percentage="100" :show-indicator="false" :processing="true" />
    </div>

    <n-space vertical :size="8">
      <div class="text-xs text-blue-500">AI 生成审查清单 + 律师配置清单，AI 生成建议 + 律师预设意见</div>

      <div v-if="pageState === 'idle'">
        <div class="text-sm font-semibold mb-2">审查视角</div>
        <n-radio-group v-model:value="perspective">
          <n-space wrap>
            <n-radio value="partyA">甲方视角</n-radio>
            <n-radio value="partyB">乙方视角</n-radio>
            <n-radio value="neutral">
              <n-space align="center">
                <span>中立视角</span>
                <n-tag size="tiny" type="info">推荐</n-tag>
              </n-space>
            </n-radio>
            <n-radio value="custom">自定义视角</n-radio>
          </n-space>
        </n-radio-group>
        <n-input
          v-if="perspective === 'custom'"
          v-model:value="customPerspective"
          type="textarea"
          placeholder="请输入自定义审查视角"
          :autosize="{ minRows: 2, maxRows: 4 }"
          class="mt-2"
        />

        <SchemeSelector
          class="mt-3"
          :schemes="schemes"
          :active-scheme-id="activeSchemeId"
          type="review"
          @update:active-scheme-id="handleSchemeChange"
          @scheme-change="handleSchemeChange"
          @scheme-create="handleSchemeCreate"
          @scheme-update="handleSchemeUpdate"
          @scheme-delete="handleSchemeDelete"
        />

        <ConfigForm
          :config="configForm"
          mode="review"
          @update-config="handleConfigUpdate"
        />
      </div>

      <div v-if="documentType && pageState !== 'idle'" class="flex items-center gap-2">
        <span class="text-sm font-semibold">识别的文档类型:</span>
        <n-tag type="primary">{{ documentType.subtype || documentType.type || '未知' }}</n-tag>
      </div>

      <div v-if="checklist.length > 0 && (pageState === 'ready' || pageState === 'reviewing')">
        <div class="flex items-center justify-between mb-2">
          <n-space align="center" :size="8">
            <span class="text-sm font-semibold">📋 审查清单</span>
            <n-tag size="small" type="info">{{ selectedChecklistCount }}/{{ checklist.length }} 项</n-tag>
          </n-space>
          <n-space v-if="pageState === 'ready'" :size="4">
            <n-button size="tiny" @click="selectAllChecklist">全选</n-button>
          </n-space>
        </div>

        <div class="space-y-1">
          <div
            v-for="item in checklist"
            :key="item.id"
            class="border border-gray-200 rounded px-2 py-1"
          >
            <div class="flex items-center gap-2 cursor-pointer" @click="toggleExpand(item.id)">
              <span class="text-gray-400 text-xs">{{ expandedId === item.id ? '▼' : '▶' }}</span>
              <n-checkbox
                v-if="pageState === 'ready'"
                :checked="item.selected"
                @update:checked="toggleChecklistItem(item.id, $event)"
                @click.stop
              />
              <span class="text-sm">{{ item.name }}</span>
              <n-tag v-if="item.source === 'lawyer'" type="warning" size="tiny">律师</n-tag>
              <n-tag v-else type="info" size="tiny">AI</n-tag>
            </div>
            <div v-if="expandedId === item.id" class="mt-2 pl-5 pb-2">
              <n-input
                v-if="pageState === 'ready'"
                v-model:value="item.reviewRequirements"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 6 }"
                placeholder="请输入该项的审查要点..."
                size="small"
              />
              <div v-else class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {{ item.reviewRequirements || '暂无审查要点' }}
              </div>
              <div v-if="item.reviewBasis" class="text-xs text-gray-500 mt-1">
                <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="pageState === 'complete' && reviewResult">
        <div class="grid grid-cols-3 gap-2 mb-3 text-center">
          <div class="bg-green-50 rounded p-2">
            <div class="text-base font-bold text-green-600">{{ passedCount }}</div>
            <div class="text-xs text-gray-500">通过</div>
          </div>
          <div class="bg-orange-50 rounded p-2">
            <div class="text-base font-bold text-orange-600">{{ failedCount }}</div>
            <div class="text-xs text-gray-500">待处理</div>
          </div>
          <div class="bg-red-50 rounded p-2">
            <div class="text-base font-bold text-red-600">{{ reviewResult.summary?.totalIssues || 0 }}</div>
            <div class="text-xs text-gray-500">问题总数</div>
          </div>
        </div>

        <div class="space-y-1">
          <div
            v-for="item in checklist.filter(i => i.selected)"
            :key="item.id"
            class="border border-gray-200 rounded px-2 py-1"
          >
            <div class="flex items-center gap-2 cursor-pointer" @click="toggleExpand(item.id)">
              <span class="text-gray-400 text-xs">{{ expandedId === item.id ? '▼' : '▶' }}</span>
              <n-tag :type="getItemIssues(item.id).length > 0 ? 'warning' : 'success'" size="tiny">
                {{ getItemIssues(item.id).length > 0 ? '待处理' : '通过' }}
              </n-tag>
              <span class="text-sm flex-1">{{ item.name }}</span>
              <n-tag v-if="item.source === 'lawyer'" type="warning" size="tiny">律师</n-tag>
              <n-tag v-else type="info" size="tiny">AI</n-tag>
              <n-tag v-if="getItemIssues(item.id).length > 0" size="tiny">
                {{ getItemIssues(item.id).length }} 个问题
              </n-tag>
            </div>
            <div v-if="expandedId === item.id" class="mt-2 pl-5 pb-2 space-y-2">
              <div v-if="item.reviewRequirements" class="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <span class="font-medium text-blue-600">审查要点：</span>{{ item.reviewRequirements }}
              </div>
              <div v-if="item.reviewBasis" class="text-xs text-gray-500">
                <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
              </div>
              <div v-if="getItemIssues(item.id).length > 0" class="space-y-2">
                <div
                  v-for="(issue, idx) in getItemIssues(item.id)"
                  :key="idx"
                  class="bg-gray-50 p-2 rounded"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <n-checkbox
                      :checked="getSuggestionByIssue(issue)?.selected"
                      @update:checked="toggleSuggestionByIssue(issue, $event)"
                    />
                    <n-tag :type="getSeverityColor(issue.severity)" size="tiny">
                      {{ getSeverityText(issue.severity) }}
                    </n-tag>
                    <n-tag v-if="getSuggestionByIssue(issue)?.source === 'merged'" type="success" size="tiny">整合</n-tag>
                    <n-tag v-else-if="getSuggestionByIssue(issue)?.source === 'ai'" type="info" size="tiny">AI</n-tag>
                    <span class="text-xs text-gray-400">{{ issue.position || '' }}</span>
                  </div>
                  <div v-if="getSuggestionByIssue(issue)?.source === 'merged'" class="pl-6 space-y-1">
                    <div class="text-sm text-orange-700 bg-orange-50 p-1 rounded">
                      <span class="font-medium">律师意见：</span>{{ getSuggestionByIssue(issue)?.content }}
                    </div>
                    <div v-if="getSuggestionByIssue(issue)?.aiContent" class="text-sm text-blue-700 bg-blue-50 p-1 rounded">
                      <span class="font-medium">AI分析：</span>{{ getSuggestionByIssue(issue)?.aiContent }}
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-700 pl-6">{{ issue.comment }}</div>
                </div>
              </div>
              <div v-else class="text-sm text-green-600">✓ 该项审查未发现问题</div>
            </div>
          </div>
        </div>

        <div v-if="unmatchedLawyerSuggestions.length > 0" class="mt-3">
          <div class="text-sm font-semibold mb-2">📝 律师通用意见（未匹配到具体内容）</div>
          <div class="space-y-1">
            <div
              v-for="item in unmatchedLawyerSuggestions"
              :key="item.id"
              class="border border-orange-200 bg-orange-50 rounded px-2 py-1"
            >
              <div class="flex items-center gap-2">
                <n-checkbox
                  :checked="item.selected"
                  @update:checked="toggleSuggestion(item.id, $event)"
                />
                <n-tag type="warning" size="tiny">律师</n-tag>
                <span class="text-sm flex-1">{{ item.keyword }}</span>
              </div>
              <div class="text-xs text-gray-600 pl-6 mt-1">{{ item.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <n-empty v-if="pageState === 'idle' && lawyerRules.length === 0" description="请先配置律师审查规则，然后点击「开始任务」" />
    </n-space>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { NSpace, NRadioGroup, NRadio, NTag, NInput, NButton, NCheckbox, NSpin, NProgress, NEmpty } from 'naive-ui'
import SchemeSelector from './SchemeSelector.vue'
import ConfigForm from './ConfigForm.vue'
import { useContractReview } from '../composables/useContractReview.js'
import { appConfig } from '../utils/appConfig.js'

defineProps({
  processing: { type: Boolean, default: false },
  reviewConfig: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['stateChange', 'update-config'])

const {
  pageState, progressText, perspective, customPerspective, documentType,
  checklist, reviewResult, suggestions, expandedId,
  selectedChecklistCount,
  passedCount, failedCount, selectedSuggestionCount, isProcessing,
  toggleExpand, getItemIssues, getSuggestionByIssue, toggleSuggestionByIssue,
  getSeverityColor, getSeverityText, toggleChecklistItem,
  selectAllChecklist, handleApplyModifications,
  handleGenerateChecklist, handleStartReview, handleReset
} = useContractReview()

const schemes = ref([])
const activeSchemeId = ref(null)
const lawyerRules = ref([])
const configForm = reactive({
  keywordList: { type: 'keywordList', value: [] }
})

const unmatchedLawyerSuggestions = computed(() => suggestions.value.filter(s => s.source === 'lawyer'))

const toggleSuggestion = (id, selected) => {
  const item = suggestions.value.find(s => s.id === id)
  if (item) item.selected = selected
}

const defaultLawyerRules = [
  { keyword: '合同主体', comment: '审查合同双方主体资格是否合法有效，检查是否有营业执照、统一社会信用代码、法定代表人信息、授权委托书等资质文件', actionType: '批注' },
  { keyword: '付款条款', comment: '审查付款方式、付款期限、付款条件是否明确具体，检查是否存在付款风险或对一方明显不利的条款', actionType: '批注' },
  { keyword: '违约责任', comment: '审查违约金标准是否合理（一般不超过实际损失的30%），检查免责条款是否过于宽泛，双方违约责任是否对等', actionType: '批注' },
  { keyword: '争议解决', comment: '审查是否约定了明确的管辖法院或仲裁机构，检查管辖约定是否有效，是否存在约定不明的情况', actionType: '批注' },
  { keyword: '合同期限', comment: '审查合同起止时间是否明确，检查续约机制、提前终止条件、合同解除情形是否清晰约定', actionType: '批注' },
  { keyword: '保密条款', comment: '审查保密信息范围、保密期限、保密义务、违约责任是否明确，检查是否有合理的例外情形', actionType: '批注' },
  { keyword: '知识产权', comment: '审查知识产权归属、使用范围、许可方式、侵权责任分担是否清晰，检查是否有权利瑕疵担保', actionType: '批注' },
  { keyword: '不可抗力', comment: '审查不可抗力条款的定义范围是否合理，检查通知义务、证明责任、后果处理是否明确约定', actionType: '批注' }
]

const migrateRules = (rules) => {
  let needSave = false
  const migrated = rules.map(rule => {
    const newRule = { ...rule }
    if (newRule.actionType === 'comment') {
      newRule.actionType = '批注'
      needSave = true
    } else if (newRule.actionType === 'revision') {
      newRule.actionType = '修订'
      needSave = true
    }
    return newRule
  })
  return { migrated, needSave }
}

const loadSchemes = () => {
  const data = appConfig.getSchemes('review')
  schemes.value = data.schemes
  activeSchemeId.value = data.activeSchemeId
  const activeScheme = data.schemes.find(s => s.id === data.activeSchemeId)
  if (activeScheme) {
    if (!activeScheme.rules || activeScheme.rules.length === 0) {
      activeScheme.rules = [...defaultLawyerRules]
      appConfig.updateScheme('review', activeScheme.id, { rules: activeScheme.rules })
    } else {
      const { migrated, needSave } = migrateRules(activeScheme.rules)
      if (needSave) {
        activeScheme.rules = migrated
        appConfig.updateScheme('review', activeScheme.id, { rules: migrated })
      }
    }
    lawyerRules.value = activeScheme.rules
    configForm.keywordList.value = lawyerRules.value
  }
}

const handleSchemeChange = (schemeId) => {
  activeSchemeId.value = schemeId
  appConfig.setActiveScheme('review', schemeId)
  const scheme = schemes.value.find(s => s.id === schemeId)
  if (scheme) {
    lawyerRules.value = scheme.rules || []
    configForm.keywordList.value = lawyerRules.value
    emit('update-config', { reviewKeywordList: lawyerRules.value })
  }
}

const handleSchemeCreate = (newScheme) => {
  appConfig.createScheme('review', newScheme)
  loadSchemes()
  window.$message?.success(`方案"${newScheme.name}"创建成功`)
}

const handleSchemeUpdate = (schemeId, updates) => {
  appConfig.updateScheme('review', schemeId, updates)
  loadSchemes()
}

const handleSchemeDelete = (schemeId) => {
  if (appConfig.deleteScheme('review', schemeId)) {
    loadSchemes()
    window.$message?.success('方案删除成功')
  }
}

const handleConfigUpdate = (data) => {
  lawyerRules.value = data.keywordList.value
  configForm.keywordList.value = data.keywordList.value
  appConfig.updateScheme('review', activeSchemeId.value, { rules: data.keywordList.value })
  emit('update-config', { reviewKeywordList: data.keywordList.value })
}

const handleGenerateChecklistWithLawyer = async () => {
  const result = await handleGenerateChecklist(emit)
  if (result.success) {
    const aiChecklist = checklist.value
    const aiItems = aiChecklist.map(item => ({ ...item, source: 'ai' }))
    const lawyerItems = lawyerRules.value.map((rule, index) => ({
      id: `lawyer_${index}`,
      name: rule.keyword || `律师规则 ${index + 1}`,
      selected: true,
      required: false,
      priority: 'medium',
      reviewRequirements: rule.comment || '',
      reviewBasis: '',
      source: 'lawyer'
    }))
    checklist.value = [...aiItems, ...lawyerItems]
  }
}

const handleStartReviewWithLawyer = async () => {
  await handleStartReview(emit)
  if (reviewResult.value) {
    generateMergedSuggestions()
  }
}

const generateMergedSuggestions = () => {
  if (!reviewResult.value?.issues) {
    suggestions.value = []
    return
  }

  const mergedSuggestions = []
  const matchedKeywords = new Set()

  reviewResult.value.issues.forEach((issue, index) => {
    const keyword = issue.searchKeyword || issue.keyword || ''
    const matchedRule = lawyerRules.value.find(rule =>
      keyword.includes(rule.keyword) || rule.keyword.includes(keyword.slice(0, 10))
    )

    if (matchedRule) {
      matchedKeywords.add(matchedRule.keyword)
      mergedSuggestions.push({
        id: `suggestion_${index}`,
        issueId: issue.id || `issue_${index}`,
        position: issue.position || '',
        keyword: keyword,
        actionType: issue.severity === 'high' ? 'revision' : 'comment',
        content: matchedRule.comment || issue.comment,
        aiContent: issue.comment,
        severity: issue.severity || 'medium',
        selected: true,
        source: 'merged'
      })
    } else {
      mergedSuggestions.push({
        id: `suggestion_${index}`,
        issueId: issue.id || `issue_${index}`,
        position: issue.position || '',
        keyword: keyword,
        actionType: issue.severity === 'high' ? 'revision' : 'comment',
        content: issue.comment || '',
        severity: issue.severity || 'medium',
        selected: true,
        source: 'ai'
      })
    }
  })

  lawyerRules.value.forEach((rule, index) => {
    if (!matchedKeywords.has(rule.keyword)) {
      mergedSuggestions.push({
        id: `lawyer_suggestion_${index}`,
        issueId: null,
        position: '',
        keyword: rule.keyword,
        actionType: rule.actionType === '修订' ? 'revision' : 'comment',
        content: rule.comment || '',
        severity: 'medium',
        selected: true,
        source: 'lawyer'
      })
    }
  })

  suggestions.value = mergedSuggestions
}

const triggerExecute = () => {
  if (pageState.value === 'idle') {
    handleGenerateChecklistWithLawyer()
  } else if (pageState.value === 'ready') {
    handleStartReviewWithLawyer()
  } else if (pageState.value === 'complete') {
    handleReset(emit)
  }
}

const buttonText = computed(() => {
  const state = pageState.value
  if (state === 'generating') return '生成中...'
  if (state === 'reviewing') return '审查中...'
  if (state === 'ready') return '开始审查'
  if (state === 'complete') return '重新审查'
  return '开始任务'
})

const applyingModifications = computed(() => false)

onMounted(() => {
  loadSchemes()
})

defineExpose({
  triggerExecute,
  isProcessing,
  buttonText,
  pageState,
  selectedSuggestionCount,
  applyingModifications,
  handleApplyModifications
})
</script>

<style scoped>
.ai-lawyer-review-container {
  position: relative;
}

.ai-lawyer-review-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
</style>
