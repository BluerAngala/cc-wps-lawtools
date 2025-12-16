<template>
  <PageLayout>
    <!-- 标题卡片 -->
    <PageHeader
      title="文档风险扫描"
      icon="⚠️"
      :loading="pageState === 'generating' || pageState === 'reviewing'"
      :loading-text="pageState === 'generating' ? '生成清单中' : '审查中'"
      description="使用 AI 智能分析文档内容，识别潜在风险点和问题条款。支持合同、诉讼文书、律师函等多种法律文书。"
    >
      <template #actions>
        <n-button 
          v-if="pageState === 'idle'" 
          type="primary" 
          @click="handleGenerateChecklist"
        >
          开始任务
        </n-button>
        <n-space v-else-if="pageState === 'ready'">
          <n-button @click="handleReset">重新生成</n-button>
          <n-button type="primary" @click="handleStartReview">开始审查</n-button>
        </n-space>
        <n-button 
          v-else-if="pageState === 'complete'" 
          type="primary" 
          @click="handleClearResults"
        >
          清除结果
        </n-button>
      </template>
    </PageHeader>

    <!-- 审查选项（仅在 idle 状态显示） -->
    <div v-if="pageState === 'idle'" class="wps-card wps-section mt-2">
      <n-space vertical size="large">
        <!-- 审查视角 -->
        <div>
          <div class="text-sm font-semibold mb-2">审查视角</div>
          <n-radio-group v-model:value="perspective">
            <n-space wrap>
              <n-radio value="partyA">
                <span>甲方视角</span>
              </n-radio>
              <n-radio value="partyB">
                <span>乙方视角</span>
              </n-radio>
              <n-radio value="neutral">
                <n-space align="center">
                  <span>中立视角</span>
                  <n-tag size="tiny" type="info">推荐</n-tag>
                </n-space>
              </n-radio>
              <n-radio value="custom">
                <span>自定义视角</span>
              </n-radio>
            </n-space>
          </n-radio-group>
          <div v-if="perspective !== 'custom'" class="text-xs text-gray-500 mt-1">{{ perspectiveDescription }}</div>
          <!-- 自定义视角输入 -->
          <div v-if="perspective === 'custom'" class="mt-2">
            <n-input
              v-model:value="customPerspective"
              type="textarea"
              placeholder="请输入自定义审查视角，例如：作为投资方，重点关注股权比例、退出机制、对赌条款等"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>
        </div>

        <!-- 扫描范围 -->
        <div>
          <div class="text-sm font-semibold mb-2">扫描范围</div>
          <n-radio-group v-model:value="scanScope">
            <n-space>
              <n-radio value="full">
                <n-space align="center">
                  <span>全文扫描</span>
                  <n-tag size="tiny" type="success">推荐</n-tag>
                </n-space>
              </n-radio>
              <n-radio value="selection">
                <span>选中内容扫描</span>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>
      </n-space>
    </div>

    <!-- 生成进度 -->
    <div v-if="pageState === 'generating'" class="wps-card wps-section mt-2">
      <n-space vertical>
        <div class="flex items-center gap-2">
          <n-spin size="small" />
          <span class="text-sm font-semibold">{{ progressText }}</span>
        </div>
        <n-progress type="line" status="info" :percentage="100" :show-indicator="false" :processing="true" />
      </n-space>
    </div>

    <!-- 文档类型识别结果 -->
    <div v-if="documentType && pageState !== 'idle'" class="wps-card wps-section mt-2">
      <n-space align="center">
        <span class="text-sm font-semibold">识别的文档类型:</span>
        <n-tag type="primary">{{ documentType.subtype || documentType.type || '未知' }}</n-tag>
        <n-tag size="small" :type="perspective === 'partyA' ? 'warning' : perspective === 'partyB' ? 'info' : 'default'">
          {{ perspectiveLabel }}
        </n-tag>
      </n-space>
    </div>

    <!-- 审查进度（显示在清单上方） -->
    <div v-if="pageState === 'reviewing'" class="wps-card wps-section mt-2">
      <n-space vertical>
        <div class="flex items-center gap-2">
          <n-spin size="small" />
          <span class="text-sm font-semibold">{{ progressText }}</span>
        </div>
        <n-progress type="line" status="info" :percentage="100" :show-indicator="false" :processing="true" />
      </n-space>
    </div>

    <!-- 审查清单（ready/reviewing 状态） -->
    <div v-if="checklist.length > 0 && (pageState === 'ready' || pageState === 'reviewing')" class="wps-card wps-section mt-2">
      <div class="flex items-center justify-between mb-3">
        <n-space align="center">
          <span class="text-base font-semibold">📋 审查清单</span>
          <n-tag size="small" type="info">{{ selectedCount }}/{{ checklist.length }} 项已选</n-tag>
        </n-space>
        <n-space v-if="pageState === 'ready'">
          <n-button size="tiny" @click="selectAll">全选</n-button>
          <n-button size="tiny" @click="selectRequired">仅必需项</n-button>
        </n-space>
      </div>
      
      <n-collapse accordion>
        <n-collapse-item v-for="item in checklist" :key="item.id" :name="item.id">
          <template #header>
            <n-space align="center" class="w-full" @click.stop>
              <n-checkbox 
                v-if="pageState === 'ready'"
                :checked="item.selected" 
                @update:checked="toggleItem(item.id, $event)"
                @click.stop
              />
              <n-tag v-if="pageState === 'reviewing'" size="small">审查中</n-tag>
              <span :class="{ 'text-gray-400': !item.selected && pageState === 'ready' }">
                {{ item.name }}
              </span>
              <n-tag v-if="item.required" type="error" size="tiny">必需</n-tag>
              <n-tag v-if="item.perspectiveFocus" type="warning" size="tiny">重点</n-tag>
            </n-space>
          </template>
          <div class="space-y-2">
            <div class="text-xs text-gray-500 mb-1">审查要点：</div>
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
            <div v-if="item.reviewBasis" class="text-xs text-gray-400">
              <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 审查结果（complete 状态） -->
    <div v-if="pageState === 'complete' && reviewResult" class="wps-card wps-section mt-2">
      <!-- 标题和统计 -->
      <div class="flex items-center justify-between mb-3">
        <n-space align="center">
          <span class="text-base font-semibold">📊 审查结果</span>
        </n-space>
      </div>
      
      <!-- 统计数据 -->
      <div class="grid grid-cols-4 gap-3 mb-4 text-center">
        <div class="bg-gray-50 rounded p-2">
          <div class="text-lg font-bold text-gray-700">{{ selectedCount }}</div>
          <div class="text-xs text-gray-500">审查项</div>
        </div>
        <div class="bg-green-50 rounded p-2">
          <div class="text-lg font-bold text-green-600">{{ passedCount }}</div>
          <div class="text-xs text-gray-500">已通过</div>
        </div>
        <div class="bg-orange-50 rounded p-2">
          <div class="text-lg font-bold text-orange-600">{{ failedCount }}</div>
          <div class="text-xs text-gray-500">有问题</div>
        </div>
        <div class="bg-red-50 rounded p-2">
          <div class="text-lg font-bold text-red-600">{{ reviewResult.summary?.totalIssues || 0 }}</div>
          <div class="text-xs text-gray-500">问题数</div>
        </div>
      </div>

      <!-- 详细结果列表 -->
      <n-collapse accordion>
        <n-collapse-item v-for="item in checklist.filter(i => i.selected)" :key="item.id" :name="item.id">
          <template #header>
            <n-space align="center" class="w-full">
              <n-tag :type="getChecklistItemStatus(item.id)" size="small">
                {{ getChecklistItemStatusText(item.id) }}
              </n-tag>
              <span class="text-sm">{{ item.name }}</span>
              <n-tag v-if="item.required" type="error" size="tiny">必需</n-tag>
              <n-tag v-if="getIssueCount(item.id) > 0" type="warning" size="tiny">
                {{ getIssueCount(item.id) }} 个问题
              </n-tag>
            </n-space>
          </template>
          
          <!-- 审查要点和法律依据（只读） -->
          <div v-if="item.reviewRequirements || item.reviewBasis" class="mb-3 p-2 bg-blue-50 rounded text-sm">
            <div v-if="item.reviewRequirements" class="text-gray-600">
              <span class="text-xs text-blue-600 font-medium">审查要点：</span>{{ item.reviewRequirements }}
            </div>
            <div v-if="item.reviewBasis" class="text-xs text-gray-500 mt-1">
              <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
            </div>
          </div>
          
          <!-- 问题列表 -->
          <div v-if="getIssueCount(item.id) > 0">
            <n-space vertical size="small">
              <div v-for="(issue, idx) in getItemIssues(item.id)" :key="idx" class="bg-gray-50 p-3 rounded">
                <n-space vertical size="small">
                  <n-space align="center">
                    <n-tag :type="getRiskLevelColor(issue.severity)" size="small">
                      {{ getRiskLevelText(issue.severity) }}
                    </n-tag>
                    <span class="text-xs text-gray-500">{{ issue.position || '未知位置' }}</span>
                  </n-space>
                  <div v-if="issue.keyword" class="text-sm text-gray-600">
                    <span class="text-xs text-gray-400">相关条款：</span>{{ issue.keyword }}
                  </div>
                  <div class="text-sm">{{ issue.comment }}</div>
                </n-space>
              </div>
            </n-space>
          </div>
          <div v-else class="text-sm text-gray-500 py-2">该项审查未发现问题 ✓</div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 风险提示（仅在有风险时显示） -->
    <div v-if="reviewResult?.risks?.length > 0 && pageState === 'complete'" class="wps-card wps-section mt-2">
      <n-collapse accordion>
        <n-collapse-item>
          <template #header>
            <n-space align="center">
              <span class="text-base font-semibold">🚨 风险提示</span>
              <n-tag size="small" type="error">{{ reviewResult.risks.length }} 个</n-tag>
            </n-space>
          </template>
          <n-space vertical>
            <n-alert 
              v-for="(risk, index) in reviewResult.risks" 
              :key="index" 
              :type="getRiskAlertType(risk.severity)"
              :closable="false" 
              show-icon
            >
              <template #header>{{ index + 1 }}. 风险提示</template>
              <div class="space-y-2">
                <div><strong>风险描述:</strong> {{ risk.description }}</div>
                <div v-if="risk.suggestion"><strong>建议:</strong> {{ risk.suggestion }}</div>
              </div>
            </n-alert>
          </n-space>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 操作按钮 -->
    <div v-if="pageState === 'complete'" class="flex justify-end gap-2 mt-4">
      <n-button @click="exportReport" :disabled="!reviewResult">导出报告</n-button>
      <n-button @click="handleReset">重新审查</n-button>
    </div>

    <!-- 测试按钮（开发用） -->
    <div v-if="pageState === 'idle'" class="wps-card wps-section mt-2">
      <n-button type="warning" size="small" @click="testGenerateReport">
        🧪 测试生成报告
      </n-button>
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-if="pageState === 'complete' && (!reviewResult?.issues?.length && !reviewResult?.risks?.length)"
      class="mt-2"
      description="未检测到风险"
      icon="✅"
    />
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NButton, NSpace, NTag, NAlert, NRadioGroup, NRadio, NCollapse, NCollapseItem, NSpin, NProgress, NCheckbox, NInput } from '../components/naive-components.js'
import { PageLayout, PageHeader, EmptyState } from '../components/common'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'
import { ActionTypes } from '../services/workflow'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'
import { generateRiskScanReport } from '../utils/reportGenerator.js'

