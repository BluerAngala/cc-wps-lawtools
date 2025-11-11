import Util from './wpsUtils.js'

/**
 * WPS 文档服务
 * 提供文档读取、结构识别、批注应用等功能
 */

export class WPSDocumentService {
  constructor(wpsService = Util?.wpsService) {
    this.wpsService = wpsService
    this._paragraphCache = {
      id: null,
      paragraphs: []
    }
  }

  /**
   * 获取当前活动文档
   */
  getDocument() {
    if (this.wpsService && typeof this.wpsService.getActiveDoc === 'function') {
      return this.wpsService.getActiveDoc()
    }
    try {
      return window.Application?.ActiveDocument ?? null
    } catch (error) {
      console.warn('获取活动文档失败:', error)
      return null
    }
  }

  /**
   * 检查WPS环境
   */
  checkWPSEnvironment() {
    const doc = this.getDocument()
    if (typeof window.Application === 'undefined') {
      throw new Error('请在 WPS 环境中使用此功能')
    }
    if (!doc) {
      throw new Error('未找到活动文档')
    }
    return doc
  }

  /**
   * 获取文档完整文本（保留段落结构）
   */
  getFullText() {
    const doc = this.checkWPSEnvironment()
    try {
      const fullText = doc.Range().Text
      this._paragraphCache = {
        id: this.getDocumentId(doc),
        paragraphs: this.collectParagraphs(doc)
      }
      return fullText
    } catch (error) {
      console.error('获取文档文本失败:', error)
      throw new Error('无法获取文档内容')
    }
  }

  /**
   * 获取段落信息（用于精确定位）
   */
  getParagraphs() {
    const doc = this.getDocument()
    if (!doc) return []

    const docId = this.getDocumentId(doc)

    if (this._paragraphCache.id !== docId) {
      this._paragraphCache = {
        id: docId,
        paragraphs: this.collectParagraphs(doc)
      }
    }

    return this._paragraphCache.paragraphs
  }

  /**
   * 获取文档结构（章节、段落）
   */
  getDocumentStructure() {
    const doc = this.checkWPSEnvironment()

    const structure = {
      paragraphs: [],
      sections: []
    }

    try {
      // 遍历所有段落
      for (let i = 1; i <= doc.Paragraphs.Count; i++) {
        const para = doc.Paragraphs.Item(i)
        const text = para.Range.Text.trim()

        // 判断是否是章节标题（基于样式、格式）
        const isHeading = this.isHeading(para)

        structure.paragraphs.push({
          index: i,
          text: text,
          isHeading: isHeading,
          range: para.Range
        })

        if (isHeading) {
          structure.sections.push({
            title: text,
            paragraphIndex: i,
            range: para.Range
          })
        }
      }
    } catch (error) {
      console.error('获取文档结构失败:', error)
    }

    return structure
  }

  /**
   * 判断是否是标题（基于样式、格式）
   */
  isHeading(paragraph) {
    try {
      // 方法1：检查样式
      const style = paragraph.Style?.NameLocal || ''
      if (style.includes('标题') || style.includes('Heading')) {
        return true
      }

      // 方法2：检查格式（加粗、字号）
      const font = paragraph.Range.Font
      if (font.Bold && font.Size > 12) {
        return true
      }

      // 方法3：检查文本模式（章节标题模式）
      const text = paragraph.Range.Text.trim()
      const headingPatterns = [
        /^第[一二三四五六七八九十百千万\d]+[条款章]/,
        /^第[一二三四五六七八九十百千万\d]+条/
      ]

      return headingPatterns.some(pattern => pattern.test(text))
    } catch (error) {
      return false
    }
  }

  /**
   * 根据字符位置获取 WPS Range
   */
  getRangeByCharPosition(startChar, endChar) {
    const doc = this.checkWPSEnvironment()

    try {
      const fullRange = doc.Range()
      const startRange = fullRange.Duplicate
      const endRange = fullRange.Duplicate

      startRange.SetRange(startChar, startChar)
      endRange.SetRange(endChar, endChar)

      const range = doc.Range(startRange.Start, endRange.End)
      return range
    } catch (error) {
      console.error('获取Range失败:', error)
      return null
    }
  }

