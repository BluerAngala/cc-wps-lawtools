<template>
  <div class="wps-card">
    <!-- 卡片头部 -->
    <div class="wps-header mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg">🔍</span>
        <span class="wps-title">关键词批注</span>
        <el-tag v-if="processing" type="warning" size="small">处理中</el-tag>
      </div>
      <el-button
        type="primary"
        @click="executeCommenting"
        :loading="processing"
        :disabled="processing"
      >
        {{ processing ? '处理中...' : '开始批注' }}
      </el-button>
    </div>

    <!-- 配置区域 -->
    <div class="mb-5">
      <el-alert title="识别关键词并添加批注" type="info" :closable="false" show-icon />

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
      { keyword: '"广东特支计划"', comment: '提醒确认项目名称以及期数是否准确无误' },
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
})

// 方法
const executeCommenting = () => {
  const config = {
    keywordList: configForm.keywordList.value
  }
  emit('execute', config)
}

const updateConfig = (configData) => {
  Object.assign(configForm, configData)
  emit('update-config', configForm)
}
</script>
