<template>
  <div class="contract-review p-2.5 h-screen overflow-y-auto">
    <!-- 主控制面板 -->
    <el-card class="wps-section" shadow="never">
      <!-- 操作按钮 -->
      <div class="flex justify-center">
        <el-space size="large">
          <el-button type="success" @click="() => saveConfigToLocal(true)" :icon="Document">
            保存配置
          </el-button>
          <el-button type="warning" @click="resetConfig" :icon="Refresh"> 重置配置 </el-button>
          <el-button type="danger" @click="clearCache" :icon="Delete"> 清除缓存 </el-button>
        </el-space>
      </div>

    </el-card>

    <div class="content">
      <!-- 规则配置组件 -->
      <RulesConfig
        :rules="rules"
        :processing-rules="processingRules"
        :extracted-data="extractedData"
        :active-extracted-items="activeExtractedItems"
        :submitting="submitting"
        @execute-rule="executeRule"
        @update-rule-config="updateRuleConfig"
        @submit-extracted-data="submitExtractedData"
        @update:active-extracted-items="activeExtractedItems = $event"
        @update:extracted-data="extractedData = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Refresh, Delete } from '@element-plus/icons-vue'
import taskPane from '../wps/TestPage.js'
import TaskScheduler from '../services/ai/TaskScheduler.js'
import RulesConfig from './RulesConfig.vue'
import { kdocsHandler } from '../utils/kdocs.js'

console.log('合同审查组件已加载')

