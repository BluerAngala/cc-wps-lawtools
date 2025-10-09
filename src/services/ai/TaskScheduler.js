/**
 * 任务调度器 - 简化的AI服务统一入口
 * 集成文档解析、缓存管理和AI调用功能
 */

import { DocumentParser } from '../document/DocumentParser.js'
import { CacheManager } from './CacheManager.js'
import { apiClient } from './siliconflow.js'
import {
  generateContractExtractionPrompt,
  generateContractReviewPrompt
} from './promptGenerator.js'

export class TaskScheduler {
  constructor(options = {}) {
    this.documentParser = new DocumentParser()
    // 优先使用传入的缓存管理器实例，否则使用全局实例，最后才创建新实例
    this.cacheManager =
      options.cacheManager || window.cacheManager || new CacheManager(options.cache)

    // AI服务配置
    this.aiConfig = {
      maxTokensPerChunk: options.maxTokensPerChunk || 3000,
      defaultModel: options.defaultModel || 'deepseek-ai/DeepSeek-V3',
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options.ai
    }

    // 调度器配置
    this.config = {
      maxConcurrentTasks: options.maxConcurrentTasks || 3,
      taskTimeout: options.taskTimeout || 30000, // 30秒超时
      retryAttempts: options.retryAttempts || 2,
      priorityLevels: ['high', 'medium', 'low'],
      ...options
    }

    // 任务队列和状态管理
    this.taskQueue = []
    this.runningTasks = new Map()
    this.completedTasks = new Map()
    this.failedTasks = new Map()
    this.taskCounter = 0

    // 事件监听器
    this.listeners = {
      taskStart: [],
      taskComplete: [],
      taskError: [],
      queueEmpty: []
    }

    // 简化统计
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    }
  }

  /**
   * 添加任务到队列
   * @param {Object} taskConfig - 任务配置
   * @returns {string} 任务ID
   */
  addTask(taskConfig) {
    const taskId = `task_${++this.taskCounter}_${Date.now()}`

    const task = {
      id: taskId,
      type: taskConfig.type,
      priority: taskConfig.priority || 'medium',
      content: taskConfig.content,
      options: taskConfig.options || {},
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      ...taskConfig
    }

    // 按优先级插入队列
    this.insertTaskByPriority(task)
    this.stats.totalTasks++

    console.log(`任务已添加: ${taskId} (${task.type}, 优先级: ${task.priority})`)

    // 尝试立即处理任务
    this.processQueue()

    return taskId
  }

  /**
   * 按优先级插入任务
   * @param {Object} task - 任务对象
   */
  insertTaskByPriority(task) {
    const priorityIndex = this.config.priorityLevels.indexOf(task.priority)

    let insertIndex = this.taskQueue.length
    for (let i = 0; i < this.taskQueue.length; i++) {
      const queueTaskPriority = this.config.priorityLevels.indexOf(this.taskQueue[i].priority)
      if (priorityIndex < queueTaskPriority) {
        insertIndex = i
        break
      }
    }

    this.taskQueue.splice(insertIndex, 0, task)
  }

  /**
   * 处理任务队列
   */
  async processQueue() {
    // 检查是否可以启动新任务
    while (this.runningTasks.size < this.config.maxConcurrentTasks && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()
      this.executeTask(task)
    }

    // 如果队列为空且没有运行中的任务，触发队列空事件
    if (this.taskQueue.length === 0 && this.runningTasks.size === 0) {
      this.emit('queueEmpty')
    }
  }

  /**
   * 执行单个任务
   * @param {Object} task - 任务对象
   */
  async executeTask(task) {
    const startTime = Date.now()
    task.status = 'running'
    task.startTime = startTime

    this.runningTasks.set(task.id, task)
    this.emit('taskStart', task)

    try {
      console.log(`开始执行任务: ${task.id} (${task.type})`)

      // 设置任务超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('任务执行超时')), this.config.taskTimeout)
      })

      // 执行任务
      const taskPromise = this.executeTaskByType(task)
      const result = await Promise.race([taskPromise, timeoutPromise])

      // 任务完成
      const processingTime = Date.now() - startTime
      task.status = 'completed'
      task.result = result
      task.processingTime = processingTime
      task.completedAt = Date.now()

      this.runningTasks.delete(task.id)
      this.completedTasks.set(task.id, task)
      this.stats.completedTasks++

      console.log(`任务完成: ${task.id} (耗时: ${processingTime}ms)`)
      this.emit('taskComplete', task)
    } catch (error) {
      console.error(`任务执行失败: ${task.id}`, error)

      // 重试逻辑
      if (task.retryCount < this.config.retryAttempts) {
        task.retryCount++
        task.status = 'retrying'

        console.log(`任务重试: ${task.id} (第${task.retryCount}次重试)`)

        // 延迟后重新加入队列
        setTimeout(() => {
          task.status = 'pending'
          this.insertTaskByPriority(task)
          this.processQueue()
        }, 1000 * task.retryCount)
      } else {
        // 重试次数用尽，标记为失败
        task.status = 'failed'
        task.error = error.message
        task.failedAt = Date.now()

        this.runningTasks.delete(task.id)
        this.failedTasks.set(task.id, task)
        this.stats.failedTasks++

        this.emit('taskError', task, error)
      }
    }

    // 继续处理队列
    this.processQueue()
  }

  /**
   * 根据任务类型执行具体任务
   * @param {Object} task - 任务对象
   * @returns {Promise<any>} 任务结果
   */
  async executeTaskByType(task) {
    const { type, content, options = {} } = task

    switch (type) {
      case 'extractText':
        return await this.analyzeContent(content, 'extractText', options)

      case 'contractReview':
        return await this.analyzeContent(content, 'contractReview', options)

      case 'analyzeStructure':
        return await this.analyzeContent(content, 'analyzeStructure', options)

      case 'keywordComment':
        return await this.analyzeContent(content, 'keywordComment', options)

      case 'parseDocument':
        return this.documentParser.parseDocument(content)

      case 'detectChanges':
        return this.documentParser.detectChanges(options.oldContent, content)

      case 'batchProcess':
        return await this.executeBatchTask(task)

      case 'addHeader':
        // 处理添加页眉任务 - 返回参数供前端处理
        return {
          success: true,
          data: options,
          message: '页眉参数已准备完成'
        }

      default:
        throw new Error(`未知的任务类型: ${type}`)
    }
  }

  /**
   * 分析内容的核心方法
   * @param {string} content - 内容
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeContent(content, analysisType, options = {}) {
    // 检查缓存
    const contentHash = this.documentParser.generateContentHash(content)
    const cached = this.cacheManager.get(contentHash, analysisType, options)
    if (cached) {
      console.log(`缓存命中: ${analysisType}`)
      return cached
    }

    // 生成提示词
    const prompt = this.generatePrompt(content, analysisType, options)

    // 调用AI服务
    const response = await this.callAI(prompt, options)

    // 解析响应
    const result = this.parseAIResponse(response, analysisType)

    // 保存到缓存
    this.cacheManager.set(contentHash, analysisType, result, options)

    return result
  }

  /**
   * 生成AI提示词
   */
  generatePrompt(content, analysisType, options) {
    switch (analysisType) {
      case 'extractText': {
        // extractTags 应该是第一个参数，content 是第二个参数
        const extractTags = options.extractTags || ['甲方名称', '乙方名称', '合同金额']
        return generateContractExtractionPrompt(extractTags, content)
      }
      case 'contractReview':
        return generateContractReviewPrompt(content, options)
      default:
        return `请分析以下内容：\n\n${content}`
    }
  }

  /**
   * 调用AI服务
   */
  async callAI(prompt, options = {}) {
    const model = options.model || this.aiConfig.defaultModel

    for (let attempt = 0; attempt < this.aiConfig.maxRetries; attempt++) {
      try {
        const response = await apiClient.post('/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.aiConfig.maxTokensPerChunk,
          temperature: 0.1
        })

        return response.data.choices[0].message.content
      } catch (error) {
        console.error(`AI调用失败 (尝试 ${attempt + 1}/${this.aiConfig.maxRetries}):`, error)
        if (attempt < this.aiConfig.maxRetries - 1) {
          await this.delay(this.aiConfig.retryDelay * (attempt + 1))
        } else {
          throw error
        }
      }
    }
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(response, analysisType) {
    try {
      // 尝试解析JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/{[\s\S]*}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonStr)
      }

      // 如果不是JSON格式，返回原始文本
      return { content: response, type: analysisType }
    } catch (error) {
      console.error('解析AI响应失败:', error)
      return { content: response, type: analysisType, error: '解析失败' }
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 执行批量任务
   * @param {Object} task - 批量任务对象
   * @returns {Promise<Array>} 批量结果
   */
  async executeBatchTask(task) {
    const { items, batchType, batchOptions } = task.options
    const results = []

    // 为每个项目创建子任务
    const subTasks = items.map((item, index) => ({
      id: `${task.id}_sub_${index}`,
      type: batchType,
      content: item.content,
      options: { ...batchOptions, ...item.options },
      priority: task.priority,
      parentTaskId: task.id
    }))

    // 并行执行子任务
    const subTaskPromises = subTasks.map((subTask) => this.executeTaskByType(subTask))

    const subResults = await Promise.allSettled(subTaskPromises)

    // 整理结果
    subResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({
          index,
          success: true,
          data: result.value
        })
      } else {
        results.push({
          index,
          success: false,
          error: result.reason.message
        })
      }
    })

    return {
      totalItems: items.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results
    }
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务状态
   */
  getTaskStatus(taskId) {
    // 检查运行中的任务
    if (this.runningTasks.has(taskId)) {
      return {
        status: 'running',
        task: this.runningTasks.get(taskId)
      }
    }

    // 检查已完成的任务
    if (this.completedTasks.has(taskId)) {
      return {
        status: 'completed',
        task: this.completedTasks.get(taskId)
      }
    }

    // 检查失败的任务
    if (this.failedTasks.has(taskId)) {
      return {
        status: 'failed',
        task: this.failedTasks.get(taskId)
      }
    }

    // 检查队列中的任务
    const queuedTask = this.taskQueue.find((task) => task.id === taskId)
    if (queuedTask) {
      return {
        status: 'pending',
        task: queuedTask,
        queuePosition: this.taskQueue.indexOf(queuedTask) + 1
      }
    }

    return null
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务ID
   * @returns {boolean} 是否成功取消
   */
  cancelTask(taskId) {
    // 从队列中移除
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId)
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1)
      console.log(`任务已从队列中取消: ${taskId}`)
      return true
    }

    // 标记运行中的任务为取消状态
    if (this.runningTasks.has(taskId)) {
      const task = this.runningTasks.get(taskId)
      task.status = 'cancelled'
      task.cancelledAt = Date.now()

      this.runningTasks.delete(taskId)
      console.log(`运行中的任务已标记为取消: ${taskId}`)
      return true
    }

    return false
  }

  /**
   * 暂停任务调度
   */
  pause() {
    this.isPaused = true
    console.log('任务调度器已暂停')
  }

  /**
   * 恢复任务调度
   */
  resume() {
    this.isPaused = false
    console.log('任务调度器已恢复')
    this.processQueue()
  }

  /**
   * 清空任务队列
   */
  clearQueue() {
    const cancelledCount = this.taskQueue.length
    this.taskQueue = []
    console.log(`已清空任务队列，取消了 ${cancelledCount} 个待处理任务`)
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback)
      if (index > -1) {
        this.listeners[event].splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...any} args - 事件参数
   */
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 获取基本统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.taskQueue.length,
      runningTasksCount: this.runningTasks.size
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.clearQueue()
    this.runningTasks.clear()
    this.completedTasks.clear()
    this.failedTasks.clear()
    this.listeners = {
      taskStart: [],
      taskComplete: [],
      taskError: [],
      queueEmpty: []
    }

    if (this.cacheManager) {
      this.cacheManager.cleanup()
    }

    console.log('任务调度器资源已清理')
  }
}

export default TaskScheduler
