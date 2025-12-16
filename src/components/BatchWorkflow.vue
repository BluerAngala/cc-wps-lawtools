<template>
  <div class="p-3">
    <n-alert type="info" :closable="false" show-icon class="mb-3">
      <template #header>工作流说明</template>
      <template #default>勾选需要执行的操作，系统会自动完成。</template>
    </n-alert>

    <n-form label-placement="left" label-width="auto" size="small">
      <n-form-item label="添加合同编号">
        <n-space align="center" :size="12">
          <n-switch v-model:value="options.addContractNumber" size="small" />
          <span class="text-sm text-gray-600">添加合同编号到页眉</span>
        </n-space>
      </n-form-item>
      <n-form-item v-if="options.addContractNumber" label="合同编号">
        <n-input v-model:value="options.contractNumber" placeholder="请输入合同编号" size="small" clearable />
      </n-form-item>
      <n-form-item label="文档重命名">
        <n-space align="center" :size="12">
          <n-switch v-model:value="options.rename" size="small" />
          <span class="text-sm text-gray-600">为文档添加「已修订」前缀</span>
        </n-space>
      </n-form-item>
      <n-form-item label="导出PDF">
        <n-space align="center" :size="12">
          <n-switch v-model:value="options.exportPdf" size="small" />
          <span class="text-sm text-gray-600">生成包含批注的PDF文件</span>
        </n-space>
      </n-form-item>
      <n-form-item v-if="options.rename" label="删除原文件">
        <n-space align="center" :size="12">
          <n-switch v-model:value="options.deleteOriginal" size="small" />
          <span class="text-sm text-gray-600">重命名后删除原始文件</span>
        </n-space>
      </n-form-item>
    </n-form>

    <!-- 结果弹窗 -->
    <n-modal
      v-model:show="showResultModal"
      preset="card"
      :title="result?.success ? '工作流执行完成' : '工作流执行结果'"
      style="width: 80%; max-width: 500px; max-height: 80vh;"
      :bordered="false"
    >
      <div class="space-y-3">
        <div class="text-sm text-gray-600 mb-3">{{ result?.summary }}</div>
        <div v-for="(step, index) in result?.steps" :key="index" class="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
          <span :class="step.success ? 'text-green-500' : 'text-red-500'">{{ step.success ? '✓' : '✗' }}</span>
          <div class="flex-1">
            <div class="font-medium text-sm">{{ step.name }}</div>
            <div class="text-xs text-gray-500">{{ step.message }}</div>
            <div
              v-if="step.path"
              class="text-xs text-blue-500 mt-1 cursor-pointer hover:underline break-all"
              @dblclick="copyPath(step.path)"
              title="双击复制路径"
            >
              📁 {{ step.path }}
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <n-button type="primary" size="small" @click="showResultModal = false">确定</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NAlert, NForm, NFormItem, NSwitch, NSpace, NInput, NModal, NButton } from 'naive-ui'
import { wpsFileService } from '../services/wps'

const processing = ref(false)
const result = ref(null)
const showResultModal = ref(false)

const options = ref({
  addContractNumber: false,
  contractNumber: '',
  rename: true,
  exportPdf: false,
  deleteOriginal: true
})

const isProcessing = computed(() => processing.value)
const canExecute = computed(() =>
  options.value.addContractNumber || options.value.rename || options.value.exportPdf
)
const buttonText = computed(() => (processing.value ? '处理中...' : '开始处理'))

// 执行工作流
const triggerExecute = async () => {
  if (processing.value) return

  const { addContractNumber, contractNumber, rename, exportPdf, deleteOriginal } = options.value

  if (!addContractNumber && !rename && !exportPdf) {
    window.$message?.warning('请至少选择一个操作')
    return
  }

  if (addContractNumber && !contractNumber?.trim()) {
    window.$message?.warning('请输入合同编号')
    return
  }

  processing.value = true
  result.value = null
  const steps = []

  try {
    if (addContractNumber) {
      const res = await wpsFileService.addHeader({
        text: `文件编号：${contractNumber.trim()}`,
        fontSize: 12,
        alignment: '右对齐'
      })
      steps.push({
        name: '添加合同编号',
        success: res.success,
        message: res.success ? `编号"${contractNumber.trim()}"已添加到页眉` : res.message
      })
    }

    if (rename) {
      const res = await wpsFileService.renameDocument({
        prefix: '「已修订」',
        deleteOriginal
      })
      steps.push({
        name: '文档重命名',
        success: res.success,
        message: res.success ? `已重命名为"${res.newFileName}"` : res.message
      })
      if (res.success && deleteOriginal && res.deleteResult) {
        steps.push({
          name: '删除原文件',
          success: res.deleteResult.success,
          message: res.deleteResult.success
            ? '原文件已删除'
            : res.deleteResult.unsupported
              ? '当前环境不支持自动删除'
              : '删除失败'
        })
      }
    }

    if (exportPdf) {
      const res = await wpsFileService.exportPDF()
      steps.push({
        name: '导出PDF',
        success: res.success,
        message: res.success ? `已导出: ${res.pdfFileName}` : res.message,
        path: res.success ? res.pdfFullPath : null
      })
    }

    const successCount = steps.filter(s => s.success).length
    const failCount = steps.filter(s => !s.success).length
    result.value = {
      success: failCount === 0,
      steps,
      summary: `共执行 ${steps.length} 个操作，成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ''}`
    }
    showResultModal.value = true
  } catch (error) {
    result.value = {
      success: false,
      steps: [{ name: '执行工作流', success: false, message: error.message || '处理失败' }],
      summary: '工作流执行出错'
    }
    showResultModal.value = true
  } finally {
    processing.value = false
  }
}

const copyPath = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    window.$message?.success('路径已复制到剪贴板')
  } catch {
    window.$message?.error('复制失败')
  }
}

defineExpose({
  triggerExecute,
  isProcessing,
  buttonText,
  canExecute
})
</script>
