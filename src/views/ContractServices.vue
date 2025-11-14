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
              :disabled="batchProcessing || !batchActionEnabled"
              @click.stop="handleBatchProcess"
            >
              {{ batchProcessing ? '处理中...' : '开始处理' }}
            </n-button>
          </div>
        </template>
        <div class="p-4">
          <n-alert type="info" :closable="false" show-icon class="mb-4">
            <template #header>一键处理说明</template>
            <template #default>勾选需要执行的操作，系统会自动完成。</template>
          </n-alert>

          <n-form label-placement="left" label-width="auto" size="small" class="mb-4">
            <n-form-item label="文档重命名">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.rename" size="small" />
                <span class="text-sm text-gray-600">为文档添加「已修订」前缀</span>
              </n-space>
            </n-form-item>
            <n-form-item label="导出PDF">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.exportPdf" size="small" />
                <span class="text-sm text-gray-600">生成包含批注的PDF文件</span>
              </n-space>
            </n-form-item>
            <n-form-item label="删除原文件" v-if="batchOptions.rename">
              <n-space align="center" :size="12">
                <n-switch v-model:value="batchOptions.deleteOriginal" size="small" />
                <span class="text-sm text-gray-600">重命名后删除原始文件</span>
              </n-space>
            </n-form-item>
          </n-form>

          <div v-if="batchResult" class="mt-4">
            <n-divider>处理结果</n-divider>
            <n-alert :type="batchResult.success ? 'success' : 'error'" :closable="false" show-icon>
              <template #header>{{ batchResult.success ? '处理完成' : '处理失败' }}</template>
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
import { NButton, NCollapse, NCollapseItem, NTag, NAlert, NDivider, NForm, NFormItem, NSwitch, NSpace } from 'naive-ui'
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
  keyword: {},
  review: {},
  smart: {}
})
const batchOptions = ref({
  rename: true,
  exportPdf: false,
  deleteOriginal: true
})
const smartCommenterRef = ref(null)
const smartProcessing = computed(
  () =>
    contractService.isTaskProcessing('keywordComment') ||
    contractService.isTaskProcessing('contractReview') ||
    contractService.isTaskProcessing('contractReviewNew')
)
const smartAIProcessing = computed(() => smartCommenterRef.value?.isAIProcessing?.value ?? false)
const batchActionEnabled = computed(() => batchOptions.value.rename || batchOptions.value.exportPdf)

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
  if (configForm && configForm.extractTags) {
    updateConfig('extractor', { extractTags: configForm.extractTags.value })
  }
}

