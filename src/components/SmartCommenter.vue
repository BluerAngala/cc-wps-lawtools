<template>
  <n-card size="small" class="wps-card">
    <n-space vertical :size="16">
      <!-- 模式切换 -->
      <n-alert 
        :title="getModeDescription()" 
        type="info" 
        :closable="false" 
        show-icon 
      />

      <div class="text-center mode-buttons">
        <n-space justify="center" :size="6" :wrap="false">
          <n-button
            :type="currentMode === 'keyword' ? 'primary' : 'default'"
            @click="switchMode('keyword')"
            size="small"
            round
            :disabled="isAIProcessing"
          >
            🔍 关键词
          </n-button>
          <n-button
            :type="currentMode === 'aiReview' ? 'primary' : 'default'"
            @click="switchMode('aiReview')"
            size="small"
            round
            :disabled="isAIProcessing"
          >
            ⚖️ AI预审
          </n-button>
          <n-button
            :type="currentMode === 'aiLawyer' ? 'primary' : 'default'"
            @click="switchMode('aiLawyer')"
            size="small"
            round
            :disabled="isAIProcessing"
          >
            👨‍⚖️ AI+律师
          </n-button>
        </n-space>
      </div>

      <!-- 审查选项（仅AI模式显示） -->
      <n-collapse v-if="isAIMode()">
        <n-collapse-item title="审查选项" name="options">
          <n-space vertical>
            <n-radio-group v-model:value="reviewStrategy">
              <n-space vertical>
                <n-radio value="segment">分段审查（推荐）</n-radio>
                <n-radio value="full">全文审查</n-radio>
              </n-space>
            </n-radio-group>
            <n-checkbox v-model:checked="options.autoApply">
              自动应用批注
            </n-checkbox>
          </n-space>
        </n-collapse-item>
      </n-collapse>

      <!-- 配置表单 -->
      <div v-if="currentMode === 'keyword' || currentMode === 'aiLawyer'">
        <ConfigForm 
          :config="getConfigForm()" 
          :mode="currentMode === 'keyword' ? 'keyword' : 'review'" 
          @update-config="updateConfig" 
        />
      </div>

      <!-- AI审查执行进度提示 -->
      <n-alert 
        v-if="isAIMode() && isAIProcessing" 
        type="info" 
        :closable="false"
        show-icon
      >
        <template #header>
          <n-space :size="8" align="center">
            <n-spin size="small" />
            <span>正在审查中...</span>
          </n-space>
        </template>
        <div class="text-sm">
          <div v-if="reviewProgress.current > 0">
            进度: {{ reviewProgress.current }} / {{ reviewProgress.total }} 段
            <n-progress 
              :percentage="Math.round((reviewProgress.current / reviewProgress.total) * 100)" 
              :show-indicator="false"
              style="margin-top: 8px;"
            />
          </div>
          <div v-else-if="reviewProgress.stage">
            {{ reviewProgress.stage }}
          </div>
        </div>
      </n-alert>

      <!-- 合同类型显示（识别后立即显示） -->
      <n-alert 
        v-if="isAIMode() && identifiedContractType" 
        type="info" 
        :title="`已识别合同类型: ${identifiedContractType.type}${identifiedContractType.subtype ? ` (${identifiedContractType.subtype})` : ''}`"
        :closable="false"
        show-icon
      />

      <!-- 审查任务清单（仅AI模式显示） -->
      <n-card v-if="isAIMode() && reviewTasks && reviewTasks.length > 0" size="small" title="审查任务清单">
        <n-collapse accordion>
          <n-collapse-item 
            v-for="(task, index) in reviewTasks" 
            :key="index"
            :name="task.id"
          >
            <template #header>
              <n-space :size="8" align="center">
                <span v-if="task.status === 'completed'" class="text-green-600">✅</span>
                <span v-else-if="task.status === 'processing'" class="text-blue-500">⏳</span>
                <span v-else class="text-gray-400">○</span>
                <span>{{ task.name }}</span>
                <span v-if="task.status === 'completed'" class="text-sm text-gray-500">
                  ({{ task.issues || 0 }} 个问题)
                </span>
              </n-space>
            </template>
            <template #header-extra>
              <n-space :size="8">
                <n-tag 
                  :type="getRiskLevelType(task.riskLevel || task.priority)"
                  size="small"
                  round
                >
                  {{ getRiskLevelText(task.riskLevel || task.priority) }}
                </n-tag>
                <n-tag 
                  v-if="task.status === 'completed'"
                  :type="task.issues > 0 ? 'error' : 'success'"
                  size="small"
                  round
                >
                  {{ task.issues || 0 }} 个问题
                </n-tag>
              </n-space>
            </template>

            <n-space vertical :size="12" class="overflow-hidden">
              <!-- 审查要求 -->
              <div v-if="task.reviewRequirements" class="overflow-hidden">
                <div class="text-sm font-medium text-gray-700 mb-2">审查要求：</div>
                <div class="text-sm text-gray-600 break-words">{{ task.reviewRequirements }}</div>
              </div>

              <!-- 审查依据 -->
              <div v-if="task.reviewBasis" class="overflow-hidden">
                <div class="text-sm font-medium text-gray-700 mb-2">审查依据：</div>
                <div class="text-sm text-gray-600 break-words">{{ task.reviewBasis }}</div>
              </div>

              <!-- 该任务的问题列表 -->
              <div v-if="task.relatedIssues && task.relatedIssues.length > 0" class="overflow-hidden">
                <div class="text-sm font-medium text-gray-700 mb-2">发现问题 ({{ task.relatedIssues.length }} 个)：</div>
                <n-list size="small">
                  <n-list-item v-for="(issue, idx) in task.relatedIssues" :key="idx" class="overflow-hidden">
                    <n-thing>
                      <template #header>
                        <n-space :size="8" wrap>
                          <n-tag 
                            :type="issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'" 
                            size="small" 
                            round
                          >
                            {{ getSeverityText(issue.severity || 'medium') }}
                          </n-tag>
                          <n-tag 
                            v-if="getCleanPosition(issue.position)" 
                            type="info" 
                            size="small" 
                            round
                          >
                            {{ getCleanPosition(issue.position) }}
                          </n-tag>
                        </n-space>
                      </template>
                      <template #description>
                        <div class="text-sm text-gray-600 mt-1 break-words overflow-wrap-anywhere">{{ issue.comment }}</div>
                        <div v-if="issue.keyword || issue.searchKeyword" class="text-xs text-gray-400 mt-1 break-words overflow-wrap-anywhere">
                          关键词: {{ (issue.searchKeyword || issue.keyword || '').substring(0, 50) }}{{ (issue.searchKeyword || issue.keyword || '').length > 50 ? '...' : '' }}
                        </div>
                      </template>
                    </n-thing>
                  </n-list-item>
                </n-list>
              </div>

              <!-- 该任务的风险点 -->
              <div v-if="task.relatedRisks && task.relatedRisks.length > 0">
                <div class="text-sm font-medium text-gray-700 mb-2">风险点 ({{ task.relatedRisks.length }} 个)：</div>
                <n-list size="small">
                  <n-list-item v-for="(risk, idx) in task.relatedRisks" :key="idx">
                    <n-thing>
                      <template #header>
                        <n-tag 
                          :type="risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'info'" 
                          size="small" 
                          round
                        >
                          {{ risk.severity }}
                        </n-tag>
                      </template>
                      <template #description>
                        <div class="text-sm font-medium text-gray-700 mt-1">{{ risk.description }}</div>
                        <div class="text-sm text-gray-600 mt-1">{{ risk.suggestion }}</div>
                      </template>
                    </n-thing>
                  </n-list-item>
                </n-list>
              </div>

              <!-- 无问题提示 -->
              <div v-if="task.status === 'completed' && (!task.relatedIssues || task.relatedIssues.length === 0) && (!task.relatedRisks || task.relatedRisks.length === 0)" class="text-sm text-green-600">
                ✓ 未发现问题
              </div>
            </n-space>
          </n-collapse-item>
        </n-collapse>
      </n-card>

      <!-- 审查结果统计（仅AI模式显示） -->
      <n-card v-if="isAIMode() && reviewResult && reviewResult.segments && reviewResult.segments.length > 0" size="small" title="审查统计">
        <n-list>
          <n-list-item>
            <n-space vertical :size="4">
              <div class="text-sm text-gray-600">
                共审查 {{ reviewResult.segments.length }} 个部分，
                发现问题 {{ reviewResult.summary?.totalIssues || 0 }} 个，
                风险点 {{ reviewResult.summary?.totalRisks || 0 }} 个
                <span v-if="reviewResult.segments.some(s => s.applied)" class="text-green-600">
                  （已应用批注 {{ reviewResult.segments.reduce((sum, s) => sum + (s.applied || 0), 0) }} 个）
                </span>
              </div>
            </n-space>
          </n-list-item>
        </n-list>
      </n-card>

      <!-- 空状态 -->
      <n-empty v-if="isAIMode() && !reviewResult" description="点击「开始处理」按钮开始审查合同" />
    </n-space>
  </n-card>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import {
  NCard,
  NButton,
  NTag,
  NAlert,
  NSpace,
  NCollapse,
  NCollapseItem,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NList,
  NListItem,
  NEmpty,
  NSpin,
  NThing,
  NProgress
} from 'naive-ui'
import ConfigForm from './ConfigForm.vue'
import { contractService } from '../services/contract/contractService.js'
import { reviewAIService } from '../services/contract/reviewAIService.js'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'
import { wpsDocumentService } from '../services/wps/wpsDocumentService.js'

