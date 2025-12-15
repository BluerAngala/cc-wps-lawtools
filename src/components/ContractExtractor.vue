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
    </div>

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

      <n-form v-if="extractedData" label-placement="top" size="small">
        <!-- 第一行：合同名称 + 对接客户 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="6">
          <n-grid-item>
            <n-form-item label="合同名称" class="mb-2">
              <n-input
                :value="extractedData['合同名称']"
                @update:value="updateExtractedItem('合同名称', $event)"
                placeholder="请输入合同名称"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="对接客户" class="mb-2">
              <n-input
                :value="extractedData['对接客户']"
                @update:value="updateExtractedItem('对接客户', $event)"
                placeholder="请输入对接客户"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <!-- 第二行：甲方 + 甲方主体信息 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="6">
          <n-grid-item>
            <n-form-item label="甲方" class="mb-2">
              <n-input
                :value="extractedData['甲方']"
                @update:value="updateExtractedItem('甲方', $event)"
                placeholder="请输入甲方"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="甲方主体信息" class="mb-2">
              <n-input
                :value="extractedData['甲方主体信息']"
                @update:value="updateExtractedItem('甲方主体信息', $event)"
                placeholder="请输入甲方主体信息"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <!-- 第三行：乙方 + 乙方主体信息 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="6">
          <n-grid-item>
            <n-form-item label="乙方" class="mb-2">
              <n-input
                :value="extractedData['乙方']"
                @update:value="updateExtractedItem('乙方', $event)"
                placeholder="请输入乙方"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="乙方主体信息" class="mb-2">
              <n-input
                :value="extractedData['乙方主体信息']"
                @update:value="updateExtractedItem('乙方主体信息', $event)"
                placeholder="请输入乙方主体信息"
                show-count
                :maxlength="200"
                size="small"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <!-- 其他字段 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="6">
          <n-grid-item v-for="key in otherFields" :key="key">
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

// 固定字段列表（按顺序排列）
const fixedFields = ['合同名称', '对接客户', '甲方', '甲方主体信息', '乙方', '乙方主体信息']

// 计算其他字段（排除固定字段）
const otherFields = computed(() => {
  if (!props.extractedData) return []
  return Object.keys(props.extractedData).filter(key => !fixedFields.includes(key))
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
