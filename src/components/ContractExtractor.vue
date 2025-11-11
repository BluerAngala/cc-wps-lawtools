<template>
  <div class="wps-card">
    <div>
      <!-- 配置区域 -->
      <div class="mb-5">
        <n-alert title="使用AI智能提取合同关键信息" type="info" :closable="false" show-icon />

        <div class="mt-4">
          <ConfigForm :config="configForm" @update-config="updateConfig" />
        </div>
      </div>

      <!-- 提取结果展示 -->
      <div v-if="extractedData" class="mt-6">
        <n-divider>
          <template #default>
            <n-icon><DocumentIcon /></n-icon>
            <span class="ml-2">提取结果</span>
          </template>
        </n-divider>

        <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <!-- 结果卡片头部 -->
          <div class="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <n-icon class="text-blue-600"><EditIcon /></n-icon>
                <span class="font-medium text-gray-800">合同信息编辑</span>
                <n-tag size="small" type="success" round>
                  {{ Object.keys(extractedData).length }} 项
                </n-tag>
              </div>
              <n-button type="primary" size="small" @click="submitData" :loading="submitting" round>
                <template #icon><UploadIcon /></template>
                {{ submitting ? '提交中...' : '提交' }}
              </n-button>
            </div>
          </div>

          <!-- 表单内容 -->
          <div class="p-4 bg-gray-50">
            <n-form label-placement="top" size="small">
              <n-grid :cols="2" :x-gap="12" :y-gap="6">
                <n-grid-item v-for="(value, key) in extractedData" :key="key">
                  <n-form-item :label="key" class="mb-2">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { 
  NButton, NTag, NAlert, NDivider, NIcon, NForm, NFormItem, NInput, NGrid, NGridItem 
} from 'naive-ui'
import {
  DocumentOutline as DocumentIcon,
  Create as EditIcon,
  CloudUpload as UploadIcon
} from '@vicons/ionicons5'
import ConfigForm from './ConfigForm.vue'

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
