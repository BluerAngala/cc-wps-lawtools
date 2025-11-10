/**
 * WPS 文档服务
 * 提供文档读取、结构识别、批注应用等功能
 */

export class WPSDocumentService {
  constructor() {
    this.doc = null
    this.init()
  }

  init() {
    if (typeof window.Application !== 'undefined') {
      this.doc = window.Application.ActiveDocument
    }
  }

  /**
   * 检查WPS环境
   */
  checkWPSEnvironment() {
    if (typeof window.Application === 'undefined') {
      throw new Error('请在 WPS 环境中使用此功能')
    }
    if (!this.doc) {
      throw new Error('未找到活动文档')
    }
    return true
  }

  /**
   * 获取文档完整文本（保留段落结构）
   */
  getFullText() {
    this.checkWPSEnvironment()
    try {
      // 方法1：直接获取Range文本（可能丢失段落信息）
      const fullText = this.doc.Range().Text
      
      // 方法2：通过段落获取，保留段落结构
      const paragraphs = []
      for (let i = 1; i <= this.doc.Paragraphs.Count; i++) {
        const para = this.doc.Paragraphs.Item(i)
        const paraText = para.Range.Text
        paragraphs.push({
          index: i,
          text: paraText,
          range: para.Range,
          startChar: para.Range.Start,
          endChar: para.Range.End
        })
      }
      
      // 保存段落信息供后续使用
      this._paragraphs = paragraphs
      
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
    if (!this._paragraphs) {
      this.getFullText() // 触发段落信息收集
    }
    return this._paragraphs || []
  }

  /**
   * 获取文档结构（章节、段落）
   */
  getDocumentStructure() {
    this.checkWPSEnvironment()

    const structure = {
      paragraphs: [],
      sections: []
    }

    try {
      // 遍历所有段落
      for (let i = 1; i <= this.doc.Paragraphs.Count; i++) {
        const para = this.doc.Paragraphs.Item(i)
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
    this.checkWPSEnvironment()

    try {
      const fullRange = this.doc.Range()
      const startRange = fullRange.Duplicate
      const endRange = fullRange.Duplicate

      startRange.SetRange(startChar, startChar)
      endRange.SetRange(endChar, endChar)

      const range = this.doc.Range(startRange.Start, endRange.End)
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
      
      // 获取段落信息
      const paragraphs = this.getParagraphs()
      
      // 在指定范围内查找段落
      const relevantParagraphs = paragraphs.filter(para => {
        if (endChar) {
          return para.startChar >= startChar && para.endChar <= endChar
        }
        return para.startChar >= startChar
      })
      
      // 优先在段落中查找（更精准）
      for (const para of relevantParagraphs) {
        const paraText = para.text.trim()
        
        // 尝试精确匹配
        let index = paraText.indexOf(cleanKeyword)
        
        if (index !== -1) {
          // 找到匹配，使用段落的Range进行精确定位
          const paraRange = para.range.Duplicate
          const startOffset = this.findTextPositionInParagraph(paraRange, cleanKeyword)
          
          if (startOffset !== -1) {
            // 创建精确的Range
            const targetRange = paraRange.Duplicate
            const keywordLength = cleanKeyword.length > 50 ? 30 : (cleanKeyword.length > 20 ? 20 : cleanKeyword.length)
            targetRange.SetRange(
              paraRange.Start + startOffset,
              paraRange.Start + startOffset + keywordLength
            )
            return targetRange
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
            const keywordLength = normalizedKeyword.length > 50 ? 30 : (normalizedKeyword.length > 20 ? 20 : normalizedKeyword.length)
            targetRange.SetRange(
              paraRange.Start + startOffset,
              paraRange.Start + startOffset + keywordLength
            )
            return targetRange
          }
        }
      }
      
      // 如果段落查找失败，回退到字符位置查找
      const fullText = this.getFullText()
      const searchText = endChar ? fullText.substring(startChar, endChar) : fullText.substring(startChar)
      
      let index = searchText.indexOf(cleanKeyword)
      if (index === -1) {
        return null
      }

      const actualStart = startChar + index
      let keywordLength = cleanKeyword.length
      if (cleanKeyword.length > 50) {
        keywordLength = 30
      } else if (cleanKeyword.length > 20) {
        keywordLength = 20
      }
      const actualEnd = actualStart + keywordLength

      return this.getRangeByCharPosition(actualStart, actualEnd)
    } catch (error) {
      console.error('查找关键词失败:', error)
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
    this.checkWPSEnvironment()

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
          const targetRange = this.doc.Range(paraRange.Start, midPoint)
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
    this.checkWPSEnvironment()

    if (!range) {
      console.warn('Range为空，无法添加修订')
      return false
    }

    try {
      // 启用修订跟踪
      this.doc.TrackRevisions = true

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
      return typeof window.Application !== 'undefined' && 
             window.Application.ActiveDocument !== null
    } catch (error) {
      return false
    }
  }
}

export const wpsDocumentService = new WPSDocumentService()

