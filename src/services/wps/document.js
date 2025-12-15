/**
 * WPS 文档内容服务
 * 提供文档读取、结构识别、批注、修订等功能
 */

import { wpsCore } from './core.js'

/**
 * WPS 文档服务类
 */
class WPSDocumentService {
  constructor() {
    this._paragraphCache = { id: null, paragraphs: [] }
  }

  /**
   * 获取当前活动文档
   */
  getDocument() {
    return wpsCore.getActiveDocument()
  }

  /**
   * 检查 WPS 环境并返回文档
   */
  checkWPSEnvironment() {
    wpsCore.checkEnvironment()
    const doc = this.getDocument()
    if (!doc) {
      throw new Error('未找到活动文档')
    }
    return doc
  }

  /**
   * 获取文档完整文本
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
   * 获取段落信息
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
   * 获取文档结构
   */
  getDocumentStructure() {
    const doc = this.checkWPSEnvironment()
    const structure = { paragraphs: [], sections: [] }

    try {
      for (let i = 1; i <= doc.Paragraphs.Count; i++) {
        const para = doc.Paragraphs.Item(i)
        const text = para.Range.Text.trim()
        const isHeading = this.isHeading(para)

        structure.paragraphs.push({
          index: i,
          text,
          isHeading,
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
   * 判断是否是标题
   */
  isHeading(paragraph) {
    try {
      const style = paragraph.Style?.NameLocal || ''
      if (style.includes('标题') || style.includes('Heading')) return true

      const font = paragraph.Range.Font
      if (font.Bold && font.Size > 12) return true

      const text = paragraph.Range.Text.trim()
      const headingPatterns = [
        /^第[一二三四五六七八九十百千万\d]+[条款章]/,
        /^第[一二三四五六七八九十百千万\d]+条/
      ]
      return headingPatterns.some(pattern => pattern.test(text))
    } catch {
      return false
    }
  }

  /**
   * 根据字符位置获取 Range
   */
  getRangeByCharPosition(startChar, endChar) {
    const doc = this.checkWPSEnvironment()
    try {
      return doc.Range(startChar, endChar)
    } catch (error) {
      console.error('获取 Range 失败:', error)
      return null
    }
  }

  /**
   * 根据关键词查找 Range
   */
  findRangeByKeyword(keyword, startChar = 0, endChar = null) {
    this.checkWPSEnvironment()

    try {
      const cleanKeyword = keyword.trim().replace(/\s+/g, ' ')
      if (!cleanKeyword || cleanKeyword.length < 3) {
        console.warn(`[定位] 关键词太短: ${cleanKeyword}`)
        return null
      }

      const paragraphs = this.getParagraphs()
      if (!paragraphs?.length) {
        console.warn('[定位] 无法获取段落信息')
        return null
      }

      const isFullDocSearch = startChar === 0 && endChar === null
      const relevantParagraphs = isFullDocSearch
        ? paragraphs
        : paragraphs.filter(para => {
            if (endChar) return para.startChar < endChar && para.endChar > startChar
            return para.startChar >= startChar
          })

      if (!relevantParagraphs.length) {
        if (endChar !== null) return this.findRangeByKeyword(keyword)
        return null
      }

      // 在段落中查找
      for (const para of relevantParagraphs) {
        const paraText = para.text.trim()
        if (!paraText || paraText.length < cleanKeyword.length) continue

        let index = paraText.indexOf(cleanKeyword)
        if (index !== -1) {
          const paraRange = para.range.Duplicate
          const startOffset = this.findTextPositionInParagraph(paraRange, cleanKeyword)

          if (startOffset !== -1) {
            const targetRange = paraRange.Duplicate
            const actualStart = paraRange.Start + startOffset
            const actualEnd = actualStart + cleanKeyword.length

            if (actualStart >= paraRange.Start && actualEnd <= paraRange.End) {
              targetRange.SetRange(actualStart, actualEnd)
              return targetRange
            }
          }
        }

        // 模糊匹配
        const normalizedParaText = paraText.replace(/\s+/g, ' ')
        const normalizedKeyword = cleanKeyword.replace(/\s+/g, ' ')
        index = normalizedParaText.indexOf(normalizedKeyword)

        if (index !== -1) {
          const paraRange = para.range.Duplicate
          const startOffset = this.findTextPositionInParagraph(paraRange, normalizedKeyword, true)

          if (startOffset !== -1) {
            const targetRange = paraRange.Duplicate
            const actualStart = paraRange.Start + startOffset
            const actualEnd = actualStart + cleanKeyword.length

            if (actualStart >= paraRange.Start && actualEnd <= paraRange.End) {
              targetRange.SetRange(actualStart, actualEnd)
              return targetRange
            }
          }
        }
      }

      // 回退到字符位置查找
      if (!isFullDocSearch && endChar !== null) {
        const fullText = this.getFullText()
        const searchText = fullText.substring(startChar, endChar)
        const index = searchText.indexOf(cleanKeyword)

        if (index !== -1) {
          const actualStart = startChar + index
          const actualEnd = actualStart + cleanKeyword.length
          if (actualStart >= 0 && actualEnd <= fullText.length) {
            return this.getRangeByCharPosition(actualStart, actualEnd)
          }
        }
      }

      return null
    } catch (error) {
      console.error('查找关键词失败:', error)
      return null
    }
  }

  /**
   * 在段落中查找文本位置
   */
  findTextPositionInParagraph(paraRange, keyword, normalize = false) {
    try {
      const findRange = paraRange.Duplicate
      findRange.Find.ClearFormatting()
      findRange.Find.Text = normalize ? keyword.replace(/\s+/g, ' ') : keyword
      findRange.Find.MatchCase = false
      findRange.Find.MatchWholeWord = false

      if (findRange.Find.Execute()) {
        return findRange.Start - paraRange.Start
      }
      return -1
    } catch {
      const paraText = normalize ? paraRange.Text.replace(/\s+/g, ' ') : paraRange.Text
      const searchKeyword = normalize ? keyword.replace(/\s+/g, ' ') : keyword
      return paraText.indexOf(searchKeyword)
    }
  }

  /**
   * 添加批注
   */
  addComment(range, commentText) {
    this.checkWPSEnvironment()
    if (!range) {
      console.warn('Range 为空，无法添加批注')
      return false
    }

    try {
      if (range.Start < 0 || range.End < range.Start) {
        console.warn(`[批注] 无效的 Range: ${range.Start}-${range.End}`)
        return false
      }

      // 检查重复批注
      if (range.Comments?.Count > 0) {
        for (let i = 1; i <= range.Comments.Count; i++) {
          if (range.Comments.Item(i).Range.Text === commentText) {
            return false
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
  addRevision(range, suggestedText, reason) {
    this.checkWPSEnvironment()
    if (!range) {
      console.warn('Range 为空，无法添加修订')
      return false
    }

    try {
      wpsCore.enableRevisionMode()
      range.Text = suggestedText
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
    } catch {
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

// 创建单例
export const wpsDocument = new WPSDocumentService()

// 兼容旧版导出
export { WPSDocumentService, wpsDocument as wpsDocumentService }
