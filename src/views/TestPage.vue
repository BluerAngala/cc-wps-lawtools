<template>
  <n-config-provider>
    <div class="p-4 space-y-4">
      <!-- 顶部信息卡片 -->
      <n-card title="WPS 加载项调试工具" size="small">
        <template #header-extra>
          <n-tag type="info" size="small">🔧 调试模式</n-tag>
        </template>
        <n-space vertical size="small">
          <n-text depth="3">
            按 <n-tag size="tiny">F12</n-tag> 打开调试器
          </n-text>
          <n-text depth="3">
            <n-button  type="primary" @click="onOpenWeb()">
              {{ DemoSpan || '打开开发文档页面' }}
            </n-button>
          </n-text>
          
        </n-space>
      </n-card>


      <!-- 功能测试面板 -->
      <n-card title="功能测试面板" size="small">
        <n-collapse accordion>
          <!-- 基础文档操作 -->
          <n-collapse-item title="📄 基础文档操作" name="basicOps">
            <n-space vertical size="medium">
              <n-space>
                <n-button @click="executeTest('insertDateTime')" type="primary" size="small">
                  ⏰ 插入时间
                </n-button>
                <n-button @click="executeTest('addHeader')" type="primary" size="small">
                  📋 添加页眉
                </n-button>
                <n-button @click="executeTest('addComment')" type="primary" size="small">
                  💬 添加批注
                </n-button>
                <n-button @click="executeTest('addString')" type="primary" size="small">
                  ✏️ 添加文本
                </n-button>
              </n-space>
              <!-- 结果预览 -->
              <n-alert v-if="testResults.basicOps" type="info" title="执行结果">
                <n-code :code="testResults.basicOps" language="text" />
              </n-alert>
            </n-space>
          </n-collapse-item>

          <!-- 文本处理 -->
          <n-collapse-item title="📝 文本处理" name="textProcessing">
            <n-space vertical size="medium">
              <n-space>
                <n-button @click="executeTest('extractText')" type="success" size="small">
                  📄 提取文本
                </n-button>
                <n-button @click="executeTest('desensitizeText')" type="warning" size="small">
                  🔒 脱敏文本
                </n-button>
                <n-button @click="executeTest('getDocName')" type="default" size="small">
                  📋 取文件名
                </n-button>
                <n-button @click="executeTest('renameDoc')" type="default" size="small">
                  ✏️ 重命名
                </n-button>
              </n-space>
              
              <!-- 脱敏配置区域 -->
              <n-divider title-placement="center">⚙️ 脱敏配置</n-divider>
              <n-text depth="3">系统会自动检测常见敏感信息（手机号、身份证号等）</n-text>
              <n-space vertical>
                <n-form-item label="白名单 (每行一个)">
                  <n-input
                    v-model:value="whitelist"
                    type="textarea"
                    placeholder="请输入白名单项，每行一个"
                    :rows="3"
                  />
                </n-form-item>
                <n-form-item label="自定义敏感词 (格式: 敏感词|替换词)">
                  <n-input
                    v-model:value="customSensitiveWords"
                    type="textarea"
                    placeholder="请输入自定义敏感词，格式: 敏感词|替换词，每行一个"
                    :rows="3"
                  />
                </n-form-item>
              </n-space>
              
              <!-- 结果预览 -->
              <n-alert v-if="testResults.textProcessing" type="success" title="执行结果">
                <n-code :code="testResults.textProcessing" language="text" />
              </n-alert>
            </n-space>
          </n-collapse-item>

          <!-- AI功能 -->
          <n-collapse-item title="🤖 AI功能" name="aiFeatures">
            <n-space vertical size="medium">
              <n-button @click="executeTest('processWithAI')" type="success" size="small">
                🤖 AI处理文档
              </n-button>
              
              <!-- AI文本处理区域 -->
              <n-divider title-placement="center">AI文本处理</n-divider>
              <n-space vertical>
                <n-form-item label="输入文本内容">
                  <n-input
                    v-model:value="userInputText"
                    type="textarea"
                    placeholder="请输入要处理的文本内容"
                    :rows="4"
                  />
                </n-form-item>
                <n-form-item label="处理要求">
                  <n-input
                    v-model:value="userProcessRequest"
                    placeholder="请输入处理要求，例如：总结要点"
                  />
                </n-form-item>
                <n-button 
                  @click="onProcessUserTextWithAI" 
                  type="success"
                  block
                  :loading="isProcessing"
                >
                  <template #icon>
                    <n-icon><span>🤖</span></n-icon>
                  </template>
                  {{ isProcessing ? '处理中...' : 'AI处理' }}
                </n-button>
              </n-space>
              
              <!-- 结果预览 -->
              <n-alert v-if="testResults.aiFeatures" type="info" title="执行结果">
                <n-code :code="testResults.aiFeatures" language="text" />
              </n-alert>
              
              <!-- AI处理结果 -->
              <n-alert v-if="aiProcessedText" type="success" title="✨ AI处理结果">
                <n-code :code="aiProcessedText" language="text" />
              </n-alert>
            </n-space>
          </n-collapse-item>

          <!-- 窗格控制 -->
          <n-collapse-item title="🖼️ 窗格控制" name="paneControl">
            <n-space vertical size="medium">
              <n-space>
                <n-button @click="executeTest('dockLeft')" size="small">
                  ⬅️ 停靠左边
                </n-button>
                <n-button @click="executeTest('dockRight')" size="small">
                  ➡️ 停靠右边
                </n-button>
                <n-button @click="executeTest('hideTaskPane')" size="small">
                  👁️ 隐藏窗格
                </n-button>
              </n-space>
              <!-- 结果预览 -->
              <n-alert v-if="testResults.paneControl" type="warning" title="执行结果">
                <n-code :code="testResults.paneControl" language="text" />
              </n-alert>
            </n-space>
          </n-collapse-item>
        </n-collapse>
      </n-card>

      <!-- 全局文档信息 -->
      <n-card v-if="docName" title="📄 当前文档" size="small">
        <n-code :code="docName" language="text" />
      </n-card>

      <!-- 全局提取的文本内容 -->
      <n-card v-if="extractedText" title="📝 文档文本内容" size="small">
        <n-code :code="extractedText" language="text" :max-height="240" />
      </n-card>

      <!-- 脱敏信息 -->
      <n-card v-if="sensitiveInfoList.length > 0" title="🔒 检测到的敏感信息" size="small">
        <n-space vertical>
          <n-list>
            <n-list-item v-for="(info, index) in sensitiveInfoList" :key="index">
              <n-thing :title="info.type">
                <template #description>
                  <n-space vertical size="small">
                    <n-text>原始: <n-tag type="error" size="small">{{ info.original }}</n-tag></n-text>
                    <n-text>脱敏: <n-tag type="success" size="small">{{ info.desensitized }}</n-tag></n-text>
                  </n-space>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-space>
            <n-button @click="applyDesensitization" type="success" size="small">
              应用脱敏
            </n-button>
            <n-button @click="sensitiveInfoList = []" size="small">
              取消
            </n-button>
          </n-space>
        </n-space>
      </n-card>
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  NConfigProvider, NCard, NButton, NSpace, NText, NIcon, NTag, 
  NCollapse, NCollapseItem, NAlert, NCode, NInput, NFormItem, 
  NDivider, NList, NListItem, NThing 
} from 'naive-ui'
import taskPane from '../services/wps/wpsTestHelper.js'
import { desensitizeText } from '../services/document/desensitize.js'
import TaskScheduler from '../services/ai/TaskScheduler.js'
import errorLogger from '@/utils/errorLogger'