// 使用工作流执行 composable
const { executePreset, getResultData, reset: resetWorkflow } = useWorkflowExecution()

// 使用 WPS 环境 composable
const { getFullText, getSelectedText } = useWpsEnvironment()

// 页面状态：idle | generating | ready | reviewing | complete
const pageState = ref('idle')
const progressText = ref('')

// 用户选择
const perspective = ref('neutral')
const customPerspective = ref('')
const scanScope = ref('full')

// 数据
const documentType = ref(null)
const checklist = ref([])
const reviewResult = ref(null)

// 视角描述
const perspectiveDescriptions = {
  partyA: '甲方视角：重点关注付款条件、违约责任、验收标准等对甲方权益的保护',
  partyB: '乙方视角：重点关注付款保障、履行期限、知识产权归属等对乙方权益的保护',
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
    return `自定义: ${customPerspective.value.slice(0, 20)}${customPerspective.value.length > 20 ? '...' : ''}`
  }
  return perspectiveLabels[perspective.value]
})

// 已选清单项数量
const selectedCount = computed(() => checklist.value.filter(item => item.selected).length)

// 通过/失败统计
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

// 获取清单项状态
const getChecklistItemStatus = (itemId) => {
  if (pageState.value === 'reviewing') return 'default'
  if (!reviewResult.value) return 'default'
  const issues = (reviewResult.value.issues || []).filter(i => i.checklistId === itemId)
  return issues.length > 0 ? 'warning' : 'success'
}

