<template>
  <el-collapse-transition>
    <div v-show="visible" class="stats-panel">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="总任务数" :value="stats.totalTasks">
            <template #suffix>
              <el-icon color="#409EFF"><DataAnalysis /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="已完成" :value="stats.completedTasks">
            <template #suffix>
              <el-icon color="#67C23A"><Check /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="缓存命中率" :value="stats.cacheHitRate" suffix="%">
            <template #suffix>
              <el-icon :color="stats.cacheHitRate > 50 ? '#67C23A' : '#F56C6C'"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均处理时间" :value="stats.averageProcessingTime" suffix="ms">
            <template #suffix>
              <el-icon color="#E6A23C"><Timer /></el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
      
      <!-- 实时进度显示 - 只在有任务时显示 -->
      <template v-if="hasActiveTasks">
        <el-divider content-position="left">实时状态</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="progress-item">
              <div class="progress-label">整体进度</div>
              <el-progress 
                :percentage="overallProgress" 
                :status="overallProgressStatus"
                :stroke-width="8"
              >
                <template #default="{ percentage }">
                  <span class="percentage-value">{{ percentage }}%</span>
                </template>
              </el-progress>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="progress-item">
              <div class="progress-label">队列状态</div>
              <el-tag v-if="queueStatus.running.length > 0" type="warning" size="large">
                <el-icon><Loading /></el-icon>
                {{ queueStatus.running.length }} 个任务运行中
              </el-tag>
              <el-tag v-else-if="queueStatus.pending.length > 0" type="info" size="large">
                <el-icon><Clock /></el-icon>
                {{ queueStatus.pending.length }} 个任务等待中
              </el-tag>
            </div>
          </el-col>
        </el-row>
      </template>
      
      <!-- 空闲状态提示 -->
      <template v-else>
        <el-divider content-position="left">系统状态</el-divider>
        <el-alert 
          title="系统就绪" 
          description="当前没有运行中的任务，可以开始新的审查工作" 
          type="success" 
          :closable="false" 
          show-icon
        />
      </template>
    </div>
  </el-collapse-transition>
</template>

<script setup>
import { computed } from 'vue'
import { DataAnalysis, Check, TrendCharts, Timer, Loading, Clock } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  stats: {
    type: Object,
    required: true
  },
  overallProgress: {
    type: Number,
    default: 0
  },
  overallProgressStatus: {
    type: String,
    default: ''
  },
  queueStatus: {
    type: Object,
    required: true
  }
})

// 计算是否有活跃任务
const hasActiveTasks = computed(() => {
  return props.queueStatus.running.length > 0 || props.queueStatus.pending.length > 0
})
</script>

<style scoped>
.stats-panel {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.progress-item {
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.percentage-value {
  font-weight: bold;
  color: #409EFF;
}
</style>