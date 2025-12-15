<template>
  <PageLayout>
    <!-- 标题卡片 -->
    <PageHeader
      title="合同风险扫描"
      icon="⚠️"
      :loading="isExecuting"
      loading-text="扫描中"
      description="使用 AI 智能分析合同内容，识别潜在风险点和问题条款。本功能仅进行预审分析，不会修改文档内容。"
    >
      <template #actions>
        <n-button type="primary" @click="startScan" :loading="isExecuting" :disabled="isExecuting">
          {{ isExecuting ? '扫描中...' : '开始扫描' }}
        </n-button>
      </template>
    </PageHeader>

    <!-- 扫描选项 -->
    <div class="wps-card wps-section mt-2">
      <n-space vertical>
        <div class="text-sm font-semibold">扫描选项</div>
        <n-radio-group v-model:value="scanStrategy">
          <n-space vertical>
            <n-radio value="full">
              <n-space align="center">
                <span>全文扫描</span>
                <n-tag size="tiny" type="success">推荐</n-tag>
              </n-space>
            </n-radio>
            <n-radio value="segment">
              <span>分段扫描（适合长文档）</span>
            </n-radio>
          </n-space>
        </n-radio-group>
      </n-space>
    </div>

    <!-- 合同类型识别结果 -->
    <div v-if="contractType" class="wps-card wps-section mt-2">
      <n-space align="center">
        <span class="text-sm font-semibold">识别的合同类型:</span>
        <n-tag type="primary">{{ contractType }}</n-tag>
      </n-space>
    </div>

    <!-- 扫描进度 -->
    <div v-if="isExecuting" class="wps-card wps-section mt-2">
      <n-space vertical>
        <div class="flex items-center gap-2">
          <n-spin size="small" />
          <span class="text-sm font-semibold">{{ scanStage }}</span>
        </div>
        <n-progress 
          type="line" 
          status="info"
          :percentage="100"
          :show-indicator="false"
          :processing="true"
        />
      </n-space>
    </div>

    <!-- 审查清单（扫描过程中先显示） -->
    <div v-if="checklist.length > 0" class="wps-card wps-section mt-2">
      <n-collapse :default-expanded-names="isExecuting ? ['checklist'] : []">
        <n-collapse-item name="checklist">
          <template #header>
            <n-space align="center">
              <span class="text-base font-semibold">📋 审查清单</span>
              <n-tag size="small" type="info">{{ checklist.length }} 项</n-tag>
              <n-tag v-if="isExecuting" size="tiny" type="warning">审查中...</n-tag>
            </n-space>
          </template>
          <n-list bordered>
            <n-list-item v-for="(item, index) in checklist" :key="index">
              <n-thing>
                <template #header>
                  <n-space align="center">
                    <n-tag :type="isChecklistItemMatched(item.id) ? 'success' : 'default'" size="small">
                      {{ isChecklistItemMatched(item.id) ? '✓' : '○' }}
                    </n-tag>
                    <span>{{ item.name }}</span>
                    <n-tag v-if="item.required" type="error" size="tiny">必需</n-tag>
                  </n-space>
                </template>
                <template #description>
                  <div class="text-sm text-gray-600 mt-1">{{ item.reviewRequirements }}</div>
                  <div v-if="isChecklistItemMatched(item.id)" class="text-xs text-green-600 mt-1">
                    ✓ 已检测到相关内容 ({{ getChecklistMatchCount(item.id) }} 个问题)
                  </div>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 扫描结果 -->
    <div v-if="scanResult" class="mt-2">
      <!-- 风险统计 -->
      <div class="wps-card wps-section">
        <div class="text-base font-semibold mb-4">📊 风险统计</div>
        <div class="grid grid-cols-3 gap-4">
          <n-statistic label="检测问题" :value="scanResult.summary?.totalIssues || 0">
            <template #suffix>个</template>
          </n-statistic>
          <n-statistic label="风险提示" :value="scanResult.summary?.totalRisks || 0">
            <template #suffix>个</template>
          </n-statistic>
          <n-statistic label="审查清单" :value="checklist.length">
            <template #suffix>项</template>
          </n-statistic>
        </div>
      </div>

      <!-- 检测到的问题 -->
      <div v-if="scanResult.issues && scanResult.issues.length > 0" class="wps-card wps-section mt-2">
        <n-collapse accordion>
          <n-collapse-item>
            <template #header>
              <n-space align="center">
                <span class="text-base font-semibold">⚠️ 检测到的问题</span>
                <n-tag size="small" type="warning">{{ scanResult.issues.length }} 个</n-tag>
              </n-space>
            </template>
            <n-collapse accordion>
              <n-collapse-item v-for="(issue, index) in scanResult.issues" :key="index">
                <template #header>
                  <n-space align="center">
                    <span class="text-gray-500 text-sm">{{ index + 1 }}.</span>
                    <n-tag :type="getRiskLevelColor(issue.severity)" size="small">
                      {{ getRiskLevelText(issue.severity) }}
                    </n-tag>
                    <span class="text-sm">{{ issue.position || '未知位置' }}</span>
                  </n-space>
                </template>
                <n-space vertical class="text-sm">
                  <div v-if="issue.keyword" class="bg-gray-50 p-2 rounded">
                    <div class="text-xs text-gray-500 mb-1">相关条款:</div>
                    <div class="text-gray-700">{{ issue.keyword }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-500 mb-1">问题描述:</div>
                    <div class="text-gray-700">{{ issue.comment }}</div>
                  </div>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- 风险提示 -->
      <div v-if="scanResult.risks && scanResult.risks.length > 0" class="wps-card wps-section mt-2">
        <n-collapse accordion>
          <n-collapse-item>
            <template #header>
              <n-space align="center">
                <span class="text-base font-semibold">🚨 风险提示</span>
                <n-tag size="small" type="error">{{ scanResult.risks.length }} 个</n-tag>
              </n-space>
            </template>
            <n-space vertical>
              <n-alert v-for="(risk, index) in scanResult.risks" :key="index" :type="getRiskAlertType(risk.severity)"
                :closable="false" show-icon>
                <template #header>{{ index + 1 }}. 风险提示</template>
                <template #default>
                  <div class="space-y-2">
                    <div><strong>风险描述:</strong> {{ risk.description }}</div>
                    <div v-if="risk.suggestion"><strong>建议:</strong> {{ risk.suggestion }}</div>
                  </div>
                </template>
              </n-alert>
            </n-space>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-2 mt-4">
        <n-button @click="exportReport" :disabled="!scanResult">导出报告</n-button>
        <n-button type="primary" @click="clearResults">清除结果</n-button>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else-if="!isExecuting && scanned"
      class="mt-2"
      description="未检测到风险"
      icon="✅"
    />
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { NButton, NSpace, NTag, NAlert, NRadioGroup, NRadio, NStatistic, NList, NListItem, NThing, NCollapse, NCollapseItem, NSpin, NProgress } from '../components/naive-components.js'
import { PageLayout, PageHeader, EmptyState } from '../components/common'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'
import { ActionTypes } from '../services/workflow'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'

// 使用工作流执行 composable
const { isExecuting, executePreset, getResultData, reset: resetWorkflow } = useWorkflowExecution()

// 使用 WPS 环境 composable
const { getFullText } = useWpsEnvironment()

// 响应式数据
const scanned = ref(false)
const scanStrategy = ref('full')
const contractType = ref('')
const contractTypeObj = ref(null)
const scanResult = ref(null)
const scanStage = ref('正在扫描...')
const checklist = ref([]) // 审查清单（扫描过程中先显示）

// 获取风险等级颜色
const getRiskLevelColor = (level) => {
  const colorMap = { high: 'error', medium: 'warning', low: 'info' }
  return colorMap[level] || 'default'
}

// 获取风险等级文本
const getRiskLevelText = (level) => {
  const textMap = { high: '高风险', medium: '中风险', low: '低风险' }
  return textMap[level] || '未知'
}

// 获取风险提示类型
const getRiskAlertType = (level) => {
  const typeMap = { high: 'error', medium: 'warning', low: 'info' }
  return typeMap[level] || 'default'
}

// 检查审查清单项是否匹配
const isChecklistItemMatched = (checklistId) => {
  if (!scanResult.value || !scanResult.value.issues) return false
  return scanResult.value.issues.some(issue => issue.checklistId === checklistId)
}

// 获取审查清单项匹配的问题数量
const getChecklistMatchCount = (checklistId) => {
  if (!scanResult.value || !scanResult.value.issues) return 0
  return scanResult.value.issues.filter(issue => issue.checklistId === checklistId).length
}


// 开始扫描
const startScan = async () => {
  const fullText = getFullText()
  if (!fullText) {
    scanned.value = true
    return
  }

  scanned.value = false
  scanResult.value = null
  contractType.value = ''

  // 计算预计时间并提示
  const wordCount = fullText.length
  let timeRange = ''
  if (scanStrategy.value === 'full') {
    const minTime = Math.ceil(wordCount / 600) * 10
    const maxTime = Math.ceil(wordCount / 400) * 15
    timeRange = maxTime <= 60 ? `${minTime}-${maxTime} 秒` : `${Math.ceil(minTime / 60)}-${Math.ceil(maxTime / 60)} 分钟`
  } else {
    const minTime = Math.ceil(wordCount / 1200) * 8
    const maxTime = Math.ceil(wordCount / 800) * 12
    timeRange = maxTime <= 60 ? `${minTime}-${maxTime} 秒` : `${Math.ceil(minTime / 60)}-${Math.ceil(maxTime / 60)} 分钟`
  }
  window.$message?.info(`文档字数: ${wordCount} 字 | 预计用时: ${timeRange}`, { duration: 6000 })

  // 更新扫描阶段的回调
  const updateStage = (progressInfo) => {
    if (progressInfo.stepName) {
      scanStage.value = progressInfo.stepName
      
      // 当识别合同类型步骤完成后，立即获取并显示审查清单
      if (progressInfo.stage === 'complete' && progressInfo.stepName === '识别合同类型') {
        // 使用 progressInfo.getStepData 获取当前步骤的数据
        const identifiedType = progressInfo.getStepData?.('contractType')
        if (identifiedType) {
          contractTypeObj.value = identifiedType
          contractType.value = identifiedType.subtype || identifiedType.type || '未知'
          // 生成审查清单
          checklist.value = reviewChecklistGenerator.generateChecklist(identifiedType)
          scanStage.value = '正在审查合同...'
        }
      }
    }
  }

  // 执行风险扫描工作流
  scanStage.value = '正在读取文档...'
  const result = await executePreset('contract-risk-scan', {
    stepParams: {
      [ActionTypes.REVIEW_CONTRACT]: {
        depth: scanStrategy.value === 'full' ? 'standard' : 'deep',
        autoApply: false
      }
    },
    onProgress: updateStage
  })

  scanned.value = true

  if (result.success) {
    // 从工作流结果中获取合同类型（如果还没获取）
    if (!contractType.value) {
      const identifiedType = getResultData('contractType')
      if (identifiedType) {
        contractTypeObj.value = identifiedType
        contractType.value = identifiedType.subtype || identifiedType.type || '未知'
      }
    }

    // 从工作流结果中获取审查结果
    const reviewResult = getResultData('reviewResult')
    if (reviewResult) {
      scanResult.value = reviewResult
      // 更新审查清单（使用审查结果中的清单，包含匹配信息）
      if (reviewResult.checklist) {
        checklist.value = reviewResult.checklist
      }
    }

    if (scanResult.value?.summary?.totalIssues > 0 || scanResult.value?.summary?.totalRisks > 0) {
      window.$message?.success(`扫描完成！检测到 ${scanResult.value.summary.totalIssues} 个问题，${scanResult.value.summary.totalRisks} 个风险提示`)
    } else {
      window.$message?.success('扫描完成，未发现明显风险')
    }
  }
}

// 清除结果
const clearResults = () => {
  scanResult.value = null
  contractType.value = ''
  contractTypeObj.value = null
  checklist.value = []
  scanned.value = false
  resetWorkflow()
}

// 导出报告
const exportReport = () => {
  if (!scanResult.value) {
    window.$message?.warning('没有可导出的报告')
    return
  }

  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  try {
    let reportText = '合同风险扫描报告\n\n'
    reportText += `合同类型：${contractType.value}\n\n`
    reportText += `═══════════════════════════════════\n\n`
    reportText += `风险统计\n\n`
    reportText += `检测问题：${scanResult.value.summary?.totalIssues || 0} 个\n`
    reportText += `风险提示：${scanResult.value.summary?.totalRisks || 0} 个\n`
    reportText += `审查清单：${scanResult.value.summary?.checklistCount || 0} 项\n\n`

    if (scanResult.value.issues?.length > 0) {
      reportText += `检测到的问题（${scanResult.value.issues.length}个）\n\n`
      scanResult.value.issues.forEach((issue, index) => {
        reportText += `${index + 1}. [${getRiskLevelText(issue.severity)}] ${issue.position || '未知位置'}\n`
        if (issue.keyword) reportText += `相关条款：${issue.keyword}\n`
        reportText += `问题描述：${issue.comment}\n\n`
      })
    }

    if (scanResult.value.risks?.length > 0) {
      reportText += `风险提示（${scanResult.value.risks.length}个）\n\n`
      scanResult.value.risks.forEach((risk, index) => {
        reportText += `${index + 1}. 风险描述：${risk.description}\n`
        if (risk.suggestion) reportText += `建议：${risk.suggestion}\n\n`
      })
    }

    reportText += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`

    const newDoc = window.Application.Documents.Add()
    newDoc.Range().Text = reportText
    window.$message?.success('报告已生成到新文档')
  } catch (error) {
    window.$message?.error('导出失败: ' + error.message)
  }
}
</script>
