<template>
  <div class="contract-review">
    <!-- 主控制面板 -->
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>智能合同审查</span>
          <div class="header-actions">
            <el-button type="info" @click="showStats = !showStats" :icon="DataAnalysis">
              统计信息
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 统计信息面板组件 -->
      <StatsPanel 
        :visible="showStats"
        :stats="stats"
        :queue-status="queueStatus"
        @clear-completed="clearCompletedTasks"
      />
      
      <!-- 操作按钮 -->
      <div class="action-bar-center">
        <el-space size="large">
          <el-button type="success" @click="() => saveConfigToLocal(true)" :icon="Document">
            保存配置
          </el-button>
          <el-button type="warning" @click="resetConfig" :icon="Refresh">
            重置配置
          </el-button>

        </el-space>
      </div>
    </el-card>

    <div class="content">
      <!-- 规则配置组件 -->
      <RulesConfig 
        :rules="rules"
        :processing-rules="processingRules"
        @execute-rule="executeRule"
        @update-rule-config="updateRuleConfig"
      />
    </div>
    

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Document, Refresh, DataAnalysis } from '@element-plus/icons-vue'
import taskPane from '../../services/wps/taskpane.js'
import TaskScheduler from '../../services/ai/TaskScheduler.js'
import { getOptimalConfig, getPerformanceRecommendations, PERFORMANCE_MONITORING } from '../../services/ai/config/performance-config.js'
import StatsPanel from '../common/StatsPanel.vue'
import RulesConfig from './RulesConfig.vue'

console.log('合同审查组件已加载')

// 响应式数据
const showStats = ref(false)
const processingRules = ref(new Set())



// 统计信息
const stats = ref({
  totalTasks: 0,
  completedTasks: 0,
  cacheHitRate: 0,
  averageProcessingTime: 0
})

// 任务队列状态
const queueStatus = ref({
  running: [],
  pending: [],
  completed: []
})

// 获取最佳配置
const optimalConfig = getOptimalConfig('production', 'normal', {
  // 可以在这里添加自定义配置覆盖
})

// 初始化TaskScheduler
const taskScheduler = new TaskScheduler(optimalConfig)

// 默认规则配置
const DEFAULT_RULES = [
  {
    name: 'extractText',
    icon: '🤖',
    title: 'AI抽取合同信息',
    description: '使用AI智能提取合同关键信息',
    configForm: {
      extractTags: {
        label: '提取数据要素',
        type: 'tags',
        value: ['甲方名称', '乙方名称', '合同金额'],
        inputValue: ''
      }
    }
  },
  {
    name: 'contractReview',
    icon: '⚖️',
    title: 'AI合同预审',
    description: 'AI预审合同，使用自定义规则更灵活',
    configForm: {
      contractReviewRules: {
        label: 'AI合同预审规则',
        type: 'contractReviewList',
        value: [
          {
            reviewRules: '审查争议解决条款',
            reviewRequirements: '审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？',
            actionType: '批注'
          },
          {
            reviewRules: '审查违约责任条款',
            reviewRequirements: '审查合同中违约责任条款是否明确，违约金或赔偿标准是否合理，是否存在免责条款？',
            actionType: '批注'
          }
        ]
      }
    }
  },
  {
    name: 'addHeader',
    icon: '📄',
    title: '添加页眉',
    description: '为文档添加标准页眉信息',
    configForm: {
      headerText: {
        label: '页眉文本',
        type: 'text',
        value: '合同编号',
        placeholder: '请输入页眉文本'
      },
      fontSize: {
        label: '字体大小',
        type: 'select',
        value: '12pt',
        options: ['10pt', '12pt', '14pt', '16pt']
      },
      alignment: {
        label: '对齐方式',
        type: 'select',
        value: '右对齐',
        options: ['左对齐', '居中', '右对齐']
      }
    }
  },
  {
    name: 'keywordComment',
    icon: '🔍',
    title: '关键词批注',
    description: '识别关键词并添加批注',
    configForm: {
      keywordList: {
        type: 'keywordList',
        value: [
          { keyword: '违约', comment: '此处涉及违约条款，需重点关注' },
          { keyword: '责任', comment: '责任条款，请仔细审查' },
          { keyword: '赔偿', comment: '赔偿相关条款，注意金额和条件' },
          { keyword: '终止', comment: '合同终止条件，需明确约定' }
        ]
      }
    }
  },
  {
    name: 'analyzeDocStructure',
    icon: '📋',
    title: '分析文档内容结构',
    description: '自动抽取出文档的一级标题、二级标题、三级标题',
    configForm: {
      // 不需要配置具体内容，保持为空对象
    }
  }

]

