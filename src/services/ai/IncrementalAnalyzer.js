/**
 * 增量分析管理器 - 智能文档变更检测和增量处理
 * 只对文档变更部分进行AI分析，提升处理效率
 */

import { DocumentParser } from './DocumentParser.js'
import { CacheManager } from './CacheManager.js'
import { AIServiceManager } from './AIServiceManager.js'

export class IncrementalAnalyzer {
  constructor(options = {}) {
    this.documentParser = new DocumentParser()
    this.cacheManager = new CacheManager(options.cache)
    this.aiService = new AIServiceManager(options.ai)
    
    // 增量分析配置
    this.config = {
      changeThreshold: options.changeThreshold || 0.1, // 变更阈值（10%）
      maxChunkSize: options.maxChunkSize || 2000,
      contextWindow: options.contextWindow || 500, // 上下文窗口大小
      enableSmartMerge: options.enableSmartMerge !== false,
      ...options
    }
    
    // 文档版本管理
    this.documentVersions = new Map()
    this.analysisHistory = new Map()
    
    // 变更检测缓存
    this.changeCache = new Map()
    
    console.log('增量分析管理器已初始化', this.config)
  }

  /**
   * 分析文档变更并执行增量处理
   * @param {string} currentContent - 当前文档内容
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 分析选项
   * @param {string} documentId - 文档标识符
   * @returns {Promise<Object>} 增量分析结果
   */
  async analyzeIncremental(currentContent, analysisType, options = {}, documentId = 'default') {
    try {
      console.log(`开始增量分析: ${analysisType} (文档: ${documentId})`)
      
      // 解析当前文档
      console.log('IncrementalAnalyzer.analyzeIncremental: 输入内容检查', {
        inputType: typeof currentContent,
        inputLength: currentContent?.length || 0,
        inputPreview: currentContent?.substring(0, 100) || 'N/A'
      })
      
      const currentDoc = this.documentParser.parseDocument(currentContent)
      const currentHash = currentDoc.hash
      
      console.log('IncrementalAnalyzer.analyzeIncremental: 解析后文档检查', {
        hasContent: !!currentDoc.content,
        contentType: typeof currentDoc.content,
        contentLength: currentDoc.content?.length || 0,
        hash: currentHash,
        documentKeys: Object.keys(currentDoc)
      })
      
      // 获取历史版本
      const previousVersion = this.documentVersions.get(documentId)
      
      if (!previousVersion) {
        // 首次分析，执行完整分析
        console.log('首次分析，执行完整处理')
        const result = await this.performFullAnalysis(currentDoc, analysisType, options)
        
        // 保存版本信息
        this.saveDocumentVersion(documentId, currentDoc, result)
        
        return {
          type: 'full',
          result: result,
          changes: null,
          processingTime: result.metadata?.processingTime || 0
        }
      }
      
      // 检查是否有变更
      if (currentHash === previousVersion.hash) {
        console.log('文档无变更，返回缓存结果')
        return {
          type: 'cached',
          result: previousVersion.lastResult,
          changes: null,
          processingTime: 0
        }
      }
      
      // 检测具体变更
      const changes = this.detectDetailedChanges(
        previousVersion.document,
        currentDoc
      )
      
      console.log('检测到变更:', {
        addedSections: changes.added.length,
        modifiedSections: changes.modified.length,
        deletedSections: changes.deleted.length,
        changeRatio: changes.changeRatio
      })
      
      // 判断是否需要增量处理
      if (this.shouldUseIncrementalAnalysis(changes)) {
        const result = await this.performIncrementalAnalysis(
          currentDoc,
          previousVersion,
          changes,
          analysisType,
          options
        )
        
        // 保存新版本
        this.saveDocumentVersion(documentId, currentDoc, result)
        
        return {
          type: 'incremental',
          result: result,
          changes: changes,
          processingTime: result.metadata?.processingTime || 0
        }
      } else {
        // 变更太大，执行完整分析
        console.log('变更过大，执行完整重新分析')
        const result = await this.performFullAnalysis(currentDoc, analysisType, options)
        
        // 保存版本信息
        this.saveDocumentVersion(documentId, currentDoc, result)
        
        return {
          type: 'full_reanalysis',
          result: result,
          changes: changes,
          processingTime: result.metadata?.processingTime || 0
        }
      }
      
    } catch (error) {
      console.error('增量分析失败:', error)
      throw new Error(`增量分析失败: ${error.message}`)
    }
  }

