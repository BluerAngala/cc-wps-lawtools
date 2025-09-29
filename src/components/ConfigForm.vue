<template>
  <el-form label-width="auto" label-position="top" class="w-full">
    <el-form-item v-for="(field, key) in config" :key="key" :label="field.label">
      <!-- 文本输入框 -->
      <el-input
        v-if="field.type === 'text'"
        v-model="field.value"
        :placeholder="field.placeholder"
        @input="updateConfig"
      />

      <!-- 选择框 -->
      <el-select
        v-else-if="field.type === 'select'"
        v-model="field.value"
        class="w-full"
        @change="updateConfig"
      >
        <el-option v-for="option in field.options" :key="option" :label="option" :value="option" />
      </el-select>

      <!-- 数字输入框 -->
      <el-input-number
        v-else-if="field.type === 'number'"
        v-model="field.value"
        :placeholder="field.placeholder"
        @change="updateConfig"
      />

      <!-- 关键词列表配置 -->
      <div v-else-if="field.type === 'keywordList'" class="contract-review-config">
        <div class="scroll-container border border-wps-blue rounded mb-3 scrollbar-none">
          <div v-for="(item, index) in field.value" :key="index" class="keyword-item">
            <div class="keyword-title">{{ index + 1 }}. 关键词</div>
            <el-button
              type="danger"
              @click="removeKeyword(field, index)"
              size="small"
              :icon="Delete"
              circle
              class="delete-btn"
            />
            <div class="flex items-center gap-1.5 mb-1.5">
              <el-input
                v-model="item.keyword"
                placeholder="请输入关键词"
                size="small"
                class="w-full"
                @input="updateConfig"
              />
            </div>
            <div class="keyword-title">- 批注内容</div>
            <el-input
              v-model="item.comment"
              placeholder="请输入批注内容"
              size="small"
              type="textarea"
              :rows="2"
              class="w-full mt-0.5"
              @input="updateConfig"
            />
          </div>
        </div>
        <el-button
          type="primary"
          @click="addKeyword(field)"
          :icon="Plus"
          size="small"
          class="add-rule-btn"
        >
          添加关键词
        </el-button>
      </div>

      <!-- AI合同预审规则列表配置 -->
      <div v-else-if="field.type === 'contractReviewList'" class="contract-review-config">
        <div class="max-h-400px overflow-y-auto scrollbar-none border border-wps-blue rounded mb-3">
          <div v-for="(rule, index) in field.value" :key="index" class="review-rule-item">
            <div class="rule-title">{{ index + 1 }}. 预审规则</div>
            <el-button
              type="danger"
              @click="removeReviewRule(field, index)"
              size="small"
              :icon="Delete"
              circle
              class="delete-btn"
            />

            <!-- 规则名称 -->
            <div class="config-section">
              <div class="section-title">📋 规则名称</div>
              <el-input
                v-model="rule.reviewRules"
                placeholder="请输入预审规则名称"
                size="small"
                @input="updateConfig"
              />
            </div>

            <!-- 审查要求 -->
            <div class="config-section">
              <div class="section-title">📝 审查要求</div>
              <el-input
                v-model="rule.reviewRequirements"
                type="textarea"
                :rows="3"
                placeholder="请输入具体的审查要求，例如：审查合同是否存在争议解决条款，约定纠纷处理是仲裁还是法院，争议解决条款是否有效？"
                @input="updateConfig"
              />
            </div>

            <!-- 执行动作 -->
            <div class="config-section">
              <div class="section-title">⚙️ 执行动作</div>
              <el-select v-model="rule.actionType" class="w-full" @change="updateConfig">
                <el-option label="批注" value="批注" />
                <el-option label="修订" value="修订" />
              </el-select>
            </div>
          </div>
        </div>
        <el-button
          type="primary"
          @click="addReviewRule(field)"
          :icon="Plus"
          size="small"
          class="add-rule-btn"
        >
          添加预审规则
        </el-button>
      </div>

      <!-- 标签输入框配置 -->
      <div v-else-if="field.type === 'tags'" class="w-full">
        <div class="tags-display">
          <el-tag
            v-for="(tag, index) in field.value"
            :key="index"
            closable
            @close="removeTag(field, index)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div class="tag-input-row">
          <el-input
            v-model="field.inputValue"
            placeholder="输入数据要素"
            @keyup.enter="addTag(field)"
            class="flex-1"
          />
          <el-button
            type="primary"
            @click="addTag(field)"
            :icon="Plus"
            size="small"
            class="flex-shrink-0"
          >
            添加
          </el-button>
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { Delete, Plus } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update-config'])

// 方法
const updateConfig = () => {
  emit('update-config', props.config)
}

const addKeyword = (field) => {
  field.value.push({ keyword: '', comment: '' })
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
/* Element Plus 深度样式覆盖 - 这些需要保留因为UnoCSS无法处理deep选择器 */
:deep(.el-form-item) {
  width: 100%;
}

:deep(.el-form-item__content) {
  width: 100%;
}

/* 隐藏空的标签显示区域 */
.tags-display:empty {
  display: none;
}
</style>