const updateSmartConfig = (configForm) => {
  // 保存关键词配置
  if (configForm && configForm.keywordList) {
    updateConfig('keyword', { keywordList: configForm.keywordList })
  }
  
  // 保存审查配置（转换为标准格式）
  if (configForm && configForm.reviewKeywordList && Array.isArray(configForm.reviewKeywordList)) {
    const contractReviewRules = configForm.reviewKeywordList.map(item => ({
      reviewRules: item.keyword || '',
      reviewRequirements: item.comment || '',
      actionType: item.actionType || 'comment'
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

  if (!batchOptions.value.rename && !batchOptions.value.exportPdf) {
    window.$message?.warning('请至少选择一个操作')
    return
  }

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

  // 确保文档有名称属性
  if (!doc.Name) {
    window.$message?.error('文档信息不完整，无法处理')
    return
  }

  batchProcessing.value = true
  batchResult.value = null

  const shouldRename = batchOptions.value.rename
  const shouldExport = batchOptions.value.exportPdf
  const shouldDeleteOriginal = batchOptions.value.deleteOriginal && shouldRename

  let renameAttempted = false
  let renameSuccess = false
  let deleteAttempted = false
  let deleteSuccess = false
  let deleteUnsupported = false
  let pdfAttempted = false
  let pdfSuccess = false
  let newFileName = doc.Name
  let pdfFullPath = ''

  try {
    const directory = doc.Path || ''
    const originalName = doc.Name
    const pathSeparator = directory.includes('/') ? '/' : '\\'
    const originalFullPath = directory ? `${directory}${pathSeparator}${originalName}` : originalName

    console.log('[一键处理] 开始处理...')
    console.log('[一键处理] 原文件路径:', directory)
    console.log('[一键处理] 原文件名:', originalName)

    let currentFileName = originalName

    if (shouldRename) {
      renameAttempted = true
      console.log('[一键处理] 步骤1: 开始重命名文档...')
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
      const extension = originalName.match(/\.[^/.]+$/)?.[0] || ''
      newFileName = `「已修订」${nameWithoutExt}${extension}`
      const newFullPath = directory ? `${directory}${pathSeparator}${newFileName}` : newFileName

      console.log('[一键处理] 新文件路径:', newFullPath)
      doc.SaveAs2(newFullPath)
      renameSuccess = true
      currentFileName = newFileName
      console.log('[一键处理] ✅ 文档重命名成功:', newFullPath)

      if (shouldDeleteOriginal) {
        const fs = window.Application?.FileSystem
        if (fs && typeof fs.unlinkSync === 'function') {
          deleteAttempted = true
          try {
            fs.unlinkSync(originalFullPath)
            deleteSuccess = true
            console.log('[一键处理] ✅ 原文件已删除:', originalFullPath)
          } catch (deleteError) {
            console.error('[一键处理] ❌ 删除原文件失败:', deleteError)
            throw new Error(`删除原文件失败: ${deleteError.message || '未知错误'}`)
          }
        } else {
          deleteUnsupported = true
          console.warn('[一键处理] ⚠️ unlinkSync 方法不可用，无法自动删除原文件')
        }
      }
    }

    if (shouldExport) {
      pdfAttempted = true
      console.log('[一键处理] 步骤2: 开始导出PDF...')
      const pdfFileName = currentFileName.replace(/\.[^/.]+$/, '.pdf')
      pdfFullPath = directory ? `${directory}${pathSeparator}${pdfFileName}` : pdfFileName

      console.log('[一键处理] PDF保存路径:', pdfFullPath)
      console.log('[一键处理] 开始调用 ExportAsFixedFormat...')

      try {
        doc.ExportAsFixedFormat(
          pdfFullPath,
          17,
          false,
          0,
          0,
          1,
          1,
          7,
          true,
          true,
          0,
          true,
          true,
          false
        )
        pdfSuccess = true
        console.log('[一键处理] ✅ PDF导出调用成功:', pdfFullPath)

        console.log('[一键处理] 等待PDF文件生成...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (window.Application?.FileSystem) {
          const fs = window.Application.FileSystem
          let fileExists = false
          let checkCount = 0
          const maxChecks = 5

          while (checkCount < maxChecks && !fileExists) {
            fileExists = fs.Exists(pdfFullPath)
            if (fileExists) {
              console.log('[一键处理] ✅ PDF文件已确认存在:', pdfFullPath)
              break
            }
            checkCount++
            if (checkCount < maxChecks) {
              console.log(`[一键处理] 等待文件生成中... (${checkCount}/${maxChecks})`)
              await new Promise(resolve => setTimeout(resolve, 500))
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
        
        // 处理WPS特定的错误码
        let errorMessage = 'PDF导出失败'
        if (pdfError.number) {
          switch (pdfError.number) {
            case -2146827284: // 文件路径不存在
              errorMessage = 'PDF导出失败：文件路径不存在或无访问权限'
              break
            case -2146827850: // 磁盘空间不足
              errorMessage = 'PDF导出失败：磁盘空间不足'
              break
            case -2147467259: // 未指定的错误
              errorMessage = 'PDF导出失败：未指定的错误，请检查文档内容'
              break
            default:
              errorMessage = `PDF导出失败：错误代码 ${pdfError.number}`
          }
        } else {
          errorMessage = `PDF导出失败: ${pdfError.message || '未知错误'}`
        }
        
        throw new Error(errorMessage)
      }
    }

    const messages = []
    if (renameAttempted && renameSuccess) {
      messages.push(`文档已重命名为"${newFileName}"`)
    }
    if (deleteAttempted) {
      messages.push(deleteSuccess ? '原文件已删除' : '原文件删除失败')
    } else if (shouldDeleteOriginal && deleteUnsupported) {
      messages.push('当前环境不支持自动删除原文件，请手动删除原文件')
    } else if (shouldRename) {
      messages.push('保留了原始文件副本')
    } else {
      messages.push('已跳过文档重命名')
    }
    if (pdfAttempted && pdfSuccess) {
      const pdfFileName = pdfFullPath.split(pathSeparator).pop() || pdfFullPath
      messages.push(`PDF已导出为"${pdfFileName}"`)
      messages.push(`PDF保存路径: ${pdfFullPath}`)
    }
    if (!pdfAttempted) {
      messages.push('已跳过导出PDF')
    }

    const successFlags = []
    if (renameAttempted) successFlags.push(renameSuccess && (!deleteAttempted || deleteSuccess))
    if (pdfAttempted) successFlags.push(pdfSuccess)
    const overallSuccess = successFlags.length > 0 && successFlags.every(Boolean)

    batchResult.value = {
      success: overallSuccess,
      message: messages.join('\n')
    }

    if (overallSuccess) {
      window.$message?.success('一键处理完成')
    } else {
      window.$message?.warning('部分操作未成功，请查看详情')
    }
  } catch (error) {
    console.error('[一键处理] ❌ 处理失败:', error)
    console.error('[一键处理] 错误详情:', error.message, error.stack)

    const errorMessages = []
    if (renameAttempted) {
      if (renameSuccess) {
        errorMessages.push(`文档已重命名为"${newFileName}"`)
      } else {
        errorMessages.push('文档重命名失败')
      }
      if (deleteAttempted) {
        errorMessages.push(deleteSuccess ? '原文件已删除' : '原文件删除失败')
      } else if (shouldDeleteOriginal && deleteUnsupported) {
        errorMessages.push('当前环境不支持自动删除原文件，请手动删除原文件')
      }
    } else {
      errorMessages.push('已跳过文档重命名')
    }
    if (pdfAttempted) {
      if (pdfSuccess) {
        errorMessages.push(`PDF已导出为"${pdfFullPath}"`)
      } else {
        errorMessages.push(`PDF导出失败: ${error.message || '未知错误'}`)
      }
    } else {
      errorMessages.push('已跳过导出PDF')
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
