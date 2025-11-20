<template>
  <n-config-provider>
    <div class=" h-screen overflow-y-auto scrollbar-none">
      <!-- 标题卡片 -->
      <div class="wps-card wps-section">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold">⚠️ 合同风险扫描</span>
            <n-tag v-if="isScanning" type="warning" size="small">扫描中</n-tag>
          </div>
          <n-button type="primary" @click="startScan" :loading="isScanning" :disabled="isScanning">
            {{ isScanning ? '扫描中...' : '开始扫描' }}
          </n-button>
        </div>

        <n-alert type="info" :closable="false" show-icon>
          <template #header>功能说明</template>
          <template #default>
            使用 AI 智能分析合同内容，识别潜在风险点和问题条款。本功能仅进行预审分析，不会修改文档内容。
          </template>
        </n-alert>
      </div>

      <!-- 扫描选项 -->
      <div class="wps-card wps-section">
        <n-space vertical>
          <div class="text-sm font-semibold ">扫描选项</div>
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
      <div v-if="isScanning" class="wps-card wps-section mt-2">
        <n-space vertical>
          <div class="flex items-center gap-2">
            <n-spin size="small" />
            <span class="text-sm font-semibold">{{ scanProgress.stage || '正在扫描...' }}</span>
          </div>
          <n-progress v-if="scanProgress.current > 0"
            :percentage="Math.round((scanProgress.current / scanProgress.total) * 100)" type="line" status="info" />
          <div v-if="scanProgress.current > 0" class="text-xs text-gray-500">
            进度: {{ scanProgress.current }} / {{ scanProgress.total }}
          </div>
        </n-space>
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
            <n-statistic label="审查清单" :value="scanResult.summary?.checklistCount || 0">
              <template #suffix>项</template>
            </n-statistic>
          </div>
        </div>

        <!-- 审查清单 -->
        <div v-if="scanResult.checklist && scanResult.checklist.length > 0" class="wps-card wps-section mt-2">
          <n-collapse accordion>
            <n-collapse-item>
              <template #header>
                <n-space align="center">
                  <span class="text-base font-semibold">📋 审查清单</span>
                  <n-tag size="small" type="info">{{ scanResult.checklist.length }} 项</n-tag>
                </n-space>
              </template>
              <n-list bordered>
                <n-list-item v-for="(item, index) in scanResult.checklist" :key="index">
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
          <n-button @click="exportReport" :disabled="!scanResult">
            导出报告
          </n-button>
          <n-button type="primary" @click="clearResults">
            清除结果
          </n-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!isScanning && scanned" class="wps-card wps-section mt-2">
        <n-empty description="未检测到风险" class="py-8">
          <template #icon>
            <span class="text-4xl">✅</span>
          </template>
        </n-empty>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import {
  NConfigProvider,
  NButton,
  NSpace,
  NTag,
  NAlert,
  NRadioGroup,
  NRadio,
  NSpin,
  NProgress,
  NStatistic,
  NList,
  NListItem,
  NThing,
  NCollapse,
  NCollapseItem,
  NEmpty
} from 'naive-ui'
import { ContractReviewEngine } from '../services/contract/contractReviewEngine.js'
import { ReviewAIService } from '../services/contract/reviewAIService.js'
import { wpsDocumentService } from '../services/wps/wpsDocumentService.js'
import unifiedLogger from '../utils/unifiedLogger.js'



// 响应式数据
const isScanning = ref(false)
const scanned = ref(false)
const scanStrategy = ref('full')
const scanProgress = ref({ current: 0, total: 0, stage: '' })
const contractType = ref('') // 显示用的文本
const contractTypeObj = ref(null) // 传递给审查引擎的完整对象
const scanResult = ref(null)
const realtimeResponse = ref('') // 实时AI响应内容

// 创建审查引擎实例
const reviewEngine = new ContractReviewEngine()
const reviewAIService = new ReviewAIService()

// 获取风险等级颜色
const getRiskLevelColor = (level) => {
  const colorMap = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return colorMap[level] || 'default'
}

// 获取风险等级文本
const getRiskLevelText = (level) => {
  const textMap = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return textMap[level] || '未知'
}

