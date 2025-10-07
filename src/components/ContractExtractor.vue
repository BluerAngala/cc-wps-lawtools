<template>
  <div class="wps-card">
    <!-- 卡片头部 -->
    <div class="wps-header mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg">🤖</span>
        <span class="wps-title">AI抽取合同信息</span>
        <n-tag v-if="processing" type="warning" size="small">处理中</n-tag>
      </div>
      <n-button
        type="primary"
        @click="executeExtraction"
        :loading="processing"
        :disabled="processing"
      >
        {{ processing ? '抽取中...' : '开始抽取' }}
      </n-button>
    </div>

    <div>
      <!-- 配置区域 -->
      <div class="mb-5">
        <n-alert title="使用AI智能提取合同关键信息" type="info" :closable="false" show-icon />

        <div class="mt-4">
          <ConfigForm :config="configForm" @update-config="updateConfig" />
        </div>
      </div>

      <!-- 抽取结果展示 -->
      <div v-if="extractedData" class="mt-6">
        <n-divider>
          <template #default>
            <n-icon><DocumentIcon /></n-icon>
            <span class="ml-2">抽取结果</span>
          </template>
        </n-divider>

        <div class="wps-card border border-wps-border rounded-lg overflow-hidden">
          <!-- 结果卡片头部 -->
          <div class="wps-header p-4 bg-gray-50 border-b border-wps-border">
            <div class="flex items-center gap-2">
              <n-icon class="text-primary-500"><EditIcon /></n-icon>
              <span class="font-semibold text-wps-text">合同信息编辑</span>
              <n-tag size="small" type="success"
                >{{ Object.keys(extractedData).length }} 项</n-tag
              >
            </div>
            <n-button type="primary" size="small" @click="submitData" :loading="submitting">
              <template #icon><UploadIcon /></template>
              {{ submitting ? '提交中...' : '提交' }}
            </n-button>
          </div>

          <!-- 表单内容 -->
          <div class="p-4">
            <n-form label-placement="top">
              <n-grid :cols="2" :x-gap="16">
                <n-grid-item v-for="(value, key) in extractedData" :key="key" class="mb-2">
                  <n-form-item :label="key" class="mb-4">
                    <n-input
                      :value="extractedData[key]"
                      @update:value="updateExtractedItem(key, $event)"
                      type="textarea"
                      :rows="3"
                      :placeholder="`请输入${key}`"
                      show-count
                      :maxlength="500"
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
import { reactive } from 'vue'
import { 
  NButton, NTag, NAlert, NDivider, NIcon, NForm, NFormItem, 
  NInput, NGrid, NGridItem 
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
  }
})

// Emits
const emit = defineEmits(['execute', 'submit-data', 'update:extracted-data', 'update-config'])

// 配置表单
const configForm = reactive({
  extractTags: {
    label: '提取数据要素',
    type: 'tags',
    value: ['合同名称', '甲方', '乙方', '其他方', '合同金额'],
    inputValue: ''
  }
})

// 方法
const executeExtraction = () => {
  const config = {
    extractTags: configForm.extractTags.value
  }
  emit('execute', config)
}

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
</script>
