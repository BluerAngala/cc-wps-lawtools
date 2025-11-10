<template>
  <n-card title="智能文档处理" size="small" class="wps-card">
    <template #header-extra>
      <n-space>
        <n-button
          type="primary"
          :loading="processing"
          @click="executeCommenting"
          size="small"
        >
          <template #icon>
            <DocumentSearchIcon />
          </template>
          {{ processing ? '处理中...' : '开始处理' }}
        </n-button>
      </n-space>
    </template>

    <n-space vertical :size="16">
      <!-- 模式切换 -->
      <n-alert 
        :title="getModeDescription()" 
        type="info" 
        :closable="false" 
        show-icon 
      />

      <div class="text-center mode-buttons">
        <n-space justify="center" :size="6" :wrap="false">
          <n-button
            :type="currentMode === 'keyword' ? 'primary' : 'default'"
            @click="switchMode('keyword')"
            size="small"
            round
          >
            🔍 关键词
          </n-button>
          <n-button
            :type="currentMode === 'aiReview' ? 'primary' : 'default'"
            @click="switchMode('aiReview')"
            size="small"
            round
          >
            ⚖️ AI预审
          </n-button>
          <n-button
            :type="currentMode === 'aiLawyer' ? 'primary' : 'default'"
            @click="switchMode('aiLawyer')"
            size="small"
            round
          >
            👨‍⚖️ AI+律师
          </n-button>
        </n-space>
      </div>

      <!-- 审查选项（仅AI模式显示） -->
      <n-collapse v-if="isAIMode()">
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

      <!-- 配置表单 -->
      <div v-if="currentMode === 'keyword' || currentMode === 'aiLawyer'">
        <ConfigForm 
          :config="getConfigForm()" 
          :mode="currentMode === 'keyword' ? 'keyword' : 'review'" 
          @update-config="updateConfig" 
        />
      </div>
      <div v-else class="text-center text-gray-500 py-4">
        AI预审模式将根据合同类型自动生成审查清单，无需配置
      </div>

      <!-- 审查任务清单（仅AI模式显示） -->
      <n-card v-if="isAIMode() && reviewTasks && reviewTasks.length > 0" size="small" title="审查任务清单">
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

      <!-- 审查结果（仅AI模式显示） -->
      <div v-if="isAIMode() && reviewResult" class="space-y-4">
        <!-- 审查总结 -->
        <n-alert type="info" :title="`合同类型: ${reviewResult.contractType?.type || '未知'}`">
          <div class="text-sm space-y-1">
            <div v-if="reviewResult.summary?.segmentCount">审查段数: {{ reviewResult.summary.segmentCount }} 段</div>
            <div>发现问题: {{ reviewResult.summary?.totalIssues || 0 }} 个</div>
            <div>风险点: {{ reviewResult.summary?.totalRisks || 0 }} 个</div>
          </div>
        </n-alert>

        <!-- 审查统计 -->
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
      <n-empty v-if="isAIMode() && !reviewResult" description="点击「开始处理」按钮开始审查合同" />
    </n-space>
  </n-card>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import {
  NCard,
  NButton,
  NTag,
  NAlert,
  NSpace,
  NCollapse,
  NCollapseItem,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NList,
  NListItem,
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
import ConfigForm from './ConfigForm.vue'
import { contractService } from '../services/contract/contractService.js'
import { reviewAIService } from '../services/contract/reviewAIService.js'
import { reviewChecklistGenerator } from '../services/contract/reviewChecklistGenerator.js'
import { wpsDocumentService } from '../services/wps/wpsDocumentService.js'

// Props
const props = defineProps({
  processing: {
    type: Boolean,
    default: false
  },
  keywordConfig: {
    type: Object,
    default: () => ({})
  },
  reviewConfig: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['execute', 'update-config'])

// 当前模式
const currentMode = ref('keyword')

// 审查选项（仅AI模式）
const reviewStrategy = ref('segment') // 'segment' | 'full'
const options = ref({
  autoApply: true // 自动应用批注
})

// 配置表单（从 props 初始化，不使用硬编码的默认值）
const configForm = reactive({
  keywordList: [],
  reviewKeywordList: []
})

// 审查结果（仅AI模式）
const reviewResult = ref(null)
const reviewTasks = ref([]) // 审查任务清单

// 方法
const isAIMode = () => {
  return currentMode.value === 'aiReview' || currentMode.value === 'aiLawyer'
}

const getModeDescription = () => {
  if (currentMode.value === 'keyword') {
    return '匹配关键词并添加固定的批注或修订内容'
  } else if (currentMode.value === 'aiReview') {
    return 'AI根据合同类型的通用审查清单自动完成审查，添加批注'
  } else if (currentMode.value === 'aiLawyer') {
    return '在AI预审模式基础上，加上自定义的审查规则，完成审查并且添加批注'
  }
  return ''
}

const getConfigForm = () => {
  if (currentMode.value === 'keyword') {
    return { keywordList: { type: 'keywordList', value: configForm.keywordList } }
  } else if (currentMode.value === 'aiLawyer') {
    return { keywordList: { type: 'keywordList', value: configForm.reviewKeywordList } }
  }
  return {}
}

const executeCommenting = async () => {
  if (currentMode.value === 'keyword') {
    // 关键词批注模式
    const config = {
      mode: 'keyword',
      keywordList: configForm.keywordList
    }
    emit('execute', config)
  } else if (currentMode.value === 'aiReview' || currentMode.value === 'aiLawyer') {
    // AI审查模式
    try {
      reviewResult.value = null
      reviewTasks.value = []

      // 1. 先识别合同类型并生成审查清单
      const fullText = wpsDocumentService.getFullText()
      if (!fullText) {
        throw new Error('无法获取文档内容')
      }

      window.$message?.info('正在识别合同类型...')
      const contractType = await reviewAIService.identifyContractType(fullText)
      
      // 2. 生成审查清单
      const baseChecklist = reviewChecklistGenerator.generateChecklist(contractType)
      let checklist = baseChecklist
      
      // 3. 如果是AI+律师模式，合并用户自定义规则
      if (currentMode.value === 'aiLawyer') {
        const userRules = configForm.reviewKeywordList.map(item => ({
          reviewRules: item.keyword,
          reviewRequirements: item.comment,
          actionType: item.actionType
        }))
        checklist = reviewChecklistGenerator.mergeUserRules(baseChecklist, userRules)
      }

      // 4. 根据审查清单初始化任务列表
      reviewTasks.value = checklist.map((item, index) => ({
        id: `checklist_${item.id || index}`,
        name: item.name,
        status: 'pending',
        issues: 0,
        error: null
      }))

      // 5. 进度回调 - 更新审查清单任务状态
      const onProgress = (current, total, segment, result) => {
        if (!segment || !segment.section) return

        // 审查开始时，将所有pending任务标记为processing
        if (current === 1) {
          reviewTasks.value.forEach(task => {
            if (task.status === 'pending') {
              task.status = 'processing'
            }
          })
        }

        // 当段审查完成时，如果有结果，更新任务状态
        if (result) {
          // 根据审查结果中的问题，可以更精确地更新相关任务
          // 这里简化处理：当所有段审查完成时，标记所有任务为完成
          if (current === total) {
            reviewTasks.value.forEach(task => {
              if (task.status !== 'error') {
                task.status = 'completed'
              }
            })
          }
        }
      }

      // 6. 执行审查
      const result = await contractService.reviewContract({
        strategy: reviewStrategy.value,
        autoApply: options.value.autoApply,
        useCustomRules: currentMode.value === 'aiLawyer', // AI+律师模式使用自定义规则
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
}

const switchMode = (mode) => {
  currentMode.value = mode
  // 切换模式时清空结果
  reviewResult.value = null
  reviewTasks.value = []
}

const updateConfig = (configData) => {
  // 更新对应模式的数组
  if (currentMode.value === 'keyword') {
    configForm.keywordList = configData.keywordList.value
  } else if (currentMode.value === 'aiLawyer') {
    configForm.reviewKeywordList = configData.keywordList.value
  }
  emit('update-config', configForm)
}

// 监听 props 变化，同步配置
watch(
  () => props.keywordConfig,
  (newConfig) => {
    if (newConfig && newConfig.keywordList) {
      configForm.keywordList = newConfig.keywordList
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.reviewConfig,
  (newConfig) => {
    if (newConfig && newConfig.contractReviewRules) {
      // review 配置使用 contractReviewRules 字段，转换为组件内部格式
      configForm.reviewKeywordList = newConfig.contractReviewRules.map(rule => ({
        keyword: rule.reviewRules,
        comment: rule.reviewRequirements,
        actionType: rule.actionType
      }))
    }
  },
  { immediate: true, deep: true }
)
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

.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.mode-buttons {
  white-space: nowrap;
}

.mode-buttons :deep(.n-space) {
  flex-wrap: nowrap !important;
}
</style>