const getChecklistItemStatusText = (itemId) => {
  if (pageState.value === 'reviewing') return '审查中'
  if (!reviewResult.value) return '待审查'
  const issues = (reviewResult.value.issues || []).filter(i => i.checklistId === itemId)
  return issues.length > 0 ? '有问题' : '已通过'
}

const getIssueCount = (itemId) => {
  if (!reviewResult.value) return 0
  return (reviewResult.value.issues || []).filter(i => i.checklistId === itemId).length
}

// 获取某个清单项的所有问题
const getItemIssues = (itemId) => {
  if (!reviewResult.value) return []
  return (reviewResult.value.issues || []).filter(i => i.checklistId === itemId)
}

// 风险等级
const getRiskLevelColor = (level) => {
  const colorMap = { high: 'error', medium: 'warning', low: 'info' }
  return colorMap[level] || 'default'
}

const getRiskLevelText = (level) => {
  const textMap = { high: '高风险', medium: '中风险', low: '低风险' }
  return textMap[level] || '未知'
}

const getRiskAlertType = (level) => {
  const typeMap = { high: 'error', medium: 'warning', low: 'info' }
  return typeMap[level] || 'default'
}

// 切换清单项选中状态
const toggleItem = (itemId, checked) => {
  const item = checklist.value.find(i => i.id === itemId)
  if (item) {
    item.selected = checked
  }
}

