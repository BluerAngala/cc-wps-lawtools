<template>
  <div class="global">
    <div class="divItem">
      这是一个网页，按<span style="font-weight: bolder">"F12"</span>可以打开调试器。
    </div>
    <div class="divItem">
      这个示例展示了wps加载项的相关基础能力，与B/S业务系统的交互，请用浏览器打开：
      <span style="font-weight: bolder; color: slateblue; cursor: pointer" @click="onOpenWeb()">{{
        DemoSpan
      }}</span>
    </div>
    <div class="divItem">
      开发文档:
      <span style="font-weight: bolder; color: slateblue">https://open.wps.cn/docs/office</span>
    </div>
    <hr />
    <div class="divItem">
      <button style="margin: 3px" @click="onbuttonclick('insertDateTime')">插入当前时间</button>
      <button style="margin: 3px" @click="onbuttonclick('addHeader')">添加页眉</button>
      <button style="margin: 3px" @click="onbuttonclick('addComment')">添加批注</button>
      <button style="margin: 3px" @click="onbuttonclick('extractText')">提取纯文本</button>
      <button style="margin: 3px" @click="onbuttonclick('processWithAI')">AI处理文本</button>
      <button style="margin: 3px" @click="onbuttonclick('desensitizeText')">脱敏文本</button>
      <button style="margin: 3px" @click="onbuttonclick('dockLeft')">停靠左边</button>
      <button style="margin: 3px" @click="onbuttonclick('dockRight')">停靠右边</button>
      <button style="margin: 3px" @click="onbuttonclick('hideTaskPane')">隐藏TaskPane</button>
      <button style="margin: 3px" @click="onbuttonclick('addString')">文档开头添加字符串</button>
      <button style="margin: 3px" @click="onbuttonclick('getDocName')">取文件名</button>
      <button style="margin: 3px" @click="onbuttonclick('renameDoc')">
        修改文件名为「已修订」+原文件名
      </button>
    </div>

    <hr />
    <div class="divItem">
      文档文件名为：<span>{{ docName }}</span>
    </div>

    <div class="divItem" v-if="extractedText">
      <h3>纯文本内容：</h3>
      <pre>{{ extractedText }}</pre>
    </div>

    <!-- 脱敏信息展示 -->
    <div class="divItem" v-if="sensitiveInfoList.length > 0">
      <h3>检测到的敏感信息：</h3>
      <div v-for="(info, index) in sensitiveInfoList" :key="index" style="margin-bottom: 10px">
        <p>
          <strong>{{ info.type }}:</strong>
        </p>
        <p>原始: {{ info.original }}</p>
        <p>脱敏后: {{ info.desensitized }}</p>
      </div>
      <button style="margin: 3px" @click="applyDesensitization">应用脱敏</button>
      <button style="margin: 3px" @click="sensitiveInfoList = []">取消</button>
    </div>

    <!-- 脱敏后文本预览 -->
    <div class="divItem" v-if="desensitizedText">
      <h3>脱敏后文本预览：</h3>
      <pre>{{ desensitizedText }}</pre>
    </div>
    <div class="divItem" v-else>
      <h3>脱敏后文本预览：</h3>
      <p>
        未检测到敏感信息。请确保输入的文本包含敏感信息（如手机号、身份证号等），或检查是否已正确配置白名单和自定义敏感词。
      </p>
    </div>

    <!-- 脱敏配置 -->
    <div class="divItem">
      <h3>脱敏配置</h3>
      <p>
        提示：即使不输入白名单和自定义敏感词，系统也会自动检测常见的敏感信息（如手机号、身份证号等）。
      </p>
      <div>
        <label>白名单 (每行一个):</label>
        <textarea v-model="whitelist" placeholder="请输入白名单项，每行一个" rows="5" style="width: 100%"></textarea>
      </div>
      <div>
        <label>自定义敏感词 (格式: 敏感词|替换词，每行一个):</label>
        <textarea v-model="customSensitiveWords" placeholder="请输入自定义敏感词，格式: 敏感词|替换词，每行一个" rows="5"
          style="width: 100%"></textarea>
      </div>
    </div>

    <!-- AI交互展示 -->

    <div class="divItem">
      <h3>AI文本处理</h3>
      <div>
        <label>输入文本内容：</label>
        <textarea v-model="userInputText" placeholder="请输入要处理的文本内容" rows="5" style="width: 100%"></textarea>
      </div>
      <div>
        <label>处理要求：</label>
        <input v-model="userProcessRequest" placeholder="请输入处理要求，例如：总结要点" style="width: 100%" />
      </div>
      <button style="margin: 3px" @click="onProcessUserTextWithAI" :disabled="isProcessing">
        {{ isProcessing ? '处理中...' : 'AI处理' }}
      </button>
      <div v-if="isProcessing" style="margin-top: 10px; color: #007bff">正在处理中，请稍候...</div>
    </div>
    <div class="divItem" v-if="aiProcessedText">
      <h3>AI处理结果：</h3>
      <pre>{{ aiProcessedText }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import taskPane from '../backgroundjs/taskpane.js'
import { processDocumentContent } from '../utils/ai/siliconflow.js'
import { Desensitizer } from '../utils/desensitizeAdvanced.js'

console.log('TaskPane组件已加载')
console.log('当前打开的文档：', window.Application.ActiveDocument)

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

// 解析文本数组，过滤空行
const parseTextArray = (text) => {
  return text.split('\n').filter((item) => item.trim())
}

// 计算属性
const hasWhitelist = computed(() => {
  return parseTextArray(whitelist.value).length > 0
})

const hasCustomSensitiveWords = computed(() => {
  return parseTextArray(customSensitiveWords.value).length > 0
})

const hasSensitiveInfo = computed(() => {
  return sensitiveInfoList.value?.length > 0
})

// 统一的按钮点击处理
const onbuttonclick = async (id) => {
  let result

  switch (id) {
    // 点击AI处理按钮
    case 'processWithAI':
      console.log('点击AI处理按钮')
      await processWithAI()
      return
    // 点击脱敏按钮
    case 'desensitizeText': {
      console.log('点击脱敏按钮')
      const text = await getDocText()
      if (!text) {
        alert('当前没有打开任何文档或文本为空')
        return
      }
      processDesensitizeText(text)
      return
    }
    // 点击提取文本按钮
    case 'extractText':
      console.log('点击提取文本按钮')
      result = await taskPane.onbuttonclick(id)
      extractedText.value = result
      break

    // 点击重命名按钮
    case 'renameDoc':
      console.log('点击重命名按钮')
      result = await taskPane.onbuttonclick(id)
      if (result) docName.value = result
      break
    // 点击获取文档名称按钮
    case 'getDocName':
      console.log('点击获取文档名称按钮')
      result = await taskPane.onbuttonclick(id)
      docName.value = result
      break
    // 点击打开网页按钮
    case 'openWeb':
      console.log('点击打开网页按钮')
      // 网页打开功能已在taskpane.js中处理
      result = await taskPane.onbuttonclick(id)
      break
    // 点击添加页眉按钮
    case 'addHeader':
      console.log('点击添加页眉按钮')
      result = await taskPane.onbuttonclick(id, {
        contractNumber: '测试页眉123'
      })
      break
    //未定义 
    default:
      console.log('未定义指令， id', id)
      break
  }

  return result
}

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
  taskPane.onbuttonclick('openWeb', DemoSpan.value)
}

