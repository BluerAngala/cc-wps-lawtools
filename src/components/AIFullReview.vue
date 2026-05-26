<template>
  <div class="relative">
    <div
      v-if="isProcessing"
      class="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded"
    >
      <n-spin size="large" />
      <div class="mt-3 text-sm font-medium text-gray-600">{{ progressText }}</div>
      <n-progress
        class="w-48 mt-2"
        type="line"
        status="info"
        :percentage="100"
        :show-indicator="false"
        :processing="true"
      />
    </div>

    <n-space vertical :size="8">
      <div class="text-xs text-blue-500">
        AI 根据合同类型自动生成审查清单，执行审查后生成修改建议
      </div>

      <div v-if="pageState === 'idle'">
        <div class="text-sm font-semibold mb-2">审查视角</div>
        <n-radio-group v-model:value="perspective">
          <n-space wrap>
            <n-radio value="partyA">甲方视角</n-radio>
            <n-radio value="partyB">乙方视角</n-radio>
            <n-radio value="neutral">
              <n-space align="center">
                <span>中立视角</span>
                <n-tag size="tiny" type="info">推荐</n-tag>
              </n-space>
            </n-radio>
            <n-radio value="custom">自定义视角</n-radio>
          </n-space>
        </n-radio-group>
        <div v-if="perspective !== 'custom'" class="text-xs text-gray-500 mt-1">
          {{ perspectiveDescription }}
        </div>
        <n-input
          v-if="perspective === 'custom'"
          v-model:value="customPerspective"
          type="textarea"
          placeholder="请输入自定义审查视角"
          :autosize="{ minRows: 2, maxRows: 4 }"
          class="mt-2"
        />
      </div>

      <div v-if="documentType && pageState !== 'idle'" class="flex items-center gap-2">
        <span class="text-sm font-semibold">识别的文档类型:</span>
        <n-tag type="primary">{{ documentType.subtype || documentType.type || '未知' }}</n-tag>
        <n-tag size="small">{{ perspectiveLabel }}</n-tag>
      </div>

      <div v-if="checklist.length > 0 && (pageState === 'ready' || pageState === 'reviewing')">
        <div class="flex items-center justify-between mb-2">
          <n-space align="center" :size="8">
            <span class="text-sm font-semibold">📋 审查清单</span>
            <n-tag size="small" type="info"
              >{{ selectedChecklistCount }}/{{ checklist.length }} 项已选</n-tag
            >
          </n-space>
          <n-space v-if="pageState === 'ready'" :size="4">
            <n-button size="tiny" @click="selectAllChecklist">全选</n-button>
            <n-button size="tiny" @click="selectRequiredChecklist">仅必需项</n-button>
          </n-space>
        </div>

        <div class="space-y-1">
          <div
            v-for="item in checklist"
            :key="item.id"
            class="border border-gray-200 rounded px-2 py-1"
          >
            <div class="flex items-center gap-2 cursor-pointer" @click="toggleExpand(item.id)">
              <span class="text-gray-400 text-xs">{{ expandedId === item.id ? '▼' : '▶' }}</span>
              <n-checkbox
                v-if="pageState === 'ready'"
                :checked="item.selected"
                @update:checked="toggleChecklistItem(item.id, $event)"
                @click.stop
              />
              <span
                class="text-sm"
                :class="{ 'text-gray-400': !item.selected && pageState === 'ready' }"
                >{{ item.name }}</span
              >
              <n-tag v-if="item.required" type="error" size="tiny">必需</n-tag>
            </div>
            <div v-if="expandedId === item.id" class="mt-2 pl-5 pb-2">
              <n-input
                v-if="pageState === 'ready'"
                v-model:value="item.reviewRequirements"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 6 }"
                placeholder="请输入该项的审查要点..."
                size="small"
              />
              <div v-else class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {{ item.reviewRequirements || '暂无审查要点' }}
              </div>
              <div v-if="item.reviewBasis" class="text-xs text-gray-500 mt-1">
                <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="pageState === 'complete' && reviewResult">
        <div class="grid grid-cols-3 gap-2 mb-3 text-center">
          <div class="bg-green-50 rounded p-2">
            <div class="text-base font-bold text-green-600">{{ passedCount }}</div>
            <div class="text-xs text-gray-500">通过</div>
          </div>
          <div class="bg-orange-50 rounded p-2">
            <div class="text-base font-bold text-orange-600">{{ failedCount }}</div>
            <div class="text-xs text-gray-500">待处理</div>
          </div>
          <div class="bg-red-50 rounded p-2">
            <div class="text-base font-bold text-red-600">
              {{ reviewResult.summary?.totalIssues || 0 }}
            </div>
            <div class="text-xs text-gray-500">问题总数</div>
          </div>
        </div>

        <div class="space-y-1">
          <div
            v-for="item in checklist.filter((i) => i.selected)"
            :key="item.id"
            class="border border-gray-200 rounded px-2 py-1"
          >
            <div class="flex items-center gap-2 cursor-pointer" @click="toggleExpand(item.id)">
              <span class="text-gray-400 text-xs">{{ expandedId === item.id ? '▼' : '▶' }}</span>
              <n-tag :type="getItemIssues(item.id).length > 0 ? 'warning' : 'success'" size="tiny">
                {{ getItemIssues(item.id).length > 0 ? '待处理' : '通过' }}
              </n-tag>
              <span class="text-sm flex-1">{{ item.name }}</span>
              <n-tag v-if="getItemIssues(item.id).length > 0" size="tiny">
                {{ getItemIssues(item.id).length }} 个问题
              </n-tag>
            </div>
            <div v-if="expandedId === item.id" class="mt-2 pl-5 pb-2 space-y-2">
              <div
                v-if="item.reviewRequirements"
                class="text-xs text-gray-500 bg-blue-50 p-2 rounded"
              >
                <span class="font-medium text-blue-600">审查要点：</span
                >{{ item.reviewRequirements }}
              </div>
              <div v-if="item.reviewBasis" class="text-xs text-gray-500">
                <span class="font-medium">法律依据：</span>{{ item.reviewBasis }}
              </div>
              <div v-if="getItemIssues(item.id).length > 0" class="space-y-2">
                <div
                  v-for="(issue, idx) in getItemIssues(item.id)"
                  :key="idx"
                  class="bg-gray-50 p-2 rounded"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <n-checkbox
                      :checked="getSuggestionByIssue(issue)?.selected"
                      @update:checked="toggleSuggestionByIssue(issue, $event)"
                    />
                    <n-tag :type="getSeverityColor(issue.severity)" size="tiny">
                      {{ getSeverityText(issue.severity) }}
                    </n-tag>
                    <span class="text-xs text-gray-400">{{ issue.position || '' }}</span>
                  </div>
                  <div class="text-sm text-gray-700 pl-6">{{ issue.comment }}</div>
                </div>
              </div>
              <div v-else class="text-sm text-green-600">✓ 该项审查未发现问题</div>
            </div>
          </div>
        </div>
      </div>

      <n-empty v-if="pageState === 'idle'" description="点击「开始任务」按钮开始审查" />
    </n-space>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  NSpace,
  NRadioGroup,
  NRadio,
  NTag,
  NInput,
  NButton,
  NCheckbox,
  NSpin,
  NProgress,
  NEmpty
} from 'naive-ui'
import { useContractReview } from '../composables/useContractReview.js'

