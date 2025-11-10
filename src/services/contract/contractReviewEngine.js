/**
 * 合同审查引擎
 * 提供分段审查、全文审查等功能
 */

import { documentSegmenter } from './documentSegmenter.js'
import { wpsDocumentService } from '../wps/wpsDocumentService.js'
import { reviewAIService } from './reviewAIService.js'

export class ContractReviewEngine {
  constructor() {
    this.segmenter = documentSegmenter
    this.wpsService = wpsDocumentService
    this.aiService = reviewAIService
  }

  /**
   * 审查流程
   */
  async review(options = {}) {
    // 1. 获取文档文本
    const fullText = this.wpsService.getFullText()
    if (!fullText) {
      throw new Error('无法获取文档内容')
    }

    console.log(`[审查引擎] 文档长度: ${fullText.length}字符`)

    // 2. 智能分段
    const segments = this.segmenter.segmentDocument(fullText)
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
    const results = {
      issues: [],
      risks: [],
      segments: [],
      contractType: contractType
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
          options
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
          applied: options.autoApply ? segmentResult.issues.length : 0
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
      segmentCount: segments.length
    }

    return results
  }

  /**
   * 审查单个段
   */
  async reviewSegment(segment, fullText, contractType, reviewedItems, options) {
    // 关键：使用完整上下文，而不是只发送段内容
    const context = {
      currentSegment: segment.content,
      fullDocument: fullText, // 完整文档用于上下文
      segmentPosition: {
        section: segment.section.title,
        index: segment.section.number
      }
    }

    // AI审查（传递完整上下文）
    const aiResult = await this.aiService.reviewClause(
      context,
      contractType,
      options
    )

    // 去重
    const uniqueIssues = (aiResult.issues || []).filter(issue => {
      const key = `${issue.keyword || ''}_${issue.comment?.substring(0, 50) || ''}`
      if (reviewedItems.has(key)) {
        return false
      }
      reviewedItems.add(key)
      return true
    })

    return {
      issues: uniqueIssues,
      risks: aiResult.risks || []
    }
  }

  /**
   * 全文审查
   */
  async reviewByFullText(fullText, contractType, options) {
    const context = {
      currentSegment: fullText,
      fullDocument: fullText,
      segmentPosition: {
        section: '全文',
        index: 0
      }
    }

    const aiResult = await this.aiService.reviewClause(
      context,
      contractType,
      options
    )

    return {
      issues: aiResult.issues || [],
      risks: aiResult.risks || [],
      contractType: contractType,
      summary: {
        totalIssues: (aiResult.issues || []).length,
        totalRisks: (aiResult.risks || []).length
      }
    }
  }

  /**
   * 应用批注到WPS文档
   */
  async applyComments(segment, issues) {
    let appliedCount = 0

    for (const issue of issues) {
      try {
        // 定位到具体位置
        const range = this.locateIssue(segment, issue)

        if (range) {
          // 添加批注
          const success = this.wpsService.addComment(range, issue.comment)
          if (success) {
            appliedCount++
            console.log(`[审查引擎] ✅ 批注已添加: ${issue.keyword || issue.position}`)
          }
        } else {
          console.warn(`[审查引擎] ⚠️ 未找到定位点: ${issue.keyword || issue.position}`)
        }
      } catch (error) {
        console.error(`[审查引擎] ❌ 添加批注失败:`, error)
      }
    }

    return appliedCount
  }

  /**
   * 定位问题位置（智能定位，基于段落精确定位）
   */
  locateIssue(segment, issue) {
    // 方法1：基于keyword精确定位（最准确，使用段落信息）
    if (issue.keyword && issue.keyword.trim().length >= 3) {
      // 清理keyword，提取核心关键词（去除换行符和多余空格）
      const cleanKeyword = issue.keyword.trim().replace(/\s+/g, ' ')
      
      // 提取keyword的核心部分（用于更精准的匹配）
      // 优先使用keyword的最后部分（通常是问题所在的具体文字）
      let searchKeywords = []
      
      if (cleanKeyword.length > 100) {
        // 如果keyword很长，提取最后50字符（通常是问题所在的具体文字）
        searchKeywords.push(cleanKeyword.substring(cleanKeyword.length - 50).trim())
        searchKeywords.push(cleanKeyword.substring(0, 50).trim())
      } else if (cleanKeyword.length > 50) {
        // 提取最后30字符和开头30字符
        searchKeywords.push(cleanKeyword.substring(cleanKeyword.length - 30).trim())
        searchKeywords.push(cleanKeyword.substring(0, 30).trim())
      } else if (cleanKeyword.length > 20) {
        // 提取最后20字符和开头20字符
        searchKeywords.push(cleanKeyword.substring(cleanKeyword.length - 20).trim())
        searchKeywords.push(cleanKeyword.substring(0, 20).trim())
      } else {
        // 直接使用完整keyword
        searchKeywords.push(cleanKeyword)
      }
      
      // 按优先级尝试匹配
      for (const searchKeyword of searchKeywords) {
        if (searchKeyword.length < 3) continue
        
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
      
      // 如果都失败，尝试完整keyword
      const keywordRange = this.wpsService.findRangeByKeyword(
        cleanKeyword,
        segment.startChar,
        segment.endChar
      )
      
      if (keywordRange) {
        return keywordRange
      }
    }

    // 方法2：基于position定位（如果提供了章节号）
    if (issue.position) {
      const positionRange = this.wpsService.findRangeByPosition(issue.position, segment)
      if (positionRange) {
        return positionRange
      }
    }

    // 方法3：基于段范围定位（兜底，但尽量缩小范围）
    // 如果段内容太长，只定位到段的前半部分
    const segmentLength = segment.endChar - segment.startChar
    if (segmentLength > 500) {
      // 如果段太长，只定位到前500字符
      return this.wpsService.getRangeByCharPosition(
        segment.startChar,
        segment.startChar + 500
      )
    }
    
    return this.wpsService.getRangeByCharPosition(
      segment.startChar,
      segment.endChar
    )
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
  }
}

export const contractReviewEngine = new ContractReviewEngine()

