/**
 * 合同审查公共逻辑 Composable
 * 抽取 AIFullReview 和 AILawyerReview 的公共逻辑
 */

import { ref, computed } from 'vue'
import { useWorkflowExecution } from './useWorkflowExecution.js'
import { useWpsEnvironment } from './useWpsEnvironment.js'
import { ActionTypes } from '../services/workflow'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'
import { wpsDocumentService } from '../services/wps'

export function useContractReview() {
  const { executePreset, getResultData, reset: resetWorkflow } = useWorkflowExecution()
  const { getFullText } = useWpsEnvironment()

  const pageState = ref('idle')
  const progressText = ref('')
  const perspective = ref('neutral')
  const customPerspective = ref('')
  const documentType = ref(null)
  const checklist = ref([])
  const reviewResult = ref(null)
  const suggestions = ref([])
  const expandedId = ref(null)

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

  const selectedChecklistCount = computed(() => checklist.value.filter((i) => i.selected).length)

  const passedCount = computed(() => {
    if (!reviewResult.value) return 0
    return checklist.value.filter((item) => {
      const issues = (reviewResult.value.issues || []).filter((i) => i.checklistId === item.id)
      return item.selected && issues.length === 0
    }).length
  })

  const failedCount = computed(() => {
    if (!reviewResult.value) return 0
    return checklist.value.filter((item) => {
      const issues = (reviewResult.value.issues || []).filter((i) => i.checklistId === item.id)
      return item.selected && issues.length > 0
    }).length
  })

  const selectedSuggestionCount = computed(() => suggestions.value.filter((s) => s.selected).length)
  const selectedSuggestions = computed(() => suggestions.value.filter((s) => s.selected))

  const isProcessing = computed(
    () => pageState.value === 'generating' || pageState.value === 'reviewing'
  )

  const toggleExpand = (id) => {
    expandedId.value = expandedId.value === id ? null : id
  }

  const getItemIssues = (itemId) => {
    if (!reviewResult.value) return []
    return (reviewResult.value.issues || []).filter((i) => i.checklistId === itemId)
  }

  const getSuggestionByIssue = (issue) => {
    return suggestions.value.find(
      (s) => s.issueId === issue.id || s.keyword === (issue.searchKeyword || issue.keyword)
    )
  }

  const toggleSuggestionByIssue = (issue, selected) => {
    const suggestion = getSuggestionByIssue(issue)
    if (suggestion) suggestion.selected = selected
  }

  const getSeverityColor = (level) => {
    const colorMap = { high: 'error', medium: 'warning', low: 'info' }
    return colorMap[level] || 'default'
  }

  const getSeverityText = (level) => {
    const textMap = { high: '高风险', medium: '中风险', low: '低风险' }
    return textMap[level] || '未知'
  }

  const getEffectivePerspective = () => {
    if (perspective.value === 'custom' && customPerspective.value.trim()) {
      return customPerspective.value.trim()
    }
    return perspective.value
  }

  const toggleChecklistItem = (id, checked) => {
    const item = checklist.value.find((i) => i.id === id)
    if (item) item.selected = checked
  }

  const selectAllChecklist = () =>
    checklist.value.forEach((i) => {
      i.selected = true
    })

  const selectRequiredChecklist = () =>
    checklist.value.forEach((i) => {
      i.selected = i.required
    })

  const generateSuggestions = () => {
    if (!reviewResult.value?.issues) {
      suggestions.value = []
      return
    }

    suggestions.value = reviewResult.value.issues.map((issue, index) => ({
      id: `suggestion_${index}`,
      issueId: issue.id || `issue_${index}`,
      position: issue.position || '',
      keyword: issue.searchKeyword || issue.keyword || '',
      actionType: issue.severity === 'high' ? 'revision' : 'comment',
      content: issue.comment || '',
      severity: issue.severity || 'medium',
      selected: true,
      source: 'ai'
    }))
  }

  const cleanKeyword = (keyword) => {
    if (!keyword) return ''
    const lines = keyword
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0) return ''
    let cleaned = lines[0].replace(/\s+/g, ' ').trim()
    if (cleaned.length > 50) cleaned = cleaned.slice(0, 50)
    return cleaned
  }

  const tryFindRange = (keyword) => {
    let range = wpsDocumentService.findRangeByKeyword(keyword)
    if (range) return range
    if (keyword.length > 20) {
      range = wpsDocumentService.findRangeByKeyword(keyword.slice(0, 20))
      if (range) return range
    }
    if (keyword.length > 10) {
      range = wpsDocumentService.findRangeByKeyword(keyword.slice(0, 10))
      if (range) return range
    }
    return null
  }

  const handleApplyModifications = async () => {
    const toApply = selectedSuggestions.value
    if (toApply.length === 0) return

    let successCount = 0
    let failCount = 0

    for (const item of toApply) {
      try {
        const keyword = cleanKeyword(item.keyword)
        if (!keyword || keyword.length < 2) {
          failCount++
          continue
        }
        const range = tryFindRange(keyword)
        if (range) {
          const commentText =
            item.actionType === 'revision' ? `[修订建议] ${item.content}` : item.content
          wpsDocumentService.addComment(range, commentText)
          successCount++
        } else {
          failCount++
        }
      } catch (err) {
        failCount++
      }
    }

    if (failCount > 0) {
      window.$message?.warning(`执行完成：成功 ${successCount} 个，失败 ${failCount} 个`)
    } else {
      window.$message?.success(`执行完成：成功 ${successCount} 个`)
    }
  }

  const handleGenerateChecklist = async (emit) => {
    if (perspective.value === 'custom' && !customPerspective.value.trim()) {
      window.$message?.warning('请输入自定义审查视角')
      return { success: false }
    }

    const fullText = getFullText()
    if (!fullText) {
      window.$message?.warning('无法读取文档内容')
      return { success: false }
    }

    pageState.value = 'generating'
    progressText.value = '正在识别合同类型...'
    emit?.('stateChange', 'generating')

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
          checklist.value = reviewChecklistGenerator.generateChecklist(
            { type: 'default' },
            perspective.value
          )
        }
        pageState.value = 'ready'
        window.$message?.success(`已生成 ${checklist.value.length} 项审查清单`)
        emit?.('stateChange', pageState.value)
        return { success: true }
      } else {
        pageState.value = 'idle'
        window.$message?.error(result.message || '生成清单失败')
        emit?.('stateChange', pageState.value)
        return { success: false }
      }
    } catch (error) {
      pageState.value = 'idle'
      window.$message?.error('生成清单失败: ' + error.message)
      emit?.('stateChange', pageState.value)
      return { success: false }
    }
  }

  const handleStartReview = async (emit, extraParams = {}) => {
    const selectedItems = checklist.value.filter((i) => i.selected)
    if (selectedItems.length === 0) {
      window.$message?.warning('请至少选择一个审查项')
      return { success: false }
    }

    pageState.value = 'reviewing'
    progressText.value = '正在审查...'
    emit?.('stateChange', 'reviewing')

    try {
      const result = await executePreset('execute-risk-review', {
        stepParams: {
          [ActionTypes.REVIEW_CONTRACT]: {
            perspective: getEffectivePerspective(),
            depth: 'standard',
            autoApply: false,
            contractType: documentType.value,
            checklist: selectedItems,
            ...extraParams
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
        const totalIssues = reviewResult.value?.summary?.totalIssues || 0
        window.$message?.success(`审查完成！检测到 ${totalIssues} 个问题`)
        emit?.('stateChange', pageState.value)
        return { success: true }
      } else {
        pageState.value = 'ready'
        window.$message?.error(result.message || '审查失败')
        emit?.('stateChange', pageState.value)
        return { success: false }
      }
    } catch (error) {
      pageState.value = 'ready'
      window.$message?.error('审查失败: ' + error.message)
      emit?.('stateChange', pageState.value)
      return { success: false }
    }
  }

  const handleReset = (emit) => {
    pageState.value = 'idle'
    documentType.value = null
    checklist.value = []
    reviewResult.value = null
    suggestions.value = []
    resetWorkflow()
    emit?.('stateChange', 'idle')
  }

  return {
    pageState,
    progressText,
    perspective,
    customPerspective,
    documentType,
    checklist,
    reviewResult,
    suggestions,
    expandedId,
    perspectiveDescription,
    perspectiveLabel,
    selectedChecklistCount,
    passedCount,
    failedCount,
    selectedSuggestionCount,
    selectedSuggestions,
    isProcessing,
    toggleExpand,
    getItemIssues,
    getSuggestionByIssue,
    toggleSuggestionByIssue,
    getSeverityColor,
    getSeverityText,
    getEffectivePerspective,
    toggleChecklistItem,
    selectAllChecklist,
    selectRequiredChecklist,
    generateSuggestions,
    handleApplyModifications,
    handleGenerateChecklist,
    handleStartReview,
    handleReset,
    getFullText,
    executePreset,
    getResultData
  }
}
