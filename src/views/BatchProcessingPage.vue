<template>
  <PageLayout>
    <div class="p-4 space-y-4">
      <!-- 返回按钮 -->
      <n-button size="small" @click="goBack">
        ← 返回合同审查
      </n-button>

      <!-- 页面标题 -->
      <n-card title="📦 合同批量处理" size="small">
        <template #header-extra>
          <n-tag type="info" size="small">Beta</n-tag>
        </template>
        <n-text depth="3">
          批量处理文件夹中的合同文件：识别信息 → 提交金山文档 → 获取编号 → 写入页眉 → 添加批注
        </n-text>
      </n-card>

      <!-- 配置区域 -->
      <n-card title="⚙️ 处理配置" size="small">
        <n-space vertical>
          <!-- 文件夹选择 -->
          <n-form-item label="合同文件夹路径">
            <n-input-group>
              <n-input
                v-model:value="config.folderPath"
                placeholder="例如: C:\Users\用户名\Documents\合同"
              />
              <n-button type="primary" @click="scanFolder">
                🔍 扫描文件
              </n-button>
            </n-input-group>
          </n-form-item>

          <!-- 工作流选择 -->
          <n-form-item label="处理工作流">
            <n-select
              v-model:value="config.workflowId"
              :options="workflowOptions"
              placeholder="请选择处理工作流"
            />
          </n-form-item>

          <!-- 关键词配置 -->
          <n-form-item label="关键词批注配置">
            <n-space vertical class="w-full">
              <n-alert type="info" :show-icon="false" class="text-xs">
                配置需要添加批注的关键词，系统将为每个匹配的关键词添加批注
              </n-alert>
              <n-dynamic-input
                v-model:value="config.keywords"
                :min="0"
                :max="20"
                placeholder="输入关键词"
              />
            </n-space>
          </n-form-item>

          <!-- 高级选项 -->
          <n-collapse>
            <n-collapse-item title="高级选项" name="advanced">
              <n-space vertical>
                <n-form-item label="任务间延迟 (毫秒)">
                  <n-slider v-model:value="config.delayBetweenTasks" :min="1000" :max="10000" :step="500" />
                  <n-text depth="3" class="text-xs">{{ config.delayBetweenTasks }}ms</n-text>
                </n-form-item>
                <n-form-item label="金山文档提交后延迟 (毫秒)">
                  <n-slider v-model:value="config.delayAfterKdocs" :min="2000" :max="15000" :step="500" />
                  <n-text depth="3" class="text-xs">{{ config.delayAfterKdocs }}ms</n-text>
                </n-form-item>
                <n-form-item label="文件扩展名过滤">
                  <n-checkbox-group v-model:value="config.extensions">
                    <n-checkbox value=".docx">.docx</n-checkbox>
                    <n-checkbox value=".doc">.doc</n-checkbox>
                    <n-checkbox value=".wps">.wps</n-checkbox>
                  </n-checkbox-group>
                </n-form-item>
              </n-space>
            </n-collapse-item>
          </n-collapse>
        </n-space>
      </n-card>

      <!-- 文件列表 -->
      <n-card v-if="fileList.length > 0" title="📄 待处理文件" size="small">
        <template #header-extra>
          <n-text depth="3" class="text-sm">共 {{ fileList.length }} 个文件</n-text>
        </template>
        <n-list size="small" bordered>
          <n-list-item v-for="(file, index) in fileList" :key="index">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <n-tag size="tiny">{{ index + 1 }}</n-tag>
                  <span class="text-sm">{{ file.name }}</span>
                </n-space>
              </template>
              <template #header-extra>
                <n-tag
                  :type="getStatusType(file.status)"
                  size="tiny"
                >
                  {{ getStatusText(file.status) }}
                </n-tag>
              </template>
              <template #description>
                <n-text depth="3" class="text-xs">{{ file.path }}</n-text>
                <n-text v-if="file.error" type="error" class="text-xs block mt-1">
                  错误: {{ file.error }}
                </n-text>
                <n-text v-if="file.contractNumber" type="success" class="text-xs block mt-1">
                  合同编号: {{ file.contractNumber }}
                </n-text>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </n-card>

      <!-- 进度显示 -->
      <n-card v-if="isProcessing" title="⏳ 处理进度" size="small">
        <n-space vertical>
          <n-progress
            type="line"
            :percentage="progressPercentage"
            :indicator-placement="'inside'"
            :status="progressStatus"
          />
          <n-space justify="space-between">
            <n-text depth="3" class="text-sm">
              {{ progressText }}
            </n-text>
            <n-text depth="3" class="text-sm">
              成功: {{ successCount }} / 失败: {{ failedCount }} / 总计: {{ fileList.length }}
            </n-text>
          </n-space>
          <n-alert v-if="currentTaskMessage" :type="currentTaskStatus" :show-icon="false" class="text-sm">
            {{ currentTaskMessage }}
          </n-alert>
        </n-space>
      </n-card>

      <!-- 结果汇总 -->
      <n-card v-if="showResult" title="✅ 处理结果" size="small">
        <n-space vertical>
          <n-statistic label="处理完成" :value="summary.completed">
            <template #suffix>
              <span class="text-sm text-gray-500">/ {{ summary.total }}</span>
            </template>
          </n-statistic>
          <n-space>
            <n-statistic label="成功" :value="summary.success">
              <template #suffix>
                <n-tag type="success" size="tiny">个</n-tag>
              </template>
            </n-statistic>
            <n-statistic label="失败" :value="summary.failed">
              <template #suffix>
                <n-tag type="error" size="tiny">个</n-tag>
              </template>
            </n-statistic>
            <n-statistic label="耗时" :value="formatDuration(summary.duration)">
              <template #suffix>
                <n-tag size="tiny">秒</n-tag>
              </template>
            </n-statistic>
          </n-space>

          <!-- 失败文件列表 -->
          <n-collapse v-if="failedFiles.length > 0">
            <n-collapse-item title="❌ 失败文件详情" name="failed">
              <n-list size="small">
                <n-list-item v-for="file in failedFiles" :key="file.path">
                  <n-thing :title="file.name">
                    <template #description>
                      <n-text type="error" class="text-xs">{{ file.error }}</n-text>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>
            </n-collapse-item>
          </n-collapse>
        </n-space>
      </n-card>

      <!-- 操作按钮 -->
      <n-space justify="center" class="pt-4">
        <n-button
          v-if="!isProcessing"
          type="primary"
          size="large"
          :disabled="!canStart"
          @click="startBatchProcessing"
        >
          🚀 开始批量处理
        </n-button>
        <n-button
          v-else
          type="error"
          size="large"
          @click="stopProcessing"
        >
          ⏹️ 停止处理
        </n-button>
        <n-button
          v-if="showResult"
          size="large"
          @click="reset"
        >
          🔄 重新开始
        </n-button>
      </n-space>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard, NTag, NText, NFormItem, NInput, NInputGroup, NButton,
  NSelect, NDynamicInput, NCollapse, NCollapseItem, NSlider,
  NCheckbox, NCheckboxGroup, NList, NListItem, NThing, NSpace,
  NProgress, NAlert, NStatistic, useMessage
} from 'naive-ui'
import { PageLayout } from '../components/common'
import {
  batchProcessor,
  BatchTaskStatus,
  presetBatchWorkflows,
  getPresetBatchWorkflow,
  buildKeywordList
} from '../services/batch'