// 全选
const selectAll = () => {
  checklist.value.forEach(item => { item.selected = true })
}

// 仅选必需项
const selectRequired = () => {
  checklist.value.forEach(item => { item.selected = item.required })
}

// 获取实际视角参数
const getEffectivePerspective = () => {
  if (perspective.value === 'custom' && customPerspective.value.trim()) {
    return customPerspective.value.trim()
  }
  return perspective.value
}

// 生成清单
const handleGenerateChecklist = async () => {
  // 检查自定义视角
  if (perspective.value === 'custom' && !customPerspective.value.trim()) {
    window.$message?.warning('请输入自定义审查视角')
    return
  }

  // 检查扫描范围
  if (scanScope.value === 'selection') {
    const selectedText = getSelectedText()
    if (!selectedText || selectedText.trim().length === 0) {
      window.$message?.warning('请先在文档中选中要扫描的内容')
      return
    }
  }

  const fullText = getFullText()
  if (!fullText) {
    window.$message?.warning('无法读取文档内容')
    return
  }

  pageState.value = 'generating'
  progressText.value = '正在读取文档...'

  try {
    // 执行生成清单工作流
    const result = await executePreset('generate-review-checklist', {
      stepParams: {
        [ActionTypes.GENERATE_CHECKLIST]: {
          perspective: getEffectivePerspective()
        }
      },
      onProgress: (info) => {
        if (info.stepName) {
          progressText.value = info.stepName
        }
      }
    })

    if (result.success) {
      // 获取文档类型
      documentType.value = getResultData('contractType')
      
      // 获取清单
      const generatedChecklist = getResultData('checklist')
      if (generatedChecklist && generatedChecklist.length > 0) {
        checklist.value = generatedChecklist
        pageState.value = 'ready'
        window.$message?.success(`已生成 ${checklist.value.length} 项审查清单`)
      } else {
        // 使用默认清单
        checklist.value = reviewChecklistGenerator.generateChecklist({ type: 'default' }, perspective.value)
        pageState.value = 'ready'
        window.$message?.info('使用通用审查清单')
      }
    } else {
      pageState.value = 'idle'
      window.$message?.error(result.message || '生成清单失败')
    }
  } catch (error) {
    pageState.value = 'idle'
    window.$message?.error('生成清单失败: ' + error.message)
  }
}

// 开始审查
const handleStartReview = async () => {
  const selectedItems = checklist.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    window.$message?.warning('请至少选择一个审查项')
    return
  }

  pageState.value = 'reviewing'
  progressText.value = '正在审查...'

  try {
    // 获取要审查的文本
    let textToReview = ''
    if (scanScope.value === 'selection') {
      textToReview = getSelectedText()
    } else {
      textToReview = getFullText()
    }

    if (!textToReview) {
      window.$message?.error('无法获取文档内容')
      pageState.value = 'ready'
      return
    }

    // 执行审查工作流
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
        if (info.stepName) {
          progressText.value = info.stepName
        }
      }
    })

    if (result.success) {
      reviewResult.value = getResultData('reviewResult')
      pageState.value = 'complete'
      
      const totalIssues = reviewResult.value?.summary?.totalIssues || 0
      const totalRisks = reviewResult.value?.summary?.totalRisks || 0
      
      if (totalIssues > 0 || totalRisks > 0) {
        window.$message?.success(`审查完成！检测到 ${totalIssues} 个问题，${totalRisks} 个风险提示`)
      } else {
        window.$message?.success('审查完成，未发现明显风险')
      }
    } else {
      pageState.value = 'ready'
      window.$message?.error(result.message || '审查失败')
    }
  } catch (error) {
    pageState.value = 'ready'
    window.$message?.error('审查失败: ' + error.message)
  }
}

