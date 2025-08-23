<template>
  <div class="contract-review">
    <!-- 主控制面板 -->
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>智能合同审查</span>
        </div>
      </template>
      
      <!-- 操作按钮 -->
      <div class="action-bar-center">
        <el-space size="large">
          <el-button type="success" @click="() => saveConfigToLocal(true)" :icon="Document">
            保存配置
          </el-button>
          <el-button type="warning" @click="resetConfig" :icon="Refresh">
            重置配置
          </el-button>
          <el-button type="danger" @click="clearCache" :icon="Delete">
            清除缓存
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
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { Document, Refresh, Delete } from '@element-plus/icons-vue'
import taskPane from '../../services/wps/taskpane.js'
import TaskScheduler from '../../services/ai/TaskScheduler.js'
import RulesConfig from './RulesConfig.vue'

console.log('合同审查组件已加载')

// 响应式数据
const processingRules = ref(new Set())

// 初始化TaskScheduler（使用简化配置）
const taskScheduler = new TaskScheduler({
  maxConcurrentTasks: 2,
  taskTimeout: 30000,
  retryAttempts: 2
})

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
     
    ElMessage.info('任务正在处理中...')
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

// 清除缓存
const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有AI分析缓存吗？此操作不可恢复。',
      '清除缓存确认',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 通过TaskScheduler访问CacheManager
    if (taskScheduler && taskScheduler.cacheManager) {
      taskScheduler.cacheManager.clear()
      ElMessage.success('缓存已清除')
    } else {
      ElMessage.warning('缓存管理器不可用')
    }
  } catch {
    // 用户取消操作
  }
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


// 组件挂载时的初始化
onMounted(() => {
  console.log('合同审查组件已挂载')
  
  // 加载本地保存的配置
  loadConfigFromLocal()
})

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理所有任务监听器
  taskListeners.forEach((_, taskId) => {
    cleanupTaskListeners(taskId)
  })
  taskListeners.clear()
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>