<template>
  <div>
    <!-- 输入区域 -->
    <div class="flex gap-2">
      <n-input
        v-model:value="userInput"
        placeholder="描述你想要的工作流，如：给文档添加机密水印，然后导出PDF"
        :disabled="isGenerating"
        @keyup.enter="handleGenerate"
        class="flex-1"
      />
      <n-button
        type="primary"
        :loading="isGenerating"
        :disabled="!userInput.trim()"
        @click="handleGenerate"
      >
        {{ isGenerating ? '生成中...' : '生成' }}
      </n-button>
    </div>
    
    <!-- 进度提示 -->
    <div v-if="progressText" class="text-xs text-gray-500 mt-2">
      {{ progressText }}
    </div>
    
    <!-- 快捷示例 -->
    <div class="mt-2">
      <span class="text-xs text-gray-400">试试：</span>
      <n-space size="small" class="mt-1">
        <n-tag
          v-for="example in examples"
          :key="example"
          size="small"
          :bordered="false"
          class="cursor-pointer hover:bg-blue-50"
          @click="userInput = example"
        >
          {{ example }}
        </n-tag>
      </n-space>
    </div>
  </div>

  <!-- 预览确认弹窗 -->
  <n-modal
    v-model:show="showPreview"
    preset="card"
    title="确认生成的工作流"
    style="width: 90%; max-width: 500px"
  >
    <!-- AI 解释 -->
    <div v-if="generatedResult?.explanation" class="text-sm text-gray-600 mb-3 p-2 bg-blue-50 rounded">
      💡 {{ generatedResult.explanation }}
    </div>
    
    <!-- 警告信息 -->
    <n-alert
      v-if="generatedResult?.validation?.warnings?.length"
      type="warning"
      size="small"
      class="mb-3"
    >
      <div class="text-xs">
        <div v-for="(warn, idx) in generatedResult.validation.warnings" :key="idx">
          {{ warn }}
        </div>
      </div>
    </n-alert>
    
    <!-- 步骤预览 -->
    <div class="text-sm font-semibold mb-2">
      生成的步骤 ({{ generatedResult?.steps?.length || 0 }})
    </div>
    
    <n-space vertical>
      <div
        v-for="(step, index) in generatedResult?.steps"
        :key="index"
        class="flex items-center gap-2 p-2 bg-gray-50 rounded"
      >
        <span class="text-gray-400 text-sm w-6">{{ index + 1 }}.</span>
        <span>{{ getActionIcon(step.actionType) }}</span>
        <div class="flex-1">
          <div class="text-sm">{{ step.name }}</div>
          <div class="text-xs text-gray-400">
            {{ formatParams(step) }}
          </div>
        </div>
      </div>
    </n-space>
    
    <template #footer>
      <n-space justify="end">
        <n-button size="small" @click="showPreview = false">取消</n-button>
        <n-button size="small" @click="handleRegenerate">重新生成</n-button>
        <n-button type="primary" size="small" @click="handleConfirm">
          确认添加
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import { NInput, NButton, NSpace, NTag, NModal, NAlert } from './naive-components.js'
import { aiWorkflowGenerator } from '../services/workflow/aiWorkflowGenerator.js'
import { actionRegistry } from '../services/workflow/actionRegistry.js'

const emit = defineEmits(['confirm'])

// 响应式数据
const userInput = ref('')
const isGenerating = ref(false)
const progressText = ref('')
const showPreview = ref(false)
const generatedResult = ref(null)

// 快捷示例
const examples = [
  '添加机密水印后导出PDF',
  '审查合同并生成检查清单',
  '提取合同要素'
]

// 获取操作图标
const getActionIcon = (type) => {
  const action = actionRegistry.get(type)
  return action?.icon || '⚙️'
}

// 格式化参数显示
const formatParams = (step) => {
  if (!step.params) return ''
  const entries = Object.entries(step.params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .slice(0, 3) // 最多显示3个参数
  
  if (entries.length === 0) return '使用默认参数'
  
  return entries.map(([k, v]) => {
    // 截断过长的值
    const displayValue = String(v).length > 15 ? String(v).substring(0, 15) + '...' : v
    return `${k}: ${displayValue}`
  }).join(', ')
}

// 生成工作流
const handleGenerate = async () => {
  if (!userInput.value.trim() || isGenerating.value) return
  
  isGenerating.value = true
  progressText.value = ''
  
  try {
    const result = await aiWorkflowGenerator.generate(userInput.value, {
      onProgress: (info) => {
        progressText.value = info.stage
      }
    })
    
    if (result.steps.length === 0) {
      window.$message?.warning('未能生成有效的工作流步骤，请尝试更清晰地描述需求')
      return
    }
    
    // 显示错误信息
    if (result.validation.errors.length > 0) {
      window.$message?.warning(result.validation.errors.join('\n'))
    }
    
    generatedResult.value = result
    showPreview.value = true
  } catch (error) {
    console.error('生成失败:', error)
    window.$message?.error(error.message || '生成失败，请重试')
  } finally {
    isGenerating.value = false
    progressText.value = ''
  }
}

// 重新生成
const handleRegenerate = () => {
  showPreview.value = false
  handleGenerate()
}

// 确认添加
const handleConfirm = () => {
  if (generatedResult.value?.steps) {
    emit('confirm', generatedResult.value.steps)
    showPreview.value = false
    userInput.value = ''
    generatedResult.value = null
    window.$message?.success('已添加到工作流')
  }
}
</script>
