/**
 * 任务管理器 - 统一管理合同服务相关的任务执行
 */

// 使用全局消息提示
import TaskScheduler from '../ai/TaskScheduler.js'
import taskPane from '../wps/wpsTestHelper.js'

export class TaskManager {
  constructor(options = {}) {
    // 初始化TaskScheduler
    this.taskScheduler = new TaskScheduler({
      maxConcurrentTasks: options.maxConcurrentTasks || 2,
      taskTimeout: options.taskTimeout || 30000,
      retryAttempts: options.retryAttempts || 2
    })

    // 任务监听器管理
    this.taskListeners = new Map()

    // 需要AI处理的规则类型
    this.AI_RULE_TYPES = ['extractText', 'contractReview', 'analyzeDocStructure']

    // 执行结果映射
    this.resultMessages = {
      addHeader: '页眉添加成功！',
      keywordComment: '关键词批注添加完成！',
      extractText: 'AI合同信息抽取完成！',
      contractReview: 'AI合同预审完成！',
      analyzeDocStructure: '文档内容结构分析完成！'
    }
  }

  /**
   * 清理任务监听器
   * @param {string} taskId - 任务ID
   */
  cleanupTaskListeners(taskId) {
    const listeners = this.taskListeners.get(taskId)
    if (listeners) {
      this.taskScheduler.off('taskComplete', listeners.onComplete)
      this.taskScheduler.off('taskError', listeners.onError)
      this.taskListeners.delete(taskId)
    }
  }

  /**
   * 创建任务事件监听器
   * @param {string} taskId - 任务ID
   * @param {string} ruleType - 规则类型
   * @param {Object} params - 参数
   * @param {Function} onComplete - 完成回调
   * @param {Function} onError - 错误回调
   */
  createTaskListeners(taskId, ruleType, params, onComplete, onError) {
    // 清理可能存在的旧监听器
    this.cleanupTaskListeners(taskId)

    const handleTaskComplete = (task) => {
      if (task.id === taskId) {
        if (onComplete) {
          onComplete(task.result, params)
        }
        this.cleanupTaskListeners(taskId)
      }
    }

    const handleTaskError = (task, error) => {
      if (task.id === taskId) {
        console.error('任务执行失败:', error)
        if (onError) {
          onError(error)
        } else {
          window.$message?.error(`任务执行失败: ${error.message}`)
        }
        this.cleanupTaskListeners(taskId)
      }
    }

    // 存储监听器引用
    this.taskListeners.set(taskId, {
      onComplete: handleTaskComplete,
      onError: handleTaskError
    })

    this.taskScheduler.on('taskComplete', handleTaskComplete)
    this.taskScheduler.on('taskError', handleTaskError)
  }

  /**
   * 执行任务
   * @param {string} ruleType - 规则类型
   * @param {Object} params - 参数
   * @param {Function} onComplete - 完成回调
   * @param {Function} onError - 错误回调
   * @returns {Promise} 执行结果
   */
  async executeTask(ruleType, params = {}, onComplete = null, onError = null) {
    console.log('执行任务:', ruleType, params)

    try {
      // 对于不需要AI处理的规则，直接执行
      if (!this.AI_RULE_TYPES.includes(ruleType)) {
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

      // 创建事件监听器
      this.createTaskListeners(taskId, ruleType, params, onComplete, onError)

      window.$message?.info('任务正在处理中...')
      return taskId
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
        return await taskPane.onbuttonclick('addComment', {
          keywordList: params.keywordList
        })
      case 'addHeader':
        return await taskPane.onbuttonclick('addHeader', {
          headerText: params.headerText,
          fontSize: params.fontSize,
          alignment: params.alignment
        })
      case 'contractReview':
        return await taskPane.onbuttonclick('contractReview', {
          reviewRules: params.reviewRules,
          aiResult: params.aiResult
        })
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
   * 清理所有任务监听器
   */
  cleanup() {
    this.taskListeners.forEach((_, taskId) => {
      this.cleanupTaskListeners(taskId)
    })
    this.taskListeners.clear()
  }

  /**
   * 获取任务结果消息
   * @param {string} ruleType - 规则类型
   * @returns {string} 消息文本
   */
  getResultMessage(ruleType) {
    return this.resultMessages[ruleType] || '任务执行完成！'
  }
}

// 创建默认实例
export const taskManager = new TaskManager()
