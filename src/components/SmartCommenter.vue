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
import { reactive, ref, watch } from 'vue'
import { NButton, NTag, NAlert, NSpace } from 'naive-ui'
import ConfigForm from './ConfigForm.vue'

// Props
const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  },
  keywordConfig: {
    type: Object,
    default: () => ({})
  },
  reviewConfig: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['execute', 'update-config'])

// 当前模式
const currentMode = ref('keyword')

// 配置表单（从 props 初始化，不使用硬编码的默认值）
const configForm = reactive({
  keywordList: [],
  reviewKeywordList: []
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

// 监听 props 变化，同步配置
watch(
  () => props.keywordConfig,
  (newConfig) => {
    if (newConfig && newConfig.keywordList) {
      configForm.keywordList = newConfig.keywordList
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.reviewConfig,
  (newConfig) => {
    if (newConfig && newConfig.contractReviewRules) {
      // review 配置使用 contractReviewRules 字段，转换为组件内部格式
      configForm.reviewKeywordList = newConfig.contractReviewRules.map(rule => ({
        keyword: rule.reviewRules,
        comment: rule.reviewRequirements,
        actionType: rule.actionType
      }))
    }
  },
  { immediate: true, deep: true }
)
</script>