// Props
const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  },
  keywordConfig: {
    type: Object,
    default: () => ({})
  },
  reviewConfig: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['execute', 'update-config'])

// 当前模式
const currentMode = ref('keyword')

// 审查选项（仅AI模式）
const reviewStrategy = ref('segment') // 'segment' | 'full'
const options = ref({
  autoApply: true // 自动应用批注
})

// 配置表单（从 props 初始化，不使用硬编码的默认值）
const configForm = reactive({
  keywordList: [],
  reviewKeywordList: []
})

// 审查结果（仅AI模式）
const reviewResult = ref(null)
const reviewTasks = ref([]) // 审查任务清单
const identifiedContractType = ref(null) // 识别到的合同类型
const isAIProcessing = ref(false) // AI审查是否正在执行
const reviewProgress = ref({
  current: 0,
  total: 0,
  stage: '' // 当前阶段：识别合同类型、生成清单、审查中
})

// 方法
const isAIMode = () => {
  return currentMode.value === 'aiReview' || currentMode.value === 'aiLawyer'
}

const getModeDescription = () => {
  if (currentMode.value === 'keyword') {
    return '匹配关键词并添加固定的批注或修订内容'
  } else if (currentMode.value === 'aiReview') {
    return 'AI根据合同类型的通用审查清单自动完成审查，添加批注'
  } else if (currentMode.value === 'aiLawyer') {
    return '在AI预审模式基础上，加上自定义的审查规则，完成审查并且添加批注'
  }
  return ''
}

