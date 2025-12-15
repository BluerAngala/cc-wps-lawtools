/**
 * 合同服务统一管理器 - 整合所有合同相关功能（简化版）
 */

import { appConfig } from '../../utils/appConfig.js'
import { TaskManager } from './taskManager.js'
import { dataSubmitter } from './dataSubmitter.js'
import { contractReviewEngine } from './contractReviewEngine.js'

export class ContractService {
  constructor() {
    this.taskManager = new TaskManager({
      maxConcurrentTasks: 2,
      taskTimeout: 30000,
      retryAttempts: 2
    })

    this.processingTasks = new Set()
    this.reviewEngine = contractReviewEngine
    
    // 结果消息映射
    this.resultMessages = {
      keywordComment: '关键词批注添加完成！',
      extractText: 'AI合同信息提取完成！',
      contractReview: 'AI合同预审完成！',
      contractReviewNew: '合同审查完成！'
    }
  }

  /**
   * 执行任务（统一入口）
   * @param {string} taskType - 任务类型
   * @param {Object} params - 参数
   * @param {Function} onComplete - 完成回调
   * @returns {Promise}
   */
  async executeTask(taskType, params, onComplete) {
    // 防重复执行
    if (this.processingTasks.has(taskType)) {
      window.$message?.warning('该任务正在执行中，请稍候...')
      return
    }

    this.processingTasks.add(taskType)

    try {
      await this.taskManager.executeTask(
        taskType,
        params,
        (result) => {
          if (onComplete) {
            onComplete(result)
          }
          window.$message?.success(this.resultMessages[taskType] || '任务执行完成！')
        },
        (error) => window.$message?.error(error.message || '任务执行失败')
      )
    } catch (error) {
      window.$message?.error(error.message || '任务执行失败')
    } finally {
      this.processingTasks.delete(taskType)
    }
  }

  /**
   * 处理数据提取结果（直接调用，无需包装）
   * @param {Object} result - 提取结果
   * @returns {Promise<Object>} 处理后的数据
   */
  async processExtractedData(result) {
    return await dataSubmitter.processExtractedData(result)
  }

  /**
   * 提交提取的数据（直接调用，消息提示已在 dataSubmitter 中处理）
   * @param {Object} extractedData - 提取的数据
   * @returns {Promise}
   */
  async submitExtractedData(extractedData) {
    return await dataSubmitter.submitExtractedData(extractedData)
  }

  /**
   * 保存配置（直接调用 appConfig，无需包装）
   */
  saveConfig(configs) {
    return appConfig.saveConfig(configs)
  }

  /**
   * 重置配置（直接调用 appConfig）
   */
  resetConfig() {
    return appConfig.reset()
  }

  /**
   * 加载配置（简化，直接返回配置对象）
   */
  loadConfig() {
    const allConfig = appConfig.getConfig()
    return {
      extractor: allConfig.extractor || {},
      keyword: allConfig.keyword || {},
      review: allConfig.review || {}
    }
  }

  /**
   * 检查任务是否正在处理
   * @param {string} taskType - 任务类型
   * @returns {boolean}
   */
  isTaskProcessing(taskType) {
    return this.processingTasks.has(taskType)
  }

  /**
   * 合同审查（新版本）
   * @param {Object} options - 审查选项
   * @returns {Promise<Object>} 审查结果
   */
  async reviewContract(options = {}) {
    // 防重复执行
    if (this.processingTasks.has('contractReviewNew')) {
      window.$message?.warning('合同审查正在执行中，请稍候...')
      return
    }

    this.processingTasks.add('contractReviewNew')

    try {
      const result = await this.reviewEngine.review(options)
      return result
    } catch (error) {
      console.error('合同审查失败:', error)
      window.$message?.error(error.message || '合同审查失败')
      throw error
    } finally {
      this.processingTasks.delete('contractReviewNew')
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.taskManager.cleanup()
    this.processingTasks.clear()
  }
}

// 创建默认实例
export const contractService = new ContractService()
