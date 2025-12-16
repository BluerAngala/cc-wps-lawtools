<template>
  <div class="relative p-3">
    <!-- 执行中遮罩 -->
    <div v-if="isProcessing" class="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded">
      <n-spin size="large" />
      <div class="mt-3 text-sm font-medium text-gray-600">{{ progressText }}</div>
      <n-progress class="w-48 mt-2" type="line" status="info" :percentage="100" :show-indicator="false" :processing="true" />
    </div>

    <n-space vertical :size="12">
      <!-- 功能说明 -->
      <n-alert title="AI 生成审查清单 + 律师配置清单，AI 生成建议 + 律师预设意见" type="info" :closable="false" show-icon />

      <!-- 审查选项（idle 状态） -->
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

        <!-- 方案选择器 -->
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

        <!-- 律师自定义规则配置 -->
        <ConfigForm
          :config="configForm"
          mode="review"
          @update-config="handleConfigUpdate"
        />
      </div>

      <!-- 文档类型识别结果 -->
      <div v-if="documentType && pageState !== 'idle'" class="flex items-center gap-2">
        <span class="text-sm font-semibold">识别的文档类型:</span>
        <n-tag type="primary">{{ documentType.subtype || documentType.type || '未知' }}</n-tag>
      </div>

      <!-- 审查清单（ready/reviewing 状态显示） -->
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

      <!-- 审查结果（complete 状态）- 整合清单和建议 -->
      <div v-if="pageState === 'complete' && reviewResult">
        <!-- 统计数据 -->
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

        <!-- 整合的审查结果列表 -->
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
              <!-- 审查要点 -->
              <div v-if="item.reviewRequirements" class="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <span class="font-medium text-blue-600">审查要点：</span>{{ item.reviewRequirements }}
              </div>
              <!-- 法律依据 -->
              <div v-if="item.reviewBasis" class="text-xs text-gray-500">
                <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
              </div>
              <!-- 问题列表 -->
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
                    <span class="text-xs text-gray-400">{{ issue.position || '' }}</span>
                  </div>
                  <div class="text-sm text-gray-700 pl-6">{{ issue.comment }}</div>
                </div>
              </div>
              <div v-else class="text-sm text-green-600">✓ 该项审查未发现问题</div>
            </div>
          </div>
        </div>

        <!-- 律师预设意见（单独显示） -->
        <div v-if="lawyerSuggestionsList.length > 0" class="mt-3">
          <div class="text-sm font-semibold mb-2">📝 律师预设意见</div>
          <div class="space-y-1">
            <div
              v-for="item in lawyerSuggestionsList"
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

        <!-- 应用修改按钮 -->
        <div v-if="suggestions.length > 0" class="flex justify-end mt-3">
          <n-button
            type="primary"
            :disabled="selectedSuggestionCount === 0 || applyingModifications"
            :loading="applyingModifications"
            @click="handleApplyModifications"
          >
            {{ applyingModifications ? '执行中...' : `应用批注 (${selectedSuggestionCount})` }}
          </n-button>
        </div>
      </div>

      <!-- 空状态 -->
      <n-empty v-if="pageState === 'idle' && lawyerRules.length === 0" description="请先配置律师审查规则，然后点击「开始任务」" />
    </n-space>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { NSpace, NAlert, NRadioGroup, NRadio, NTag, NInput, NButton, NCheckbox, NSpin, NProgress, NEmpty } from 'naive-ui'
import SchemeSelector from './SchemeSelector.vue'
import ConfigForm from './ConfigForm.vue'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'
import { ActionTypes } from '../services/workflow'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'
import { wpsDocumentService } from '../services/wps'
import { appConfig } from '../utils/appConfig.js'

