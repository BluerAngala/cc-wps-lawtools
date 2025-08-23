/**
 * AI服务管理器 - 统一AI调用接口和智能分块处理
 * 集成缓存管理、文档解析和智能分块功能
 */

import { DocumentParser } from './DocumentParser.js'
import { CacheManager } from './CacheManager.js'
import { apiClient } from './siliconflow.js'
import { generateContractExtractionPrompt, generateContractReviewPrompt } from './promptGenerator.js'

export class AIServiceManager {
  constructor(options = {}) {
    this.documentParser = new DocumentParser()
    this.cacheManager = new CacheManager(options.cache)
    
    // AI服务配置
    this.config = {
      maxTokensPerChunk: options.maxTokensPerChunk || 3000,
      defaultModel: options.defaultModel || 'deepseek-ai/DeepSeek-V3',
      chunkOverlap: options.chunkOverlap || 200,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    }
    
    // 模型性能配置
    this.modelConfigs = {
      'deepseek-ai/DeepSeek-V3': {
        maxTokens: 4000,
        costPerToken: 0.00001,
        speed: 'fast',
        quality: 'high'
      },
      'qwen/Qwen2.5-72B-Instruct': {
        maxTokens: 3500,
        costPerToken: 0.00002,
        speed: 'medium',
        quality: 'high'
      }
    }
    
    // 分析类型配置
    this.analysisTypes = {
      'extractText': {
        priority: 'high',
        cacheable: true,
        chunkable: true
      },
      'contractReview': {
        priority: 'high',
        cacheable: true,
        chunkable: true
      },
      'analyzeStructure': {
        priority: 'medium',
        cacheable: true,
        chunkable: false
      },
      'keywordComment': {
        priority: 'low',
        cacheable: true,
        chunkable: false
      },
      'customTextProcess': {
        priority: 'medium',
        cacheable: true,
        chunkable: true
      }
    }
  }

  /**
   * 智能分析文档内容
   * @param {string} content - 文档内容
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 分析选项
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeContent(content, analysisType, options = {}) {
    try {
      this.startTime = Date.now()
      console.log(`开始分析: ${analysisType}`, { contentLength: content.length })
      
      // 解析文档结构
      const parsedDoc = this.documentParser.parseDocument(content)
      const contentHash = parsedDoc.hash
      
      // 检查缓存
      const cachedResult = this.cacheManager.get(contentHash, analysisType, options)
      if (cachedResult) {
        return this.formatResult(cachedResult, analysisType, true)
      }
      
      // 选择最优模型
      const model = this.selectOptimalModel(content, analysisType)
      
      // 判断是否需要分块处理
      const needsChunking = this.shouldChunkContent(content, analysisType)
      
      let result
      if (needsChunking) {
        result = await this.processInChunks(parsedDoc, analysisType, options, model)
      } else {
        result = await this.processSingle(content, analysisType, options, model)
      }
      
      // 缓存结果
      this.cacheManager.set(contentHash, analysisType, result, options)
      
      return this.formatResult(result, analysisType, false)
      
    } catch (error) {
      console.error(`分析失败 (${analysisType}):`, error)
      throw new Error(`AI分析失败: ${error.message}`)
    }
  }

  /**
   * 选择最优AI模型
   * @param {string} content - 内容
   * @param {string} analysisType - 分析类型
   * @returns {string} 模型名称
   */
  selectOptimalModel(content, analysisType) {
    const contentLength = content.length
    const analysisConfig = this.analysisTypes[analysisType] || {}
    
    // 根据内容长度和分析类型选择模型
    if (contentLength > 10000 && analysisConfig.priority === 'high') {
      return 'deepseek-ai/DeepSeek-V3' // 高性能模型处理大文档
    }
    
    if (analysisConfig.priority === 'low') {
      return 'qwen/Qwen2.5-72B-Instruct' // 成本优化模型处理简单任务
    }
    
    return this.config.defaultModel
  }

