<template>
  <n-modal
    :show="show"
    preset="card"
    :title="title"
    style="width: 90%; max-width: 600px; max-height: 85vh"
    @update:show="$emit('update:show', $event)"
  >
    <div v-if="result" class="result-content">
      <div class="text-sm text-gray-600 mb-4">{{ result.message }}</div>

      <!-- 步骤列表 -->
      <div class="space-y-3 max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in result.steps"
          :key="index"
          class="p-3 bg-gray-50 rounded-lg"
        >
          <!-- 步骤标题 -->
          <div class="flex items-center gap-2 mb-2">
            <span :class="item.result.success ? 'text-green-500' : 'text-red-500'" class="text-lg">
              {{ item.result.success ? '✓' : '✗' }}
            </span>
            <span class="font-medium">{{ item.step.name || item.step.actionType }}</span>
          </div>

          <!-- 步骤消息 -->
          <div class="text-xs text-gray-500 mb-2">{{ item.result.message }}</div>

          <!-- AI 结果数据展示 -->
          <div v-if="item.result.data && hasDisplayableData(item)" class="mt-2">
            <!-- 合同类型识别结果 -->
            <div v-if="item.result.data.contractType" class="ai-result-card">
              <div class="ai-result-title">🔍 识别结果</div>
              <div class="ai-result-content">
                <div class="result-item">
                  <span class="label">合同类型：</span>
                  <span class="value">{{ item.result.data.contractType.type }}</span>
                </div>
                <div v-if="item.result.data.contractType.subtype" class="result-item">
                  <span class="label">子类型：</span>
                  <span class="value">{{ item.result.data.contractType.subtype }}</span>
                </div>
                <div class="result-item">
                  <span class="label">置信度：</span>
                  <n-tag :type="getConfidenceType(item.result.data.contractType.confidence)" size="small">
                    {{ getConfidenceLabel(item.result.data.contractType.confidence) }}
                  </n-tag>
                </div>
              </div>
            </div>

            <!-- 合同要素提取结果 -->
            <div v-if="item.result.data.elements" class="ai-result-card">
              <div class="ai-result-title">📋 提取要素</div>
              <div class="ai-result-content">
                <div v-for="(value, key) in item.result.data.elements" :key="key" class="result-item">
                  <span class="label">{{ key }}：</span>
                  <span class="value">{{ formatValue(value) }}</span>
                </div>
                <div v-if="Object.keys(item.result.data.elements).length === 0" class="text-gray-400 text-xs">
                  未提取到要素
                </div>
              </div>
            </div>

            <!-- 合同审查结果 -->
            <div v-if="item.result.data.reviewResult" class="ai-result-card">
              <div class="ai-result-title">⚖️ 审查结果</div>
              <div class="ai-result-content">
                <div class="result-item">
                  <span class="label">发现问题：</span>
                  <n-tag :type="item.result.data.reviewResult.issues?.length > 0 ? 'warning' : 'success'" size="small">
                    {{ item.result.data.reviewResult.issues?.length || 0 }} 个
                  </n-tag>
                </div>
                <div class="result-item">
                  <span class="label">风险提示：</span>
                  <n-tag :type="item.result.data.reviewResult.risks?.length > 0 ? 'error' : 'success'" size="small">
                    {{ item.result.data.reviewResult.risks?.length || 0 }} 个
                  </n-tag>
                </div>
                <!-- 问题列表（最多显示3个） -->
                <div v-if="item.result.data.reviewResult.issues?.length > 0" class="mt-2">
                  <div class="text-xs text-gray-500 mb-1">主要问题：</div>
                  <div
                    v-for="(issue, idx) in item.result.data.reviewResult.issues.slice(0, 3)"
                    :key="idx"
                    class="issue-item"
                  >
                    <span class="issue-keyword">{{ issue.keyword || issue.position || '问题' + (idx + 1) }}</span>
                    <span class="issue-comment">{{ truncateText(issue.comment, 50) }}</span>
                  </div>
                  <div v-if="item.result.data.reviewResult.issues.length > 3" class="text-xs text-gray-400 mt-1">
                    还有 {{ item.result.data.reviewResult.issues.length - 3 }} 个问题...
                  </div>
                </div>
              </div>
            </div>

            <!-- 全局分析结果 -->
            <div v-if="item.result.data.globalAnalysis" class="ai-result-card">
              <div class="ai-result-title">🌐 全局分析</div>
              <div class="ai-result-content">
                <div class="result-item">
                  <span class="label">合同类型：</span>
                  <span class="value">{{ item.result.data.globalAnalysis.type }}</span>
                </div>
                <div v-if="item.result.data.globalAnalysis.riskAreas?.length > 0" class="mt-2">
                  <div class="text-xs text-gray-500 mb-1">风险区域：</div>
                  <div class="flex flex-wrap gap-1">
                    <n-tag
                      v-for="(area, idx) in item.result.data.globalAnalysis.riskAreas.slice(0, 5)"
                      :key="idx"
                      :type="getRiskLevelType(area.riskLevel)"
                      size="small"
                    >
                      {{ area.section }}
                    </n-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- PDF 导出结果 -->
            <div v-if="item.result.data.pdfFullPath" class="ai-result-card pdf-result">
              <div class="ai-result-title">📑 导出成功</div>
              <div class="ai-result-content">
                <div class="result-item">
                  <span class="label">文件名：</span>
                  <span class="value">{{ item.result.data.pdfFileName }}</span>
                </div>
                <div class="result-item flex-col items-start!">
                  <span class="label">保存路径（点击复制）：</span>
                  <span class="value path-text" @click="copyPath(item.result.data.pdfFullPath)" title="点击复制路径">
                    {{ item.result.data.pdfFullPath }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" size="small" @click="$emit('update:show', false)">确定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import { NModal, NButton, NTag } from './naive-components.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  result: {
    type: Object,
    default: null
  }
})

