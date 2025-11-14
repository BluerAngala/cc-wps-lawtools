/**
 * 合同审查引擎
 * 提供分段审查、全文审查等功能
 */

import { documentSegmenter } from './documentSegmenter.js'
import { wpsDocumentService } from '../wps/wpsDocumentService.js'
import { reviewAIService } from './reviewAIService.js'
import { reviewChecklistGenerator } from './reviewChecklistGenerator.js'
import { appConfig } from '../../utils/appConfig.js'

export class ContractReviewEngine {
  constructor() {
    this.segmenter = documentSegmenter
    this.wpsService = wpsDocumentService
    this.aiService = reviewAIService
    this._appliedComments = new Set() // 记录已应用的批注，避免重复
  }

  /**
   * 审查流程
   */
  async review(options = {}) {
    // 重置已应用批注记录（每次审查开始时清空）
    this._appliedComments = new Set()
    
    // 1. 获取文档文本和段落信息
    const fullText = this.wpsService.getFullText()
    if (!fullText) {
      throw new Error('无法获取文档内容')
    }

    console.log(`[审查引擎] 文档长度: ${fullText.length}字符`)

    // 2. 获取段落信息（用于改进分段）
    const paragraphs = this.wpsService.getParagraphs() || []
    console.log(`[审查引擎] 获取到 ${paragraphs.length} 个段落`)

    // 3. 智能分段（传入段落信息以改进分段效果）
    const segments = this.segmenter.segmentDocument(fullText, paragraphs)
    console.log(`[审查引擎] 文档分段完成，共 ${segments.length} 段`)

    // 3. 合同类型识别（基于全文）
    console.log(`[审查引擎] 开始识别合同类型...`)
    const contractType = await this.aiService.identifyContractType(fullText)
    console.log(`[审查引擎] 合同类型: ${contractType.type}${contractType.subtype ? ` (${contractType.subtype})` : ''}`)

    // 4. 审查策略选择
    if (options.strategy === 'full') {
      // 全文审查
      return await this.reviewByFullText(fullText, contractType, options)
    } else {
      // 分段审查（推荐）
      return await this.reviewBySegments(segments, fullText, contractType, options)
    }
  }

  /**
   * 分段审查（优化策略：分层审查 + 并行处理）
   */
  async reviewBySegments(segments, fullText, contractType, options) {
    // 生成审查清单（统一使用同一份以确保ID稳定）
    const baseChecklist = reviewChecklistGenerator.generateChecklist(contractType)
    const userRules = options.useCustomRules ? this.getUserReviewRules() : []
    const checklist = reviewChecklistGenerator.mergeUserRules(baseChecklist, userRules)

    const results = {
      issues: [],
      risks: [],
      segments: [],
      contractType: contractType,
      checklistSummary: {},
      checklist
    }

    const reviewedItems = new Set() // 去重

    // 阶段1：全局分析（识别高风险区域）
    let riskAreas = []
    if (options.enableGlobalAnalysis !== false) {
      try {
        console.log(`[审查引擎] 开始全局分析...`)
        if (options.onProgress) {
          // 兼容旧格式和新格式
          if (typeof options.onProgress === 'function') {
            const progressArg = { stage: '全局分析中...', current: 0, total: segments.length }
            // 尝试新格式（对象）
            try {
              options.onProgress(progressArg)
            } catch {
              // 降级到旧格式（current, total, segment, result）
              options.onProgress(0, segments.length)
            }
          }
        }
        
        const globalAnalysis = await this.aiService.analyzeGlobal(fullText)
        riskAreas = globalAnalysis.riskAreas || []
        console.log(`[审查引擎] 全局分析完成，识别到 ${riskAreas.length} 个风险区域`)
        
        // 更新合同类型（如果全局分析返回了更准确的信息）
        if (globalAnalysis.type && globalAnalysis.type !== '未知') {
          contractType.type = globalAnalysis.type
          contractType.subtype = globalAnalysis.subtype || contractType.subtype
        }
      } catch (error) {
        console.warn(`[审查引擎] 全局分析失败，继续使用分段审查:`, error)
      }
    }

    // 阶段2：根据风险区域优先级进行审查
    // 将段按照风险等级分组
    const segmentGroups = this.groupSegmentsByRisk(segments, riskAreas)

    // 先审查高风险区域（批量并行，每批3个）
    if (segmentGroups.high.length > 0) {
      console.log(`[审查引擎] 开始审查高风险区域（${segmentGroups.high.length} 段），批量并行处理...`)
      if (options.onProgress) {
        try {
          options.onProgress({ stage: '审查高风险区域...', current: 0, total: segments.length })
        } catch {
          options.onProgress(0, segments.length)
        }
      }

      const batchSize = 3
      for (let i = 0; i < segmentGroups.high.length; i += batchSize) {
        const batch = segmentGroups.high.slice(i, i + batchSize)
        console.log(`[审查引擎] 处理高风险批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(segmentGroups.high.length/batchSize)}，${batch.length} 段并行`)
        
        const batchResults = await Promise.allSettled(
          batch.map((segment, batchIndex) =>
            this.reviewSegmentWithProgress(segment, fullText, contractType, reviewedItems, options, checklist, i + batchIndex, segmentGroups.high.length)
          )
        )

        // 处理高风险区域结果
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            this.mergeResults(results, result.value.segmentResult)
            results.segments.push(result.value.segmentInfo)
          } else {
            console.error(`[审查引擎] 高风险区域审查失败:`, result.reason)
            results.segments.push({ error: result.reason?.message || '未知错误' })
          }
        })