const router = useRouter()
const message = useMessage()

// 返回合同审查页面
const goBack = () => {
  router.push('/contractreview')
}

// 配置状态
const config = reactive({
  folderPath: '',
  workflowId: 'contract_standardization',
  keywords: [],
  delayBetweenTasks: 2000,
  delayAfterKdocs: 3000,
  extensions: ['.docx', '.doc', '.wps']
})

// 文件列表
const fileList = ref([])

// 处理状态
const isProcessing = ref(false)
const showResult = ref(false)
const currentTaskIndex = ref(0)
const currentTaskMessage = ref('')
const currentTaskStatus = ref('info')
const summary = reactive({
  total: 0,
  success: 0,
  failed: 0,
  completed: 0,
  duration: 0
})

// 工作流选项
const workflowOptions = computed(() =>
  presetBatchWorkflows.map(w => ({
    label: w.name,
    value: w.id,
    description: w.description
  }))
)

// 计算属性
const canStart = computed(() => {
  return config.folderPath && fileList.value.length > 0 && !isProcessing.value
})

const progressPercentage = computed(() => {
  if (fileList.value.length === 0) return 0
  return Math.round((currentTaskIndex.value / fileList.value.length) * 100)
})

const progressStatus = computed(() => {
  if (failedCount.value > 0) return 'warning'
  return 'success'
})

const progressText = computed(() => {
  if (currentTaskIndex.value === 0) return '准备开始...'
  return `正在处理第 ${currentTaskIndex.value} 个文件: ${fileList.value[currentTaskIndex.value - 1]?.name || ''}`
})

const successCount = computed(() =>
  fileList.value.filter(f => f.status === BatchTaskStatus.SUCCESS).length
)

const failedCount = computed(() =>
  fileList.value.filter(f => f.status === BatchTaskStatus.FAILED).length
)

const failedFiles = computed(() =>
  fileList.value.filter(f => f.status === BatchTaskStatus.FAILED)
)

