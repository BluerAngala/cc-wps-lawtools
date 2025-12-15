/**
 * 工作流引擎
 * 负责执行工作流，管理步骤间的数据传递和进度追踪
 */

import { actionRegistry } from './actionRegistry.js'
import { createInitialContext, createErrorResult } from './types.js'

class WorkflowEngine {
  constructor(registry = actionRegistry) {
    this.registry = registry
  }

  /**
   * 验证工作流定义
   * @param {Object} workflow - 工作流定义
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(workflow) {
    const errors = []

    if (!workflow) {
      errors.push('工作流定义不能为空')
      return { valid: false, errors }
    }

    if (!workflow.id) errors.push('缺少工作流 ID')
    if (!workflow.name) errors.push('缺少工作流名称')
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      errors.push('steps 必须是数组')
      return { valid: false, errors }
    }

    if (workflow.steps.length === 0) {
      errors.push('工作流至少需要一个步骤')
    }

    workflow.steps.forEach((step, index) => {
      if (!step.actionType) {
        errors.push(`步骤 ${index + 1}: 缺少 actionType`)
      } else if (!this.registry.has(step.actionType)) {
        errors.push(`步骤 ${index + 1}: 未知的操作类型 "${step.actionType}"`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  /**
   * 执行工作流
   * @param {Object} workflow - 工作流定义
   * @param {Object} [options] - 执行选项
   * @param {Function} [options.onProgress] - 进度回调
   * @returns {Promise<Object>} 执行结果
   */
  async execute(workflow, options = {}) {
    const { onProgress } = options
    const validation = this.validate(workflow)

    if (!validation.valid) {
      return {
        success: false,
        message: '工作流验证失败: ' + validation.errors.join('; '),
        steps: [],
        executedCount: 0,
        totalCount: workflow?.steps?.length || 0
      }
    }

    const context = createInitialContext()
    const stepResults = []
    const totalSteps = workflow.steps.length

    for (let i = 0; i < totalSteps; i++) {
      const step = workflow.steps[i]
      const action = this.registry.get(step.actionType)
      const stepName = step.name || action.name || step.actionType

      // 报告步骤开始
      if (onProgress) {
        onProgress({
          current: i,
          total: totalSteps,
          stage: 'start',
          stepName
        })
      }

      let result
      try {
        // 验证参数
        if (action.validate) {
          const paramValidation = action.validate(step.params || {})
          if (!paramValidation.valid) {
            result = createErrorResult('参数验证失败: ' + paramValidation.errors.join('; '))
          }
        }

        // 执行操作
        if (!result) {
          result = await action.execute(step.params || {}, context)
        }
      } catch (error) {
        result = createErrorResult(error.message || '执行出错')
      }

      // 更新上下文
      context.previousResult = result
      if (result.data) {
        Object.assign(context.data, result.data)
      }

      stepResults.push({ step, result })

      // 报告步骤完成
      if (onProgress) {
        onProgress({
          current: i,
          total: totalSteps,
          stage: 'complete',
          stepName,
          result
        })
      }

      // 失败时中断
      if (!result.success) {
        return {
          success: false,
          message: `步骤 "${stepName}" 执行失败: ${result.message}`,
          steps: stepResults,
          executedCount: i + 1,
          totalCount: totalSteps
        }
      }
    }

    return {
      success: true,
      message: `工作流执行完成，共 ${totalSteps} 个步骤`,
      steps: stepResults,
      executedCount: totalSteps,
      totalCount: totalSteps
    }
  }
}

// 创建默认实例
export const workflowEngine = new WorkflowEngine()

export { WorkflowEngine }
