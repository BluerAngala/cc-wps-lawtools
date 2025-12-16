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
      <n-alert title="AI 根据合同类型自动生成审查清单，执行审查后生成修改建议" type="info" :closable="false" show-icon />

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
        <div v-if="perspective !== 'custom'" class="text-xs text-gray-500 mt-1">{{ perspectiveDescription }}</div>
        <n-input
          v-if="perspective === 'custom'"
          v-model:value="customPerspective"
          type="textarea"
          placeholder="请输入自定义审查视角"
          :autosize="{ minRows: 2, maxRows: 4 }"
          class="mt-2"
        />
      </div>

      <!-- 文档类型识别结果 -->
      <div v-if="documentType && pageState !== 'idle'" class="flex items-center gap-2">
        <span class="text-sm font-semibold">识别的文档类型:</span>
        <n-tag type="primary">{{ documentType.subtype || documentType.type || '未知' }}</n-tag>
        <n-tag size="small">{{ perspectiveLabel }}</n-tag>
      </div>

      <!-- 审查清单（ready/reviewing 状态显示） -->
      <div v-if="checklist.length > 0 && (pageState === 'ready' || pageState === 'reviewing')">
        <div class="flex items-center justify-between mb-2">
          <n-space align="center" :size="8">
            <span class="text-sm font-semibold">📋 审查清单</span>
            <n-tag size="small" type="info">{{ selectedChecklistCount }}/{{ checklist.length }} 项已选</n-tag>
          </n-space>
          <n-space v-if="pageState === 'ready'" :size="4">
            <n-button size="tiny" @click="selectAllChecklist">全选</n-button>
            <n-button size="tiny" @click="selectRequiredChecklist">仅必需项</n-button>
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
              <span class="text-sm" :class="{ 'text-gray-400': !item.selected && pageState === 'ready' }">{{ item.name }}</span>
              <n-tag v-if="item.required" type="error" size="tiny">必需</n-tag>
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
      <n-empty v-if="pageState === 'idle'" description="点击「开始任务」按钮开始审查" />
    </n-space>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NSpace, NAlert, NRadioGroup, NRadio, NTag, NInput, NButton, NCheckbox, NSpin, NProgress, NEmpty } from 'naive-ui'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'
import { ActionTypes } from '../services/workflow'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'
import { wpsDocumentService } from '../services/wps'

defineProps({
  processing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['stateChange'])

// 工作流执行
const { executePreset, getResultData, reset: resetWorkflow } = useWorkflowExecution()
const { getFullText } = useWpsEnvironment()

// 页面状态
const pageState = ref('idle') // idle | generating | ready | reviewing | complete
const progressText = ref('')

// 用户选择
const perspective = ref('neutral')
const customPerspective = ref('')

// 数据
const documentType = ref(null)
const checklist = ref([])
const reviewResult = ref(null)
const suggestions = ref([])
const applyingModifications = ref(false)
const expandedId = ref(null)

// 展开/折叠清单项
const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

// 视角描述
const perspectiveDescriptions = {
  partyA: '甲方视角：重点关注付款条件、违约责任、验收标准等',
  partyB: '乙方视角：重点关注付款保障、履行期限、知识产权归属等',
  neutral: '中立视角：平衡审查双方权利义务，识别对任一方不利的条款',
  custom: '自定义视角：按您指定的角度和关注点进行审查'
}

const perspectiveLabels = {
  partyA: '甲方视角',
  partyB: '乙方视角',
  neutral: '中立视角',
  custom: '自定义视角'
}

const perspectiveDescription = computed(() => perspectiveDescriptions[perspective.value])
const perspectiveLabel = computed(() => {
  if (perspective.value === 'custom' && customPerspective.value) {
    return `自定义: ${customPerspective.value.slice(0, 20)}...`
  }
  return perspectiveLabels[perspective.value]
})

// 清单统计
const selectedChecklistCount = computed(() => checklist.value.filter(i => i.selected).length)
const passedCount = computed(() => {
  if (!reviewResult.value) return 0
  return checklist.value.filter(item => {
    const issues = (reviewResult.value.issues || []).filter(i => i.checklistId === item.id)
    return item.selected && issues.length === 0
  }).length
})
const failedCount = computed(() => {
  if (!reviewResult.value) return 0
  return checklist.value.filter(item => {
    const issues = (reviewResult.value.issues || []).filter(i => i.checklistId === item.id)
    return item.selected && issues.length > 0
  }).length
})

// 建议统计
const selectedSuggestionCount = computed(() => suggestions.value.filter(s => s.selected).length)
const selectedSuggestions = computed(() => suggestions.value.filter(s => s.selected))

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

// 获取实际视角
const getEffectivePerspective = () => {
  if (perspective.value === 'custom' && customPerspective.value.trim()) {
    return customPerspective.value.trim()
  }
  return perspective.value
}

// 清单操作
const toggleChecklistItem = (id, checked) => {
  const item = checklist.value.find(i => i.id === id)
  if (item) item.selected = checked
}
const selectAllChecklist = () => checklist.value.forEach(i => { i.selected = true })
const selectRequiredChecklist = () => checklist.value.forEach(i => { i.selected = i.required })



// 生成清单
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
      const generated = getResultData('checklist')
      if (generated?.length > 0) {
        checklist.value = generated
      } else {
        checklist.value = reviewChecklistGenerator.generateChecklist({ type: 'default' }, perspective.value)
      }
      pageState.value = 'ready'
      window.$message?.success(`已生成 ${checklist.value.length} 项审查清单`)
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
      // 生成修改建议
      generateSuggestions()
      pageState.value = 'complete'
      const totalIssues = reviewResult.value?.summary?.totalIssues || 0
      window.$message?.success(`审查完成！检测到 ${totalIssues} 个问题`)
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

// 生成修改建议（基于审查结果）
const generateSuggestions = () => {
  if (!reviewResult.value?.issues) {
    suggestions.value = []
    return
  }

  suggestions.value = reviewResult.value.issues.map((issue, index) => ({
    id: `suggestion_${index}`,
    issueId: issue.id || `issue_${index}`,
    position: issue.position || '',
    // AI 返回的是 searchKeyword 字段
    keyword: issue.searchKeyword || issue.keyword || '',
    // AI 决定操作类型：高风险用修订，其他用批注
    actionType: issue.severity === 'high' ? 'revision' : 'comment',
    content: issue.comment || '',
    severity: issue.severity || 'medium',
    selected: true,
    source: 'ai'
  }))
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
        const commentText = item.actionType === 'revision' 
          ? `[修订建议] ${item.content}` 
          : item.content
        wpsDocumentService.addComment(range, commentText)
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

// 暴露方法给父组件
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

defineExpose({
  triggerExecute,
  isProcessing,
  pageState
})
</script>