        // 进度回调
        if (options.onProgress) {
          const current = Math.min(i + batchSize, segmentGroups.high.length)
          options.onProgress({ 
            stage: '审查高风险区域...', 
            current, 
            total: segments.length 
          })
        }
      }
    }

    // 再审查中低风险区域（串行或小批量并行）
    const remainingSegments = [...segmentGroups.medium, ...segmentGroups.low]
    if (remainingSegments.length > 0) {
      console.log(`[审查引擎] 开始审查中低风险区域（${remainingSegments.length} 段）...`)
      
      // 小批量并行（每批3个）
      const batchSize = 3
      for (let i = 0; i < remainingSegments.length; i += batchSize) {
        const batch = remainingSegments.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map((segment, batchIndex) =>
            this.reviewSegmentWithProgress(segment, fullText, contractType, reviewedItems, options, checklist, i + batchIndex, remainingSegments.length)
          )
        )

        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            this.mergeResults(results, result.value.segmentResult)
            results.segments.push(result.value.segmentInfo)
          } else {
            console.error(`[审查引擎] 中低风险区域审查失败:`, result.reason)
            results.segments.push({ error: result.reason?.message || '未知错误' })
          }
        })

        // 进度回调
        if (options.onProgress) {
          const current = Math.min(i + batchSize, remainingSegments.length)
          options.onProgress({ 
            stage: '审查中低风险区域...', 
            current: segmentGroups.high.length + current, 
            total: segments.length 
          })
        }
      }
    }

    // 生成总结
    results.summary = {
      totalIssues: results.issues.length,
      totalRisks: results.risks.length,
      segmentCount: segments.length,
      checklistCount: checklist.length
    }
    results.checklistSummary = this.buildChecklistStats(results.issues)

    return results
  }

  /**
   * 根据风险区域将段分组
   */
  groupSegmentsByRisk(segments, riskAreas) {
    const groups = { high: [], medium: [], low: [] }

    // 构建风险区域映射
    const riskMap = new Map()
    riskAreas.forEach(area => {
      riskMap.set(area.section, area.riskLevel)
    })

    segments.forEach(segment => {
      const sectionTitle = segment.section.title
      const riskLevel = riskMap.get(sectionTitle) || 'low'
      
      if (riskLevel === 'high') {
        groups.high.push(segment)
      } else if (riskLevel === 'medium') {
        groups.medium.push(segment)
      } else {
        groups.low.push(segment)
      }
    })

    return groups
  }

  /**
   * 审查段（带进度信息）
   */
  async reviewSegmentWithProgress(segment, fullText, contractType, reviewedItems, options, checklist, currentIndex, total) {
    console.log(`[审查引擎] 审查段 ${currentIndex + 1}/${total}: ${segment.section.title}`)

    try {
      const segmentResult = await this.reviewSegment(
        segment,
        fullText,
        contractType,
        reviewedItems,
        options,
        checklist
      )

      // 立即应用批注（如果启用）
      if (options.autoApply && segmentResult.issues.length > 0) {
        const appliedCount = await this.applyComments(segment, segmentResult.issues)
        console.log(`[审查引擎] 已应用批注: ${appliedCount}/${segmentResult.issues.length} 个`)
      }

      return {
        segmentResult,
        segmentInfo: {
          issues: segmentResult.issues.length,
          risks: segmentResult.risks.length,
          applied: options.autoApply ? segmentResult.issues.length : 0,
          checklistStats: segmentResult.checklistStats || {}
        }
      }
    } catch (error) {
      console.error(`[审查引擎] 审查段失败:`, error)
      throw error
    }
  }

  /**
   * 审查单个段（结合审查清单）
   */
  async reviewSegment(segment, fullText, contractType, reviewedItems, options, preloadedChecklist = null) {
    // 1. 获取审查清单（若未传入，则重新生成）
    let checklist = preloadedChecklist
    if (!checklist || checklist.length === 0) {
      const baseChecklist = reviewChecklistGenerator.generateChecklist(contractType)
      const userRules = options.useCustomRules ? this.getUserReviewRules() : []
      checklist = reviewChecklistGenerator.mergeUserRules(baseChecklist, userRules)
    }
    
    // 2. 关键：使用完整上下文，而不是只发送段内容
    const context = {
      currentSegment: segment.content,
      fullDocument: fullText, // 完整文档用于上下文
      segmentPosition: {
        section: segment.section.title,
        index: segment.section.number
      },
      checklist: checklist // 传递审查清单
    }

    // 3. AI审查（传递完整上下文和审查清单）
    const aiResult = await this.aiService.reviewClause(
      context,
      contractType,
      options
    )

    // 4. 去重（改进：使用更准确的key，包含keyword和comment的核心部分）
    const uniqueIssues = (aiResult.issues || []).filter(issue => {
      // 提取keyword的核心部分（去除特殊字符，只保留核心文本）
      const keywordCore = (issue.keyword || '').trim()
        .replace(/[：:]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 30)
      
      // 提取comment的核心部分（前50字符）
      const commentCore = (issue.comment || '').trim().substring(0, 50)
      
      // 生成唯一key
      const key = `${keywordCore}_${commentCore}`
      
      if (reviewedItems.has(key)) {
        console.log(`[审查引擎] 跳过重复问题: ${keywordCore.substring(0, 20)}...`)
        return false
      }
      reviewedItems.add(key)
      return true
    })

    // 5. 问题与审查清单匹配
    const matchedIssues = this.matchIssuesToChecklist(uniqueIssues, checklist)
    const checklistStats = this.buildChecklistStats(matchedIssues)

    return {
      issues: matchedIssues,
      risks: aiResult.risks || [],
      checklistStats
    }
  }

  /**
   * 获取用户自定义审查规则
   */
  getUserReviewRules() {
    try {
      const config = appConfig.getConfig()
      const reviewConfig = config.review || {}
      const userRules = reviewConfig.contractReviewRules || []
      
      console.log(`[审查引擎] 加载用户规则: ${userRules.length} 条`)
      
      return userRules
    } catch (error) {
      console.error('获取用户规则失败:', error)
      return []
    }
  }

  /**
   * 全文审查（结合审查清单）
   */
  async reviewByFullText(fullText, contractType, options) {
    console.log('[审查引擎] ========== 全文审查开始 ==========')
    console.log('[审查引擎] 📄 文档长度:', fullText?.length || 0, '字符')
    console.log('[审查引擎] 📋 合同类型:', contractType?.type, contractType?.subtype ? `(${contractType.subtype})` : '')
    console.log('[审查引擎] ⚙️ 选项:', JSON.stringify(options, null, 2))
    
    // 1. 生成审查清单
    const baseChecklist = reviewChecklistGenerator.generateChecklist(contractType)
    console.log('[审查引擎] 📋 基础审查清单:', baseChecklist.length, '项')
    
    // 2. 获取用户自定义规则（仅在useCustomRules为true时）
    const userRules = options.useCustomRules ? this.getUserReviewRules() : []
    console.log('[审查引擎] 📋 用户自定义规则:', userRules.length, '条')
    
    // 3. 合并清单
    const checklist = reviewChecklistGenerator.mergeUserRules(baseChecklist, userRules)
    console.log('[审查引擎] 📋 最终审查清单:', checklist.length, '项')
    
    const context = {
      currentSegment: fullText,
      fullDocument: fullText,
      segmentPosition: {
        section: '全文',
        index: 0
      },
      checklist: checklist // 传递审查清单
    }

    console.log('[审查引擎] 🚀 开始调用 AI 审查服务...')
    const aiStartTime = Date.now()
    
    const aiResult = await this.aiService.reviewClause(
      context,
      contractType,
      options
    )
    
    const aiDuration = Date.now() - aiStartTime
    console.log('[审查引擎] ✅ AI 审查完成，耗时:', aiDuration, 'ms (', (aiDuration / 1000).toFixed(2), '秒)')
    console.log('[审查引擎] 📊 AI 返回结果:')
    console.log('[审查引擎]   - Issues:', aiResult.issues?.length || 0, '个')
    console.log('[审查引擎]   - Risks:', aiResult.risks?.length || 0, '个')

    const matchedIssues = this.matchIssuesToChecklist(aiResult.issues || [], checklist)
    const checklistStats = this.buildChecklistStats(matchedIssues)
    const risks = aiResult.risks || []

    console.log('[审查引擎] 🔍 匹配审查清单完成')
    console.log('[审查引擎]   - 匹配后 Issues:', matchedIssues.length, '个')
    console.log('[审查引擎]   - Risks:', risks.length, '个')
    console.log('[审查引擎]   - 清单统计:', Object.keys(checklistStats).length, '项匹配')

    // 应用批注到文档（全文审查模式）
    let appliedCount = 0
    if (options.autoApply && matchedIssues.length > 0) {
      console.log('[审查引擎] 🔄 开始应用批注到文档...')
      // 创建虚拟segment对象用于批注应用
      const fullSegment = {
        content: fullText,
        startChar: 0,
        endChar: fullText.length,
        section: {
          title: '全文',
          number: 0,
          titleText: ''
        }
      }
      appliedCount = await this.applyComments(fullSegment, matchedIssues)
      console.log('[审查引擎] ✅ 批注应用完成，共应用 ' + appliedCount + ' 个批注')
    }

    const result = {
      issues: matchedIssues,
      risks,
      contractType: contractType,
      checklist, // 返回审查清单
      checklistSummary: checklistStats,
      segments: [
        {
          issues: matchedIssues.length,
          risks: risks.length,
          applied: appliedCount,
          checklistStats
        }
      ],
      summary: {
        totalIssues: matchedIssues.length,
        totalRisks: risks.length,
        checklistCount: checklist.length,
        segmentCount: 1
      }
    }

    console.log('[审查引擎] ========== 全文审查完成 ==========')
    console.log('[审查引擎] 📊 最终结果:')
    console.log('[审查引擎]   - 总问题数:', result.summary.totalIssues)
    console.log('[审查引擎]   - 总风险数:', result.summary.totalRisks)
    console.log('[审查引擎]   - 审查清单项数:', result.summary.checklistCount)
    console.log('[审查引擎]   - 已应用批注:', appliedCount, '个')
    console.log('[审查引擎] =======================================')

    return result
  }

  /**
   * 应用批注到WPS文档 - 支持去重和合并位置接近的批注
   */
  async applyComments(segment, issues) {
    let appliedCount = 0
    let skippedCount = 0
    let duplicateCount = 0
    let mergedCount = 0

    // 全局已应用的批注记录（用于避免重复批注）
    if (!this._appliedComments) {
      this._appliedComments = new Map() // 改为Map，存储位置信息
    }

    // 第一步：去重和合并位置接近的批注
    const mergedIssues = this.mergeNearbyComments(issues)
    console.log(`[审查引擎] 批注合并: ${issues.length} → ${mergedIssues.length}`)
    mergedCount = issues.length - mergedIssues.length

    for (const issue of mergedIssues) {
      const searchKeyword = issue.searchKeyword || issue.keyword || ''
      try {
        // 定位到具体位置
        const range = this.locateIssue(segment, issue)

        if (range) {
          // 检查是否已应用过相同位置的批注
          const positionKey = `${range.Start}_${range.End}`
          if (this._appliedComments.has(positionKey)) {
            duplicateCount++
            console.log(`[审查引擎] ⏭️ 跳过已应用的批注: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
            continue
          }

          // 添加批注（内部会检查是否重复）
          const success = this.wpsService.addComment(range, issue.comment)
          if (success) {
            appliedCount++
            // 记录已应用的批注
            this._appliedComments.set(positionKey, {
              keyword: searchKeyword,
              comment: issue.comment,
              timestamp: Date.now()
            })
            console.log(`[审查引擎] ✅ 批注已添加: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
          } else {
            skippedCount++
            // 即使添加失败，也记录（可能是重复）
            this._appliedComments.set(positionKey, {
              keyword: searchKeyword,
              comment: issue.comment,
              timestamp: Date.now()
            })
            console.warn(`[审查引擎] ⚠️ 批注添加失败（可能重复）: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
          }
        } else {
          skippedCount++
          console.warn(`[审查引擎] ⚠️ 未找到定位点，跳过批注: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
        }
      } catch (error) {
        skippedCount++
        console.error(`[审查引擎] ❌ 添加批注失败:`, error, `问题: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
      }
    }

    if (mergedCount > 0) {
      console.log(`[审查引擎] 合并了 ${mergedCount} 个位置接近的批注`)
    }
    if (duplicateCount > 0) {
      console.log(`[审查引擎] 跳过 ${duplicateCount} 个重复批注`)
    }
    if (skippedCount > 0) {
      console.warn(`[审查引擎] 共跳过 ${skippedCount} 个批注（无法定位）`)
    }

    return appliedCount
  }

  /**
   * 合并位置接近的批注
   * 如果两个批注的关键词距离小于50字符，则合并为一条
   */
  mergeNearbyComments(issues) {
    if (!Array.isArray(issues) || issues.length <= 1) {
      return issues
    }

    const merged = []
    const processed = new Set()
    const DISTANCE_THRESHOLD = 50 // 50字符以内视为接近

    for (let i = 0; i < issues.length; i++) {
      if (processed.has(i)) continue

      const currentIssue = issues[i]
      const currentKeyword = (currentIssue.searchKeyword || currentIssue.keyword || '').trim()
      
      // 查找接近的批注
      const nearbyIssues = [currentIssue]
      for (let j = i + 1; j < issues.length; j++) {
        if (processed.has(j)) continue

        const nextIssue = issues[j]
        const nextKeyword = (nextIssue.searchKeyword || nextIssue.keyword || '').trim()
        
        // 检查关键词是否接近（简单的字符串相似度检查）
        const distance = this.calculateKeywordDistance(currentKeyword, nextKeyword)
        
        if (distance < DISTANCE_THRESHOLD) {
          nearbyIssues.push(nextIssue)
          processed.add(j)
        }
      }

      // 如果有多个接近的批注，合并为一条
      if (nearbyIssues.length > 1) {
        const mergedComment = this.mergeComments(nearbyIssues)
        merged.push({
          ...currentIssue,
          comment: mergedComment,
          _mergedCount: nearbyIssues.length
        })
      } else {
        merged.push(currentIssue)
      }

      processed.add(i)
    }

    return merged
  }

  /**
   * 计算两个关键词的距离（基于编辑距离）
   */
  calculateKeywordDistance(keyword1, keyword2) {
    if (!keyword1 || !keyword2) return 100

    // 简化版本：如果包含相同的核心词，距离为0
    const words1 = keyword1.split(/[\s、。，]/g).filter(w => w.length >= 2)
    const words2 = keyword2.split(/[\s、。，]/g).filter(w => w.length >= 2)

    // 计算共同词的数量
    const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)))
    
    if (commonWords.length > 0) {
      return 0 // 有共同词，视为相同位置
    }

    // 如果没有共同词，返回较大的距离
    return 100
  }

  /**
   * 合并多条批注的内容
   */
  mergeComments(issues) {
    const comments = issues
      .map(issue => (issue.comment || '').trim())
      .filter(comment => comment.length > 0)
      .filter((comment, index, self) => self.indexOf(comment) === index) // 去重

    if (comments.length === 0) {
      return '存在多个相关问题'
    }

    return comments.join('；')
  }

  /**
   * 从comment中提取关键词用于定位
   * 优先级：position > comment中的关键词
   */
  extractKeywordFromComment(comment, position) {
    if (!comment && !position) {
      return null
    }

    // 如果有position（如"第一条"、"合同首部"），尝试使用它
    if (position && position.trim().length >= 2) {
      // 对于"第X条"这样的位置，提取条款编号
      const conditionMatch = position.match(/第([一二三四五六七八九十百千万\d]+)条/)
      if (conditionMatch) {
        return `第${conditionMatch[1]}条`
      }
      
      // 对于"合同首部"、"合同尾部"等，返回原值
      if (position.length >= 3 && position.length <= 20) {
        return position
      }
    }

    // 从comment中提取关键词（取前20-30个字符中的核心词）
    if (comment && comment.trim().length > 0) {
      const commentTrimmed = comment.trim()
      
      // 提取第一句话（以。！？结尾）
      const firstSentence = commentTrimmed.match(/^([^。！？\n]{10,50})[。！？]/)?.[1] || commentTrimmed.substring(0, 30)
      
      if (firstSentence && firstSentence.length >= 5) {
        return firstSentence
      }
    }

    return null
  }

  /**
   * 定位问题位置（智能定位，基于段落精确定位）
   */
  locateIssue(segment, issue) {
    // 方法1：优先使用searchKeyword定位（AI专门返回的定位关键字，最准确）
    let searchKeyword = issue.searchKeyword || issue.keyword
    
    // 如果searchKeyword为空，尝试从comment中提取关键词
    if (!searchKeyword || searchKeyword.trim().length < 3) {
      searchKeyword = this.extractKeywordFromComment(issue.comment, issue.position)
    }
    
    if (searchKeyword && searchKeyword.trim().length >= 3) {
      // 清理keyword，去除特殊字符和标点符号，提取核心文本
      let cleanKeyword = searchKeyword.trim()
      
      // 去除常见的占位符和特殊字符
      cleanKeyword = cleanKeyword
        .replace(/[……]/g, '') // 中文省略号
        .replace(/\.{3,}/g, '') // 英文省略号
        .replace(/【/g, '').replace(/】/g, '') // 中文方括号
        .replace(/\[/g, '').replace(/\]/g, '') // 英文方括号
        .replace(/（/g, '(').replace(/）/g, ')') // 统一括号格式
        .replace(/\s+/g, ' ') // 统一空格
        .trim()
      
      // 提取keyword的核心部分（用于更精准的匹配）
      // 优先提取连续的汉字和数字，去除标点符号
      let searchKeywords = []
      
      // 提取核心文本片段（连续的汉字、数字、字母）
      const extractCoreText = (text) => {
        // 提取连续的汉字、数字、字母（至少3个字符）
        const matches = text.match(/[\u4e00-\u9fa5\d\w]{3,}/g)
        if (matches && matches.length > 0) {
          // 返回最长的匹配片段
          return matches.sort((a, b) => b.length - a.length)[0]
        }
        return null
      }
      
      // 尝试提取核心文本
      const coreText = extractCoreText(cleanKeyword)
      if (coreText && coreText.length >= 3) {
        searchKeywords.push(coreText)
      }
      
      // 根据长度提取不同片段
      if (cleanKeyword.length > 100) {
        // 提取最后50字符和开头50字符的核心部分
        const endPart = cleanKeyword.substring(cleanKeyword.length - 50).trim()
        const startPart = cleanKeyword.substring(0, 50).trim()
        const endCore = extractCoreText(endPart)
        const startCore = extractCoreText(startPart)
        if (endCore && endCore.length >= 3) searchKeywords.push(endCore)
        if (startCore && startCore.length >= 3) searchKeywords.push(startCore)
      } else if (cleanKeyword.length > 50) {
        // 提取最后30字符和开头30字符的核心部分
        const endPart = cleanKeyword.substring(cleanKeyword.length - 30).trim()
        const startPart = cleanKeyword.substring(0, 30).trim()
        const endCore = extractCoreText(endPart)
        const startCore = extractCoreText(startPart)
        if (endCore && endCore.length >= 3) searchKeywords.push(endCore)
        if (startCore && startCore.length >= 3) searchKeywords.push(startCore)
      } else if (cleanKeyword.length > 20) {
        // 提取最后20字符和开头20字符的核心部分
        const endPart = cleanKeyword.substring(cleanKeyword.length - 20).trim()
        const startPart = cleanKeyword.substring(0, 20).trim()
        const endCore = extractCoreText(endPart)
        const startCore = extractCoreText(startPart)
        if (endCore && endCore.length >= 3) searchKeywords.push(endCore)
        if (startCore && startCore.length >= 3) searchKeywords.push(startCore)
      } else {
        // 直接使用清理后的keyword
        if (cleanKeyword.length >= 3) {
          searchKeywords.push(cleanKeyword)
        }
      }
      
      // 去重
      searchKeywords = [...new Set(searchKeywords)]
      
      // 按优先级尝试匹配（从最长的核心文本开始）
      searchKeywords.sort((a, b) => b.length - a.length)
      
      for (const searchKeyword of searchKeywords) {
        if (searchKeyword.length < 3) continue
        
        // 先在段内查找
        const keywordRange = this.wpsService.findRangeByKeyword(
          searchKeyword,
          segment.startChar,
          segment.endChar
        )
        
        if (keywordRange) {
          console.log(`[定位] ✅ 找到关键词: ${searchKeyword.substring(0, 30)}...`)
          return keywordRange
        }
      }
      
      // 如果核心文本都失败，尝试使用清理后的完整keyword（去除特殊字符）
      if (cleanKeyword.length >= 5) {
        const keywordRange = this.wpsService.findRangeByKeyword(
          cleanKeyword,
          segment.startChar,
          segment.endChar
        )
        
        if (keywordRange) {
          console.log(`[定位] ✅ 找到清理后的完整关键词`)
          return keywordRange
        }
      }
      
      // 优化：如果在段内找不到关键词，直接跳过，不要强制全文档查找
      // 这样可以避免跨段批注导致的问题
      const displayKeyword = searchKeywords.length > 0 
        ? searchKeywords[0].substring(0, 30) 
        : cleanKeyword.substring(0, 30)
      console.warn(`[定位] ⚠️ 在段内未找到关键词，跳过该批注（避免跨段定位）: ${displayKeyword}...`)
    }

    // 方法2：基于position定位（如果提供了章节号）
    if (issue.position) {
      const positionRange = this.wpsService.findRangeByPosition(issue.position, segment)
      if (positionRange) {
        console.log(`[定位] ✅ 通过position定位: ${issue.position}`)
        return positionRange
      }
    }

    // 方法3：如果所有定位都失败，返回null（不添加批注，避免错误定位）
    console.warn(`[定位] ❌ 无法定位问题，跳过批注。keyword: ${issue.keyword?.substring(0, 30) || '无'}, position: ${issue.position || '无'}`)
    return null
  }

  /**
   * 将问题与审查清单匹配，返回带有 checklistId 的问题列表
   */
  matchIssuesToChecklist(issues, checklist) {
    if (!Array.isArray(issues) || issues.length === 0) {
      return []
    }

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return issues.map(issue => ({ ...issue, checklistId: issue.checklistId || null }))
    }

    const checklistMap = new Map()
    checklist.forEach(item => {
      if (item && item.id) {
        checklistMap.set(item.id, {
          id: item.id,
          name: (item.name || '').toLowerCase(),
          keywords: (item.keywords || []).map(keyword => (keyword || '').toLowerCase())
        })
      }
    })

    return issues.map(issue => {
      if (issue.checklistId && checklistMap.has(issue.checklistId)) {
        return { ...issue, checklistId: issue.checklistId }
      }

      const textParts = [
        issue.keyword || '',
        issue.comment || '',
        issue.position || ''
      ]
      const combinedText = textParts.join(' ').toLowerCase()

      let bestMatchId = null
      let bestScore = 0

      checklistMap.forEach(item => {
        let score = 0

        if (item.name && combinedText.includes(item.name)) {
          score += 10
        }

        item.keywords.forEach(keyword => {
          if (keyword && combinedText.includes(keyword)) {
            score += keyword.length >= 4 ? 6 : 3
          }
        })

        if (
          issue.position &&
          item.name &&
          issue.position.toLowerCase().includes(item.name)
        ) {
          score += 4
        }

        if (score > bestScore) {
          bestScore = score
          bestMatchId = item.id
        }
      })

      return {
        ...issue,
        checklistId: bestScore > 0 ? bestMatchId : null
      }
    })
  }

  /**
   * 构建审查清单统计信息
   */
  buildChecklistStats(issues) {
    const stats = {}

    if (!Array.isArray(issues) || issues.length === 0) {
      return stats
    }

    issues.forEach(issue => {
      if (!issue || !issue.checklistId) {
        return
      }

      if (!stats[issue.checklistId]) {
        stats[issue.checklistId] = {
          count: 0,
          issues: []
        }
      }

      stats[issue.checklistId].count += 1
      stats[issue.checklistId].issues.push(issue)
    })

    return stats
  }

  /**
   * 合并结果
   */
  mergeResults(results, segmentResult) {
    if (segmentResult.issues) {
      results.issues.push(...segmentResult.issues)
    }
    if (segmentResult.risks) {
      results.risks.push(...segmentResult.risks)
    }
    if (segmentResult.checklistStats) {
      Object.entries(segmentResult.checklistStats).forEach(([checklistId, stat]) => {
        if (!checklistId) {
          return
        }
        if (!results.checklistSummary[checklistId]) {
          results.checklistSummary[checklistId] = {
            count: 0,
            issues: []
          }
        }
        results.checklistSummary[checklistId].count += stat.count || 0
        if (Array.isArray(stat.issues) && stat.issues.length > 0) {
          results.checklistSummary[checklistId].issues.push(...stat.issues)
        }
      })
    }
  }
}

export const contractReviewEngine = new ContractReviewEngine()