  /**
   * 根据关键词查找Range（精确匹配，基于段落定位）
   */
  findRangeByKeyword(keyword, startChar = 0, endChar = null) {
    this.checkWPSEnvironment()

    try {
      // 清理keyword，去除多余空格和换行
      const cleanKeyword = keyword.trim().replace(/\s+/g, ' ')
      
      if (!cleanKeyword || cleanKeyword.length < 3) {
        console.warn(`[定位] 关键词太短: ${cleanKeyword}`)
        return null
      }
      
      // 获取段落信息
      const paragraphs = this.getParagraphs()
      
      if (!paragraphs || paragraphs.length === 0) {
        console.warn('[定位] 无法获取段落信息')
        return null
      }
      
      // 在指定范围内查找段落
      const relevantParagraphs = paragraphs.filter(para => {
        if (endChar) {
          // 段落与目标范围有交集即可
          return para.startChar < endChar && para.endChar > startChar
        }
        return para.startChar >= startChar
      })
      
      if (relevantParagraphs.length === 0) {
        console.warn(`[定位] 在范围内未找到段落: ${startChar}-${endChar || 'end'}`)
        // 如果指定了范围但没找到，尝试全文档查找
        if (endChar !== null) {
          return this.findRangeByKeyword(keyword)
        }
        return null
      }
      
      // 优先在段落中查找（更精准）
      for (const para of relevantParagraphs) {
        const paraText = para.text.trim()
        
        if (!paraText || paraText.length < cleanKeyword.length) {
          continue
        }
        
        // 尝试精确匹配
        let index = paraText.indexOf(cleanKeyword)
        
        if (index !== -1) {
          // 找到匹配，使用段落的Range进行精确定位
          const paraRange = para.range.Duplicate
          const startOffset = this.findTextPositionInParagraph(paraRange, cleanKeyword)
          
          if (startOffset !== -1) {
            // 创建精确的Range
            const targetRange = paraRange.Duplicate
            const keywordLength = cleanKeyword.length
            const actualStart = paraRange.Start + startOffset
            const actualEnd = actualStart + keywordLength
            
            // 确保Range在段落范围内
            if (actualStart >= paraRange.Start && actualEnd <= paraRange.End) {
              targetRange.SetRange(actualStart, actualEnd)
              console.log(`[定位] ✅ 在段落 ${para.index} 中找到精确匹配: ${cleanKeyword.substring(0, 30)}...`)
              return targetRange
            }
          }
        }
        
        // 如果精确匹配失败，尝试模糊匹配（忽略空格）
        const normalizedParaText = paraText.replace(/\s+/g, ' ')
        const normalizedKeyword = cleanKeyword.replace(/\s+/g, ' ')
        index = normalizedParaText.indexOf(normalizedKeyword)
        
        if (index !== -1) {
          // 找到匹配，使用段落的Range进行精确定位
          const paraRange = para.range.Duplicate
          const startOffset = this.findTextPositionInParagraph(paraRange, normalizedKeyword, true)
          
          if (startOffset !== -1) {
            const targetRange = paraRange.Duplicate
            const keywordLength = cleanKeyword.length
            const actualStart = paraRange.Start + startOffset
            const actualEnd = actualStart + keywordLength
            
            // 确保Range在段落范围内
            if (actualStart >= paraRange.Start && actualEnd <= paraRange.End) {
              targetRange.SetRange(actualStart, actualEnd)
              console.log(`[定位] ✅ 在段落 ${para.index} 中找到模糊匹配: ${cleanKeyword.substring(0, 30)}...`)
              return targetRange
            }
          }
        }
      }
      
      // 如果段落查找失败，回退到字符位置查找（仅在指定范围内）
      if (endChar !== null) {
        const fullText = this.getFullText()
        const searchText = fullText.substring(startChar, endChar)
        
        let index = searchText.indexOf(cleanKeyword)
        if (index !== -1) {
          const actualStart = startChar + index
          const keywordLength = cleanKeyword.length
          const actualEnd = actualStart + keywordLength
          
          console.log(`[定位] ✅ 通过字符位置找到: ${cleanKeyword.substring(0, 30)}...`)
          return this.getRangeByCharPosition(actualStart, actualEnd)
        }
      }
      
      console.warn(`[定位] ❌ 未找到关键词: ${cleanKeyword.substring(0, 30)}...`)
      return null
    } catch (error) {
      console.error('查找关键词失败:', error, `keyword: ${keyword?.substring(0, 30)}...`)
      return null
    }
  }

