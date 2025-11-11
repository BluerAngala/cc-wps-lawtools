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
   * 分段审查（推荐策略）
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

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      console.log(`[审查引擎] 审查第 ${i + 1}/${segments.length} 段: ${segment.section.title}`)

      try {
        // 审查当前段（带完整上下文）
        const segmentResult = await this.reviewSegment(
          segment,
          fullText, // 传递全文，用于上下文理解
          contractType,
          reviewedItems,
          options,
          checklist
        )

        // 合并结果
        this.mergeResults(results, segmentResult)

        // 立即应用批注（如果启用）
        if (options.autoApply && segmentResult.issues.length > 0) {
          const appliedCount = await this.applyComments(segment, segmentResult.issues)
          console.log(`[审查引擎] 已应用批注: ${appliedCount}/${segmentResult.issues.length} 个`)
        }

        // 记录段结果（不记录segment标题，避免暴露内部分段信息）
        results.segments.push({
          issues: segmentResult.issues.length,
          risks: segmentResult.risks.length,
          applied: options.autoApply ? segmentResult.issues.length : 0,
          checklistStats: segmentResult.checklistStats || {}
        })

        // 进度回调
        if (options.onProgress) {
          options.onProgress(i + 1, segments.length, segment, segmentResult)
        }
      } catch (error) {
        console.error(`[审查引擎] 审查第 ${i + 1} 段失败:`, error)
        results.segments.push({
          error: error.message
        })
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
    // 1. 生成审查清单
    const baseChecklist = reviewChecklistGenerator.generateChecklist(contractType)
    
    // 2. 获取用户自定义规则（仅在useCustomRules为true时）
    const userRules = options.useCustomRules ? this.getUserReviewRules() : []
    
    // 3. 合并清单
    const checklist = reviewChecklistGenerator.mergeUserRules(baseChecklist, userRules)
    
    const context = {
      currentSegment: fullText,
      fullDocument: fullText,
      segmentPosition: {
        section: '全文',
        index: 0
      },
      checklist: checklist // 传递审查清单
    }

    const aiResult = await this.aiService.reviewClause(
      context,
      contractType,
      options
    )

    const matchedIssues = this.matchIssuesToChecklist(aiResult.issues || [], checklist)
    const checklistStats = this.buildChecklistStats(matchedIssues)
    const risks = aiResult.risks || []

    return {
      issues: matchedIssues,
      risks,
      contractType: contractType,
      checklist, // 返回审查清单
      checklistSummary: checklistStats,
      segments: [
        {
          issues: matchedIssues.length,
          risks: risks.length,
          applied: options.autoApply ? matchedIssues.length : 0,
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
  }

  /**
   * 应用批注到WPS文档
   */
  async applyComments(segment, issues) {
    let appliedCount = 0
    let skippedCount = 0
    let duplicateCount = 0

    // 全局已应用的批注记录（用于避免重复批注）
    if (!this._appliedComments) {
      this._appliedComments = new Set()
    }

    for (const issue of issues) {
      try {
        // 检查是否已应用过相同内容的批注
        const searchKeyword = issue.searchKeyword || issue.keyword || ''
        const commentKey = `${searchKeyword.trim().substring(0, 30)}_${(issue.comment || '').trim().substring(0, 50)}`
        if (this._appliedComments.has(commentKey)) {
          duplicateCount++
          console.log(`[审查引擎] ⏭️ 跳过已应用的批注: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
          continue
        }

        // 定位到具体位置
        const range = this.locateIssue(segment, issue)

        if (range) {
          // 添加批注（内部会检查是否重复）
          const success = this.wpsService.addComment(range, issue.comment)
          if (success) {
            appliedCount++
            // 记录已应用的批注
            this._appliedComments.add(commentKey)
            console.log(`[审查引擎] ✅ 批注已添加: ${(searchKeyword || issue.position || '未知').substring(0, 30)}...`)
          } else {
            skippedCount++
            // 即使添加失败，也记录（可能是重复）
            this._appliedComments.add(commentKey)
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

    if (duplicateCount > 0) {
      console.log(`[审查引擎] 跳过 ${duplicateCount} 个重复批注`)
    }
    if (skippedCount > 0) {
      console.warn(`[审查引擎] 共跳过 ${skippedCount} 个批注（无法定位）`)
    }

    return appliedCount
  }

  /**
   * 定位问题位置（智能定位，基于段落精确定位）
   */
  locateIssue(segment, issue) {
    // 方法1：优先使用searchKeyword定位（AI专门返回的定位关键字，最准确）
    const searchKeyword = issue.searchKeyword || issue.keyword
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
      
      // 如果keyword匹配完全失败，尝试在整个文档中查找（不限制在segment内）
      // 优先使用最长的核心文本
      for (const searchKeyword of searchKeywords) {
        if (searchKeyword.length < 3) continue
        console.warn(`[定位] ⚠️ 在段内未找到关键词，尝试全文档查找: ${searchKeyword.substring(0, 30)}...`)
        const fullDocRange = this.wpsService.findRangeByKeyword(searchKeyword)
        if (fullDocRange) {
          console.log(`[定位] ✅ 在全文档中找到关键词`)
          return fullDocRange
        }
      }
      
      // 最后尝试完整keyword全文档查找
      if (cleanKeyword.length >= 5) {
        const fullDocRange = this.wpsService.findRangeByKeyword(cleanKeyword)
        if (fullDocRange) {
          console.log(`[定位] ✅ 在全文档中找到完整关键词`)
          return fullDocRange
        }
      }
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

