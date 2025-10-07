<template>
  <div class="wps-card">
    <!-- 卡片头部 -->
    <div class="wps-header mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg">🔍</span>
        <span class="wps-title">智能文档处理</span>
        <n-tag v-if="processing" type="warning" size="small">处理中</n-tag>
      </div>
      <n-button
        type="primary"
        @click="executeCommenting"
        :loading="processing"
        :disabled="processing"
      >
        {{ processing ? '处理中...' : '开始处理' }}
      </n-button>
    </div>

    <!-- 配置区域 -->
    <div class="mb-5">
      <n-alert 
        :title="currentMode === 'keyword' ? '匹配关键词并添加固定的批注或修订内容' : '根据任务要求让AI动态生成批注或修订内容'" 
        type="info" 
        :closable="false" 
        show-icon 
      />

      <!-- 模式切换 -->
      <div class="mt-4 text-center">
        <n-space justify="center" :size="16">
          <n-button
            :type="currentMode === 'keyword' ? 'primary' : 'default'"
            @click="switchMode('keyword')"
            size="large"
            round
          >
            🔍 关键词模式
          </n-button>
          <n-button
            :type="currentMode === 'review' ? 'primary' : 'default'"
            @click="switchMode('review')"
            size="large"
            round
          >
            ⚖️ AI预审模式
          </n-button>
        </n-space>
      </div>

      <div class="mt-4">
        <ConfigForm :config="getCurrentConfig()" :mode="currentMode" @update-config="updateConfig" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { NButton, NTag, NAlert, NSpace } from 'naive-ui'
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

// 当前模式
const currentMode = ref('keyword')

// 配置表单
const configForm = reactive({
  keywordList: [
    { keyword: '第一条', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注' },
    {
      keyword: '付款方式',
      comment:
        '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。',
      actionType: '批注'
    },
    {
      keyword: '费用',
      comment:
        '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。',
      actionType: '批注'
    },
    {
      keyword: '验收',
      comment:
        '提醒经办人员注意加强验收，并注意检查验收材料的真实性、准确性、完整性，妥善保管好验收有关资料。',
      actionType: '批注'
    },
    { keyword: '银行账号', comment: '提醒确认支付账号是否准确无误', actionType: '批注' },
    { keyword: '仲裁', comment: '建议约定统一约定法院管辖', actionType: '修订' },
    { keyword: '"广东特支计划"', comment: '提醒确认项目名称以及期数是否准确无误', actionType: '批注' },
    {
      keyword: '培养期为',
      comment: '提醒确认培养期是否准确无误。请注意签约时间是否合理！！！',
      actionType: '批注'
    },
    {
      keyword: '资金发放安排',
      comment:
        '提醒经办人员在签订前应再次确认预算构成是否合理、协议金额是否准确无误、是否可以按期足额支付，支付方式和支付账户信息是否准确无误，且符合最新财务及有关管理规定。',
      actionType: '批注'
    },
    { keyword: '榜单项目信息', comment: '提醒确认此部分内容是否准确无误。', actionType: '批注' }
  ],
  reviewKeywordList: [
    {
      keyword: '争议解决',
      comment: '请AI审查合同中的争议解决条款，检查是否约定了明确的纠纷处理方式（仲裁或法院管辖），并评估条款的有效性和合理性',
      actionType: '批注'
    },
    {
      keyword: '违约责任',
      comment: '请AI分析违约责任条款的完整性，检查违约金标准是否合理，免责条款是否过于宽泛，并提出改进建议',
      actionType: '批注'
    },
    {
      keyword: '付款条件',
      comment: '请AI审查并优化付款条款，确保付款方式、期限、条件表述清晰，识别潜在的付款风险并提出修订建议',
      actionType: '修订'
    },
    {
      keyword: '合同期限',
      comment: '请AI检查合同期限条款的明确性，包括起止时间、续约机制、提前终止条件，并评估是否存在歧义',
      actionType: '批注'
    },
    {
      keyword: '知识产权',
      comment: '请AI全面审查知识产权相关条款，包括权利归属、使用范围、侵权责任分担、保密义务等，确保权责清晰',
      actionType: '批注'
    }
  ]
})

// 方法
const executeCommenting = () => {
  let config
  if (currentMode.value === 'keyword') {
    config = {
      mode: 'keyword',
      keywordList: configForm.keywordList
    }
  } else {
    config = {
      mode: 'review',
      keywordList: configForm.reviewKeywordList
    }
  }
  emit('execute', config)
}

const switchMode = (mode) => {
  currentMode.value = mode
}

const getCurrentConfig = () => {
  if (currentMode.value === 'keyword') {
    return { keywordList: { type: 'keywordList', value: configForm.keywordList } }
  } else {
    return { keywordList: { type: 'keywordList', value: configForm.reviewKeywordList } }
  }
}

const updateConfig = (configData) => {
  // 更新对应模式的数组
  if (currentMode.value === 'keyword') {
    configForm.keywordList = configData.keywordList.value
  } else {
    configForm.reviewKeywordList = configData.keywordList.value
  }
  emit('update-config', configForm)
}
</script>