// 获取风险提示类型
const getRiskAlertType = (level) => {
  const typeMap = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
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
  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.$message?.error('未找到活动文档')
    return
  }

  isScanning.value = true
  scanned.value = false
  scanResult.value = null
  contractType.value = ''
  realtimeResponse.value = ''
  scanProgress.value = { current: 0, total: 0, stage: '正在读取文档...' }

  try {
    // 获取文档全文
    const fullText = wpsDocumentService.getFullText()
    if (!fullText || fullText.trim().length === 0) {
      window.$message?.warning('文档内容为空')
      isScanning.value = false
      scanned.value = true
      return
    }

    

    // 计算预计时间区间（基于字数和模式，预留充足时间）
    const wordCount = fullText.length
    let timeRange = ''
    
    if (scanStrategy.value === 'full') {
      // 全文模式：根据字数估算时间区间
      const minTime = Math.ceil(wordCount / 600) * 10  // 最快情况
      const maxTime = Math.ceil(wordCount / 400) * 15  // 预留充足时间
      
      if (maxTime <= 60) {
        timeRange = `${minTime}-${maxTime} 秒`
      } else {
        const minMinutes = Math.ceil(minTime / 60)
        const maxMinutes = Math.ceil(maxTime / 60)
        timeRange = `${minMinutes}-${maxMinutes} 分钟`
      }
    } else {
      // 分段模式：通常更快
      const minTime = Math.ceil(wordCount / 1200) * 8
      const maxTime = Math.ceil(wordCount / 800) * 12
      
      if (maxTime <= 60) {
        timeRange = `${minTime}-${maxTime} 秒`
      } else {
        const minMinutes = Math.ceil(minTime / 60)
        const maxMinutes = Math.ceil(maxTime / 60)
        timeRange = `${minMinutes}-${maxMinutes} 分钟`
      }
    }

    window.$message?.info(
      `文档字数: ${wordCount} 字 | 预计用时: ${timeRange} | 模式: ${scanStrategy.value === 'full' ? '全文' : '分段'}`,
      { duration: 6000 }
    )

    // 1. 识别合同类型
    scanProgress.value.stage = '正在识别合同类型...'
    realtimeResponse.value = ''

    const identifiedType = await reviewAIService.identifyContractType(fullText, (progressInfo) => {
      if (progressInfo.stage) {
        scanProgress.value.stage = progressInfo.stage
      }
      if (progressInfo.content) {
        realtimeResponse.value = progressInfo.content.substring(0, 500) // 限制显示长度
      }
    })

    // 保存完整对象供审查引擎使用
    contractTypeObj.value = identifiedType

    // 提取类型文本用于显示，优先显示子类型
    const typeText = identifiedType.subtype || identifiedType.type || '未知'
    contractType.value = typeText

    

    // 2. 执行审查
    scanProgress.value.stage = '正在分析合同内容...'
    realtimeResponse.value = ''

    const options = {
      autoApply: false, // 不自动应用批注
      useCustomRules: false, // 不使用自定义规则
      // 注意：合同审查需要 JSON 格式输出，使用非流式请求
      // stream: false 是默认值，可以不设置
      onProgress: (progress) => {
        scanProgress.value = {
          current: progress.current || 0,
          total: progress.total || 0,
          stage: progress.stage || '正在审查...'
        }
        // 显示处理阶段
        if (progress.stage) {
          realtimeResponse.value = `[${progress.stage}]`
        }
        // 显示响应内容预览（如果有）
        if (progress.content && progress.content.length > 0) {
          const preview = progress.content.substring(0, 500)
          realtimeResponse.value = `[${progress.stage}]\n\n${preview}${progress.content.length > 500 ? '...' : ''}`
        }
      }
    }

    let result
    if (scanStrategy.value === 'full') {
      // 全文审查，传递完整的类型对象
      result = await reviewEngine.reviewByFullText(fullText, contractTypeObj.value, options)
    } else {
      // 分段审查需要先分段
      
      const segments = await reviewEngine.segmenter.segmentDocument(fullText)
      

      // 分段审查，参数顺序：segments, fullText, contractType, options
      result = await reviewEngine.reviewBySegments(segments, fullText, contractTypeObj.value, options)
    }

    scanResult.value = result
    scanned.value = true

    

    if (result.summary?.totalIssues > 0 || result.summary?.totalRisks > 0) {
      window.$message?.success(
        `扫描完成！检测到 ${result.summary.totalIssues} 个问题，${result.summary.totalRisks} 个风险提示`
      )
    } else {
      window.$message?.success('扫描完成，未发现明显风险')
    }
  } catch (error) {
    
    // 显示详细错误，支持换行
    const errorMsg = error.message || '未知错误'
    window.$message?.error(errorMsg, {
      duration: 8000,
      closable: true
    })
    scanned.value = true
  } finally {
    isScanning.value = false
    scanProgress.value = { current: 0, total: 0, stage: '' }
    // 扫描完成后保留最后一次响应3秒，然后清空
    setTimeout(() => {
      if (!isScanning.value) {
        realtimeResponse.value = ''
      }
    }, 3000)
  }
}

// 清除结果
const clearResults = () => {
  scanResult.value = null
  contractType.value = ''
  contractTypeObj.value = null
  scanned.value = false
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
    // 生成报告文本
    let reportText = '合同风险扫描报告\n\n'
    reportText += `合同类型：${contractType.value}\n\n`
    reportText += `═══════════════════════════════════\n\n`
    reportText += `风险统计\n\n`
    reportText += `检测问题：${scanResult.value.summary?.totalIssues || 0} 个\n`
    reportText += `风险提示：${scanResult.value.summary?.totalRisks || 0} 个\n`
    reportText += `审查清单：${scanResult.value.summary?.checklistCount || 0} 项\n\n`
    reportText += `═══════════════════════════════════\n\n`

    if (scanResult.value.issues && scanResult.value.issues.length > 0) {
      reportText += `检测到的问题（${scanResult.value.issues.length}个）\n\n`
      scanResult.value.issues.forEach((issue, index) => {
        reportText += `${index + 1}. [${getRiskLevelText(issue.severity)}] ${issue.position || '未知位置'}\n\n`
        if (issue.keyword) {
          reportText += `相关条款：${issue.keyword}\n\n`
        }
        reportText += `问题描述：${issue.comment}\n\n`
        reportText += `───────────────────────────────────\n\n`
      })
    }

    if (scanResult.value.risks && scanResult.value.risks.length > 0) {
      reportText += `风险提示（${scanResult.value.risks.length}个）\n\n`
      scanResult.value.risks.forEach((risk, index) => {
        reportText += `${index + 1}. 风险提示\n\n`
        reportText += `风险描述：${risk.description}\n\n`
        if (risk.suggestion) {
          reportText += `建议：${risk.suggestion}\n\n`
        }
        reportText += `───────────────────────────────────\n\n`
      })
    }

    reportText += `═══════════════════════════════════\n\n`
    reportText += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`

    // 创建新文档并写入报告
    const newDoc = window.Application.Documents.Add()
    newDoc.Range().Text = reportText

    window.$message?.success('报告已生成到新文档')
  } catch (error) {
    
    window.$message?.error('导出失败: ' + error.message)
  }
}
</script>