defineEmits(['update:show'])

const title = computed(() => {
  if (!props.result) return '执行结果'
  return props.result.success ? '✓ 执行完成' : '✗ 执行失败'
})

// 检查是否有可展示的数据
const hasDisplayableData = (item) => {
  const data = item.result?.data
  if (!data) return false
  return (
    data.contractType ||
    data.elements ||
    data.reviewResult ||
    data.globalAnalysis ||
    data.pdfFullPath
  )
}

// 获取置信度类型
const getConfidenceType = (confidence) => {
  const types = {
    high: 'success',
    medium: 'warning',
    low: 'error'
  }
  return types[confidence] || 'default'
}

// 获取置信度标签
const getConfidenceLabel = (confidence) => {
  const labels = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[confidence] || confidence
}

// 获取风险等级类型
const getRiskLevelType = (level) => {
  const types = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return types[level] || 'default'
}

// 格式化值
const formatValue = (value) => {
  if (value === null || value === undefined) return '未知'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 复制路径到剪贴板
const copyPath = (filePath) => {
  try {
    navigator.clipboard?.writeText(filePath)
    window.$message?.success('路径已复制')
  } catch (error) {
    console.error('复制失败:', error)
  }
}
</script>

<style scoped>
.result-content {
  font-size: 14px;
}

.ai-result-card {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 10px;
  margin-top: 8px;
}

.ai-result-title {
  font-weight: 600;
  font-size: 13px;
  color: #0369a1;
  margin-bottom: 8px;
}

.ai-result-content {
  font-size: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.result-item .label {
  color: #64748b;
  flex-shrink: 0;
}

.result-item .value {
  color: #1e293b;
  font-weight: 500;
}

.issue-item {
  background: #fef3c7;
  border-radius: 4px;
  padding: 6px 8px;
  margin-bottom: 4px;
  font-size: 11px;
}

.issue-keyword {
  color: #92400e;
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}

.issue-comment {
  color: #78716c;
}

.pdf-result {
  background: #f0fdf4;
  border-color: #86efac;
}

.pdf-result .ai-result-title {
  color: #166534;
}

.path-text {
  word-break: break-all;
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  display: block;
  cursor: pointer;
  transition: background-color 0.2s;
}

.path-text:hover {
  background: #e2e8f0;
}

.items-start\! {
  align-items: flex-start !important;
}

.flex-col {
  flex-direction: column;
}
</style>
