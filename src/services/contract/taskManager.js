/**
 * 任务管理器 - 统一管理合同服务相关的任务执行
 */

// 使用全局消息提示
import TaskScheduler from '../ai/TaskScheduler.js'
import taskPane from '../wps/wpsTestHelper.js'
import { keywordProcessor } from './keywordProcessor.js'
import { reviewProcessor } from './reviewProcessor.js'

export class TaskManager {
  constructor(options = {}) {
    // 初始化TaskScheduler
    this.taskScheduler = new TaskScheduler({
      maxConcurrentTasks: options.maxConcurrentTasks || 2,
      taskTimeout: options.taskTimeout || 30000,
      retryAttempts: options.retryAttempts || 2
    })

    // 需要AI处理的规则类型
    this.AI_RULE_TYPES = ['extractText', 'contractReview', 'analyzeDocStructure']
  }

  /**
   * 等待任务完成（简化版，使用 Promise）
   * @param {string} taskId - 任务ID
   * @param {string} ruleType - 规则类型
   * @param {Object} params - 参数
   * @returns {Promise} 任务结果
   */
  async waitForTaskComplete(taskId, ruleType, params) {
    return new Promise((resolve, reject) => {
      const handleComplete = async (task) => {
        if (task.id === taskId) {
          try {
            let processedResult = task.result
            
            if (ruleType === 'extractText') {
              // 合同信息抽取：简单验证后直接返回
              if (!task.result || Object.keys(task.result).length === 0) {
                throw new Error('抽取数据为空')
              }
              processedResult = task.result
            } else if (ruleType === 'contractReview') {
              // AI合同预审：根据actionType执行批注或修订
              const actionType = params.actionType || 'comment'
              if (actionType === 'comment') {
                processedResult = await reviewProcessor.addReviewComments(task.result)
              } else if (actionType === 'revision') {
                processedResult = await reviewProcessor.addReviewRevisions(task.result)
              }
            }

            this.taskScheduler.off('taskComplete', handleComplete)
            this.taskScheduler.off('taskError', handleError)
            resolve(processedResult)
          } catch (error) {
            this.taskScheduler.off('taskComplete', handleComplete)
            this.taskScheduler.off('taskError', handleError)
            reject(error)
          }
        }
      }

      const handleError = (task, error) => {
        if (task.id === taskId) {
          this.taskScheduler.off('taskComplete', handleComplete)
          this.taskScheduler.off('taskError', handleError)
          reject(error)
        }
      }

      this.taskScheduler.on('taskComplete', handleComplete)
      this.taskScheduler.on('taskError', handleError)
    })
  }

  /**
   * 执行任务（简化版，使用 Promise）
   * @param {string} ruleType - 规则类型
   * @param {Object} params - 参数
   * @param {Function} onComplete - 完成回调（兼容旧接口）
   * @param {Function} onError - 错误回调（兼容旧接口）
   * @returns {Promise} 执行结果
   */
  async executeTask(ruleType, params = {}, onComplete = null, onError = null) {
    console.log('执行任务:', ruleType, params)

    try {
      // 特殊处理：关键词模式下的 contractReview 应该直接执行，不需要 AI
      const isKeywordMode = params.mode === 'keyword'
      const needsAI = this.AI_RULE_TYPES.includes(ruleType) && !isKeywordMode

      // 对于不需要AI处理的规则，直接执行
      if (!needsAI) {
        const result = await this.executeDirectTask(ruleType, params)
        onComplete?.(result)
        return result
      }

      // 获取文档内容
      const documentContent = await this.getDocumentContent()

      // 创建任务配置并添加到调度器
      const taskId = this.taskScheduler.addTask({
        type: ruleType,
        priority: 'high',
        content: documentContent,
        options: params
      })

      // 等待任务完成（不显示"处理中"提示，用户已点击按钮知道在处理）
      const result = await this.waitForTaskComplete(taskId, ruleType, params)
      onComplete?.(result)
      return result
    } catch (error) {
      console.error('任务执行失败:', error)
      onError?.(error)
      throw error
    }
  }

  /**
   * 获取文档内容（提取为独立方法）
   * @returns {Promise<string>} 文档内容
   */
  async getDocumentContent() {
    const documentContent = await taskPane.onbuttonclick('extractText')

    if (!documentContent || typeof documentContent !== 'string' || !documentContent.trim()) {
      throw new Error(
        '无法获取文档内容，请检查以下几点：\n1. 确保已在WPS中打开文档\n2. 确保文档中有内容\n3. 尝试刷新页面重新加载插件'
      )
    }

    return documentContent
  }

  /**
   * 执行直接任务（不需要AI处理）
   * @param {string} ruleType - 规则类型
   * @param {Object} params - 参数
   * @returns {Promise} 执行结果
   */
  async executeDirectTask(ruleType, params) {
    switch (ruleType) {
      case 'keywordComment':
        return await keywordProcessor.processKeywords(params.keywordList)
      case 'addHeader':
        return await taskPane.onbuttonclick('addHeader', {
          headerText: params.headerText,
          fontSize: params.fontSize,
          alignment: params.alignment
        })
      case 'contractReview':
        // 关键词模式：使用关键词处理器
        if (params.mode === 'keyword') {
          return await keywordProcessor.processKeywords(params.keywordList)
        } else {
          // AI 预审模式
          return await taskPane.onbuttonclick('contractReview', {
            reviewRules: params.reviewRules,
            aiResult: params.aiResult
          })
        }
      case 'analyzeDocStructure':
        return await taskPane.onbuttonclick('analyzeDocStructure', {
          aiResult: params.aiResult
        })
      default:
        console.warn('未知的直接任务类型:', ruleType)
        return null
    }
  }

  /**
   * 清理资源（简化版）
   */
  cleanup() {
    // TaskScheduler 会自动清理，这里不需要额外操作
  }
}

// 创建默认实例
export const taskManager = new TaskManager()