const getConfigForm = () => {
  if (currentMode.value === 'keyword') {
    return { keywordList: { type: 'keywordList', value: configForm.keywordList } }
  } else if (currentMode.value === 'aiLawyer') {
    return { keywordList: { type: 'keywordList', value: configForm.reviewKeywordList } }
  }
  return {}
}

const executeCommenting = async () => {
  if (currentMode.value === 'keyword') {
    // 关键词批注模式
    const config = {
      mode: 'keyword',
      keywordList: configForm.keywordList
    }
    emit('execute', config)
  } else if (currentMode.value === 'aiReview' || currentMode.value === 'aiLawyer') {
    // AI审查模式
    if (isAIProcessing.value) {
      window.$message?.warning('审查正在进行中，请等待完成')
      return
    }

    try {
      isAIProcessing.value = true
      reviewResult.value = null
      reviewTasks.value = []
      reviewProgress.value = { current: 0, total: 0, stage: '正在识别合同类型...' }

      // 1. 先识别合同类型并生成审查清单
      const fullText = wpsDocumentService.getFullText()
      if (!fullText) {
        throw new Error('无法获取文档内容')
      }

      const contractType = await reviewAIService.identifyContractType(fullText)
      reviewProgress.value.stage = '正在生成审查清单...'
      
      // 2. 生成审查清单
      const baseChecklist = reviewChecklistGenerator.generateChecklist(contractType)
      let checklist = baseChecklist
      
      // 3. 如果是AI+律师模式，合并用户自定义规则
      if (currentMode.value === 'aiLawyer') {
        const userRules = configForm.reviewKeywordList.map(item => ({
          reviewRules: item.keyword,
          reviewRequirements: item.comment,
          actionType: item.actionType
        }))
        checklist = reviewChecklistGenerator.mergeUserRules(baseChecklist, userRules)
      }

      // 保存识别到的合同类型和清单（供进度回调使用）
      identifiedContractType.value = contractType
      reviewProgress.value.stage = ''
      const savedChecklist = checklist // 保存清单引用

      // 4. 根据审查清单初始化任务列表
      reviewTasks.value = checklist.map((item, index) => ({
        id: `checklist_${item.id || index}`,
        checklistId: item.id || String(index),
        name: item.name,
        status: 'processing', // 初始状态设为processing，表示审查已开始
        issues: 0,
        error: null,
        // 添加详细信息
        reviewRequirements: item.reviewRequirements || '',
        riskLevel: item.riskLevel || item.priority || 'medium',
        reviewBasis: item.reviewBasis || '',
        priority: item.priority || 'medium',
        relatedIssues: [], // 该任务相关的问题
        relatedRisks: [] // 该任务相关的风险点
      }))

      // 5. 进度回调 - 更新审查清单任务状态
      const onProgress = (current, total, segment, result) => {
        if (!segment || !segment.section) return

        // 更新进度
        reviewProgress.value.current = current
        reviewProgress.value.total = total
        reviewProgress.value.stage = `正在审查第 ${current}/${total} 段: ${segment.section.title || '未知'}`

        // 确保所有任务都是processing状态（如果还是pending的话）
        reviewTasks.value.forEach(task => {
          if (task.status === 'pending') {
            task.status = 'processing'
          }
        })

        // 根据本段审查结果更新任务问题数和状态
        if (result) {
          // 优先使用checklistStats（更准确）
          if (result.checklistStats) {
            Object.entries(result.checklistStats).forEach(([checklistId, stat]) => {
              const task = reviewTasks.value.find(item => item.checklistId === checklistId)
              if (task) {
                const count = typeof stat === 'number' ? stat : stat?.count || 0
                task.issues = (task.issues || 0) + count
                
                // 如果该任务已经有问题被审查到，标记为已完成
                if (count > 0 && task.status === 'processing') {
                  task.status = 'completed'
                }
              }
            })
          }
          
          // 通过问题列表匹配任务并分配问题（实时更新relatedIssues）
          if (result.issues && result.issues.length > 0) {
            reviewTasks.value.forEach(task => {
              if (task.status === 'processing' || task.status === 'completed') {
                // 检查是否有问题匹配到该任务
                const taskItem = savedChecklist.find(item => item.id === task.checklistId)
                if (taskItem) {
                  const taskKeywords = taskItem.keywords || []
                  const matchedIssues = result.issues.filter(issue => {
                    if (issue.checklistId === task.checklistId) return true
                    const issueText = (issue.keyword || issue.comment || issue.position || '').toLowerCase()
                    return taskKeywords.some(keyword => issueText.includes(keyword.toLowerCase()))
                  })
                  
                  if (matchedIssues.length > 0) {
                    // 累加问题数
                    task.issues = (task.issues || 0) + matchedIssues.length
                    // 实时分配问题到relatedIssues（避免重复）
                    if (!task.relatedIssues) {
                      task.relatedIssues = []
                    }
                    matchedIssues.forEach(issue => {
                      // 检查是否已存在（避免重复添加）
                      const exists = task.relatedIssues.some(existing => 
                        existing.keyword === issue.keyword && existing.comment === issue.comment
                      )
                      if (!exists) {
                        task.relatedIssues.push(issue)
                      }
                    })
                    // 更新问题数（使用实际分配的问题数）
                    task.issues = task.relatedIssues.length
                    task.status = 'completed'
                  }
                }
              }
            })
          }
        }

        // 最后一段完成后将所有剩余任务标记为完成
        if (current === total) {
          reviewProgress.value.stage = '正在整理审查结果...'
          reviewTasks.value.forEach(task => {
            if (task.status !== 'error' && task.status !== 'completed') {
              task.status = 'completed'
            }
          })
        }
      }

      // 6. 执行审查
      const result = await contractService.reviewContract({
        strategy: reviewStrategy.value,
        autoApply: options.value.autoApply,
        useCustomRules: currentMode.value === 'aiLawyer', // AI+律师模式使用自定义规则
        onProgress: onProgress
      })

      reviewResult.value = result

      // 7. 根据审查结果总结更新任务状态和问题数，并将问题/风险点分配到对应任务
      if (result.checklistSummary) {
        reviewTasks.value.forEach(task => {
          const summary = result.checklistSummary[task.checklistId]
          task.issues = summary?.count || 0
          
          // 分配该任务相关的问题
          if (result.issues && result.issues.length > 0) {
            task.relatedIssues = result.issues.filter(issue => 
              issue.checklistId === task.checklistId
            )
          }
          
          if (task.status !== 'error') {
            task.status = 'completed'
          }
        })
      } else {
        // 如果没有checklistSummary，通过匹配分配问题
        if (result.issues && result.issues.length > 0) {
          reviewTasks.value.forEach(task => {
            task.relatedIssues = result.issues.filter(issue => {
              if (issue.checklistId === task.checklistId) return true
              // 通过关键词匹配
              const issueText = (issue.keyword || issue.comment || issue.position || '').toLowerCase()
              const taskKeywords = checklist.find(item => item.id === task.checklistId)?.keywords || []
              return taskKeywords.some(keyword => issueText.includes(keyword.toLowerCase()))
            })
            task.issues = task.relatedIssues.length
          })
        }
        
        reviewTasks.value.forEach(task => {
          if (task.status !== 'error') {
            task.status = 'completed'
          }
        })
      }

      // 分配风险点到任务（通过关键词匹配）
      if (result.risks && result.risks.length > 0) {
        reviewTasks.value.forEach(task => {
          const taskItem = checklist.find(item => item.id === task.checklistId)
          if (taskItem) {
            task.relatedRisks = result.risks.filter(risk => {
              const riskText = (risk.description || risk.suggestion || '').toLowerCase()
              const taskKeywords = taskItem.keywords || []
              return taskKeywords.some(keyword => riskText.includes(keyword.toLowerCase()))
            })
          }
        })
      }

      // 重置处理状态
      isAIProcessing.value = false
      reviewProgress.value = { current: 0, total: 0, stage: '' }

      // 显示成功提示
      setTimeout(() => {
        window.$message?.success(
          `审查完成！共发现问题 ${result.summary?.totalIssues || 0} 个，风险点 ${result.summary?.totalRisks || 0} 个`
        )
      }, 100)
    } catch (error) {
      // 重置处理状态
      isAIProcessing.value = false
      reviewProgress.value = { current: 0, total: 0, stage: '' }
      window.$message?.error(error.message || '审查失败，请重试')
    }
  }
}