  /**
   * 在段落中查找文本位置（使用WPS API的Find方法，更精准）
   */
  findTextPositionInParagraph(paraRange, keyword, normalize = false) {
    try {
      // 使用WPS的Find方法进行查找（更精准）
      const findRange = paraRange.Duplicate
      findRange.Find.ClearFormatting()
      findRange.Find.Text = normalize ? keyword.replace(/\s+/g, ' ') : keyword
      findRange.Find.MatchCase = false
      findRange.Find.MatchWholeWord = false
      
      const found = findRange.Find.Execute()
      
      if (found) {
        // 返回相对于段落起始位置的偏移
        return findRange.Start - paraRange.Start
      }
      
      return -1
    } catch (error) {
      console.error('在段落中查找文本失败:', error)
      // 回退到字符串查找
      const paraText = normalize 
        ? paraRange.Text.replace(/\s+/g, ' ')
        : paraRange.Text
      const index = paraText.indexOf(normalize ? keyword.replace(/\s+/g, ' ') : keyword)
      return index !== -1 ? index : -1
    }
  }

  /**
   * 根据章节号查找Range（基于段落）
   */
  findRangeByPosition(position, segment) {
    const doc = this.checkWPSEnvironment()

    try {
      const paragraphs = this.getParagraphs()
      
      // 在segment范围内查找匹配的段落
      const relevantParagraphs = paragraphs.filter(para => {
        return para.startChar >= segment.startChar && para.endChar <= segment.endChar
      })
      
      // 查找包含position的段落
      for (const para of relevantParagraphs) {
        const paraText = para.text.trim()
        
        // 检查段落是否包含position（如"第八条"、"第4款"等）
        if (paraText.includes(position) || position.includes(paraText.substring(0, 20))) {
          // 返回段落的前半部分（更精准）
          const paraRange = para.range.Duplicate
          const midPoint = paraRange.Start + Math.floor((paraRange.End - paraRange.Start) / 2)
          const targetRange = doc.Range(paraRange.Start, midPoint)
          return targetRange
        }
      }
      
      return null
    } catch (error) {
      console.error('根据position查找失败:', error)
      return null
    }
  }

  /**
   * 添加批注
   */
  addComment(range, commentText) {
    this.checkWPSEnvironment()

    if (!range) {
      console.warn('Range为空，无法添加批注')
      return false
    }

    try {
      // 检查是否已有批注
      if (range.Comments && range.Comments.Count > 0) {
        // 检查是否重复
        for (let i = 1; i <= range.Comments.Count; i++) {
          const existingComment = range.Comments.Item(i)
          if (existingComment.Range.Text === commentText) {
            console.log('批注已存在，跳过')
            return false // 重复批注
          }
        }
      }

      range.Comments?.Add(range, commentText)
      return true
    } catch (error) {
      console.error('添加批注失败:', error)
      return false
    }
  }

  /**
   * 添加修订标记
   */
  addRevision(range, originalText, revisedText, reason) {
    const doc = this.checkWPSEnvironment()

    if (!range) {
      console.warn('Range为空，无法添加修订')
      return false
    }

    try {
      // 启用修订跟踪
      doc.TrackRevisions = true

      // 替换文本（会自动标记为修订）
      range.Text = revisedText

      // 添加批注说明修订原因
      if (reason) {
        range.Comments?.Add(range, `修订原因：${reason}`)
      }

      return true
    } catch (error) {
      console.error('添加修订失败:', error)
      return false
    }
  }

  /**
   * 检查文档是否可用
   */
  isDocumentAvailable() {
    try {
      return this.getDocument() !== null
    } catch (error) {
      return false
    }
  }

  /**
   * 收集文档段落信息
   */
  collectParagraphs(doc) {
    const paragraphs = []
    try {
      for (let i = 1; i <= doc.Paragraphs.Count; i++) {
        const para = doc.Paragraphs.Item(i)
        const paraRange = para.Range
        paragraphs.push({
          index: i,
          text: paraRange.Text,
          range: paraRange,
          startChar: paraRange.Start,
          endChar: paraRange.End
        })
      }
    } catch (error) {
      console.error('收集段落信息失败:', error)
    }
    return paragraphs
  }

  /**
   * 获取文档唯一标识
   */
  getDocumentId(doc) {
    return doc?.FullName || doc?.Name || ''
  }
}

export const wpsDocumentService = new WPSDocumentService()

