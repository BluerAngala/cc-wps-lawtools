<template>
  <el-form label-width="auto" label-position="top" style="width: 100%;">
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
        style="width: 100%"
        @change="updateConfig"
      >
        <el-option 
          v-for="option in field.options" 
          :key="option" 
          :label="option" 
          :value="option" 
        />
      </el-select>
      
      <!-- 数字输入框 -->
      <el-input-number 
        v-else-if="field.type === 'number'" 
        v-model="field.value"
        :placeholder="field.placeholder"
        @change="updateConfig"
      />
      
      <!-- 关键词列表配置 -->
      <div v-else-if="field.type === 'keywordList'" class="keyword-list-config">
        <div class="keyword-list-container">
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
            <div class="keyword-row">
              <el-input 
                v-model="item.keyword" 
                placeholder="请输入关键词" 
                size="small" 
                class="keyword-input"
                @input="updateConfig"
              />
            </div>
            <div class="comment-title"> - 批注内容</div>
            <el-input 
              v-model="item.comment" 
              placeholder="请输入批注内容" 
              size="small" 
              class="comment-input"
              @input="updateConfig"
            />
          </div>
        </div>
        <el-button 
          type="primary" 
          @click="addKeyword(field)" 
          :icon="Plus" 
          size="small"
          class="add-keyword-btn"
        >
          添加关键词
        </el-button>
      </div>
      
      <!-- AI合同预审规则列表配置 -->
      <div v-else-if="field.type === 'contractReviewList'" class="contract-review-list-config">
        <div class="review-list-container">
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
              <el-select 
                v-model="rule.actionType" 
                style="width: 100%"
                @change="updateConfig"
              >
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
      <div v-else-if="field.type === 'tags'" class="tags-config">
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
            class="tag-input"
          />
          <el-button 
            type="primary" 
            @click="addTag(field)" 
            :icon="Plus" 
            size="small" 
            class="add-tag-btn"
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
:deep(.el-form-item) {
  width: 100%;
}

:deep(.el-form-item__content) {
  width: 100%;
}

.keyword-list-config {
  margin-top: 10px;
  width: 100%;
}

.keyword-list-container {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 12px;

  /* 添加边框 */
  border: 1px solid #4d7dee;
  border-radius: 4px;

}

.keyword-list-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.keyword-item {
  position: relative;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f8f9fa;
}

.keyword-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
}

.comment-title {
  font-size: 12px;
  color: #606266;
  margin: 8px 0 6px 0;
  font-weight: 500;
}

.keyword-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  padding: 0;
}

.keyword-input {
  width: 100%;
}

.comment-input {
  width: 100%;
  margin-top: 2px;
}

.add-keyword-btn {
  margin-top: 12px;
  width: 100%;
}

.tags-config {
  width: 100%;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  min-height: 40px;
  background: #f8f9fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 8px;
  align-items: flex-start;
  align-content: flex-start;
}

.tags-display:empty {
  display: none;
}

.tag-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag-input {
  flex: 1;
}

.add-tag-btn {
  flex-shrink: 0;
}

.tag-item {
  margin: 2px;
  font-size: 12px;
}

/* AI合同预审规则列表配置样式 */
.contract-review-list-config {
  margin-top: 10px;
  width: 100%;
}

.review-list-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 12px;
  border: 1px solid #4d7dee;
  border-radius: 4px;
}

.review-list-container::-webkit-scrollbar {
  display: none;
}

.review-rule-item {
  position: relative;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f8f9fa;
}

.rule-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.config-section {
  margin-bottom: 12px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  padding: 0;
}

.add-rule-btn {
  margin-top: 12px;
  width: 100%;
}

.contract-review-list-config .el-input,
.contract-review-list-config .el-select {
  width: 100%;
}

.contract-review-list-config .el-textarea {
  width: 100%;
}
</style>