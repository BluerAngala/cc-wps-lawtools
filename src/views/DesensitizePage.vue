<template>
  <PageLayout>
    <!-- 标题卡片 -->
    <PageHeader
      title="敏感信息脱敏"
      icon="🔒"
      :loading="isExecuting"
      loading-text="扫描中"
      description="自动检测文档中的敏感信息（身份证号、手机号、邮箱、银行卡号等），支持选择性脱敏处理。"
    >
      <template #actions>
        <n-space>
          <n-button type="primary" @click="scanDocument" :loading="isExecuting" :disabled="isExecuting">
            {{ isExecuting ? '扫描中...' : '扫描文档' }}
          </n-button>
          <n-button 
            type="success" 
            @click="applyDesensitization" 
            :disabled="!hasSelectedItems || isExecuting"
            v-if="sensitiveInfoList.length > 0"
          >
            一键脱敏 ({{ selectedCount }})
          </n-button>
        </n-space>
      </template>
    </PageHeader>

    <!-- 扫描进度 -->
    <ProcessingStatus
      v-if="isExecuting"
      class="mt-4"
      :stage="progress.stepName || progress.stage"
      :current="progress.current"
      :total="progress.total"
    />

    <!-- 检测结果列表 -->
    <div v-if="sensitiveInfoList.length > 0" class="wps-card wps-section mt-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-base font-semibold">检测到 {{ sensitiveInfoList.length }} 个敏感信息</span>
        <n-space>
          <n-button size="small" @click="selectAll">全选</n-button>
          <n-button size="small" @click="unselectAll">取消全选</n-button>
          <n-button size="small" type="error" @click="clearResults">清除结果</n-button>
        </n-space>
      </div>

      <n-list bordered>
        <n-list-item v-for="(info, index) in sensitiveInfoList" :key="index">
          <template #prefix>
            <n-checkbox v-model:checked="info.selected" />
          </template>
          <n-thing>
            <template #header>
              <n-space align="center">
                <span class="text-sm text-gray-500">#{{ index + 1 }}</span>
                <n-tag :type="getTypeColor(info.type)" size="small">{{ info.type }}</n-tag>
              </n-space>
            </template>
            <template #description>
              <n-space vertical size="small" class="mt-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 w-12">原始:</span>
                  <n-tag type="error" size="small">{{ info.original }}</n-tag>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 w-12">脱敏:</span>
                  <n-tag type="success" size="small">{{ info.desensitized }}</n-tag>
                </div>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else-if="!isExecuting && scanned"
      class="mt-4"
      description="未检测到敏感信息"
      icon="✅"
    />

    <!-- 高级配置 -->
    <n-collapse :default-expanded-names="['config']" class="mt-4">
      <n-collapse-item title="⚙️ 高级配置" name="config">
        <n-space vertical>
          <n-form-item label="白名单 (每行一个)">
            <n-input
              v-model:value="whitelist"
              type="textarea"
              placeholder="请输入白名单项，每行一个&#10;例如：张三&#10;例如：13800138000"
              :rows="3"
            />
          </n-form-item>
          <n-form-item label="自定义敏感词 (格式: 敏感词|替换词)">
            <n-input
              v-model:value="customSensitiveWords"
              type="textarea"
              placeholder="请输入自定义敏感词，格式: 敏感词|替换词，每行一个&#10;例如：机密信息|***"
              :rows="3"
            />
          </n-form-item>
        </n-space>
      </n-collapse-item>
    </n-collapse>

    <!-- 处理结果提示 -->
    <div v-if="resultMessage" class="wps-card wps-section mt-4">
      <n-alert :type="resultType" :closable="false" show-icon>
        <template #header>{{ resultType === 'success' ? '处理完成' : '处理失败' }}</template>
        <template #default>{{ resultMessage }}</template>
      </n-alert>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NButton, NSpace, NTag, NAlert, NList, NListItem, NThing, NCheckbox, NCollapse, NCollapseItem, NFormItem, NInput } from '../components/naive-components.js'