// 规则配置
const rules = ref(JSON.parse(JSON.stringify(DEFAULT_RULES)))

// 执行结果映射
const resultMessages = {
  addHeader: '页眉添加成功！',
  keywordComment: '关键词批注添加完成！',
  extractText: 'AI合同信息抽取完成！',
  contractReview: 'AI合同预审完成！',
  analyzeDocStructure: '文档内容结构分析完成！'
}

// 需要AI处理的规则类型
const AI_RULE_TYPES = ['extractText', 'contractReview', 'analyzeDocStructure']

// 提取规则配置参数
const extractRuleParams = (ruleType) => {
  const currentRule = rules.value.find(rule => rule.name === ruleType)
  const config = currentRule?.configForm || {}
  const params = {}
  
  Object.keys(config).forEach(key => {
    const field = config[key]
    if (field.type === 'contractReviewList') {
      // 对于contractReviewList类型，将规则数组转换为合适的格式
      params.reviewRules = field.value
    } else {
      params[key] = field.value
    }
  })
  
  return params
}


// 任务监听器管理
const taskListeners = new Map()

// 清理任务监听器
const cleanupTaskListeners = (taskId) => {
  const listeners = taskListeners.get(taskId)
  if (listeners) {
    taskScheduler.off('taskComplete', listeners.onComplete)
    taskScheduler.off('taskError', listeners.onError)
    taskListeners.delete(taskId)
  }
}

// 创建任务事件监听器
const createTaskListeners = (taskId, ruleType, params) => {
  // 清理可能存在的旧监听器
  cleanupTaskListeners(taskId)
  
  const handleTaskComplete = (task) => {
    if (task.id === taskId) {
      handleTaskResult(ruleType, task.result, params)
      cleanupTaskListeners(taskId)
    }
  }
  
  const handleTaskError = (task, error) => {
    if (task.id === taskId) {
      console.error('任务执行失败:', error)
      ElMessage.error(`任务执行失败: ${error.message}`)
      cleanupTaskListeners(taskId)
    }
  }
  
  // 存储监听器引用
  taskListeners.set(taskId, {
    onComplete: handleTaskComplete,
    onError: handleTaskError
  })
  
  taskScheduler.on('taskComplete', handleTaskComplete)
  taskScheduler.on('taskError', handleTaskError)
}

// 执行规则
const executeRule = async (ruleType) => {
  console.log('执行规则:', ruleType)
  
  // 防止重复执行
  if (processingRules.value.has(ruleType)) {
    ElMessage.warning('该规则正在执行中，请稍候...')
    return
  }

  processingRules.value.add(ruleType)
  
  try {
    // 提取配置参数
    const params = extractRuleParams(ruleType)
    console.log('执行参数:', params)

    // 对于不需要AI处理的规则，直接执行
    if (!AI_RULE_TYPES.includes(ruleType)) {
      console.log('执行非AI规则:', ruleType)
      await handleTaskResult(ruleType, null, params)
      return
    }

    // 对于需要AI处理的规则，获取文档内容并添加到任务队列
    const documentContent = await taskPane.onbuttonclick('extractText')
    console.log('获取到的文档内容:', documentContent)
    console.log('文档内容类型:', typeof documentContent)
    console.log('文档内容长度:', documentContent?.length || 0)
    
    // 检查是否成功获取到文档内容
    if (!documentContent || typeof documentContent !== 'string' || !documentContent.trim()) {
      console.error('文档内容获取失败:', {
        content: documentContent,
        type: typeof documentContent,
        length: documentContent?.length || 0
      })
      
      ElMessage.error({
        message: '无法获取文档内容，请检查以下几点：\n1. 确保已在WPS中打开文档\n2. 确保文档中有内容\n3. 尝试刷新页面重新加载插件',
        duration: 5000,
        showClose: true
      })
      return
    }
    
    // 创建任务配置
    const taskConfig = {
      type: ruleType,
      priority: 'high',
      content: documentContent,
      options: params
    }

    // 添加任务到调度器
    const taskId = taskScheduler.addTask(taskConfig)
    
    // 创建事件监听器
    createTaskListeners(taskId, ruleType, params)
     
    ElMessage.info('任务已添加到队列，正在处理中...')
  } catch (error) {
    console.error('规则执行失败:', error)
    ElMessage.error('规则执行失败，请检查文档状态。')
  } finally {
    processingRules.value.delete(ruleType)
  }
}