const switchMode = (mode) => {
  // 如果正在执行AI审查，阻止切换
  if (isAIProcessing.value) {
    window.$message?.warning('审查正在进行中，请等待完成后再切换模式')
    return
  }
  
  currentMode.value = mode
  // 切换模式时清空结果
  reviewResult.value = null
  reviewTasks.value = []
  identifiedContractType.value = null
  reviewProgress.value = { current: 0, total: 0, stage: '' }
}

// 获取清理后的位置信息（去除内部分段信息）
const getCleanPosition = (position) => {
  if (!position) return null
  
  // 去除"第X段"这种内部分段信息
  const cleaned = position.replace(/第\d+段/g, '').trim()
  
  // 如果清理后为空或只包含标点符号，返回null
  if (!cleaned || cleaned.length < 2) {
    return null
  }
  
  // 如果包含章节信息（如"第九条"、"第十二条"），保留
  if (cleaned.match(/第[一二三四五六七八九十百千万\d]+[条款章]/)) {
    return cleaned
  }
  
  // 如果包含其他有意义的位置信息，保留
  if (cleaned.length >= 3) {
    return cleaned
  }
  
  return null
}

// 获取严重程度文本
const getSeverityText = (severity) => {
  if (severity === 'high') return '高风险'
  if (severity === 'medium') return '中风险'
  return '低风险'
}

