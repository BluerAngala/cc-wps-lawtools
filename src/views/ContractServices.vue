<template>
  <div class="p-2.5 h-screen overflow-y-auto scrollbar-none">
    <!-- 主控制面板 -->
    <div class="wps-card wps-section">
      <!-- 操作按钮 -->
      <div class="flex-center">
        <div class="flex gap-4">
          <n-button type="success" @click="saveConfig">
            <template #icon><DocumentIcon /></template>
            保存配置
          </n-button>
          <n-button type="warning" @click="resetConfig">
            <template #icon><RefreshIcon /></template>
            重置配置
          </n-button>
          <n-button type="error" @click="clearCache">
            <template #icon><DeleteIcon /></template>
            清除缓存
          </n-button>
        </div>
      </div>
    </div>

    <!-- 折叠面板（手风琴模式） -->
    <n-collapse :default-expanded-names="['extractor']" accordion class="mt-4">
      <!-- AI合同信息提取 -->
      <n-collapse-item name="extractor">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>🤖</span>
              <span>AI提取合同信息</span>
              <n-tag v-if="contractService.isTaskProcessing('extractText')" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="contractService.isTaskProcessing('extractText')"
              :disabled="contractService.isTaskProcessing('extractText')"
              @click.stop="executeExtraction(configs.extractor)"
            >
              {{ contractService.isTaskProcessing('extractText') ? '提取中...' : '开始提取' }}
            </n-button>
          </div>
        </template>
        <ContractExtractor
          :processing="contractService.isTaskProcessing('extractText')"
          :extracted-data="extractedData"
          :submitting="submitting"
          :extractor-config="configs.extractor"
          @submit-data="submitExtractedData"
          @update:extracted-data="extractedData = $event"
          @update-config="updateExtractorConfig"
        />
      </n-collapse-item>

      <!-- 智能文档处理 -->
      <n-collapse-item name="smart">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>⚡</span>
              <span>智能文档处理</span>
              <n-tag v-if="smartProcessing || smartAIProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="smartProcessing || smartAIProcessing"
              :disabled="smartProcessing || smartAIProcessing"
              @click.stop="triggerSmartProcess"
            >
              {{ smartProcessing || smartAIProcessing ? '处理中...' : '开始处理' }}
            </n-button>
          </div>
        </template>
        <SmartCommenter
          ref="smartCommenterRef"
          :processing="contractService.isTaskProcessing('keywordComment') || contractService.isTaskProcessing('contractReview') || contractService.isTaskProcessing('contractReviewNew')"
          :keyword-config="configs.keyword"
          :review-config="configs.review"
          @execute="executeSmartComment"
          @update-config="updateSmartConfig"
        />
      </n-collapse-item>

      <!-- 一键处理结果 -->
      <n-collapse-item name="batch">
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <span>📄</span>
              <span>一键处理结果</span>
              <n-tag v-if="batchProcessing" type="warning" size="small">处理中</n-tag>
            </div>
            <n-button
              type="primary"
              size="small"
              :loading="batchProcessing"
              :disabled="batchProcessing"
              @click.stop="handleBatchProcess"
            >
              {{ batchProcessing ? '处理中...' : '开始处理' }}
            </n-button>
          </div>
        </template>
        <div class="p-4">
          <n-alert type="info" :closable="false" show-icon class="mb-4">
            <template #header>一键处理说明</template>
            <template #default>
              点击"开始处理"按钮，将自动执行以下操作：
              <ul class="mt-2 ml-4 list-disc">
                <li>重命名文档：在原文件名前添加「已修订」前缀</li>
                <li>导出PDF：导出包含文档批注的PDF文件</li>
              </ul>
            </template>
          </n-alert>

          <div v-if="batchResult" class="mt-4">
            <n-divider>处理结果</n-divider>
            <n-alert :type="batchResult.success ? 'success' : 'error'" :closable="false" show-icon>
              <template #header>{{ batchResult.success ? '处理成功' : '处理失败' }}</template>
              <template #default>
                <div class="whitespace-pre-line text-sm">{{ batchResult.message }}</div>
              </template>
            </n-alert>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NCollapse, NCollapseItem, NTag, NAlert, NDivider } from 'naive-ui'
import {
  DocumentOutline as DocumentIcon,
  Refresh as RefreshIcon,
  TrashOutline as DeleteIcon
} from '@vicons/ionicons5'
import ContractExtractor from '../components/ContractExtractor.vue'
import SmartCommenter from '../components/SmartCommenter.vue'
import { contractService } from '../services/contract/contractService.js'
import { appConfig } from '../utils/appConfig.js'

console.log('合同审查组件已加载')

// 响应式数据
const extractedData = ref(null) // 存储提取的合同信息
const submitting = ref(false) // 提交状态
const batchProcessing = ref(false) // 一键处理状态
const batchResult = ref(null) // 一键处理结果
const configs = ref({
  extractor: {},
  smart: {}
})
const smartCommenterRef = ref(null)
const smartProcessing = computed(
  () =>
    contractService.isTaskProcessing('keywordComment') ||
    contractService.isTaskProcessing('contractReview') ||
    contractService.isTaskProcessing('contractReviewNew')
)
const smartAIProcessing = computed(() => smartCommenterRef.value?.isAIProcessing?.value ?? false)