// 更新规则配置
const updateRuleConfig = (ruleName, configKey, value) => {
  const rule = rules.value.find(r => r.name === ruleName)
  if (rule && rule.configForm && rule.configForm[configKey]) {
    rule.configForm[configKey].value = value
  }
}



// 重置配置到默认值
const resetConfig = () => {
  rules.value = JSON.parse(JSON.stringify(DEFAULT_RULES))
  localStorage.removeItem(STORAGE_KEY)
  ElMessage.success('配置已重置为默认值')
}

// 本地存储键名
const STORAGE_KEY = 'contract_review_rules_config'

// 保存配置到本地存储
const saveConfigToLocal = (showMessage = false) => {
  try {
    const configData = {
      rules: rules.value,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configData))
    console.log('配置已保存到本地存储')
    if (showMessage) {
      ElMessage.success('配置已保存到本地存储')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    if (showMessage) {
      ElMessage.error('保存配置失败')
    }
  }
}

// 从本地存储加载配置
const loadConfigFromLocal = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const configData = JSON.parse(savedData)
      if (configData.rules && Array.isArray(configData.rules)) {
        rules.value = configData.rules
        console.log('已从本地存储加载配置')
        ElMessage.success('已加载上次保存的配置')
        return true
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
  return false
}

// 监听规则配置变化，自动保存
watch(rules, () => {
  saveConfigToLocal()
}, { deep: true })



// 统计信息缓存
let statsCache = null
let queueStatusCache = null
let lastUpdateTime = 0
const UPDATE_INTERVAL = 1000 // 1秒更新间隔

// 防抖更新统计信息
const updateStats = () => {
  const now = Date.now()
  if (now - lastUpdateTime < UPDATE_INTERVAL && statsCache) {
    stats.value = statsCache
    return
  }
  
  if (!taskScheduler) return
  
  const schedulerStats = taskScheduler.getStats()
  
  // 安全处理缓存命中率，避免NaN
  let cacheHitRate = schedulerStats.cacheHitRate || 0
  if (isNaN(cacheHitRate) || !isFinite(cacheHitRate)) {
    cacheHitRate = 0
  }
  
  // 安全处理平均处理时间
  let averageProcessingTime = schedulerStats.averageProcessingTime || 0
  if (isNaN(averageProcessingTime) || !isFinite(averageProcessingTime)) {
    averageProcessingTime = 0
  }
  
  statsCache = {
    totalTasks: schedulerStats.totalTasks || 0,
    completedTasks: schedulerStats.completedTasks || 0,
    failedTasks: schedulerStats.failedTasks || 0,
    cacheHitRate: Math.round(cacheHitRate),
    averageProcessingTime: Math.round(averageProcessingTime),
    runningTasks: schedulerStats.runningTasksCount || 0,
    queueLength: schedulerStats.queueLength || 0,
    incremental: schedulerStats.incremental || {},
    errorRate: schedulerStats.failedTasks / Math.max(schedulerStats.totalTasks, 1)
  }
  stats.value = statsCache
  lastUpdateTime = now
  
  // 检查性能并提供建议
  checkPerformanceAndNotify()
}

// 防抖更新队列状态
const updateQueueStatus = () => {
  const now = Date.now()
  if (now - lastUpdateTime < UPDATE_INTERVAL && queueStatusCache) {
    queueStatus.value = queueStatusCache
    return
  }
  
  if (!taskScheduler) return
  
  const status = taskScheduler.getQueueStatus()
  queueStatusCache = {
    running: status.running || [],
    pending: status.pending || [],
    completed: status.completed || []
  }
  queueStatus.value = queueStatusCache
  lastUpdateTime = now
  

}

// 任务结果处理器映射
const taskResultHandlers = {
  extractText: async (result, params) => {
    if (result?.data) {
      await taskPane.onbuttonclick('extractText', {
        extractContent: params.extractTags || [],
        aiResult: result.data
      })
    }
  },
  
  contractReview: async (result, params) => {
    if (result?.data) {
      await taskPane.onbuttonclick('contractReview', {
        reviewRules: params.reviewRules,
        reviewRequirements: params.reviewRequirements,
        actionType: params.actionType === '批注' ? 'comment' : 'revision',
        aiResult: result.data
      })
    }
  },
  
  analyzeDocStructure: async (result, params) => {
    if (result?.data) {
      await taskPane.onbuttonclick('analyzeDocStructure', {
        aiResult: result.data
      })
    }
  },
  
  keywordComment: async (result, params) => {
    await taskPane.onbuttonclick('addComment', {
      keywordList: params.keywordList
    })
  },
  
  addHeader: async (result, params) => {
    await taskPane.onbuttonclick('addHeader', {
      headerText: params.headerText,
      fontSize: params.fontSize,
      alignment: params.alignment
    })
  }
}

