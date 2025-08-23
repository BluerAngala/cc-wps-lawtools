<template>
  <el-card class="rules-card" shadow="hover">
    <template #header>
      <h3>审查规则（单项执行）</h3>
    </template>
    <el-collapse v-model="activeRules" accordion>
      <el-collapse-item v-for="rule in rules" :key="rule.name" :name="rule.name">
        <template #title>
          <div class="collapse-header">
            <span class="rule-title">{{ rule.icon }} {{ rule.title }}</span>
            <div class="rule-status">
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
        <div class="rule-content">
          <!-- 规则描述 -->
          <el-alert :title="rule.description" type="info" :closable="false" show-icon />
          <div class="rule-config" v-if="rule.configForm">
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
import { VideoPlay } from '@element-plus/icons-vue'
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
  }
})

// Emits
const emit = defineEmits(['execute-rule', 'update-rule-config'])

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
</style>