// 获取风险等级类型
const getRiskLevelType = (level) => {
  if (level === 'high') return 'error'
  if (level === 'medium') return 'warning'
  return 'info'
}

// 获取风险等级文本
const getRiskLevelText = (level) => {
  if (level === 'high') return '高风险'
  if (level === 'medium') return '中风险'
  return '低风险'
}

const updateConfig = (configData) => {
  // 更新对应模式的数组
  if (currentMode.value === 'keyword') {
    configForm.keywordList = configData.keywordList.value
  } else if (currentMode.value === 'aiLawyer') {
    configForm.reviewKeywordList = configData.keywordList.value
  }
  emit('update-config', configForm)
}

// 监听 props 变化，同步配置
watch(
  () => props.keywordConfig,
  (newConfig) => {
    if (newConfig && newConfig.keywordList) {
      configForm.keywordList = newConfig.keywordList
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.reviewConfig,
  (newConfig) => {
    if (newConfig && newConfig.contractReviewRules) {
      // review 配置使用 contractReviewRules 字段，转换为组件内部格式
      configForm.reviewKeywordList = newConfig.contractReviewRules.map(rule => ({
        keyword: rule.reviewRules,
        comment: rule.reviewRequirements,
        actionType: rule.actionType
      }))
    }
  },
  { immediate: true, deep: true }
)

defineExpose({
  triggerExecute: executeCommenting,
  isAIProcessing
})
</script>

<style scoped>
.wps-card {
  max-width: 100%;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-600 {
  color: #4b5563;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-500 {
  color: #ef4444;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.mode-buttons {
  white-space: nowrap;
}

.mode-buttons :deep(.n-space) {
  flex-wrap: nowrap !important;
}
</style>