const triggerSmartProcess = () => {
  if (smartCommenterRef.value?.triggerExecute) {
    smartCommenterRef.value.triggerExecute()
  }
}

// 统一的配置更新方法
const updateConfig = (type, config) => {
  configs.value[type] = config
  // 静默保存（不显示提示）
  saveConfigToAppConfig(false)
}

// 保存配置到 appConfig
const saveConfigToAppConfig = (showMessage = true) => {
  const allConfig = appConfig.getConfig()
  
  // 更新对应的配置项
  if (configs.value.extractor) {
    allConfig.extractor = configs.value.extractor
  }
  if (configs.value.keyword) {
    allConfig.keyword = configs.value.keyword
  }
  if (configs.value.review) {
    allConfig.review = configs.value.review
  }
  
  const success = appConfig.saveConfig(allConfig)
  
  // 只在需要时显示消息
  if (showMessage) {
    if (success) {
      window.$message?.success('配置已保存')
    } else {
      window.$message?.error('保存配置失败')
    }
  }
  
  return success
}

// 组件事件处理方法（极简版）
const executeExtraction = (config = {}) => {
  contractService.executeTask('extractText', config, async (result) => {
    const processedData = await contractService.processExtractedData(result)
    if (processedData) {
      extractedData.value = processedData
    }
  })
}

const executeSmartComment = (config) => {
  if (config.mode === 'keyword') {
    // 关键词模式：直接执行关键词处理
    contractService.executeTask('keywordComment', config)
  }
  // AI审查模式（aiReview和aiLawyer）已在SmartCommenter组件内部处理，不需要在这里处理
}

const updateExtractorConfig = (configForm) => {
  // 保存提取配置
  if (configForm.extractTags) {
    updateConfig('extractor', { extractTags: configForm.extractTags.value })
  }
}

const updateSmartConfig = (configForm) => {
  // 保存关键词配置
  if (configForm.keywordList) {
    updateConfig('keyword', { keywordList: configForm.keywordList })
  }
  
  // 保存审查配置（转换为标准格式）
  if (configForm.reviewKeywordList) {
    const contractReviewRules = configForm.reviewKeywordList.map(item => ({
      reviewRules: item.keyword,
      reviewRequirements: item.comment,
      actionType: item.actionType
    }))
    updateConfig('review', { contractReviewRules })
  }
}

// 配置管理方法（简化）
const saveConfig = () => {
  // 显式保存，显示提示消息
  saveConfigToAppConfig(true)
}

const resetConfig = () => {
  appConfig.reset()
  // 重新加载配置
  loadConfig()
  window.$message?.success('配置已重置为默认值')
}
const clearCache = () => contractService.clearCache()