console.log('TaskPane组件已加载')
console.log('当前打开的文档：', window.Application.ActiveDocument)

// 初始化AI框架
const taskScheduler = new TaskScheduler({
  maxConcurrentTasks: 3,
  taskTimeout: 30000,
  retryAttempts: 2
})
console.log('TaskPane AI框架已初始化')

// 响应式数据
const DemoSpan = ref('')
const docName = ref('')
const extractedText = ref('')
const aiProcessedText = ref('')
const userInputText = ref('')
const userProcessRequest = ref('')
const isProcessing = ref(false)
const desensitizedText = ref('')
const sensitiveInfoList = ref([])
const whitelist = ref('')
const customSensitiveWords = ref('')


// 测试结果存储
const testResults = ref({
  basicOps: '',
  textProcessing: '',
  aiFeatures: '',
  paneControl: ''
})

// 功能分类映射
const functionCategories = {
  insertDateTime: 'basicOps',
  addHeader: 'basicOps',
  addComment: 'basicOps',
  addString: 'basicOps',
  extractText: 'textProcessing',
  desensitizeText: 'textProcessing',
  getDocName: 'textProcessing',
  renameDoc: 'textProcessing',
  processWithAI: 'aiFeatures',
  dockLeft: 'paneControl',
  dockRight: 'paneControl',
  hideTaskPane: 'paneControl'
}

// 计算属性

const hasSensitiveInfo = computed(() => {
  return sensitiveInfoList.value?.length > 0
})


// 获取当前文档纯文本
const getDocText = async () => {
  const text = await taskPane.onbuttonclick('extractText')
  if (typeof text === 'string' && text.trim()) {
    extractedText.value = text
    return text
  }
  return ''
}

// 打开网页
const onOpenWeb = () => {
  // 传递 WPS 开发文档的 URL
  taskPane.onbuttonclick('openWeb', 'https://qn.cache.wpscdn.cn/encs/doc/office_v19/index.htm')
}