  /**
   * 检测详细变更信息
   * @param {Object} oldDoc - 旧文档
   * @param {Object} newDoc - 新文档
   * @returns {Object} 变更详情
   */
  detectDetailedChanges(oldDoc, newDoc) {
    const changes = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: [],
      changeRatio: 0
    }
    
    // 创建章节映射
    const oldSections = new Map()
    const newSections = new Map()
    
    if (oldDoc.sections) {
      oldDoc.sections.forEach(section => {
        oldSections.set(section.title || section.content.substring(0, 50), section)
      })
    }
    
    if (newDoc.sections) {
      newDoc.sections.forEach(section => {
        newSections.set(section.title || section.content.substring(0, 50), section)
      })
    }
    
    // 检测新增和修改的章节
    for (const [key, newSection] of newSections) {
      if (!oldSections.has(key)) {
        changes.added.push({
          type: 'section',
          content: newSection,
          position: newSection.startIndex || 0
        })
      } else {
        const oldSection = oldSections.get(key)
        const oldHash = this.documentParser.generateContentHash(oldSection.content)
        const newHash = this.documentParser.generateContentHash(newSection.content)
        
        if (oldHash !== newHash) {
          changes.modified.push({
            type: 'section',
            oldContent: oldSection,
            newContent: newSection,
            position: newSection.startIndex || 0
          })
        } else {
          changes.unchanged.push(newSection)
        }
      }
    }
    
    // 检测删除的章节
    for (const [key, oldSection] of oldSections) {
      if (!newSections.has(key)) {
        changes.deleted.push({
          type: 'section',
          content: oldSection,
          position: oldSection.startIndex || 0
        })
      }
    }
    
    // 计算变更比例
    const totalSections = Math.max(oldSections.size, newSections.size)
    const changedSections = changes.added.length + changes.modified.length + changes.deleted.length
    changes.changeRatio = totalSections > 0 ? changedSections / totalSections : 0
    
