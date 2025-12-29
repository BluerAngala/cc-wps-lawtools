<template>
  <div>
    <!-- 配置区域 -->
    <div class="text-xs text-blue-500 mb-2">使用AI智能提取合同关键信息</div>
    <ConfigForm :config="configForm" @update-config="updateConfig" />

    <!-- 提取结果弹窗 -->
    <n-modal v-model:show="showResultModal" preset="card" title="提取结果" style="width: 600px; max-width: 90vw;">
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon class="text-blue-600"><DocumentIcon /></n-icon>
          <span>合同信息编辑</span>
          <n-tag size="small" type="success" round>
            {{ extractedData ? Object.keys(extractedData).length : 0 }} 项
          </n-tag>
        </div>
      </template>

      <n-form v-if="extractedData" label-placement="top" size="small" class="compact-form">
        <!-- 动态渲染所有提取的字段 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="0">
          <n-grid-item v-for="key in extractedFields" :key="key">
            <n-form-item :label="key" :show-feedback="false" class="compact-item">
              <n-input
                :value="extractedData[key]"
                @update:value="updateExtractedItem(key, $event)"
                :placeholder="`请输入${key}`"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showResultModal = false">取消</n-button>
          <n-button type="primary" @click="submitData" :loading="submitting">
            <template #icon><UploadIcon /></template>
            {{ submitting ? '提交中...' : '提交' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { 
  NButton, NTag, NAlert, NIcon, NForm, NFormItem, NInput, NGrid, NGridItem, NModal 
} from 'naive-ui'
import {
  DocumentOutline as DocumentIcon,
  CloudUpload as UploadIcon
} from '@vicons/ionicons5'
import ConfigForm from './ConfigForm.vue'

// 弹窗显示状态
const showResultModal = ref(false)

// Props
const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  },
  extractedData: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    default: false
  },
  extractorConfig: {
    type: Object,
    default: () => ({})
  }
})

// 固定字段列表（按顺序排列：合同名称、对接客户、甲方、甲方主体信息、乙方、乙方主体信息、其他方、合同金额）
const fixedFields = ['合同名称', '对接客户', '甲方', '甲方主体信息', '乙方', '乙方主体信息', '其他方', '合同金额']

// 计算所有提取的字段（按固定顺序排列，其他字段放后面）
const extractedFields = computed(() => {
  if (!props.extractedData) return []
  const keys = Object.keys(props.extractedData)
  // 先按固定顺序排列已有字段，再添加其他字段
  const orderedKeys = fixedFields.filter(key => keys.includes(key))
  const otherKeys = keys.filter(key => !fixedFields.includes(key))
  return [...orderedKeys, ...otherKeys]
})

// 监听 extractedData 变化，有数据时自动打开弹窗
watch(
  () => props.extractedData,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      showResultModal.value = true
    }
  }
)

// Emits
const emit = defineEmits(['submit-data', 'update:extracted-data', 'update-config'])

// 配置表单（从 props 初始化）
const configForm = reactive({
  extractTags: {
    label: '提取数据要素',
    type: 'tags',
    value: [],
    inputValue: ''
  }
})

// 方法
const updateConfig = (configData) => {
  Object.assign(configForm, configData)
  emit('update-config', configForm)
}

const submitData = async () => {
  if (!props.extractedData) {
    window.$message?.warning('没有可提交的数据')
    return
  }

  try {
    emit('submit-data')
    // 提交成功后关闭弹窗
    showResultModal.value = false
  } catch (error) {
    console.error('提交数据时出错:', error)
    window.$message?.error('提交数据失败')
  }
}

const updateExtractedItem = (key, value) => {
  const updatedData = { ...props.extractedData }
  updatedData[key] = value
  emit('update:extracted-data', updatedData)
}

// 监听 props 变化，同步配置
watch(
  () => props.extractorConfig,
  (newConfig) => {
    if (newConfig && newConfig.extractTags) {
      configForm.extractTags.value = newConfig.extractTags
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
/* 紧凑表单样式 */
.compact-form :deep(.n-form-item) {
  margin-bottom: 8px;
}
.compact-form :deep(.n-form-item-label) {
  padding-bottom: 2px;
}
.compact-item {
  margin-bottom: 8px !important;
}
</style>