// 处理任务结果
const handleTaskResult = async (ruleType, result, params) => {
  try {
    console.log('处理任务结果:', ruleType, result)
    
    // 获取对应的处理器
    const handler = taskResultHandlers[ruleType]
    if (handler) {
      await handler(result, params)
    } else {
      console.warn('未知的规则类型:', ruleType)
    }
    
    // 等待WPS完成渲染
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success(resultMessages[ruleType] || '规则执行完成！')
    
  } catch (error) {
    console.error('处理任务结果失败:', error)
    ElMessage.error('处理结果时发生错误')
  }
}



// 清理已完成任务
const clearCompletedTasks = () => {
  queueStatus.value.completed = []
  ElMessage.success('已清理完成的任务')
}



// 计算已完成任务数量（使用缓存）
const completedTasksCount = computed(() => {
  return queueStatus.value.completed.length
})

// 检查是否有已完成的任务（使用缓存）
const hasCompletedTasks = computed(() => {
  return queueStatus.value.completed.length > 0
})

// 开始快速分析
const startQuickAnalysis = () => {
  // 添加一些常用的分析任务
  const quickTasks = [
    { type: 'extractText', name: 'AI文本抽取', priority: 'high' },
    { type: 'contractReview', name: 'AI合同预审', priority: 'high' },
    { type: 'analyzeDocStructure', name: '文档结构分析', priority: 'medium' }
  ]
  
  quickTasks.forEach(task => {
    const rule = {
      id: Date.now() + Math.random(),
      name: task.name,
      type: task.type,
      priority: task.priority,
      enabled: true
    }
    executeRule(rule)
  })
  
  ElMessage.success('已启动快速分析任务')
}

// 性能监控
const performanceCheckCount = ref(0)
const lastPerformanceCheck = ref(Date.now())

// 检查性能并提供建议（已禁用通知）
const checkPerformanceAndNotify = () => {
  performanceCheckCount.value++
  
  // 性能优化建议已禁用
  // 如需重新启用，可以取消下面代码的注释
  /*
  if (performanceCheckCount.value % 5 === 0) {
    const recommendations = getPerformanceRecommendations(stats.value)
    
    if (recommendations.length > 0) {
      const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high')
      
      if (highPriorityRecs.length > 0) {
        ElNotification({
          title: '性能优化建议',
          message: highPriorityRecs[0].message,
          type: 'warning',
          duration: 8000,
          position: 'bottom-right'
        })
      }
    }
  }
  */
}

// 定时器引用
let updateInterval = null

// 组件挂载时的初始化
onMounted(() => {
  console.log('合同审查组件已挂载')
  console.log('使用配置:', optimalConfig)
  
  // 加载本地保存的配置
  loadConfigFromLocal()
  
  // 定期更新统计信息和队列状态（降低频率）
  updateInterval = setInterval(() => {
    updateStats()
    updateQueueStatus()
  }, 2000) // 从1秒改为2秒
  
  // 初始化统计信息
  updateStats()
  updateQueueStatus()
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
  
  // 清理所有任务监听器
  taskListeners.forEach((_, taskId) => {
    cleanupTaskListeners(taskId)
  })
  taskListeners.clear()
  
  // 清理缓存
  statsCache = null
  queueStatusCache = null
})
</script>

<style scoped>
.contract-review {
  padding: 10px;
  height: 100vh;
  overflow-y: auto;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

.contract-review::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
}

.header-card {
  margin-bottom: 20px;
}

.header-card h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.header-card p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.action-bar {
  margin-bottom: 20px;
}

.rules-card {
  margin-bottom: 20px;
}

.rules-card h3 {
  color: #333;
  margin: 0;
  font-size: 18px;
}

.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 10px;
}

.rule-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.rule-content {
  padding: 16px 0;
}

.rule-config {
  margin-top: 16px;
}


.action-bar-center {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-panel {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.progress-item {
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.percentage-value {
  font-weight: bold;
  color: #409EFF;
}

.queue-overview {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.rule-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.queue-card {
  margin-top: 20px;
}

.queue-card .el-table {
  margin-top: 16px;
}
</style>