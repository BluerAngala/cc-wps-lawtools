<template>
  <el-card class="wps-section" shadow="hover">
    <template #header>
      <h3>审查规则（单项执行）</h3>
    </template>
    <el-collapse v-model="activeRules" accordion>
      <el-collapse-item v-for="rule in rules" :key="rule.name" :name="rule.name">
        <template #title>
          <div class="wps-header pr-2.5">
            <span class="wps-subtitle">{{ rule.icon }} {{ rule.title }}</span>
            <div class="flex items-center gap-2">
              <el-tag v-if="isRuleProcessing(rule.name)" type="warning" size="small">
                处理中
              </el-tag>
              <el-button
                type="primary"
                @click.stop="executeRule(rule.name)"
                size="small"
                :icon="VideoPlay"
                :loading="isRuleProcessing(rule.name)"
                :disabled="isRuleProcessing(rule.name)"
              >
                {{ isRuleProcessing(rule.name) ? '处理中' : '执行' }}
              </el-button>
            </div>
          </div>
        </template>
        <!-- AI抽取合同信息的结果展示 -->
        <div v-if="rule.name === 'extractText' && extractedData" class="extracted-results">
          <el-divider content-position="center">
            <el-icon>
              <Document />
            </el-icon>
            <span style="margin-left: 8px">抽取结果</span>
          </el-divider>

          <el-card class="extracted-card" shadow="never">
            <template #header>
              <div class="extracted-header">
                <div class="header-info">
                  <el-icon class="header-icon">
                    <Edit />
                  </el-icon>
                  <span class="header-title">合同信息编辑</span>
                  <el-tag size="small" type="success"
                    >{{ Object.keys(extractedData).length }} 项</el-tag
                  >
                </div>
                <el-button
                  type="primary"
                  size="small"
                  @click="submitExtractedData"
                  :loading="submitting"
                >
                  <el-icon>
                    <Upload />
                  </el-icon>
                  {{ submitting ? '提交中...' : '提交' }}
                </el-button>
              </div>
            </template>

            <el-form label-position="top" class="extracted-form">
              <el-row :gutter="16">
                <el-col
                  v-for="(value, key) in extractedData"
                  :key="key"
                  :span="12"
                  class="form-item-col"
                >
                  <el-form-item :label="key" class="extracted-form-item">
                    <el-input
                      :model-value="extractedData[key]"
                      @update:model-value="updateExtractedItem(key, $event)"
                      type="textarea"
                      :rows="3"
                      :placeholder="`请输入${key}`"
                      resize="vertical"
                      show-word-limit
                      :maxlength="500"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </div>

        <div class="py-4">
          <!-- 规则描述 -->
          <el-alert :title="rule.description" type="info" :closable="false" show-icon />
          <div class="mt-4" v-if="rule.configForm">
            <ConfigForm
              :config="rule.configForm"
              @update-config="updateRuleConfig(rule.name, $event)"
            />
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { VideoPlay, Document, Edit, Upload } from '@element-plus/icons-vue'
import ConfigForm from '../common/ConfigForm.vue'

// Props
const props = defineProps({
  rules: {
    type: Array,
    required: true
  },
  processingRules: {
    type: Set,
    required: true
  },
  extractedData: {
    type: Object,
    default: null
  },
  activeExtractedItems: {
    type: Array,
    default: () => []
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'execute-rule',
  'update-rule-config',
  'submit-extracted-data',
  'update:active-extracted-items',
  'update:extracted-data'
])

// 响应式数据
const activeRules = ref('')

// 方法
const isRuleProcessing = (ruleName) => {
  return props.processingRules.has(ruleName)
}

const executeRule = (ruleName) => {
  emit('execute-rule', ruleName)
}

const updateRuleConfig = (ruleName, config) => {
  emit('update-rule-config', ruleName, config)
}

const submitExtractedData = () => {
  emit('submit-extracted-data')
}

const updateExtractedItem = (key, value) => {
  const updatedData = { ...props.extractedData }
  updatedData[key] = value
  emit('update:extracted-data', updatedData)
}
</script>

<style scoped>
.rules-card {
  margin-bottom: 20px;
}

.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.rule-title {
  font-weight: 500;
  font-size: 14px;
}

.rule-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-content {
  padding: 16px 0;
}

.rule-config {
  margin-top: 16px;
}

.extracted-results {
  margin-top: 16px;
}

.extracted-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.extracted-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #409eff;
  font-size: 16px;
}

.header-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.extracted-form {
  margin-top: 0;
}

.form-item-col {
  margin-bottom: 8px;
}

.extracted-form-item {
  margin-bottom: 16px;
}

.extracted-form-item :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
  font-size: 13px;
}

.extracted-form-item :deep(.el-textarea__inner) {
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  transition: border-color 0.2s;
}

.extracted-form-item :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}
</style>
