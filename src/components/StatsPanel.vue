<template>
  <el-collapse-transition>
    <div v-show="visible" class="stats-panel">
      <el-divider content-position="left">性能统计</el-divider>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="总任务数" :value="stats.totalTasks">
            <template #suffix>
              <el-icon><DataAnalysis /></el-icon>
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
              <el-icon color="#E6A23C"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均处理时间" :value="stats.averageProcessingTime" suffix="ms">
            <template #suffix>
              <el-icon color="#409EFF"><Timer /></el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <!-- 实时进度显示 - 只在有任务时显示 -->
      <template v-if="hasActiveTasks">
        <el-divider content-position="left">实时状态</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="mb-2">
              <div class="text-xs text-wps-text-light mb-1">整体进度</div>
              <el-progress
                :percentage="overallProgress"
                :status="overallProgressStatus"
                :stroke-width="8"
              >
                <template #default="{ percentage }">
                  <span class="font-bold text-blue-500">{{ percentage }}%</span>
                </template>
              </el-progress>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="mb-2">
              <div class="text-xs text-wps-text-light mb-1">队列状态</div>
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

      <!-- 队列详情 - 集成QueueStatus功能 -->
      <template v-if="showQueueDetails && hasActiveTasks">
        <el-divider content-position="left">队列详情</el-divider>
        <el-tabs v-model="activeQueueTab" size="small">
          <el-tab-pane name="running" :label="`运行中 (${queueStatus.running.length})`">
            <el-table :data="queueStatus.running" size="small" max-height="200">
              <el-table-column prop="id" label="任务ID" width="120" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getTaskTypeLabel(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="120">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress || 0" size="small" />
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane name="pending" :label="`等待中 (${queueStatus.pending.length})`">
            <el-table :data="queueStatus.pending" size="small" max-height="200">
              <el-table-column prop="id" label="任务ID" width="120" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getTaskTypeLabel(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="priority" label="优先级" width="80">
                <template #default="{ row }">
                  <el-tag :type="getPriorityType(row.priority)" size="small">{{
                    row.priority
                  }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <div style="text-align: center; margin-top: 10px">
          <el-button size="small" @click="showQueueDetails = false">收起详情</el-button>
          <el-button
            size="small"
            type="primary"
            @click="$emit('clear-completed')"
            :disabled="queueStatus.completed.length === 0"
          >
            清理已完成 ({{ queueStatus.completed.length }})
          </el-button>
        </div>
      </template>

      <!-- 显示队列详情按钮 -->
      <template v-else-if="hasActiveTasks">
        <div style="text-align: center; margin-top: 10px">
          <el-button size="small" type="text" @click="showQueueDetails = true">
            查看队列详情 <el-icon><ArrowDown /></el-icon>
          </el-button>
        </div>
      </template>
    </div>
  </el-collapse-transition>
</template>

<script>
import {
  DataAnalysis,
  Check,
  TrendCharts,
  Timer,
  Loading,
  Clock,
  ArrowDown
} from '@element-plus/icons-vue'

export default {
  name: 'StatsPanel',
  components: {
    DataAnalysis,
    Check,
    TrendCharts,
    Timer,
    Loading,
    Clock,
    ArrowDown
  },
  props: {
    visible: {
      type: Boolean,
      default: true
    },
    stats: {
      type: Object,
      default: () => ({
        totalTasks: 0,
        completedTasks: 0,
        cacheHitRate: 0,
        averageProcessingTime: 0
      })
    },
    queueStatus: {
      type: Object,
      default: () => ({
        running: [],
        pending: [],
        completed: []
      })
    }
  },
  data() {
    return {
      showQueueDetails: false,
      activeQueueTab: 'running'
    }
  },
  computed: {
    hasActiveTasks() {
      return this.queueStatus.running.length > 0 || this.queueStatus.pending.length > 0
    },
    overallProgress() {
      const total = this.stats.totalTasks
      if (total === 0) return 0
      return Math.round((this.stats.completedTasks / total) * 100)
    },
    overallProgressStatus() {
      if (this.overallProgress === 100) return 'success'
      if (this.overallProgress > 50) return 'warning'
      return 'exception'
    }
  },
  methods: {
    getTaskTypeLabel(type) {
      const typeMap = {
        contract_review: '合同审查',
        risk_analysis: '风险分析',
        clause_extraction: '条款提取',
        compliance_check: '合规检查'
      }
      return typeMap[type] || type
    },
    getPriorityType(priority) {
      const priorityMap = {
        high: 'danger',
        medium: 'warning',
        low: 'info'
      }
      return priorityMap[priority] || 'info'
    }
  },
  watch: {
    hasActiveTasks(newVal) {
      if (!newVal) {
        this.showQueueDetails = false
      }
    }
  }
}
</script>

<style scoped>
/* StatsPanel 样式已迁移到 UnoCSS 类 */
</style>
