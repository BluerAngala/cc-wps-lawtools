<template>
  <el-card class="queue-card" v-if="visible">
    <template #header>
      <div class="card-header">
        <span>任务队列状态</span>
        <div class="header-actions">
          <el-badge 
            :value="queueStatus.running.length + queueStatus.pending.length" 
            :hidden="queueStatus.running.length + queueStatus.pending.length === 0" 
            type="warning"
          >
            <el-button 
              size="small" 
              type="text" 
              @click="clearCompletedTasks" 
              :disabled="queueStatus.completed.length === 0"
            >
              <el-icon><Delete /></el-icon>
              清理已完成
            </el-button>
          </el-badge>
          <el-button size="small" @click="$emit('close')" :icon="Close" />
        </div>
      </div>
    </template>
    
    <!-- 队列概览 -->
    <div class="queue-overview">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic title="运行中" :value="queueStatus.running.length">
            <template #suffix>
              <el-icon color="#E6A23C" v-if="queueStatus.running.length > 0"><Loading /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="等待中" :value="queueStatus.pending.length">
            <template #suffix>
              <el-icon color="#409EFF" v-if="queueStatus.pending.length > 0"><Clock /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="已完成" :value="queueStatus.completed.length">
            <template #suffix>
              <el-icon color="#67C23A" v-if="queueStatus.completed.length > 0"><Check /></el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>
    
    <el-tabs v-model="activeQueueTab">
      <el-tab-pane name="running">
        <template #label>
          <el-badge :value="queueStatus.running.length" :hidden="queueStatus.running.length === 0" type="warning">
            运行中
          </el-badge>
        </template>
        <el-empty v-if="queueStatus.running.length === 0" description="暂无运行中的任务" />
        <el-table v-else :data="queueStatus.running" size="small">
          <el-table-column prop="id" label="任务ID" width="120" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getTaskTypeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.progress || 0" size="small" :status="row.progress === 100 ? 'success' : ''" />
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" :formatter="formatTime" />
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane name="pending">
        <template #label>
          <el-badge :value="queueStatus.pending.length" :hidden="queueStatus.pending.length === 0" type="info">
            等待中
          </el-badge>
        </template>
        <el-empty v-if="queueStatus.pending.length === 0" description="暂无等待中的任务" />
        <el-table v-else :data="queueStatus.pending" size="small">
          <el-table-column prop="id" label="任务ID" width="120" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getTaskTypeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" :formatter="formatTime" />
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane name="completed">
        <template #label>
          <el-badge :value="queueStatus.completed.length" :hidden="queueStatus.completed.length === 0" type="success">
            已完成
          </el-badge>
        </template>
        <el-empty v-if="queueStatus.completed.length === 0" description="暂无已完成的任务" />
        <el-table v-else :data="queueStatus.completed" size="small">
          <el-table-column prop="id" label="任务ID" width="120" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="success">{{ getTaskTypeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="processingTime" label="处理时间" width="100">
            <template #default="{ row }">
              <el-text size="small">{{ row.processingTime }}ms</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="completedAt" label="完成时间" :formatter="formatTime" />
          <el-table-column label="状态" width="80">
            <template #default>
              <el-icon color="#67C23A"><Check /></el-icon>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { Delete, Close, Loading, Clock, Check } from '@element-plus/icons-vue'

// Props
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  queueStatus: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['close', 'clear-completed'])

// 响应式数据
const activeQueueTab = ref('running')

// 方法
const getTaskTypeLabel = (type) => {
  const typeMap = {
    'extractText': 'AI抽取',
    'contractReview': 'AI预审',
    'addHeader': '添加页眉',
    'keywordComment': '关键词批注',
    'analyzeDocStructure': '结构分析'
  }
  return typeMap[type] || type
}

const getPriorityType = (priority) => {
  const priorityMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return priorityMap[priority] || 'info'
}

const formatTime = (row, column, cellValue) => {
  if (!cellValue) return '-'
  return new Date(cellValue).toLocaleString()
}

const clearCompletedTasks = () => {
  emit('clear-completed')
}
</script>

<style scoped>
.queue-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.queue-overview {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.queue-card .el-table {
  margin-top: 16px;
}
</style>