// 重置
const handleReset = () => {
  pageState.value = 'idle'
  documentType.value = null
  checklist.value = []
  reviewResult.value = null
  // 不重置视角选择，保留用户设置
  resetWorkflow()
}

// 清除结果
const handleClearResults = () => {
  reviewResult.value = null
  pageState.value = 'ready'
  // 重置清单项状态
  checklist.value.forEach(item => { item.selected = true })
}

// 导出报告
const exportReport = () => {
  if (!reviewResult.value) {
    window.$message?.warning('没有可导出的报告')
    return
  }

  try {
    generateRiskScanReport({
      documentType: documentType.value,
      perspectiveLabel: perspectiveLabel.value,
      scanScope: scanScope.value,
      checklist: checklist.value,
      reviewResult: reviewResult.value,
      statistics: {
        total: selectedCount.value,
        passed: passedCount.value,
        failed: failedCount.value,
        issues: reviewResult.value.summary?.totalIssues || 0
      }
    })
    window.$message?.success('报告已生成到新文档')
  } catch (error) {
    window.$message?.error('导出失败: ' + error.message)
  }
}

// 测试生成报告（使用模拟数据）
const testGenerateReport = () => {
  try {
    const mockChecklist = [
      { id: '1', name: '合同主体信息', selected: true, required: true, reviewRequirements: '审查合同双方主体资格是否合法', reviewBasis: '《民法典》第四百六十九条' },
      { id: '2', name: '服务内容', selected: true, required: true, reviewRequirements: '审查服务内容是否明确具体', reviewBasis: '《民法典》第五百一十条' },
      { id: '3', name: '服务标准', selected: true, required: false, reviewRequirements: '审查服务标准是否明确', reviewBasis: '《民法典》第五百一十条' },
      { id: '4', name: '合同金额', selected: true, required: true, reviewRequirements: '审查合同金额条款', reviewBasis: '《民法典》第五百一十条' },
      { id: '5', name: '付款方式', selected: true, required: true, reviewRequirements: '审查付款条款', reviewBasis: '《民法典》第五百七十七条' }
    ]

    const mockReviewResult = {
      issues: [
        { checklistId: '1', severity: 'high', position: '合同首部', keyword: '甲方主体信息缺失', comment: '甲方主体信息缺失，存在签约主体不明风险。' },
        { checklistId: '1', severity: 'high', position: '合同首部', keyword: '乙方主体信息不完整', comment: '乙方主体信息全部空白，必须补充。' },
        { checklistId: '4', severity: 'medium', position: '第三条', keyword: '人数增加不调整费用', comment: '人数增加不调整费用，对乙方显失公平。' },
        { checklistId: '5', severity: 'high', position: '第七条', keyword: '付款依赖甲方审核', comment: '付款依赖甲方审核，乙方收款时间不可控。' },
        { checklistId: '5', severity: 'medium', position: '第十二条', keyword: '管辖法院仅约定甲方所在地', comment: '管辖法院仅约定甲方所在地，排除乙方选择。' }
      ],
      risks: [
        { severity: 'high', description: '乙方主体信息空白导致合同无效或无法追责', suggestion: '签约前补填乙方全称、信用代码、法定代表人' },
        { severity: 'high', description: '付款依赖甲方审核，乙方收款时间不可控', suggestion: '增设最迟付款日及逾期利息条款' },
        { severity: 'medium', description: '违约金比例过高可能被法院调低', suggestion: '将30%违约金调整为实际损失+不超过逾期部分20%' }
      ],
      summary: { totalIssues: 5, totalRisks: 3 }
    }

    generateRiskScanReport({
      documentType: { type: '合同', subtype: '培训服务合同' },
      perspectiveLabel: '中立视角',
      scanScope: 'full',
      checklist: mockChecklist,
      reviewResult: mockReviewResult,
      statistics: { total: 5, passed: 2, failed: 3, issues: 5 }
    })
    window.$message?.success('测试报告已生成')
  } catch (error) {
    window.$message?.error('测试失败: ' + error.message)
    console.error(error)
  }
}
</script>
