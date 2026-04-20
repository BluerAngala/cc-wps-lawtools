/**
 * 合同服务统一管理器 - 整合所有合同相关功能
 * 合并了原 taskManager.js 的功能，减少包装层级
 */

import TaskScheduler from '../ai/TaskScheduler.js'
import { taskPane } from '../wps'
import { batchKeywordAction } from '../workflow/actions/batchKeyword.js'
import { reviewProcessor } from './reviewProcessor.js'
import { dataSubmitter } from './dataSubmitter.js'
import { contractReviewEngine } from './contractReviewEngine.js'
import { appConfig } from '../../utils/appConfig.js'

export class ContractService {
  constructor() {
    this.taskScheduler = new TaskScheduler({
      maxConcurrentTasks: 2,
      taskTimeout: 30000,
      retryAttempts: 2
    })

    this.processingTasks = new Set()
    this.reviewEngine = contractReviewEngine
    this.AI_RULE_TYPES = ['extractText', 'contractReview', 'analyzeDocStructure']

    this.resultMessages = {
      keywordComment: '关键词批注添加完成！',
      extractText: 'AI合同信息提取完成！',
      contractReview: 'AI合同预审完成！',
      contractReviewNew: '合同审查完成！'
    }
  }

  async waitForTaskComplete(taskId, ruleType, params) {
    return new Promise((resolve, reject) => {
      const handleComplete = async (task) => {
        if (task.id === taskId) {
          try {
            let processedResult = task.result

            if (ruleType === 'extractText') {
              if (!task.result || Object.keys(task.result).length === 0) {
                throw new Error('提取数据为空')
              }
              processedResult = task.result
            } else if (ruleType === 'contractReview') {
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

  async executeTask(ruleType, params = {}, onComplete = null, onError = null) {
    console.log('执行任务:', ruleType, params)

    if (this.processingTasks.has(ruleType)) {
      window.$message?.warning('该任务正在执行中，请稍候...')
      return
    }

    this.processingTasks.add(ruleType)

    try {
      const isKeywordMode = params.mode === 'keyword'
      const needsAI = this.AI_RULE_TYPES.includes(ruleType) && !isKeywordMode

      let result
      if (!needsAI) {
        result = await this.executeDirectTask(ruleType, params)
      } else {
        const documentContent = await this.getDocumentContent()
        const taskId = this.taskScheduler.addTask({
          type: ruleType,
          priority: 'high',
          content: documentContent,
          options: params
        })
        result = await this.waitForTaskComplete(taskId, ruleType, params)
      }

      if (onComplete) {
        onComplete(result)
      }
      window.$message?.success(this.resultMessages[ruleType] || '任务执行完成！')
      return result
    } catch (error) {
      console.error('任务执行失败:', error)
      if (onError) {
        onError(error)
      }
      window.$message?.error(error.message || '任务执行失败')
      throw error
    } finally {
      this.processingTasks.delete(ruleType)
    }
  }

  async getDocumentContent() {
    const documentContent = await taskPane.onbuttonclick('extractText')

    if (!documentContent || typeof documentContent !== 'string' || !documentContent.trim()) {
      throw new Error(
        '无法获取文档内容，请检查以下几点：\n1. 确保已在WPS中打开文档\n2. 确保文档中有内容\n3. 尝试刷新页面重新加载插件'
      )
    }

    return documentContent
  }

  async executeDirectTask(ruleType, params) {
    switch (ruleType) {
      case 'keywordComment':
        return await batchKeywordAction.execute({ keywordList: params.keywordList })
      case 'addHeader':
        return await taskPane.onbuttonclick('addHeader', {
          headerText: params.headerText,
          fontSize: params.fontSize,
          alignment: params.alignment
        })
      case 'contractReview':
        if (params.mode === 'keyword') {
          return await batchKeywordAction.execute({ keywordList: params.keywordList })
        } else {
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

  async processExtractedData(result) {
    return await dataSubmitter.processExtractedData(result)
  }

  async submitExtractedData(extractedData) {
    return await dataSubmitter.submitExtractedData(extractedData)
  }

  saveConfig(configs) {
    return appConfig.saveConfig(configs)
  }

  resetConfig() {
    return appConfig.reset()
  }

  loadConfig() {
    const allConfig = appConfig.getConfig()
    return {
      extractor: allConfig.extractor || {},
      keyword: allConfig.keyword || {},
      review: allConfig.review || {}
    }
  }

  isTaskProcessing(taskType) {
    return this.processingTasks.has(taskType)
  }

  async reviewContract(options = {}) {
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

  cleanup() {
    this.processingTasks.clear()
  }
}

export const contractService = new ContractService()
