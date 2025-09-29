<template>
  <div class="wps-card">
    <!-- 卡片头部 -->
    <div class="wps-header mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg">⚖️</span>
        <span class="wps-title">AI合同预审</span>
        <el-tag v-if="processing" type="warning" size="small">处理中</el-tag>
      </div>
      <el-button type="primary" @click="executeReview" :loading="processing" :disabled="processing">
        {{ processing ? '预审中...' : '开始预审' }}
      </el-button>
    </div>

    <!-- 配置区域 -->
    <div class="mb-5">
      <el-alert title="AI预审合同，使用自定义规则更灵活" type="info" :closable="false" show-icon />

      <div class="mt-4">
        <ConfigForm :config="configForm" @update-config="updateConfig" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import ConfigForm from './ConfigForm.vue'

// Props
defineProps({
  processing: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['execute', 'update-config'])

// 配置表单
const configForm = reactive({
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
})

// 方法
const executeReview = () => {
  const config = {
    reviewRules: configForm.contractReviewRules.value
  }
  emit('execute', config)
}

const updateConfig = (configData) => {
  Object.assign(configForm, configData)
  emit('update-config', configForm)
}
</script>
