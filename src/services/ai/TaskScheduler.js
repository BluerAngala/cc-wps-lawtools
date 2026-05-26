/**
 * 任务调度器 - 简化的AI服务统一入口
 * 集成文档解析和AI调用功能（无缓存，每次请求都重新获取）
 */

import { DocumentParser } from '../document/DocumentParser.js'
import axios from 'axios'
import { appConfig } from '../../utils/appConfig.js'
import {
  generateContractExtractionPrompt,
  generateContractReviewPrompt
} from './promptGenerator.js'

export class TaskScheduler {
  constructor(options = {}) {
    this.documentParser = new DocumentParser()

    // 从配置读取默认模型
    const aiConfig = appConfig.getAIConfig()

    this.aiConfig = {
      maxTokensPerChunk: options.maxTokensPerChunk || 3000,
      defaultModel: options.defaultModel || aiConfig.model || 'moonshotai/Kimi-K2-Instruct-0905',
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options.ai
    }

    this.config = {
      maxConcurrentTasks: options.maxConcurrentTasks || 3,
      taskTimeout: options.taskTimeout || 120000,
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
      console.log(`🚀 开始执行任务: ${task.id}`)
      console.log(`   类型: ${task.type}`)
      console.log(`   优先级: ${task.priority}`)
      console.log(`   超时时间: ${this.config.taskTimeout}ms`)
      console.log(`   内容长度: ${task.content?.length || 0}字符`)

      // 设置任务超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                `任务执行超时(${this.config.taskTimeout}ms)，请检查网络连接或在设置中增加超时时间`
              )
            ),
          this.config.taskTimeout
        )
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

      console.log(`✅ 任务完成: ${task.id}`)
      console.log(`   耗时: ${processingTime}ms`)
      console.log(`   结果: ${JSON.stringify(result).substring(0, 100)}...`)
      this.emit('taskComplete', task)
    } catch (error) {
      console.error(`❌ 任务执行失败: ${task.id}`)
      console.error(`   错误: ${error.message}`)
      console.error(`   详情:`, error)

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

      case 'contractReview': {
        // 合同预审需要特殊处理：需要从 options 中提取规则信息
        const reviewRules = options.reviewRules || ''
        const reviewRequirements = options.reviewRequirements || ''
        const actionType = options.actionType || 'comment'

        // 生成提示词
        const prompt = generateContractReviewPrompt(reviewRules, reviewRequirements, actionType)

        // 调用AI服务
        const response = await this.callAI(prompt, options)

        // 解析响应
        return this.parseAIResponse(response, 'contractReview')
      }

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
    console.log(`开始分析: ${analysisType}`)
    console.log(`文档长度: ${content.length}字符`)
    console.log(`分析选项:`, options)

    // 禁用缓存，每次都重新获取
    console.log(`准备调用AI（缓存已禁用）`)

    // 生成提示词
    console.log(`生成提示词 - 类型: ${analysisType}`)
    const prompt = this.generatePrompt(content, analysisType, options)
    console.log(`提示词生成完成，长度: ${prompt.length}字符`)

    // 调用AI服务
    const response = await this.callAI(prompt, options)

    // 解析响应（如果解析失败会抛出错误，不会被缓存）
    console.log(`解析AI响应 - 类型: ${analysisType}`)
    const result = this.parseAIResponse(response, analysisType)
    console.log(`响应解析完成`)

    // 缓存已禁用，不再保存结果
    console.log(`✅ AI调用完成（缓存已禁用）`)

    return result
  }

  /**
   * 生成AI提示词
   */
  generatePrompt(content, analysisType, options) {
    switch (analysisType) {
      case 'extractText': {
        // extractTags 应该是第一个参数，content 是第二个参数
        const extractTags = options.extractTags || [
          '合同名称',
          '对接人',
          '甲方',
          '甲方主体信息',
          '乙方',
          '乙方主体信息',
          '其他方',
          '合同金额'
        ]
        return generateContractExtractionPrompt(extractTags, content)
      }
      case 'contractReview': {
        // contractReview 需要三个参数：reviewRules, reviewRequirements, actionType
        const reviewRules = options.reviewRules || ''
        const reviewRequirements = options.reviewRequirements || ''
        const actionType = options.actionType || 'comment'
        return generateContractReviewPrompt(reviewRules, reviewRequirements, actionType).replace(
          '{{input}}',
          content
        )
      }
      default:
        return `请分析以下内容：\n\n${content}`
    }
  }

  /**
   * 调用AI服务
   * @param {string|Array} promptOrMessages - 提示词字符串或消息数组
   * @param {Object} options - 选项
   * @param {string} options.model - 模型名称
   * @param {number} options.maxTokens - 最大token数
   * @param {number} options.temperature - 温度参数
   * @param {number} options.timeout - 超时时间
   * @param {Object} options.response_format - 响应格式，如 {type: "json_object"}
   * @param {Array} options.messages - 消息数组（如果提供，会覆盖 promptOrMessages）
   */
  async callAI(promptOrMessages, options = {}) {
    const model = options.model || this.aiConfig.defaultModel

    // 构建 messages 数组
    let messages = []
    if (options.messages && Array.isArray(options.messages)) {
      messages = options.messages
    } else if (typeof promptOrMessages === 'string') {
      // 兼容旧方式：字符串 prompt
      messages = [{ role: 'user', content: promptOrMessages }]
    } else if (Array.isArray(promptOrMessages)) {
      messages = promptOrMessages
    } else {
      throw new Error('promptOrMessages 必须是字符串或消息数组')
    }

    const promptLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0)
    console.log(
      `准备调用AI - 模型: ${model}, Messages数量: ${messages.length}, 总长度: ${promptLength}字符`
    )

    for (let attempt = 0; attempt < this.aiConfig.maxRetries; attempt++) {
      try {
        console.log(`AI调用尝试 ${attempt + 1}/${this.aiConfig.maxRetries}`)

        // 获取最新的超时配置（每次调用时重新读取，确保使用最新配置）
        const currentConfig = appConfig.getAIConfig()
        const requestTimeout = options.timeout || currentConfig.timeout || 120000

        // 创建临时axios实例，使用最新的超时配置
        const tempClient = axios.create({
          baseURL: currentConfig.baseUrl,
          timeout: requestTimeout,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentConfig.apiKey}`
          }
        })

        // 构建请求体
        const requestBody = {
          model,
          messages,
          max_tokens: options.maxTokens || this.aiConfig.maxTokensPerChunk,
          temperature: options.temperature !== undefined ? options.temperature : 0.1
        }

        // 如果指定了 response_format，添加到请求中
        if (options.response_format) {
          requestBody.response_format = options.response_format
        }

        const response = await tempClient.post('/chat/completions', requestBody)

        console.log('AI调用成功，响应长度:', response.data.choices[0].message.content.length)
        return response.data.choices[0].message.content
      } catch (error) {
        console.error(
          `AI调用失败 (尝试 ${attempt + 1}/${this.aiConfig.maxRetries}):`,
          error.message
        )

        // 如果是配置错误或权限错误，不重试直接抛出
        if (error.message.includes('API 密钥') || error.message.includes('权限')) {
          throw error
        }

        if (attempt < this.aiConfig.maxRetries - 1) {
          const delay = this.aiConfig.retryDelay * (attempt + 1)
          console.log(`${delay}ms后重试...`)
          await this.delay(delay)
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
      // 检查响应是否为空或无效
      if (!response || typeof response !== 'string') {
        throw new Error('AI响应为空或格式无效')
      }

      // 尝试解析JSON - 先尝试 markdown 代码块格式
      let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[1].trim()
        return JSON.parse(jsonStr)
      }

      // 尝试直接匹配 JSON 对象
      jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0].trim()
        return JSON.parse(jsonStr)
      }

      // 如果不是JSON格式，对于 extractText 类型抛出错误
      if (analysisType === 'extractText') {
        console.error('AI响应不是有效的JSON格式:', response.substring(0, 200))
        throw new Error('AI返回的数据格式不正确，请重试')
      }

      // 其他类型返回原始文本（但标记为非结构化数据）
      return { _rawContent: response, _type: analysisType, _isRaw: true }
    } catch (error) {
      console.error('解析AI响应失败:', error.message)
      console.error('原始响应前200字符:', response?.substring?.(0, 200))
      // 抛出错误而不是返回错误对象，这样不会被缓存
      throw new Error(`AI响应解析失败: ${error.message}`)
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

    console.log('任务调度器资源已清理')
  }
}

export default TaskScheduler
