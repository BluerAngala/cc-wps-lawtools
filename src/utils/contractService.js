/**
 * 合同服务统一管理器 - 整合所有合同相关功能
 */

// 使用全局消息提示
import { configManager } from './configManager.js'
import { TaskManager } from './taskManager.js'
import { dataSubmitter } from './dataSubmitter.js'

export class ContractService {
  constructor() {
    this.taskManager = new TaskManager({
      maxConcurrentTasks: 2,
      taskTimeout: 30000,
      retryAttempts: 2
    })

    this.processingTasks = new Set()
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
          window.$message?.success(this.taskManager.getResultMessage(taskType))
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
   * 处理数据抽取结果
   * @param {Object} result - 抽取结果
   * @returns {Object} 处理后的数据
   */
  processExtractedData(result) {
    return dataSubmitter.processExtractedData(result)
  }

  /**
   * 提交抽取的数据
   * @param {Object} extractedData - 抽取的数据
   * @returns {Promise}
   */
  async submitExtractedData(extractedData) {
    try {
      const result = await dataSubmitter.submitExtractedData(extractedData)
      window.$message?.success(result.message)
      return result
    } catch (error) {
      window.$message?.error(error.message)
      throw error
    }
  }

  /**
   * 保存配置
   * @param {Object} configs - 配置对象
   */
  saveConfig(configs) {
    const result = configManager.saveConfig(configs, true)
    if (result.success) {
      window.$message?.success(result.message)
    } else {
      window.$message?.error(result.message)
    }
  }

  /**
   * 重置配置
   * @returns {Object} 默认配置
   */
  resetConfig() {
    const defaultConfigs = configManager.resetConfig()
    window.$message?.success('配置已重置为默认值')
    return defaultConfigs
  }

  /**
   * 加载配置
   * @returns {Object} 配置对象
   */
  loadConfig() {
    const savedConfig = configManager.loadConfig()
    if (savedConfig) {
      const configs = {
        extractor: savedConfig.extractor || {},
        keyword: savedConfig.keyword || {},
        review: savedConfig.review || {}
      }
      window.$message?.success('已加载上次保存的配置')
      return configs
    } else {
      return configManager.getDefaultConfig()
    }
  }

  /**
   * 清除缓存
   */
  async clearCache() {
    try {
      const cacheManager =
        window.cacheManager ||
        (this.taskManager.taskScheduler && this.taskManager.taskScheduler.cacheManager)

      if (!cacheManager) {
        window.$message?.warning('缓存管理器不可用')
        return
      }

      await window.$messageBox.confirm(
        '确定要清除所有AI分析缓存吗？此操作不可恢复。\n\n注意：现在每次打开新文档时会自动清除缓存，缓存时长已调整为30分钟。',
        '清除缓存确认',
        {
          confirmButtonText: '确定清除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      cacheManager.clear()
      window.$message?.success('缓存已清除')
    } catch {
      // 用户取消操作
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
   * 清理资源
   */
  cleanup() {
    this.taskManager.cleanup()
    this.processingTasks.clear()
  }
}

// 创建默认实例
export const contractService = new ContractService()