    return changes
  }

  /**
   * 判断是否应该使用增量分析
   * @param {Object} changes - 变更信息
   * @returns {boolean} 是否使用增量分析
   */
  shouldUseIncrementalAnalysis(changes) {
    // 如果变更比例超过阈值，使用完整分析
    if (changes.changeRatio > this.config.changeThreshold) {
      return false
    }
    
    // 如果有太多删除操作，使用完整分析
    if (changes.deleted.length > 3) {
      return false
    }
    
    // 如果变更内容太大，使用完整分析
    const totalChangeSize = [...changes.added, ...changes.modified]
      .reduce((size, change) => {
        const content = change.content?.content || change.newContent?.content || ''
        return size + content.length
      }, 0)
    
    if (totalChangeSize > this.config.maxChunkSize * 3) {
      return false
    }
    
    return true
  }

  /**
   * 执行完整分析
   * @param {Object} document - 文档对象
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 分析结果
   */
  async performFullAnalysis(document, analysisType, options) {
    console.log('执行完整文档分析')
    console.log('IncrementalAnalyzer.performFullAnalysis: 文档内容检查', {
      hasContent: !!document.content,
      contentType: typeof document.content,
      contentLength: document.content?.length || 0,
      documentKeys: Object.keys(document)
    })
    
    const contentToAnalyze = document.content || ''
    if (!contentToAnalyze) {
      console.error('IncrementalAnalyzer.performFullAnalysis: 文档内容为空', document)
      throw new Error('文档内容为空，无法进行分析')
    }
    
    const startTime = Date.now()
    const result = await this.aiService.analyzeContent(
      contentToAnalyze,
      analysisType,
      options
    )
    
    result.metadata = {
      ...result.metadata,
      analysisMode: 'full',
      processingTime: Date.now() - startTime
    }
    
    return result
  }

  /**
   * 执行增量分析
   * @param {Object} currentDoc - 当前文档
   * @param {Object} previousVersion - 上一版本
   * @param {Object} changes - 变更信息
   * @param {string} analysisType - 分析类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 分析结果
   */
  async performIncrementalAnalysis(currentDoc, previousVersion, changes, analysisType, options) {
    console.log('执行增量分析')
    
    const startTime = Date.now()
    const incrementalResults = []
    
    // 处理新增内容
    for (const addedChange of changes.added) {
      const content = this.extractContentWithContext(
        currentDoc,
        addedChange.content,
        addedChange.position
      )
      
      const result = await this.aiService.analyzeContent(
        content,
        analysisType,
        { ...options, mode: 'incremental_added' }
      )
      
      incrementalResults.push({
        type: 'added',
        position: addedChange.position,
        result: result
      })
    }
    
    // 处理修改内容
    for (const modifiedChange of changes.modified) {
      const content = this.extractContentWithContext(
        currentDoc,
        modifiedChange.newContent,
        modifiedChange.position
      )
      
      const result = await this.aiService.analyzeContent(
        content,
        analysisType,
        { ...options, mode: 'incremental_modified' }
      )
      
      incrementalResults.push({
        type: 'modified',
        position: modifiedChange.position,
        oldContent: modifiedChange.oldContent,
        result: result
      })
    }
    
    // 合并增量结果与历史结果
    const mergedResult = this.mergeIncrementalResults(
      previousVersion.lastResult,
      incrementalResults,
      changes,
      analysisType
    )
    
    mergedResult.metadata = {
      ...mergedResult.metadata,
      analysisMode: 'incremental',
      processingTime: Date.now() - startTime,
      changesProcessed: {
        added: changes.added.length,
        modified: changes.modified.length,
        deleted: changes.deleted.length
      }
    }
    
    return mergedResult
  }

  /**
   * 提取带上下文的内容
   * @param {Object} document - 文档对象
   * @param {Object} targetContent - 目标内容
   * @param {number} position - 位置
   * @returns {string} 带上下文的内容
   */
  extractContentWithContext(document, targetContent, position) {
    const fullContent = document.content || ''
    const targetText = targetContent.content || ''
    
    // 计算上下文范围
    const contextStart = Math.max(0, position - this.config.contextWindow)
    const contextEnd = Math.min(
      fullContent.length,
      position + targetText.length + this.config.contextWindow
    )
    
    const contextContent = fullContent.substring(contextStart, contextEnd)
    
    return contextContent
  }

  /**
   * 合并增量分析结果
   * @param {Object} baseResult - 基础结果
   * @param {Array} incrementalResults - 增量结果
   * @param {Object} changes - 变更信息
   * @param {string} analysisType - 分析类型
   * @returns {Object} 合并后的结果
   */
  mergeIncrementalResults(baseResult, incrementalResults, changes, analysisType) {
    if (!this.config.enableSmartMerge) {
      // 简单合并：直接追加新结果
      return {
        ...baseResult,
        incrementalUpdates: incrementalResults,
        lastUpdate: Date.now()
      }
    }
    
    // 智能合并：根据分析类型进行特定合并
    switch (analysisType) {
      case 'extractText':
        return this.mergeExtractionResults(baseResult, incrementalResults, changes)
      
      case 'contractReview':
        return this.mergeReviewResults(baseResult, incrementalResults, changes)
      
      case 'analyzeStructure':
        return this.mergeStructureResults(baseResult, incrementalResults, changes)
      
      default:
        return this.mergeGenericResults(baseResult, incrementalResults, changes)
    }
  }

  /**
   * 合并提取结果
   * @param {Object} baseResult - 基础结果
   * @param {Array} incrementalResults - 增量结果
   * @param {Object} changes - 变更信息
   * @returns {Object} 合并结果
   */
  mergeExtractionResults(baseResult, incrementalResults, changes) {
    const merged = { ...baseResult.data }
    
    incrementalResults.forEach(({ result }) => {
      if (result.data && typeof result.data === 'object') {
        Object.keys(result.data).forEach(key => {
          if (!merged[key]) {
            merged[key] = []
          }
          
          if (Array.isArray(result.data[key])) {
            merged[key].push(...result.data[key])
          } else {
            merged[key].push(result.data[key])
          }
        })
      }
    })
    
    // 去重
    Object.keys(merged).forEach(key => {
      merged[key] = [...new Set(merged[key].filter(Boolean))]
    })
    
    return {
      data: merged,
      metadata: {
        ...baseResult.metadata,
        mergeType: 'extraction',
        incrementalUpdates: incrementalResults.length
      }
    }
  }

  /**
   * 合并审查结果
   * @param {Object} baseResult - 基础结果
   * @param {Array} incrementalResults - 增量结果
   * @param {Object} changes - 变更信息
   * @returns {Object} 合并结果
   */
  mergeReviewResults(baseResult, incrementalResults, changes) {
    const merged = {
      issues: [...(baseResult.data?.issues || [])],
      revisions: [...(baseResult.data?.revisions || [])],
      summary: baseResult.data?.summary || ''
    }
    
    incrementalResults.forEach(({ result, position }) => {
      if (result.data) {
        if (result.data.issues) {
          merged.issues.push(...result.data.issues.map(issue => ({
            ...issue,
            position,
            source: 'incremental'
          })))
        }
        
        if (result.data.revisions) {
          merged.revisions.push(...result.data.revisions.map(revision => ({
            ...revision,
            position,
            source: 'incremental'
          })))
        }
        
        if (result.data.summary) {
          merged.summary += '\n\n增量更新: ' + result.data.summary
        }
      }
    })
    
    return {
      data: merged,
      metadata: {
        ...baseResult.metadata,
        mergeType: 'review',
        incrementalUpdates: incrementalResults.length
      }
    }
  }

  /**
   * 合并结构分析结果
   * @param {Object} baseResult - 基础结果
   * @param {Array} incrementalResults - 增量结果
   * @param {Object} changes - 变更信息
   * @returns {Object} 合并结果
   */
  mergeStructureResults(baseResult, incrementalResults, changes) {
    // 结构分析通常需要重新分析整个文档
    // 这里返回最新的增量结果或基础结果
    const latestResult = incrementalResults.length > 0 
      ? incrementalResults[incrementalResults.length - 1].result
      : baseResult
    
    return {
      ...latestResult,
      metadata: {
        ...latestResult.metadata,
        mergeType: 'structure',
        note: 'Structure analysis merged with latest incremental result'
      }
    }
  }

  /**
   * 通用结果合并
   * @param {Object} baseResult - 基础结果
   * @param {Array} incrementalResults - 增量结果
   * @param {Object} changes - 变更信息
   * @returns {Object} 合并结果
   */
  mergeGenericResults(baseResult, incrementalResults, changes) {
    return {
      ...baseResult,
      incrementalUpdates: incrementalResults,
      metadata: {
        ...baseResult.metadata,
        mergeType: 'generic',
        lastIncrementalUpdate: Date.now()
      }
    }
  }

  /**
   * 保存文档版本
   * @param {string} documentId - 文档ID
   * @param {Object} document - 文档对象
   * @param {Object} result - 分析结果
   */
  saveDocumentVersion(documentId, document, result) {
    this.documentVersions.set(documentId, {
      hash: document.hash,
      document: document,
      lastResult: result,
      timestamp: Date.now()
    })
    
    // 限制版本历史数量
    if (this.documentVersions.size > 10) {
      const oldestKey = this.documentVersions.keys().next().value
      this.documentVersions.delete(oldestKey)
    }
  }

  /**
   * 获取文档版本历史
   * @param {string} documentId - 文档ID
   * @returns {Object|null} 版本信息
   */
  getDocumentVersion(documentId) {
    return this.documentVersions.get(documentId) || null
  }

  /**
   * 清除文档版本
   * @param {string} documentId - 文档ID（可选，不提供则清除所有）
   */
  clearDocumentVersions(documentId = null) {
    if (documentId) {
      this.documentVersions.delete(documentId)
      console.log(`已清除文档版本: ${documentId}`)
    } else {
      this.documentVersions.clear()
      console.log('已清除所有文档版本')
    }
  }

  /**
   * 获取增量分析统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const versionCount = this.documentVersions.size
    const cacheStats = this.cacheManager.getStats()
    
    return {
      documentVersions: versionCount,
      cacheStats: cacheStats,
      config: this.config,
      memoryUsage: {
        versions: versionCount,
        changeCache: this.changeCache.size
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.documentVersions.clear()
    this.analysisHistory.clear()
    this.changeCache.clear()
    
    if (this.cacheManager) {
      this.cacheManager.clear()
    }
    
    if (this.aiService) {
      this.aiService.cleanup()
    }
    
    console.log('增量分析管理器资源已清理')
  }
}

export default IncrementalAnalyzer