// 响应式数据
const processingRules = ref(new Set())
const extractedData = ref(null) // 存储抽取的合同信息
const activeExtractedItems = ref([]) // 控制折叠面板展开状态
const submitting = ref(false) // 提交状态

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
        value: ['合同名称', '甲方', '乙方', '其他方', '合同金额'],
        inputValue: ''
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
          { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。' },
          {
            keyword: '付款方式',
            comment:
              '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。'
          },
          {
            keyword: '费用',
            comment:
              '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。'
          },
          {
            keyword: '验收',
            comment:
              '提醒经办人员注意加强验收，并注意检查验收材料的真实性、准确性、完整性，妥善保管好验收有关资料。'
          },
          { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误' },
          { keyword: '仲裁', comment: '建议约定统一约定法院管辖' },
          { keyword: '“广东特支计划”', comment: '提醒确认项目名称以及期数是否准确无误' },
          {
            keyword: '培养期为',
            comment: '提醒确认培养期是否准确无误。请注意签约时间是否合理！！！'
          },
          {
            keyword: '资金发放安排',
            comment:
              '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。'
          },
          { keyword: '榜单项目信息', comment: '提醒确认此部分内容是否准确无误。' }
        ]
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
            reviewRequirements:
              '审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？',
            actionType: '批注'
          },
          {
            reviewRules: '审查违约责任条款',
            reviewRequirements:
              '审查合同中违约责任条款是否明确，违约金或赔偿标准是否合理，是否存在免责条款？',
            actionType: '批注'
          }
        ]
      }
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
  const currentRule = rules.value.find((rule) => rule.name === ruleType)
  const config = currentRule?.configForm || {}
  const params = {}

  Object.keys(config).forEach((key) => {
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
        message:
          '无法获取文档内容，请检查以下几点：\n1. 确保已在WPS中打开文档\n2. 确保文档中有内容\n3. 尝试刷新页面重新加载插件',
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
  const rule = rules.value.find((r) => r.name === ruleName)
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
    const cacheManager = window.cacheManager || (taskScheduler && taskScheduler.cacheManager)

    if (!cacheManager) {
      ElMessage.warning('缓存管理器不可用')
      return
    }

    await ElMessageBox.confirm(
      '确定要清除所有AI分析缓存吗？此操作不可恢复。\n\n注意：现在每次打开新文档时会自动清除缓存，缓存时长已调整为30分钟。',
      '清除缓存确认',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    cacheManager.clear()
    ElMessage.success('缓存已清除')
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
watch(
  rules,
  () => {
    saveConfigToLocal()
  },
  { deep: true }
)

// 任务结果处理器映射
const taskResultHandlers = {
  extractText: async (result) => {
    console.log('extractText 完整结果:', result)
    console.log('result类型:', typeof result)

    // TaskScheduler的parseAIResponse直接返回解析后的JSON对象
    if (result && typeof result === 'object' && !result.error) {
      // 过滤掉非数据字段
      const filteredData = {}
      Object.keys(result).forEach((key) => {
        if (key !== 'content' && key !== 'type' && key !== 'error') {
          filteredData[key] = result[key]
        }
      })

      console.log('过滤后的抽取信息:', filteredData)

      // 如果过滤后有数据，使用过滤后的数据，否则使用原始数据
      let finalData = Object.keys(filteredData).length > 0 ? filteredData : result

      // 确保包含所有必需字段
      const requiredFields = ['合同名称', '甲方', '乙方', '其他方', '合同金额']
      requiredFields.forEach((field) => {
        if (!finalData[field]) {
          finalData[field] = '' // 为缺失字段设置空字符串
        }
      })

      // 对接客户字段默认为空
      finalData['对接客户'] = ''

      console.log('补充字段后的数据:', finalData)

      // 检查合同名称，如果是人才培养协议或含有"揭榜挂帅"，则交换乙方和丙方
      const contractName = finalData['合同名称'] || ''
      if (contractName.includes('人才培养协议') || contractName.includes('揭榜挂帅')) {
        console.log('检测到特殊合同类型，交换乙方和丙方:', contractName)

        // 交换乙方和丙方（其他方）
        const tempPartyB = finalData['乙方']
        finalData['乙方'] = finalData['其他方'] || finalData['丙方'] || ''
        finalData['其他方'] = tempPartyB

        // 如果存在丙方字段，也进行相应处理
        if (finalData['丙方']) {
          finalData['丙方'] = tempPartyB
        }

        console.log('交换后的数据:', finalData)
      }

      // 将抽取的数据存储到响应式变量中
      extractedData.value = finalData
      // 默认展开所有项目
      activeExtractedItems.value = Object.keys(finalData)
      console.log('已设置extractedData.value:', extractedData.value)
    } else {
      console.warn('未找到有效的抽取数据或存在错误:', result)
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

  analyzeDocStructure: async (result) => {
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

// 提交抽取的数据
const submitExtractedData = async () => {
  if (!extractedData.value) {
    ElMessage.warning('没有可提交的数据')
    return
  }

  submitting.value = true

  try {
    // 1. 保存到本地存储
    const storageKey = 'contract_extracted_data'
    const dataToSave = {
      data: extractedData.value,
      timestamp: Date.now(),
      id: Date.now().toString()
    }

    // 获取现有数据
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]')
    existingData.push(dataToSave)
    localStorage.setItem(storageKey, JSON.stringify(existingData))

    console.log('数据已保存到本地存储')

    // 2. 数据验证和处理
    const fields = { ...extractedData.value }

    // 确保所有字段都存在，为空字段设置空字符串
    const allFields = ['合同名称', '甲方', '乙方', '其他方', '合同金额', '对接客户']
    allFields.forEach((field) => {
      if (!fields[field] || fields[field].trim() === '') {
        fields[field] = '' // 为空字段设置空字符串
      }
    })

    // 对接客户字段强制设置为空
    fields['对接客户'] = ''

    console.log('处理后的字段数据:', fields)

    // 3. 调用金山文档接口创建记录
    console.log('创建金山文档行记录 fields', fields)

    const res = await kdocsHandler({
      type: 'createRecords',
      sheetID: Number(import.meta.env.VITE_KDOCS_SHEETID),
      inputData: [{ fields }]
    })

    console.log('res', res)

    let 审查编号 = res?.data?.[0]?.fields?.审查编号
    console.log('审查编号', 审查编号)

    if (!审查编号) {
      const 编号 = res?.data?.[0]?.fields?.编号
      // 是否存在编号
      if (编号) {
        // 自定义构建审查编号 SWXCBHT-年份-编号
        审查编号 = `SWXCBHT-${new Date().getFullYear()}-${编号}`
        console.log('审查编号', 审查编号)
      } else {
        ElMessage.error('创建金山文档行记录失败或者没有返回id')
        return
      }
    }

    // 4. 添加页眉 - 将审查编号添加到页眉
    try {
      const headerRes = await taskPane.onbuttonclick('addHeader', {
        headerText: `文件编号：${审查编号}`,
        fontSize: '12', // 小四号字体
        alignment: '右对齐'
      })
      console.log('页眉添加结果', headerRes)

      if (headerRes?.success) {
        ElMessage.success(headerRes.message || '页眉添加成功')
      } else {
        ElMessage.warning(headerRes?.message || '页眉添加失败')
      }
    } catch (headerError) {
      console.error('添加页眉失败:', headerError)
      ElMessage.error('添加页眉时发生错误')
      // 页眉添加失败不影响整体流程，只记录错误
    }

    ElMessage.success('数据提交成功！')

    return res?.data?.[0]
  } catch (error) {
    console.error('提交数据失败:', error)
    ElMessage.error(`提交失败: ${error.message}`)
  } finally {
    submitting.value = false
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
    await new Promise((resolve) => setTimeout(resolve, 500))

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
  /* 只保留滚动条隐藏样式 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

.contract-review::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
}
</style>