// 统一的AI处理错误处理
const handleAIProcess = async (processFunc) => {
  try {
    await processFunc()
  } catch (error) {
    console.error('AI处理失败:', error)
    alert('AI处理失败，请查看控制台错误信息')
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
    alert('请输入文本内容和处理要求')
    return
  }

  isProcessing.value = true
  await handleAIProcess(async () => {
    const fullPrompt = `${userProcessRequest.value}\n\n文本内容：\n${userInputText.value}`
    aiProcessedText.value = await processDocumentContent(fullPrompt)
  })
  isProcessing.value = false
}

// 脱敏文本处理
const processDesensitizeText = (text) => {
  const whitelistArray = parseTextArray(whitelist.value)
  const customWordsArray = parseTextArray(customSensitiveWords.value).map((item) => {
    const [word, replacement] = item.split('|')
    return { word: word.trim(), replacement: replacement?.trim() || '*' }
  })

  const desensitizer = new Desensitizer({
    whitelist: whitelistArray,
    customSensitiveWords: customWordsArray
  })

  const { desensitizedText: resultText, sensitiveInfoList: resultList } = desensitizer.desensitizeText(text)

  sensitiveInfoList.value = resultList
  desensitizedText.value = resultText

  if (resultList.length === 0) {
    alert('未检测到敏感信息')
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.global {
  font-size: 15px;
  min-height: 95%;
}

.divItem {
  margin-left: 5px;
  margin-bottom: 18px;
  font-size: 15px;
  word-wrap: break-word;
}

.divItem h3 {
  margin-top: 10px;
  margin-bottom: 5px;
  font-size: 16px;
  font-weight: bold;
}

.divItem pre {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  padding: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
</style>
