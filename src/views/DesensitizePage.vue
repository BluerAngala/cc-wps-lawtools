<template>
  <n-config-provider>
    <div class="p-2.5 h-screen overflow-y-auto scrollbar-none">
      <!-- 标题卡片 -->
      <div class="wps-card wps-section">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold">🔒 敏感信息脱敏</span>
            <n-tag v-if="isScanning" type="warning" size="small">扫描中</n-tag>
          </div>
          <n-space>
            <n-button type="primary" @click="scanDocument" :loading="isScanning" :disabled="isScanning">
              {{ isScanning ? '扫描中...' : '扫描文档' }}
            </n-button>
            <n-button 
              type="success" 
              @click="applyAllDesensitization" 
              :disabled="!hasSelectedItems"
              v-if="sensitiveInfoList.length > 0"
            >
              一键脱敏 ({{ selectedCount }})
            </n-button>
          </n-space>
        </div>

        <n-alert type="info" :closable="false" show-icon class="mb-4">
          <template #header>功能说明</template>
          <template #default>
            自动检测文档中的敏感信息（身份证号、手机号、邮箱、银行卡号等），支持选择性脱敏处理。
          </template>
        </n-alert>
      </div>

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
      <div v-else-if="!isScanning && scanned" class="wps-card wps-section mt-4">
        <n-empty description="未检测到敏感信息" class="py-8">
          <template #icon>
            <span class="text-4xl">✅</span>
          </template>
        </n-empty>
      </div>

      <!-- 高级配置 -->
      <n-collapse class="mt-4">
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
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  NConfigProvider,
  NButton,
  NSpace,
  NTag,
  NAlert,
  NList,
  NListItem,
  NThing,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NFormItem,
  NInput,
  NEmpty
} from 'naive-ui'
import { desensitizeText } from '../services/document/desensitize.js'

console.log('敏感信息脱敏页面已加载')

// 响应式数据
const isScanning = ref(false)
const scanned = ref(false)
const sensitiveInfoList = ref([])
const whitelist = ref('')
const customSensitiveWords = ref('')
const resultMessage = ref('')
const resultType = ref('success')

// 计算属性
const hasSelectedItems = computed(() => {
  return sensitiveInfoList.value.some(item => item.selected)
})

const selectedCount = computed(() => {
  return sensitiveInfoList.value.filter(item => item.selected).length
})

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

// 扫描文档
const scanDocument = async () => {
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
  resultMessage.value = ''

  try {
    // 获取文档全文
    const fullText = doc.Range().Text
    if (!fullText || fullText.trim().length === 0) {
      window.$message?.warning('文档内容为空')
      isScanning.value = false
      scanned.value = true
      return
    }

    console.log('开始扫描文档，文本长度:', fullText.length)

    // 解析白名单
    const whitelistArray = whitelist.value
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    // 解析自定义敏感词
    const customSensitiveWordsArray = customSensitiveWords.value
      .split('\n')
      .map(line => {
        const parts = line.split('|')
        if (parts.length === 2) {
          return {
            word: parts[0].trim(),
            replacement: parts[1].trim()
          }
        }
        return null
      })
      .filter(item => item !== null)

    console.log('白名单:', whitelistArray)
    console.log('自定义敏感词:', customSensitiveWordsArray)

    // 调用脱敏检测
    const { sensitiveInfoList: detectedList } = desensitizeText(fullText, {
      whitelist: whitelistArray,
      customSensitiveWords: customSensitiveWordsArray
    })

    // 为每个检测项添加选中状态
    sensitiveInfoList.value = detectedList.map(item => ({
      ...item,
      selected: true // 默认全选
    }))

    scanned.value = true

    if (sensitiveInfoList.value.length === 0) {
      window.$message?.success('未检测到敏感信息')
    } else {
      window.$message?.success(`检测到 ${sensitiveInfoList.value.length} 个敏感信息`)
    }

    console.log('扫描完成，检测到:', sensitiveInfoList.value)
  } catch (error) {
    console.error('扫描文档失败:', error)
    window.$message?.error('扫描失败: ' + error.message)
  } finally {
    isScanning.value = false
  }
}

// 全选
const selectAll = () => {
  sensitiveInfoList.value.forEach(item => {
    item.selected = true
  })
}

// 取消全选
const unselectAll = () => {
  sensitiveInfoList.value.forEach(item => {
    item.selected = false
  })
}

// 清除结果
const clearResults = () => {
  sensitiveInfoList.value = []
  scanned.value = false
  resultMessage.value = ''
}

// 应用脱敏
const applyAllDesensitization = async () => {
  if (!hasSelectedItems.value) {
    window.$message?.warning('请至少选择一个敏感信息')
    return
  }

  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.$message?.error('未找到活动文档')
    return
  }

  try {
    // 获取选中的敏感信息
    const selectedItems = sensitiveInfoList.value.filter(item => item.selected)
    console.log('开始应用脱敏，选中项:', selectedItems.length)

    // 使用 WPS 的查找替换功能，保留格式
    let replacedCount = 0
    const selection = doc.Application.Selection
    
    selectedItems.forEach(item => {
      // 重置查找范围到文档开头
      selection.HomeKey(6) // wdStory = 6，移动到文档开头
      
      const findObj = selection.Find
      findObj.ClearFormatting()
      findObj.Text = item.original
      findObj.Replacement.ClearFormatting()
      findObj.Replacement.Text = item.desensitized
      findObj.Forward = true
      findObj.Wrap = 1 // wdFindContinue = 1
      findObj.Format = false
      findObj.MatchCase = false
      findObj.MatchWholeWord = false
      findObj.MatchWildcards = false
      findObj.MatchSoundsLike = false
      findObj.MatchAllWordForms = false
      
      // 执行全部替换
      const result = findObj.Execute(
        undefined, // FindText (已设置)
        undefined, // MatchCase (已设置)
        undefined, // MatchWholeWord (已设置)
        undefined, // MatchWildcards (已设置)
        undefined, // MatchSoundsLike (已设置)
        undefined, // MatchAllWordForms (已设置)
        undefined, // Forward (已设置)
        undefined, // Wrap (已设置)
        undefined, // Format (已设置)
        undefined, // ReplaceWith (已设置)
        2 // Replace = 2 (wdReplaceAll，替换全部)
      )
      
      if (result) {
        replacedCount++
      }
    })

    resultType.value = 'success'
    resultMessage.value = `成功脱敏 ${replacedCount} 个敏感信息`
    window.$message?.success(resultMessage.value)

    // 清空列表
    setTimeout(() => {
      clearResults()
    }, 2000)
  } catch (error) {
    console.error('应用脱敏失败:', error)
    resultType.value = 'error'
    resultMessage.value = '脱敏失败: ' + error.message
    window.$message?.error(resultMessage.value)
  }
}
</script>

