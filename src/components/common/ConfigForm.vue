<template>
  <el-form label-width="80px" label-position="top">
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
        <div v-for="(item, index) in field.value" :key="index" class="keyword-item">
          <div class="keyword-title">关键词</div>
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
          <div class="comment-title">批注内容</div>
          <el-input 
            v-model="item.comment" 
            placeholder="请输入批注内容" 
            size="small" 
            class="comment-input"
            @input="updateConfig"
          />
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
</script>

<style scoped>
.keyword-list-config {
  margin-top: 10px;
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
</style>