const props = defineProps({
  processing: { type: Boolean, default: false },
  reviewConfig: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['stateChange', 'update-config'])

// 工作流
const { executePreset, getResultData, reset: resetWorkflow } = useWorkflowExecution()
const { getFullText } = useWpsEnvironment()

// 状态
const pageState = ref('idle')
const progressText = ref('')
const perspective = ref('neutral')
const customPerspective = ref('')

// 数据
const documentType = ref(null)
const checklist = ref([])
const reviewResult = ref(null)
const suggestions = ref([])
const applyingModifications = ref(false)
const expandedId = ref(null)

// 方案管理
const schemes = ref([])
const activeSchemeId = ref(null)
const lawyerRules = ref([])

// 配置表单
const configForm = reactive({
  keywordList: { type: 'keywordList', value: [] }
})

// 展开/折叠清单项
const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

// 计算属性
const selectedChecklistCount = computed(() => checklist.value.filter(i => i.selected).length)
const passedCount = computed(() => {
  if (!reviewResult.value) return 0
  return checklist.value.filter(item => {
    const issues = (reviewResult.value.issues || []).filter(i => i.checklistId === item.id)
    return item.selected && issues.length === 0
  }).length
})
const selectedSuggestionCount = computed(() => suggestions.value.filter(s => s.selected).length)
const selectedSuggestions = computed(() => suggestions.value.filter(s => s.selected))

// 律师预设意见列表（单独显示）
const lawyerSuggestionsList = computed(() => suggestions.value.filter(s => s.source === 'lawyer'))

// 获取某个清单项的所有问题
const getItemIssues = (itemId) => {
  if (!reviewResult.value) return []
  return (reviewResult.value.issues || []).filter(i => i.checklistId === itemId)
}

// 根据问题获取对应的建议
const getSuggestionByIssue = (issue) => {
  return suggestions.value.find(s => s.issueId === issue.id || s.keyword === (issue.searchKeyword || issue.keyword))
}

// 切换问题对应建议的选中状态
const toggleSuggestionByIssue = (issue, selected) => {
  const suggestion = getSuggestionByIssue(issue)
  if (suggestion) suggestion.selected = selected
}

// 风险等级颜色
const getSeverityColor = (level) => {
  const colorMap = { high: 'error', medium: 'warning', low: 'info' }
  return colorMap[level] || 'default'
}

// 风险等级文本
const getSeverityText = (level) => {
  const textMap = { high: '高风险', medium: '中风险', low: '低风险' }
  return textMap[level] || '未知'
}

// 失败数量（有问题的清单项）
const failedCount = computed(() => {
  if (!reviewResult.value) return 0
  return checklist.value.filter(item => {
    const issues = (reviewResult.value.issues || []).filter(i => i.checklistId === item.id)
    return item.selected && issues.length > 0
  }).length
})

// 默认律师规则（通用审查方案）
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

// 加载方案
const loadSchemes = () => {
  const data = appConfig.getSchemes('review')
  schemes.value = data.schemes
  activeSchemeId.value = data.activeSchemeId
  const activeScheme = data.schemes.find(s => s.id === data.activeSchemeId)
  if (activeScheme) {
    // 如果方案规则为空，使用默认规则并保存
    if (!activeScheme.rules || activeScheme.rules.length === 0) {
      activeScheme.rules = [...defaultLawyerRules]
      appConfig.updateScheme('review', activeScheme.id, { rules: activeScheme.rules })
    }
    lawyerRules.value = activeScheme.rules
    configForm.keywordList.value = lawyerRules.value
  }
}

// 方案操作
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

// 清单操作
const toggleChecklistItem = (id, checked) => {
  const item = checklist.value.find(i => i.id === id)
  if (item) item.selected = checked
}
const selectAllChecklist = () => checklist.value.forEach(i => { i.selected = true })

// 建议操作
const toggleSuggestion = (id, selected) => {
  const item = suggestions.value.find(s => s.id === id)
  if (item) item.selected = selected
}


const getEffectivePerspective = () => {
  if (perspective.value === 'custom' && customPerspective.value.trim()) {
    return customPerspective.value.trim()
  }
  return perspective.value
}

// 生成清单（合并 AI 清单 + 律师清单）
const handleGenerateChecklist = async () => {
  if (perspective.value === 'custom' && !customPerspective.value.trim()) {
    window.$message?.warning('请输入自定义审查视角')
    return
  }

  const fullText = getFullText()
  if (!fullText) {
    window.$message?.warning('无法读取文档内容')
    return
  }

  pageState.value = 'generating'
  progressText.value = '正在识别合同类型...'
  emit('stateChange', 'generating')

  try {
    const result = await executePreset('generate-review-checklist', {
      stepParams: {
        [ActionTypes.GENERATE_CHECKLIST]: { perspective: getEffectivePerspective() }
      },
      onProgress: (info) => {
        if (info.stepName) progressText.value = info.stepName
      }
    })

    if (result.success) {
      documentType.value = getResultData('contractType')
      const aiChecklist = getResultData('checklist') || reviewChecklistGenerator.generateChecklist({ type: 'default' }, perspective.value)

      // 合并 AI 清单 + 律师清单
      const aiItems = aiChecklist.map(item => ({ ...item, source: 'ai' }))
      const lawyerItems = lawyerRules.value.map((rule, index) => ({
        id: `lawyer_${index}`,
        name: rule.keyword || `律师规则 ${index + 1}`,
        selected: true,
        required: false,
        reviewRequirements: rule.comment || '',
        source: 'lawyer',
        suggestionContent: rule.comment,
        actionType: rule.actionType || 'comment'
      }))

      checklist.value = [...aiItems, ...lawyerItems]
      pageState.value = 'ready'
      window.$message?.success(`已生成 ${checklist.value.length} 项审查清单（AI: ${aiItems.length}, 律师: ${lawyerItems.length}）`)
    } else {
      pageState.value = 'idle'
      window.$message?.error(result.message || '生成清单失败')
    }
  } catch (error) {
    pageState.value = 'idle'
    window.$message?.error('生成清单失败: ' + error.message)
  }
  emit('stateChange', pageState.value)
}

// 开始审查
const handleStartReview = async () => {
  const selectedItems = checklist.value.filter(i => i.selected)
  if (selectedItems.length === 0) {
    window.$message?.warning('请至少选择一个审查项')
    return
  }

  pageState.value = 'reviewing'
  progressText.value = '正在审查...'
  emit('stateChange', 'reviewing')

  try {
    const result = await executePreset('execute-risk-review', {
      stepParams: {
        [ActionTypes.REVIEW_CONTRACT]: {
          perspective: getEffectivePerspective(),
          depth: 'standard',
          autoApply: false,
          contractType: documentType.value,
          checklist: selectedItems
        }
      },
      onProgress: (info) => {
        if (info.stepName) progressText.value = info.stepName
      }
    })

    if (result.success) {
      reviewResult.value = getResultData('reviewResult')
      generateSuggestions()
      pageState.value = 'complete'
      window.$message?.success(`审查完成！检测到 ${reviewResult.value?.summary?.totalIssues || 0} 个问题`)
    } else {
      pageState.value = 'ready'
      window.$message?.error(result.message || '审查失败')
    }
  } catch (error) {
    pageState.value = 'ready'
    window.$message?.error('审查失败: ' + error.message)
  }
  emit('stateChange', pageState.value)
}

// 生成修改建议（合并 AI 建议 + 律师预设意见）
const generateSuggestions = () => {
  const aiSuggestions = (reviewResult.value?.issues || []).map((issue, index) => ({
    id: `ai_${index}`,
    issueId: issue.id || `issue_${index}`,
    position: issue.position || '',
    // AI 返回的是 searchKeyword 字段
    keyword: issue.searchKeyword || issue.keyword || '',
    actionType: issue.severity === 'high' ? 'revision' : 'comment',
    content: issue.comment || '',
    severity: issue.severity || 'medium',
    selected: true,
    source: 'ai'
  }))

  // 律师预设意见
  const lawyerSuggestions = lawyerRules.value
    .filter(rule => rule.comment)
    .map((rule, index) => ({
      id: `lawyer_${index}`,
      issueId: `lawyer_rule_${index}`,
      position: '',
      keyword: rule.keyword || '',
      actionType: rule.actionType || 'comment',
      content: rule.comment || '',
      severity: 'medium',
      selected: true,
      source: 'lawyer'
    }))

  suggestions.value = [...aiSuggestions, ...lawyerSuggestions]
}

// 清理关键词：处理换行符、多余空格，截取有效部分
const cleanKeyword = (keyword) => {
  if (!keyword) return ''
  // 按换行符分割，取第一个非空行
  const lines = keyword.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return ''
  // 取第一行，如果太长则截取前50个字符
  let cleaned = lines[0].replace(/\s+/g, ' ').trim()
  if (cleaned.length > 50) cleaned = cleaned.slice(0, 50)
  return cleaned
}

// 尝试多种方式查找关键词
const tryFindRange = (keyword) => {
  // 1. 直接查找
  let range = wpsDocumentService.findRangeByKeyword(keyword)
  if (range) return range

  // 2. 尝试截取前20个字符
  if (keyword.length > 20) {
    range = wpsDocumentService.findRangeByKeyword(keyword.slice(0, 20))
    if (range) return range
  }

  // 3. 尝试截取前10个字符
  if (keyword.length > 10) {
    range = wpsDocumentService.findRangeByKeyword(keyword.slice(0, 10))
    if (range) return range
  }

  return null
}

// 应用修改
const handleApplyModifications = async () => {
  const toApply = selectedSuggestions.value
  if (toApply.length === 0) return

  applyingModifications.value = true
  let successCount = 0
  let failCount = 0

  for (const item of toApply) {
    try {
      // 清理关键词
      const keyword = cleanKeyword(item.keyword)
      if (!keyword || keyword.length < 2) {
        console.warn('[应用修改] 关键词太短或为空:', item.keyword, '->', keyword)
        failCount++
        continue
      }
      const range = tryFindRange(keyword)
      if (range) {
        const prefix = item.source === 'lawyer' ? '[律师意见] ' : ''
        wpsDocumentService.addComment(range, `${prefix}${item.content}`)
        successCount++
      } else {
        console.warn('[应用修改] 未找到关键词:', keyword)
        failCount++
      }
    } catch (err) {
      console.error('[应用修改] 执行失败:', err)
      failCount++
    }
  }

  applyingModifications.value = false

  if (failCount > 0) {
    window.$message?.warning(`执行完成：成功 ${successCount} 个，失败 ${failCount} 个`)
  } else {
    window.$message?.success(`执行完成：成功 ${successCount} 个`)
  }
}

// 重置
const handleReset = () => {
  pageState.value = 'idle'
  documentType.value = null
  checklist.value = []
  reviewResult.value = null
  suggestions.value = []
  resetWorkflow()
  emit('stateChange', 'idle')
}

// 暴露方法
const triggerExecute = () => {
  if (pageState.value === 'idle') {
    handleGenerateChecklist()
  } else if (pageState.value === 'ready') {
    handleStartReview()
  } else if (pageState.value === 'complete') {
    handleReset()
  }
}

const isProcessing = computed(() => pageState.value === 'generating' || pageState.value === 'reviewing')

const buttonText = computed(() => {
  const state = pageState.value
  if (state === 'generating') return '生成中...'
  if (state === 'reviewing') return '审查中...'
  if (state === 'ready') return '开始审查'
  if (state === 'complete') return '重新审查'
  return '开始任务'
})

watch(() => props.reviewConfig, (newConfig) => {
  if (newConfig?.contractReviewRules) {
    lawyerRules.value = newConfig.contractReviewRules.map(rule => ({
      keyword: rule.reviewRules,
      comment: rule.reviewRequirements,
      actionType: rule.actionType
    }))
    configForm.keywordList.value = lawyerRules.value
  }
}, { deep: true })

onMounted(() => {
  loadSchemes()
})

defineExpose({
  triggerExecute,
  isProcessing,
  buttonText,
  pageState
})
</script>