// 执行测试功能
const executeTest = async (functionName) => {
  const category = functionCategories[functionName]
  if (!category) {
    console.warn('未找到功能分类:', functionName)
    return
  }

  try {
    // 清空之前的结果
    testResults.value[category] = ''
    
    // 显示加载状态
    testResults.value[category] = '执行中...'
    
    // 执行功能
    let result
    switch (functionName) {
      case 'desensitizeText': {
        const text = await getDocText()
        if (!text) {
          testResults.value[category] = '错误: 当前没有打开任何文档或文本为空'
          return
        }
        processDesensitizeText(text)
        testResults.value[category] = `已处理脱敏，检测到 ${sensitiveInfoList.value.length} 个敏感信息`
        break
      }
      
      case 'processWithAI':
        await processWithAI()
        testResults.value[category] = 'AI处理已启动，请查看控制台输出'
        break
      
      case 'extractText':
        result = await taskPane.onbuttonclick(functionName)
        extractedText.value = result
        testResults.value[category] = `提取文本成功，长度: ${result?.length || 0} 字符`
        break
      
      case 'getDocName':
        result = await taskPane.onbuttonclick(functionName)
        docName.value = result
        testResults.value[category] = `文档名称: ${result}`
        break
      
      case 'renameDoc':
        result = await taskPane.onbuttonclick(functionName)
        if (result) docName.value = result
        testResults.value[category] = result ? `重命名成功: ${result}` : '重命名失败'
        break
      
      case 'addHeader':
        result = await taskPane.onbuttonclick(functionName, {
          headerText: '测试页眉123',
          fontSize: 12,
          alignment: '居中'
        })
        testResults.value[category] = result?.success ? 
          `页眉添加成功: ${result.headerText}` : 
          `页眉添加失败: ${result?.message || '未知错误'}`
        break
      
      default:
        result = await taskPane.onbuttonclick(functionName)
        testResults.value[category] = result ? 
          (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)) : 
          '执行成功'
        break
    }
    
    console.log(`${functionName} 执行完成:`, result)
    
  } catch (error) {
    console.error(`执行 ${functionName} 时出错:`, error)
    testResults.value[category] = `错误: ${error.message}`
  }
}

// 统一的AI处理错误处理
const handleAIProcess = async (processFunc) => {
  try {
    await processFunc()
  } catch (error) {
    console.error('AI处理失败:', error)
    errorLogger.log('AI处理失败，请查看控制台错误信息', { method: 'handleAIProcess', error: error.message })
  }
}

// AI处理文本
const processWithAI = async () => {
  const result = await taskPane.onbuttonclick('processWithAI')
  console.log('result', result)

  // 获取到金山文档行记录id
  let recordID = result?.id
  console.log('recordID', recordID)

  // 获取到审查编号
  let contractNumber = result?.fields?.审查编号
  console.log('contractNumber', contractNumber)

  // 以修订模式，添加页眉（仅当有审查编号时）
  if (contractNumber) {
    taskPane.onbuttonclick('addHeader', {
      contractNumber: contractNumber
    })
  } else {
    console.warn('processWithAI: 未获取到审查编号，跳过添加页眉')
  }
}

// 处理用户输入的AI文本
const onProcessUserTextWithAI = async () => {
  if (!userInputText.value || !userProcessRequest.value) {
    errorLogger.log('请输入文本内容和处理要求', { method: 'onProcessUserTextWithAI' })
    return
  }

  isProcessing.value = true
  await handleAIProcess(async () => {
    // 创建AI任务配置
    const taskConfig = {
      type: 'customTextProcess',
      priority: 'high',
      content: userInputText.value,
      options: {
        processRequest: userProcessRequest.value
      }
    }

    // 添加任务到调度器
    const taskId = taskScheduler.addTask(taskConfig)

    // 监听任务完成事件
    const handleTaskComplete = (task) => {
      if (task.id === taskId) {
        if (task.result && task.result.data) {
          aiProcessedText.value = task.result.data
        }
        taskScheduler.off('taskComplete', handleTaskComplete)
      }
    }

    const handleTaskError = (task, error) => {
      if (task.id === taskId) {
        console.error('AI处理失败:', error)
        errorLogger.log('AI处理失败，请查看控制台错误信息', { method: 'onProcessUserTextWithAI', taskId, error: error.message })
        taskScheduler.off('taskError', handleTaskError)
      }
    }

    taskScheduler.on('taskComplete', handleTaskComplete)
    taskScheduler.on('taskError', handleTaskError)
  })
  isProcessing.value = false
}

// 脱敏文本处理
const processDesensitizeText = (text) => {
  const { desensitizedText: resultText, sensitiveInfoList: resultList } = desensitizeText(text)

  sensitiveInfoList.value = resultList
  desensitizedText.value = resultText

  if (resultList.length === 0) {
    window.$message?.info('未检测到敏感信息')
  }
}

// 应用脱敏到文档
const applyDesensitization = () => {
  if (hasSensitiveInfo.value) {
    taskPane.onbuttonclick('applyDesensitization', {
      sensitiveInfoList: sensitiveInfoList.value
    })
    extractedText.value = desensitizedText.value
    sensitiveInfoList.value = []
  }
}
</script>