// 扫描文件夹 - 使用 WPS FileSystemObject
const scanFolder = async () => {
  if (!config.folderPath) {
    message.warning('请输入文件夹路径')
    return
  }

  try {
    const app = window.Application
    if (!app) {
      message.error('无法获取 WPS 应用程序实例')
      return
    }

    message.loading('正在扫描文件...')

    // 使用 WPS 的 FileSystemObject
    const fso = app.FileSystem
    if (!fso) {
      message.error('无法获取文件系统对象')
      return
    }

    // 检查文件夹是否存在
    if (!fso.FolderExists(config.folderPath)) {
      message.error('文件夹不存在: ' + config.folderPath)
      return
    }

    const folder = fso.GetFolder(config.folderPath)
    const contractFiles = []

    // 遍历文件夹中的文件
    const files = folder.Files
    for (let i = 0; i < files.Count; i++) {
      const file = files.Item(i)
      const fileName = file.Name.toLowerCase()

      if (config.extensions.some(ext => fileName.endsWith(ext))) {
        contractFiles.push({
          path: file.Path,
          name: file.Name
        })
      }
    }

    if (contractFiles.length > 0) {
      // 设置文件列表
      fileList.value = contractFiles.map(f => ({
        path: f.path,
        name: f.name,
        status: BatchTaskStatus.PENDING,
        error: null,
        contractNumber: null
      }))

      message.success(`扫描完成，找到 ${contractFiles.length} 个合同文件`)
    } else {
      message.warning('未找到符合条件的合同文件')
    }
  } catch (error) {
    console.error('扫描文件夹失败:', error)
    message.error('扫描文件夹失败: ' + error.message)
  }
}

// 开始批量处理
const startBatchProcessing = async () => {
  if (fileList.value.length === 0) {
    message.warning('没有待处理的文件')
    return
  }

  isProcessing.value = true
  showResult.value = false
  currentTaskIndex.value = 0

  try {
    // 获取工作流配置
    const workflow = getPresetBatchWorkflow(config.workflowId)
    if (!workflow) {
      throw new Error('未找到工作流配置')
    }

    // 自定义工作流参数
    const customWorkflow = JSON.parse(JSON.stringify(workflow))

    // 更新关键词配置
    const keywordStep = customWorkflow.steps.find(
      s => s.actionType === 'batchKeyword'
    )
    if (keywordStep && config.keywords.length > 0) {
      keywordStep.params.keywordList = buildKeywordList(config.keywords)
    }

    // 创建任务列表
    const tasks = batchProcessor.createTasks(
      fileList.value.map(f => f.path),
      customWorkflow
    )

    // 执行任务
    const result = await batchProcessor.execute(tasks, {
      delayBetweenTasks: config.delayBetweenTasks,
      delayAfterKdocs: config.delayAfterKdocs,
      onProgress: handleProgress,
      onTaskComplete: handleTaskComplete,
      onComplete: handleComplete
    })

    // 更新汇总
    Object.assign(summary, result)
    showResult.value = true

    if (result.success) {
      message.success('批量处理完成')
    } else {
      message.warning('批量处理完成，部分文件处理失败')
    }
  } catch (error) {
    message.error('批量处理失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

// 处理进度
const handleProgress = (progress) => {
  currentTaskIndex.value = progress.current
  currentTaskMessage.value = progress.message || ''
  currentTaskStatus.value = progress.stage === 'complete' ? 'success' : 'info'

  // 更新文件状态
  if (progress.task) {
    const file = fileList.value.find(f => f.path === progress.task.filePath)
    if (file) {
      file.status = progress.task.status
    }
  }
}

// 处理任务完成
const handleTaskComplete = (result) => {
  const file = fileList.value.find(f => f.path === result.filePath)
  if (file) {
    file.status = result.status
    file.error = result.error
    file.contractNumber = result.result?.data?.contractNumber
  }
}

// 处理全部完成
const handleComplete = (result) => {
  console.log('批量处理完成:', result)
}

// 停止处理
const stopProcessing = () => {
  batchProcessor.stop()
  message.info('正在停止处理...')
}

// 重置
const reset = () => {
  fileList.value = []
  config.folderPath = ''
  config.keywords = []
  showResult.value = false
  currentTaskIndex.value = 0
  currentTaskMessage.value = ''
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    [BatchTaskStatus.PENDING]: 'default',
    [BatchTaskStatus.PROCESSING]: 'warning',
    [BatchTaskStatus.SUCCESS]: 'success',
    [BatchTaskStatus.FAILED]: 'error',
    [BatchTaskStatus.SKIPPED]: 'info'
  }
  return typeMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    [BatchTaskStatus.PENDING]: '待处理',
    [BatchTaskStatus.PROCESSING]: '处理中',
    [BatchTaskStatus.SUCCESS]: '成功',
    [BatchTaskStatus.FAILED]: '失败',
    [BatchTaskStatus.SKIPPED]: '已跳过'
  }
  return textMap[status] || status
}

// 格式化耗时
const formatDuration = (ms) => {
  return (ms / 1000).toFixed(1)
}
</script>

<style scoped>
:deep(.n-dynamic-input .n-dynamic-input-item) {
  margin-bottom: 8px;
}
</style>
