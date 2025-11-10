<template>
  <n-card title="合同审查" size="small" class="wps-card">
    <template #header-extra>
      <n-space>
        <n-button
          type="primary"
          :loading="processing"
          @click="executeReview"
          size="small"
        >
          <template #icon>
            <DocumentSearchIcon />
          </template>
          开始审查
        </n-button>
      </n-space>
    </template>

    <n-space vertical :size="16">
      <!-- 审查选项 -->
      <n-collapse>
        <n-collapse-item title="审查选项" name="options">
          <n-space vertical>
            <n-radio-group v-model:value="reviewStrategy">
              <n-space vertical>
                <n-radio value="segment">分段审查（推荐）</n-radio>
                <n-radio value="full">全文审查</n-radio>
              </n-space>
            </n-radio-group>
            <n-checkbox v-model:checked="options.autoApply">
              自动应用批注
            </n-checkbox>
          </n-space>
        </n-collapse-item>
      </n-collapse>

      <!-- 审查任务清单 -->
      <n-card v-if="reviewTasks && reviewTasks.length > 0" size="small" title="审查任务清单">
        <n-list>
          <n-list-item v-for="(task, index) in reviewTasks" :key="index">
            <template #prefix>
              <n-icon v-if="task.status === 'completed'" color="#18a058" size="20">
                <CheckmarkCircleOutline />
              </n-icon>
              <n-spin v-else-if="task.status === 'processing'" size="small">
                <template #icon>
                  <n-icon color="#18a058" size="20">
                    <HourglassOutline />
                  </n-icon>
                </template>
              </n-spin>
              <n-icon v-else-if="task.status === 'error'" color="#d03050" size="20">
                <CloseCircleOutline />
              </n-icon>
              <n-icon v-else color="#909399" size="20">
                <RadioButtonOffOutline />
              </n-icon>
            </template>
            <n-space vertical :size="4">
              <div class="font-medium">{{ task.name }}</div>
              <div v-if="task.status === 'processing'" class="text-sm text-gray-500">
                正在审查中...
              </div>
              <div v-else-if="task.status === 'completed'" class="text-sm text-green-600">
                已完成 - 发现问题: {{ task.issues || 0 }} 个
              </div>
              <div v-else-if="task.status === 'error'" class="text-sm text-red-500">
                失败: {{ task.error }}
              </div>
            </n-space>
          </n-list-item>
        </n-list>
      </n-card>

      <!-- 审查结果 -->
      <div v-if="reviewResult" class="space-y-4">
        <!-- 审查总结 -->
        <n-alert type="info" :title="`合同类型: ${reviewResult.contractType?.type || '未知'}`">
          <div class="text-sm space-y-1">
            <div v-if="reviewResult.summary?.segmentCount">审查段数: {{ reviewResult.summary.segmentCount }} 段</div>
            <div>发现问题: {{ reviewResult.summary?.totalIssues || 0 }} 个</div>
            <div>风险点: {{ reviewResult.summary?.totalRisks || 0 }} 个</div>
          </div>
        </n-alert>

        <!-- 审查统计（不显示内部分段信息） -->
        <n-card v-if="reviewResult.segments && reviewResult.segments.length > 0" size="small" title="审查统计">
          <n-list>
            <n-list-item>
              <n-space vertical :size="4">
                <div class="text-sm text-gray-600">
                  共审查 {{ reviewResult.segments.length }} 个部分，
                  发现问题 {{ reviewResult.summary?.totalIssues || 0 }} 个，
                  风险点 {{ reviewResult.summary?.totalRisks || 0 }} 个
                  <span v-if="reviewResult.segments.some(s => s.applied)" class="text-green-600">
                    （已应用批注 {{ reviewResult.segments.reduce((sum, s) => sum + (s.applied || 0), 0) }} 个）
                  </span>
                </div>
              </n-space>
            </n-list-item>
          </n-list>
        </n-card>

        <!-- 问题列表 -->
        <n-collapse v-if="reviewResult.issues && reviewResult.issues.length > 0">
          <n-collapse-item :title="`问题列表 (${reviewResult.issues.length} 个)`" name="issues">
            <n-list>
              <n-list-item v-for="(issue, index) in reviewResult.issues" :key="index">
                <n-thing :title="issue.keyword || issue.position">
                  <template #description>
                    <n-tag type="info" size="small" round>{{ issue.position }}</n-tag>
                    <n-tag 
                      :type="issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'" 
                      size="small" 
                      round
                      style="margin-left: 8px;"
                    >
                      {{ issue.severity || 'medium' }}
                    </n-tag>
                  </template>
                  {{ issue.comment }}
                </n-thing>
              </n-list-item>
            </n-list>
          </n-collapse-item>
        </n-collapse>

        <!-- 风险点 -->
        <n-collapse v-if="reviewResult.risks && reviewResult.risks.length > 0">
          <n-collapse-item :title="`风险点 (${reviewResult.risks.length} 个)`" name="risks">
            <n-list>
              <n-list-item v-for="(risk, index) in reviewResult.risks" :key="index">
                <n-thing :title="risk.description">
                  <template #description>
                    <n-tag 
                      :type="risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'info'" 
                      size="small" 
                      round
                    >
                      {{ risk.severity }}
                    </n-tag>
                  </template>
                  {{ risk.suggestion }}
                </n-thing>
              </n-list-item>
            </n-list>
          </n-collapse-item>
        </n-collapse>
      </div>

      <!-- 空状态 -->
      <n-empty v-else description="点击「开始审查」按钮开始审查合同" />
    </n-space>
  </n-card>