// 一键处理：重命名 + 导出PDF
const handleBatchProcess = async () => {
  if (batchProcessing.value) return

  // 检查WPS环境
  if (typeof window.Application === 'undefined') {
    window.$message?.error('请在 WPS 环境中使用此功能')
    return
  }

  const doc = window.Application.ActiveDocument
  if (!doc) {
    window.$message?.error('未找到活动文档')
    return
  }

  batchProcessing.value = true
  batchResult.value = null

  let renameSuccess = false
  let pdfSuccess = false
  let newFileName = ''
  let pdfFullPath = ''

  try {
    // 获取原文件的目录路径和文件名
    const directory = doc.Path || ''
    const originalName = doc.Name
    const pathSeparator = directory.includes('/') ? '/' : '\\'
    
    console.log('[一键处理] 开始处理...')
    console.log('[一键处理] 原文件路径:', directory)
    console.log('[一键处理] 原文件名:', originalName)
    
    // 1. 重命名文档（使用「已修订」前缀）
    console.log('[一键处理] 步骤1: 开始重命名文档...')
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const extension = originalName.match(/\.[^/.]+$/)?.[0] || ''
    newFileName = `「已修订」${nameWithoutExt}${extension}`
    const newFullPath = directory ? `${directory}${pathSeparator}${newFileName}` : newFileName

    console.log('[一键处理] 新文件路径:', newFullPath)
    doc.SaveAs2(newFullPath)
    renameSuccess = true
    console.log('[一键处理] ✅ 文档重命名成功:', newFullPath)

    // 2. 导出PDF（包含批注，使用完整路径）
    console.log('[一键处理] 步骤2: 开始导出PDF...')
    const pdfFileName = newFileName.replace(/\.[^/.]+$/, '.pdf')
    pdfFullPath = directory ? `${directory}${pathSeparator}${pdfFileName}` : pdfFileName
    
    console.log('[一键处理] PDF保存路径:', pdfFullPath)
    console.log('[一键处理] 开始调用 ExportAsFixedFormat...')
    
    // ExportAsFixedFormat 参数说明：
    // outputPath, exportFormat(17=PDF), openAfterExport, optimizeFor,
    // range, from, to, item, includeDocProps, keepIRM, createBookmarks,
    // docStructureTags, bitmapMissingFonts, useDocumentPrintSettings
    try {
      doc.ExportAsFixedFormat(
        pdfFullPath,   // OutputFileName (完整路径)
        17,            // ExportFormat (wdExportFormatPDF)
        false,         // OpenAfterExport
        0,             // OptimizeFor (wdExportOptimizeForPrint)
        0,             // Range (wdExportAllDocument)
        1,             // From
        1,             // To
        7,             // Item (wdExportDocumentContents - 包含批注)
        true,          // IncludeDocProps
        true,          // KeepIRM
        0,             // CreateBookmarks (wdExportCreateNoBookmarks)
        true,          // DocStructureTags
        true,          // BitmapMissingFonts
        false          // UseDocumentPrintSettings
      )
      pdfSuccess = true
      console.log('[一键处理] ✅ PDF导出调用成功:', pdfFullPath)
      
      // 等待PDF导出完成（ExportAsFixedFormat可能是异步的）
      console.log('[一键处理] 等待PDF文件生成...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
      
      // 验证PDF文件是否存在（如果FileSystem可用）
      if (window.Application?.FileSystem) {
        const fs = window.Application.FileSystem
        let fileExists = false
        let checkCount = 0
        const maxChecks = 5 // 最多检查5次
        
        // 多次检查，因为文件可能还在写入中
        while (checkCount < maxChecks && !fileExists) {
          fileExists = fs.Exists(pdfFullPath)
          if (fileExists) {
            console.log('[一键处理] ✅ PDF文件已确认存在:', pdfFullPath)
            break
          }
          checkCount++
          if (checkCount < maxChecks) {
            console.log(`[一键处理] 等待文件生成中... (${checkCount}/${maxChecks})`)
            await new Promise(resolve => setTimeout(resolve, 500)) // 再等待0.5秒
          }
        }
        
        if (!fileExists) {
          console.warn('[一键处理] ⚠️ 文件系统检查未找到PDF文件，但导出可能已成功')
          console.warn('[一键处理] ⚠️ 请手动检查路径:', pdfFullPath)
          console.warn('[一键处理] ⚠️ 注意：WPS云盘文件可能需要同步时间')
        }
      } else {
        console.log('[一键处理] ⚠️ FileSystem不可用，无法验证文件')
      }
    } catch (pdfError) {
      console.error('[一键处理] ❌ PDF导出失败:', pdfError)
      console.error('[一键处理] PDF错误详情:', pdfError.message, pdfError.stack)
      throw new Error(`PDF导出失败: ${pdfError.message || '未知错误'}`)
    }

    // 生成结果消息
    const messages = []
    if (renameSuccess) {
      messages.push(`文档已重命名为"${newFileName}"`)
    }
    if (pdfSuccess) {
      messages.push(`PDF已导出为"${pdfFileName}"`)
      messages.push(`PDF保存路径: ${pdfFullPath}`)
    }

    batchResult.value = {
      success: renameSuccess && pdfSuccess,
      message: messages.join('\n')
    }
    
    if (renameSuccess && pdfSuccess) {
      window.$message?.success('一键处理完成')
    } else {
      window.$message?.warning('处理部分完成，请查看详情')
    }
  } catch (error) {
    console.error('[一键处理] ❌ 处理失败:', error)
    console.error('[一键处理] 错误详情:', error.message, error.stack)
    
    const errorMessages = []
    if (renameSuccess) {
      errorMessages.push(`文档已重命名为"${newFileName}"`)
    } else {
      errorMessages.push('文档重命名失败')
    }
    if (pdfSuccess) {
      errorMessages.push(`PDF已导出为"${pdfFullPath}"`)
    } else {
      errorMessages.push(`PDF导出失败: ${error.message || '未知错误'}`)
    }
    
    batchResult.value = {
      success: false,
      message: errorMessages.join('\n')
    }
    window.$message?.error('处理失败：' + (error.message || '未知错误'))
  } finally {
    batchProcessing.value = false
    console.log('[一键处理] 处理流程结束')
  }
}

const loadConfig = () => {
  configs.value = contractService.loadConfig()
}

// 提交提取的数据（简化）
const submitExtractedData = async () => {
  if (!extractedData.value) {
    window.$message?.warning('没有可提交的数据')
    return
  }

  submitting.value = true
  try {
    const result = await contractService.submitExtractedData(extractedData.value)
    if (result?.success) {
      window.$message?.success(result.message || '数据提交成功！')
    }
  } catch (error) {
    console.error('提交数据失败:', error)
    window.$message?.error(error.message || '提交数据失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('合同审查组件已挂载')
  loadConfig()
})

// 组件卸载时清理资源
onUnmounted(() => {
  contractService.cleanup()
})
</script>