  /**
   * 判断是否需要分块处理
   * @param {string} content - 内容
   * @param {string} analysisType - 分析类型
   * @returns {boolean} 是否需要分块
   */
  shouldChunkContent(content, analysisType) {
    const analysisConfig = this.analysisTypes[analysisType] || {}
    
    // 如果分析类型不支持分块，直接返回false
    if (!analysisConfig.chunkable) {
      return false
    }
    
    // 根据内容长度判断
    const estimatedTokens = content.length / 3 // 粗略估算token数
    return estimatedTokens > this.config.maxTokensPerChunk
  }

  /**
   * 分块处理大文档
   * @param {Object} parsedDoc - 解析后的文档
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 选项
   * @param {string} model - 模型名称
   * @returns {Promise<Object>} 处理结果
   */
  async processInChunks(parsedDoc, analysisType, options, model) {
    console.log(`开始分块处理: ${analysisType}`)
    
    const chunks = this.createSmartChunks(parsedDoc, analysisType)
    const results = []
    
    // 并行处理独立的块
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        console.log(`处理块 ${index + 1}/${chunks.length}`)
        
        // 检查块级缓存
        const chunkHash = this.documentParser.generateContentHash(chunk.content)
        const cachedChunkResult = this.cacheManager.get(chunkHash, analysisType, options)
        
        if (cachedChunkResult) {
          return { index, result: cachedChunkResult, fromCache: true }
        }
        
        const result = await this.processSingle(chunk.content, analysisType, options, model)
        
        // 缓存块结果
        this.cacheManager.set(chunkHash, analysisType, result, options)
        
        return { index, result, fromCache: false }
        
      } catch (error) {
        console.error(`处理块 ${index + 1} 失败:`, error)
        return { index, error: error.message }
      }
    })
    
    const chunkResults = await Promise.all(chunkPromises)
    
    // 合并结果
    return this.mergeChunkResults(chunkResults, analysisType)
  }

  /**
   * 创建智能分块
   * @param {Object} parsedDoc - 解析后的文档
   * @param {string} analysisType - 分析类型
   * @returns {Array} 分块数组
   */
  createSmartChunks(parsedDoc, analysisType) {
    const chunks = []
    
    if (analysisType === 'extractText' || analysisType === 'contractReview') {
      // 按章节分块
      if (parsedDoc.sections && parsedDoc.sections.length > 0) {
        parsedDoc.sections.forEach(section => {
          if (section.content.length > 100) { // 过滤太短的章节
            chunks.push({
              type: 'section',
              title: section.title,
              content: section.content,
              metadata: { level: section.level }
            })
          }
        })
      }
      
      // 如果没有明确章节，按段落分块
      if (chunks.length === 0) {
        const paragraphs = parsedDoc.content?.split('\n\n') || []
        let currentChunk = ''
        
        paragraphs.forEach(paragraph => {
          if (currentChunk.length + paragraph.length > this.config.maxTokensPerChunk * 3) {
            if (currentChunk) {
              chunks.push({
                type: 'paragraph',
                content: currentChunk.trim()
              })
            }
            currentChunk = paragraph
          } else {
            currentChunk += '\n\n' + paragraph
          }
        })
        
        if (currentChunk) {
          chunks.push({
            type: 'paragraph',
            content: currentChunk.trim()
          })
        }
      }
    } else {
      // 其他分析类型的默认分块策略
      chunks.push({
        type: 'full',
        content: parsedDoc.content || ''
      })
    }
    
    return chunks.filter(chunk => chunk.content && chunk.content.length > 50)
  }

  /**
   * 单次处理
   * @param {string} content - 内容
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 选项
   * @param {string} model - 模型名称
   * @returns {Promise<any>} 处理结果
   */
  async processSingle(content, analysisType, options, model) {
    const prompt = this.generatePrompt(content, analysisType, options)
    
    let lastError
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`AI调用尝试 ${attempt}/${this.config.maxRetries} (${model})`)
        
        const response = await apiClient.post('/chat/completions', {
          model: model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.1,
          max_tokens: 2000
        })
        
        const result = response.data.choices[0].message.content
        return this.parseAIResponse(result, analysisType)
        
      } catch (error) {
        lastError = error
        console.warn(`AI调用失败 (尝试 ${attempt}):`, error.message)
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }
    
    throw lastError
  }

  /**
   * 生成提示词
   * @param {string} content - 内容
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 选项
   * @returns {string} 提示词
   */
  generatePrompt(content, analysisType, options) {
    switch (analysisType) {
      case 'extractText':
        return generateContractExtractionPrompt(options.extractTags || [], content)
      
      case 'contractReview':
        return generateContractReviewPrompt({
          content,
          reviewRules: options.reviewRules,
          reviewRequirements: options.reviewRequirements,
          actionType: options.actionType
        })
      
      case 'analyzeStructure':
        return `请分析以下合同文档的结构，提取标题层级：\n\n${content}`
      
      case 'keywordComment':
        return `请在以下合同中找到关键词并提供批注建议：\n\n${content}`
      
      case 'customTextProcess':
        return `${options.processRequest}\n\n文本内容：\n${content}`
      
      default:
        return `请分析以下合同内容：\n\n${content}`
    }
  }

  /**
   * 解析AI响应
   * @param {string} response - AI响应
   * @param {string} analysisType - 分析类型
   * @returns {any} 解析后的结果
   */
  parseAIResponse(response, analysisType) {
    try {
      // 清理响应格式
      const cleanedResponse = response
        .replace(/```json\n/g, '')
        .replace(/\n```/g, '')
        .replace(/[\r\n]+/g, '\n')
        .trim()
      
      // 尝试解析JSON格式的响应
      if (cleanedResponse.startsWith('{') || cleanedResponse.startsWith('[')) {
        return JSON.parse(cleanedResponse)
      }
      
      // 根据分析类型处理文本响应
      switch (analysisType) {
        case 'extractText':
          return this.parseExtractionResponse(cleanedResponse)
        
        case 'contractReview':
          return this.parseReviewResponse(cleanedResponse)
        
        case 'analyzeStructure':
          return this.parseStructureResponse(cleanedResponse)
        
        case 'keywordComment':
          return this.parseKeywordResponse(cleanedResponse)
        
        case 'customTextProcess':
          return { content: cleanedResponse, type: 'customTextProcess' }
        
        default:
          return { content: cleanedResponse, type: analysisType }
      }
      
    } catch (error) {
      console.warn('AI响应解析失败，返回原始内容:', error)
      return { content: response, type: analysisType, parseError: true }
    }
  }

  /**
   * 解析文本提取响应
   * @param {string} response - 响应内容
   * @returns {Object} 解析结果
   */
  parseExtractionResponse(response) {
    const lines = response.split('\n').filter(line => line.trim())
    const extracted = {}
    
    lines.forEach(line => {
      const match = line.match(/^(.+?)[:：]\s*(.+)$/)
      if (match) {
        const [, key, value] = match
        extracted[key.trim()] = value.trim()
      }
    })
    
    return {
      type: 'extractText',
      extracted,
      rawContent: response
    }
  }

  /**
   * 解析合同审查响应
   * @param {string} response - 响应内容
   * @returns {Object} 解析结果
   */
  parseReviewResponse(response) {
    const sections = response.split(/\n\s*\n/)
    const issues = []
    const suggestions = []
    
    sections.forEach(section => {
      if (section.includes('问题') || section.includes('风险')) {
        issues.push(section.trim())
      } else if (section.includes('建议') || section.includes('修改')) {
        suggestions.push(section.trim())
      }
    })
    
    return {
      type: 'contractReview',
      issues,
      suggestions,
      summary: sections[0] || response,
      rawContent: response
    }
  }

  /**
   * 解析结构分析响应
   * @param {string} response - 响应内容
   * @returns {Object} 解析结果
   */
  parseStructureResponse(response) {
    const lines = response.split('\n').filter(line => line.trim())
    const structure = []
    
    lines.forEach(line => {
      const match = line.match(/^(\s*)(\d+\.?|[一二三四五六七八九十]+[、.]|[A-Z]\.|\([a-z]\)|[①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/)
      if (match) {
        const [, indent, marker, title] = match
        structure.push({
          level: Math.floor(indent.length / 2) + 1,
          marker: marker.trim(),
          title: title.trim()
        })
      }
    })
    
    return {
      type: 'analyzeStructure',
      structure,
      rawContent: response
    }
  }

  /**
   * 解析关键词批注响应
   * @param {string} response - 响应内容
   * @returns {Object} 解析结果
   */
  parseKeywordResponse(response) {
    const lines = response.split('\n').filter(line => line.trim())
    const keywords = []
    
    lines.forEach(line => {
      const match = line.match(/^(.+?)[:：]\s*(.+)$/)
      if (match) {
        const [, keyword, comment] = match
        keywords.push({
          keyword: keyword.trim(),
          comment: comment.trim()
        })
      }
    })
    
    return {
      type: 'keywordComment',
      keywords,
      rawContent: response
    }
  }

  /**
   * 合并分块结果
   * @param {Array} chunkResults - 分块结果数组
   * @param {string} analysisType - 分析类型
   * @returns {Object} 合并后的结果
   */
  mergeChunkResults(chunkResults, analysisType) {
    const validResults = chunkResults.filter(r => !r.error)
    const errors = chunkResults.filter(r => r.error)
    
    if (validResults.length === 0) {
      throw new Error(`所有分块处理都失败了: ${errors.map(e => e.error).join(', ')}`)
    }
    
    switch (analysisType) {
      case 'extractText':
        return this.mergeExtractionResults(validResults)
      
      case 'contractReview':
        return this.mergeReviewResults(validResults)
      
      case 'analyzeStructure':
        return this.mergeStructureResults(validResults)
      
      case 'customTextProcess':
        // 对于自定义文本处理，简单合并所有内容
        return {
          type: 'customTextProcess',
          content: validResults.map(r => r.result.content || r.result).join('\n\n'),
          errors: errors.length > 0 ? errors : undefined
        }
      
      default:
        return {
          type: analysisType,
          chunks: validResults.map(r => r.result),
          errors: errors.length > 0 ? errors : undefined
        }
    }
  }

  /**
   * 合并文本提取结果
   * @param {Array} results - 结果数组
   * @returns {Object} 合并结果
   */
  mergeExtractionResults(results) {
    const merged = { extracted: {}, type: 'extractText' }
    
    results.forEach(({ result }) => {
      if (result.extracted) {
        Object.assign(merged.extracted, result.extracted)
      }
    })
    
    return merged
  }

  /**
   * 合并审查结果
   * @param {Array} results - 结果数组
   * @returns {Object} 合并结果
   */
  mergeReviewResults(results) {
    const merged = {
      type: 'contractReview',
      issues: [],
      suggestions: [],
      summary: ''
    }
    
    results.forEach(({ result }) => {
      if (result.issues) merged.issues.push(...result.issues)
      if (result.suggestions) merged.suggestions.push(...result.suggestions)
      if (result.summary) merged.summary += result.summary + '\n\n'
    })
    
    merged.summary = merged.summary.trim()
    return merged
  }

  /**
   * 合并结构分析结果
   * @param {Array} results - 结果数组
   * @returns {Object} 合并结果
   */
  mergeStructureResults(results) {
    const merged = {
      type: 'analyzeStructure',
      structure: []
    }
    
    results.forEach(({ result }) => {
      if (result.structure) {
        merged.structure.push(...result.structure)
      }
    })
    
    return merged
  }

  /**
   * 格式化最终结果
   * @param {Object} result - 原始结果
   * @param {string} analysisType - 分析类型
   * @param {boolean} fromCache - 是否来自缓存
   * @returns {Object} 格式化结果
   */
  formatResult(result, analysisType, fromCache = false) {
    return {
      ...result,
      analysisType,
      fromCache,
      timestamp: new Date().toISOString(),
      processingTime: fromCache ? 0 : Date.now() - this.startTime
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      cache: this.cacheManager.getStats(),
      models: Object.keys(this.modelConfigs),
      analysisTypes: Object.keys(this.analysisTypes)
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.cacheManager.cleanup()
  }
}