</template>

<script setup>
import { ref } from 'vue'
import {
  NCard,
  NButton,
  NSpace,
  NCollapse,
  NCollapseItem,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NAlert,
  NList,
  NListItem,
  NTag,
  NEmpty,
  NIcon,
  NSpin,
  NThing
} from 'naive-ui'
import {
  SearchOutline as DocumentSearchIcon,
  CheckmarkCircleOutline,
  HourglassOutline,
  CloseCircleOutline,
  RadioButtonOffOutline
} from '@vicons/ionicons5'
import { contractService } from '../services/contract/contractService.js'

const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  }
})

// 审查选项
const reviewStrategy = ref('segment') // 'segment' | 'full'
const options = ref({
  autoApply: true // 自动应用批注
})

// 审查结果
const reviewResult = ref(null)
const reviewTasks = ref([]) // 审查任务清单

// 执行审查
const executeReview = async () => {
  try {
    reviewResult.value = null
    reviewTasks.value = []

    // 进度回调
    const onProgress = (current, total, segment, result) => {
      if (!segment || !segment.section) return

      // 更新任务清单
      let task = reviewTasks.value.find(t => t.id === segment.section.title)
      if (!task) {
        task = {
          id: segment.section.title,
          name: segment.section.title,
          status: 'processing',
          issues: 0,
          error: null
        }
        reviewTasks.value.push(task)
      } else {
        task.status = 'processing'
      }

      // 如果有结果，更新任务状态
      if (result) {
        task.status = 'completed'
        task.issues = result.issues?.length || 0
      }
    }

    const result = await contractService.reviewContract({
      strategy: reviewStrategy.value,
      autoApply: options.value.autoApply,
      onProgress: onProgress
    })

    reviewResult.value = result

    // 显示成功提示
    setTimeout(() => {
      window.$message?.success(
        `审查完成！共发现问题 ${result.summary?.totalIssues || 0} 个，风险点 ${result.summary?.totalRisks || 0} 个`
      )
    }, 100)
  } catch (error) {
    console.error('审查失败:', error)
    window.$message?.error(error.message || '审查失败，请重试')
  }
}
</script>

<style scoped>
.wps-card {
  max-width: 100%;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-600 {
  color: #4b5563;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-500 {
  color: #ef4444;
}

.text-xs {
  font-size: 0.75rem;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>