defineProps({
  processing: { type: Boolean, default: false }
})

const emit = defineEmits(['stateChange'])

const {
  pageState,
  progressText,
  perspective,
  customPerspective,
  documentType,
  checklist,
  reviewResult,
  expandedId,
  perspectiveDescription,
  perspectiveLabel,
  selectedChecklistCount,
  passedCount,
  failedCount,
  selectedSuggestionCount,
  isProcessing,
  toggleExpand,
  getItemIssues,
  getSuggestionByIssue,
  toggleSuggestionByIssue,
  getSeverityColor,
  getSeverityText,
  toggleChecklistItem,
  selectAllChecklist,
  selectRequiredChecklist,
  handleApplyModifications,
  handleGenerateChecklist,
  handleStartReview,
  handleReset
} = useContractReview()

const triggerExecute = () => {
  if (pageState.value === 'idle') {
    handleGenerateChecklist(emit)
  } else if (pageState.value === 'ready') {
    handleStartReview(emit)
  } else if (pageState.value === 'complete') {
    handleReset(emit)
  }
}

const buttonText = computed(() => {
  const state = pageState.value
  if (state === 'generating') return '生成中...'
  if (state === 'reviewing') return '审查中...'
  if (state === 'ready') return '开始审查'
  if (state === 'complete') return '重新审查'
  return '开始任务'
})

const applyingModifications = computed(() => false)

defineExpose({
  triggerExecute,
  isProcessing,
  buttonText,
  pageState,
  selectedSuggestionCount,
  applyingModifications,
  handleApplyModifications
})
</script>