import { PageLayout, PageHeader, EmptyState, ProcessingStatus } from '../components/common'
import { useWorkflowExecution } from '../composables/useWorkflowExecution.js'
import { useWpsEnvironment } from '../composables/useWpsEnvironment.js'
import { ActionTypes } from '../services/workflow'

// 使用工作流执行 composable
const { isExecuting, progress, executePreset, getResultData, reset: resetWorkflow } = useWorkflowExecution()

// 使用 WPS 环境 composable
const { getDocument } = useWpsEnvironment()

// 响应式数据
const scanned = ref(false)
const sensitiveInfoList = ref([])
const whitelist = ref('')
const customSensitiveWords = ref('')
const resultMessage = ref('')
const resultType = ref('success')

// 计算属性
const hasSelectedItems = computed(() => sensitiveInfoList.value.some(item => item.selected))
const selectedCount = computed(() => sensitiveInfoList.value.filter(item => item.selected).length)

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    '身份证号': 'error',
    '手机号': 'warning',
    '邮箱': 'info',
    '银行卡号': 'error',
    '姓名': 'warning',
    '自定义敏感词': 'success'
  }
  return colorMap[type] || 'default'
}

// 解析自定义敏感词
const parseCustomSensitiveWords = () => {
  return customSensitiveWords.value
    .split('\n')
    .map(line => {
      const parts = line.split('|')
      if (parts.length === 2) {
        return { word: parts[0].trim(), replacement: parts[1].trim() }
      }
      return null
    })
    .filter(item => item !== null)
    .map(item => item.word)
    .join(',')
}

// 扫描文档
const scanDocument = async () => {
  scanned.value = false
  resultMessage.value = ''
  sensitiveInfoList.value = []

  // 执行扫描工作流
  const result = await executePreset('scan-sensitive', {
    stepParams: {
      [ActionTypes.SCAN_SENSITIVE]: {
        whitelist: whitelist.value,
        blacklist: parseCustomSensitiveWords()
      }
    }
  })

  scanned.value = true

  if (result.success) {
    // 从工作流结果中获取敏感信息列表
    const detectedList = getResultData('sensitiveInfoList') || []
    sensitiveInfoList.value = detectedList.map(item => ({ ...item, selected: true }))

    if (sensitiveInfoList.value.length === 0) {
      window.$message?.success('未检测到敏感信息')
    } else {
      window.$message?.success(`检测到 ${sensitiveInfoList.value.length} 个敏感信息`)
    }
  }
}

// 全选/取消全选
const selectAll = () => sensitiveInfoList.value.forEach(item => { item.selected = true })
const unselectAll = () => sensitiveInfoList.value.forEach(item => { item.selected = false })

// 清除结果
const clearResults = () => {
  sensitiveInfoList.value = []
  scanned.value = false
  resultMessage.value = ''
  resetWorkflow()
}

// 应用脱敏
const applyDesensitization = async () => {
  if (!hasSelectedItems.value) {
    window.$message?.warning('请至少选择一个敏感信息')
    return
  }

  const doc = getDocument()
  if (!doc) return

  try {
    const selectedItems = sensitiveInfoList.value.filter(item => item.selected)
    let replacedCount = 0
    const selection = doc.Application.Selection
    
    // 逐个替换敏感信息
    selectedItems.forEach(item => {
      selection.HomeKey(6)
      const findObj = selection.Find
      findObj.ClearFormatting()
      findObj.Text = item.original
      findObj.Replacement.ClearFormatting()
      findObj.Replacement.Text = item.desensitized
      findObj.Forward = true
      findObj.Wrap = 1
      findObj.Format = false
      findObj.MatchCase = false
      findObj.MatchWholeWord = false
      findObj.MatchWildcards = false
      
      const result = findObj.Execute(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 2)
      if (result) replacedCount++
    })

    resultType.value = 'success'
    resultMessage.value = `成功脱敏 ${replacedCount} 个敏感信息`
    window.$message?.success(resultMessage.value)

    setTimeout(() => clearResults(), 2000)
  } catch (error) {
    resultType.value = 'error'
    resultMessage.value = '脱敏失败: ' + error.message
    window.$message?.error(resultMessage.value)
  }
}
</script>
