/**
 * 任务调度器 - 智能任务分发和并行处理
 * 协调文档解析、缓存管理和AI服务的工作流程
 */

import { AIServiceManager } from './AIServiceManager.js'
import { DocumentParser } from './DocumentParser.js'
import { CacheManager } from './CacheManager.js'
import { IncrementalAnalyzer } from './IncrementalAnalyzer.js'

export class TaskScheduler {
  constructor(options = {}) {
    this.aiService = new AIServiceManager(options.ai)
    this.documentParser = new DocumentParser()
    this.cacheManager = new CacheManager(options.cache)
    this.incrementalAnalyzer = new IncrementalAnalyzer({
      ai: options.ai,
      cache: options.cache,
      ...options.incremental
    })
    
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
    
    // 性能统计
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0
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
      
      // 更新平均处理时间
      this.updateAverageProcessingTime(processingTime)
      
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
    // 检查是否启用增量分析
    const useIncremental = task.options?.enableIncremental !== false && 
                          ['extractText', 'contractReview', 'analyzeStructure'].includes(task.type)
    
    if (useIncremental && task.content) {
      // 使用增量分析
      const documentId = task.options?.documentId || 'default'
      return await this.incrementalAnalyzer.analyzeIncremental(
        task.content,
        task.type,
        task.options,
        documentId
      )
    }
    
    // 传统处理方式
    switch (task.type) {
      case 'extractText':
        return await this.aiService.analyzeContent(
          task.content,
          'extractText',
          task.options
        )
      
      case 'contractReview':
        return await this.aiService.analyzeContent(
          task.content,
          'contractReview',
          task.options
        )
      
      case 'analyzeStructure':
        return await this.aiService.analyzeContent(
          task.content,
          'analyzeStructure',
          task.options
        )
      
      case 'keywordComment':
        return await this.aiService.analyzeContent(
          task.content,
          'keywordComment',
          task.options
        )
      
      case 'parseDocument':
        return this.documentParser.parseDocument(task.content)
      
      case 'detectChanges':
        return this.documentParser.detectChanges(
          task.options.oldContent,
          task.content
        )
      
      case 'batchProcess':
        return await this.executeBatchTask(task)
      
      case 'addHeader':
        // 处理添加页眉任务 - 返回参数供前端处理
        return {
          success: true,
          data: task.options,
          message: '页眉参数已准备完成'
        }
      
      default:
        throw new Error(`未知的任务类型: ${task.type}`)
    }
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
    const subTaskPromises = subTasks.map(subTask => 
      this.executeTaskByType(subTask)
    )
    
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
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
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
    const queuedTask = this.taskQueue.find(task => task.id === taskId)
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
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId)
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
      this.listeners[event].forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 更新平均处理时间
   * @param {number} processingTime - 处理时间
   */
  updateAverageProcessingTime(processingTime) {
    const totalCompleted = this.stats.completedTasks
    const currentAverage = this.stats.averageProcessingTime
    
    this.stats.averageProcessingTime = 
      (currentAverage * (totalCompleted - 1) + processingTime) / totalCompleted
  }

  /**
   * 获取调度器统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const cacheStats = this.cacheManager.getStats()
    const incrementalStats = this.incrementalAnalyzer.getStats()
    
    return {
      ...this.stats,
      queueLength: this.taskQueue.length,
      runningTasksCount: this.runningTasks.size,
      cacheHitRate: cacheStats.hitRate,
      uptime: Date.now() - (this.startTime || Date.now()),
      incremental: incrementalStats,
      config: this.config
    }
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态
   */
  getQueueStatus() {
    return {
      pending: this.taskQueue.map(task => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        createdAt: task.createdAt
      })),
      running: Array.from(this.runningTasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        startTime: task.startTime,
        progress: this.calculateTaskProgress(task)
      })),
      completed: Array.from(this.completedTasks.values()).slice(-10).map(task => ({
        id: task.id,
        type: task.type,
        processingTime: task.processingTime,
        completedAt: task.completedAt
      })),
      failed: Array.from(this.failedTasks.values()).slice(-10).map(task => ({
        id: task.id,
        type: task.type,
        error: task.error,
        failedAt: task.failedAt
      }))
    }
  }

  /**
   * 计算任务进度（简单估算）
   * @param {Object} task - 任务对象
   * @returns {number} 进度百分比
   */
  calculateTaskProgress(task) {
    const elapsed = Date.now() - task.startTime
    const estimated = this.stats.averageProcessingTime || 10000
    return Math.min(Math.round((elapsed / estimated) * 100), 95)
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
    
    if (this.aiService) {
      this.aiService.cleanup()
    }
    
    if (this.incrementalAnalyzer) {
      this.incrementalAnalyzer.cleanup()
    }
    
    console.log('任务调度器资源已清理')
  }
}

export default TaskScheduler