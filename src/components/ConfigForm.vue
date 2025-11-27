<template>
  <n-form label-placement="top" class="w-full compact-form">
    <n-form-item v-for="(field, key) in config" :key="key" :label="field.label" class="compact-form-item">
      <!-- 文本输入框 -->
      <n-input v-if="field.type === 'text'" v-model:value="field.value" :placeholder="field.placeholder"
        @update:value="updateConfig" />

      <!-- 选择框 -->
      <n-select v-else-if="field.type === 'select'" v-model:value="field.value"
        :options="field.options?.map(option => ({ label: option, value: option }))" class="w-full"
        @update:value="updateConfig" />

      <!-- 数字输入框 -->
      <n-input-number v-else-if="field.type === 'number'" v-model:value="field.value" :placeholder="field.placeholder"
        @update:value="updateConfig" />

      <!-- 关键词列表配置 -->
      <div v-else-if="field.type === 'keywordList'" class="contract-review-config">
        <div class="config-header">
          <n-button type="primary" @click="addKeyword(field)" size="small" class="add-rule-btn-sticky">
            <template #icon>
              <PlusIcon />
            </template>
            添加规则
          </n-button>
        </div>
        <div class="scroll-container border border-wps-blue rounded max-h-80 overflow-y-auto">

          <div v-for="(item, index) in field.value" :key="index" class="keyword-item">
            <div class="keyword-title">{{ index + 1 }}. 关键词</div>
            <n-button type="error" @click="removeKeyword(field, index)" size="small" circle class="delete-btn">
              <template #icon>
                <DeleteIcon />
              </template>
            </n-button>
            <div class="flex items-center gap-1.5 mb-1.5">
              <n-input v-model:value="item.keyword" placeholder="请输入关键词" size="small" class="w-full"
                @update:value="updateConfig" />
            </div>
            <div class="keyword-title mt-2">- 执行动作</div>
            <n-select v-model:value="item.actionType"
              :options="[{ label: '批注', value: '批注' }, { label: '修订', value: '修订' }]" size="small" class="w-full mt-0.5"
              @update:value="updateConfig" />
            <div v-if="item.actionType === '批注'" class="mt-2">
              <div class="keyword-title">- {{ props.mode === 'keyword' ? '批注内容' : '任务要求' }}</div>
              <n-input v-model:value="item.comment"
                :placeholder="props.mode === 'keyword' ? '请输入固定的批注内容' : '请输入AI任务要求，描述需要AI做什么'" size="small"
                type="textarea" :rows="2" class="w-full mt-0.5" @update:value="updateConfig" />
            </div>
            <div v-if="item.actionType === '修订'" class="mt-2">
              <div class="keyword-title">- 修改内容</div>
              <n-input v-model:value="item.suggestedText" placeholder="请输入修改后的内容" size="small" type="textarea" :rows="2"
                class="w-full mt-0.5" @update:value="updateConfig" />
            </div>
          </div>
        </div>

      </div>

      <!-- AI合同预审规则列表配置 -->
      <div v-else-if="field.type === 'contractReviewList'" class="contract-review-config">
        <div class="scroll-container border border-wps-blue rounded mb-3 max-h-96 overflow-y-auto">
          <div v-for="(rule, index) in field.value" :key="index" class="review-rule-item">
            <div class="rule-title">{{ index + 1 }}. 预审规则</div>
            <n-button type="error" @click="removeReviewRule(field, index)" size="small" circle class="delete-btn">
              <template #icon>
                <DeleteIcon />
              </template>
            </n-button>

            <!-- 规则名称 -->
            <div class="config-section">
              <div class="section-title">📋 规则名称</div>
              <n-input v-model:value="rule.reviewRules" placeholder="请输入预审规则名称" size="small"
                @update:value="updateConfig" />
            </div>

            <!-- 审查要求 -->
            <div class="config-section">
              <div class="section-title">📝 审查要求</div>
              <n-input v-model:value="rule.reviewRequirements" type="textarea" :rows="3"
                placeholder="请输入具体的审查要求，例如：审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？" @update:value="updateConfig" />
            </div>

            <!-- 执行动作 -->
            <div class="config-section">
              <div class="section-title">⚙️ 执行动作</div>
              <n-select v-model:value="rule.actionType"
                :options="[{ label: '批注', value: '批注' }, { label: '修订', value: '修订' }]" class="w-full"
                @update:value="updateConfig" />
            </div>
          </div>
        </div>
        <n-button type="primary" @click="addReviewRule(field)" size="small" class="add-rule-btn">
          <template #icon>
            <PlusIcon />
          </template>
          添加预审规则
        </n-button>
      </div>

      <!-- 标签输入框配置 -->
      <div v-else-if="field.type === 'tags'" class="w-full">
        <div class="tags-display">
          <n-tag v-for="(tag, index) in field.value" :key="index" closable @close="removeTag(field, index)"
            class="tag-item">
            {{ tag }}
          </n-tag>
        </div>
        <div class="tag-input-row">
          <n-input v-model:value="field.inputValue" placeholder="输入数据要素" @keyup.enter="addTag(field)" class="flex-1" />
          <n-button type="primary" @click="addTag(field)" size="small" class="flex-shrink-0">
            <template #icon>
              <PlusIcon />
            </template>
            添加
          </n-button>
        </div>
      </div>
    </n-form-item>
  </n-form>
</template>

<script setup>
import {
  NForm, NFormItem, NInput, NSelect, NInputNumber,
  NButton, NTag
} from 'naive-ui'
import { TrashOutline as DeleteIcon, Add as PlusIcon } from '@vicons/ionicons5'

// Props
const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'keyword' // 'keyword' | 'review'
  }
})

// Emits
const emit = defineEmits(['update-config'])

// 方法
const updateConfig = () => {
  emit('update-config', props.config)
}

const addKeyword = (field) => {
  field.value.push({ keyword: '', comment: '', actionType: '批注', suggestedText: '' })
  updateConfig()
}

const removeKeyword = (field, index) => {
  field.value.splice(index, 1)
  updateConfig()
}

const addTag = (field) => {
  if (field.inputValue && field.inputValue.trim()) {
    field.value.push(field.inputValue.trim())
    field.inputValue = ''
    updateConfig()
  }
}

const removeTag = (field, index) => {
  field.value.splice(index, 1)
  updateConfig()
}

const addReviewRule = (field) => {
  field.value.push({
    reviewRules: '',
    reviewRequirements: '',
    actionType: '批注'
  })
  updateConfig()
}

const removeReviewRule = (field, index) => {
  field.value.splice(index, 1)
  updateConfig()
}
</script>

<style scoped>
/* 隐藏空的标签显示区域 */
.tags-display:empty {
  display: none;
}

/* 配置区域样式优化 */
.contract-review-config {
  position: relative;
}

.config-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.add-rule-btn-sticky {
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scroll-container {
  margin-top: 0;
}

.keyword-item,
.review-rule-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 6px;
  position: relative;
}

.keyword-item:last-child,
.review-rule-item:last-child {
  margin-bottom: 0;
}

.keyword-title,
.rule-title,
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.config-section {
  margin-top: 12px;
}

.config-section:first-child {
  margin-top: 0;
}

/* 减小表单项间距 */
.compact-form :deep(.n-form-item) {
  margin-bottom: 0 !important;
}

.compact-form-item :deep(.n-form-item__blank) {
  padding-top: 0 !important;
}

.compact-form-item :deep(.n-form-item__label) {
  display: none;
}

/* 配置区域紧凑布局 */
.contract-review-config :deep(.n-form-item) {
  margin-bottom: 0 !important;
}
</style>
