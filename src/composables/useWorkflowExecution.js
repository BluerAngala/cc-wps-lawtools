/**
 * 工作流执行 composable
 * 封装工作流执行的状态管理和通用逻辑
 */

import { ref, computed } from 'vue'
import {
  workflowEngine,
  createWorkflowFromPreset,
  registerAllActions,
  actionRegistry
} from '../services/workflow'

// 确保 Action 已注册（只注册一次）
let actionsRegistered = false
function ensureActionsRegistered() {
  if (!actionsRegistered && actionRegistry.size === 0) {
    registerAllActions()
    actionsRegistered = true
  }
}

/**
 * 工作流执行 composable
 * @returns {Object} 工作流执行相关的状态和方法
 */
export function useWorkflowExecution() {
  // 确保 Action 已注册
  ensureActionsRegistered()
  // 执行状态
  const isExecuting = ref(false)
  const progress = ref({
    current: 0,
    total: 0,
    stage: '',
    stepName: ''
  })
  const result = ref(null)
  const error = ref(null)

  // 计算属性
  const hasResult = computed(() => result.value !== null)
  const hasError = computed(() => error.value !== null)
  const isSuccess = computed(() => result.value?.success === true)

  /**
   * 执行预设工作流
   * @param {string} presetId - 预设工作流 ID
   * @param {Object} [options] - 执行选项
   * @param {Object} [options.stepParams] - 步骤参数覆盖
   * @param {Function} [options.onProgress] - 额外的进度回调
   * @returns {Promise<Object>} 执行结果
   */
  async function executePreset(presetId, options = {}) {
    const { stepParams = {}, onProgress: customOnProgress } = options

    // 创建工作流实例
    const workflow = createWorkflowFromPreset(presetId, { stepParams })

    return execute(workflow, { onProgress: customOnProgress })
  }

  /**
   * 执行工作流
   * @param {Object} workflow - 工作流定义
   * @param {Object} [options] - 执行选项
   * @param {Function} [options.onProgress] - 额外的进度回调
   * @returns {Promise<Object>} 执行结果
   */
  async function execute(workflow, options = {}) {
    const { onProgress: customOnProgress } = options

    // 重置状态
    isExecuting.value = true
    error.value = null
    result.value = null
    progress.value = {
      current: 0,
      total: workflow.steps?.length || 0,
      stage: '准备执行...',
      stepName: ''
    }

    // 用于存储执行过程中的步骤结果
    const stepResults = []

    try {
      // 执行工作流
      const execResult = await workflowEngine.execute(workflow, {
        onProgress: (progressInfo) => {
          // 更新进度状态
          progress.value = {
            current: progressInfo.current + 1,
            total: progressInfo.total,
            stage: progressInfo.stage === 'start' ? '正在执行' : '已完成',
            stepName: progressInfo.stepName || ''
          }

          // 步骤完成时，保存结果数据以便回调中使用
          if (progressInfo.stage === 'complete' && progressInfo.result?.data) {
            stepResults.push({ result: progressInfo.result })
          }

          // 调用自定义进度回调，传递步骤结果数据
          if (customOnProgress) {
            customOnProgress({
              ...progressInfo,
              // 提供一个方法让回调可以获取当前已完成步骤的数据
              getStepData: (key) => {
                for (const step of stepResults) {
                  if (step.result?.data?.[key] !== undefined) {
                    return step.result.data[key]
                  }
                }
                return null
              }
            })
          }
        }
      })

      result.value = execResult

      if (!execResult.success) {
        error.value = execResult.message
        window.$message?.error(execResult.message)
      }

      return execResult
    } catch (e) {
      error.value = e.message || '工作流执行失败'
      window.$message?.error(error.value)
      return { success: false, message: error.value }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * 获取工作流执行结果中的数据
   * @param {string} key - 数据键名
   * @returns {*} 数据值
   */
  function getResultData(key) {
    if (!result.value?.steps) return null

    // 遍历所有步骤结果，查找数据
    for (const stepResult of result.value.steps) {
      if (stepResult.result?.data?.[key] !== undefined) {
        return stepResult.result.data[key]
      }
    }
    return null
  }

  /**
   * 获取最后一个步骤的结果数据
   * @returns {Object|null} 最后一个步骤的数据
   */
  function getLastStepData() {
    if (!result.value?.steps?.length) return null
    const lastStep = result.value.steps[result.value.steps.length - 1]
    return lastStep?.result?.data || null
  }

  /**
   * 重置所有状态
   */
  function reset() {
    isExecuting.value = false
    progress.value = { current: 0, total: 0, stage: '', stepName: '' }
    result.value = null
    error.value = null
  }

  return {
    // 状态
    isExecuting,
    progress,
    result,
    error,
    // 计算属性
    hasResult,
    hasError,
    isSuccess,
    // 方法
    execute,
    executePreset,
    getResultData,
    getLastStepData,
    reset
  }
}
