import { wpsCore } from './core.js'

class WPSDocumentService {
  constructor() {
    this._paragraphCache = { id: null, paragraphs: [] }
  }

  getDocument() {
    return wpsCore.getActiveDocument()
  }

  checkWPSEnvironment() {
    wpsCore.checkEnvironment()
    const doc = this.getDocument()
    if (!doc) {
      throw new Error('未找到活动文档')
    }
    return doc
  }

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

  getRangeByCharPosition(startChar, endChar) {
    const doc = this.checkWPSEnvironment()
    try {
      return doc.Range(startChar, endChar)
    } catch (error) {
      console.error('获取 Range 失败:', error)
      return null
    }
  }

  findRangeByKeyword(keyword) {
    const doc = this.checkWPSEnvironment()
    const cleanKeyword = keyword.trim().replace(/\s+/g, ' ')
    if (!cleanKeyword || cleanKeyword.length < 2) {
      console.warn(`[定位] 关键词太短: "${cleanKeyword}"`)
      return null
    }

    try {
      const found = this._findTextInDoc(doc, cleanKeyword)
      if (found) {
        console.log(`[定位] 精确找到关键词: Start=${found.Start}, End=${found.End}`)
        return found
      }

      const foundNorm = this._findTextInDoc(doc, cleanKeyword, true)
      if (foundNorm) {
        console.log(`[定位] 规范化匹配找到关键词: Start=${foundNorm.Start}, End=${foundNorm.End}`)
        return foundNorm
      }

      const partial = this._findPartialInDoc(doc, cleanKeyword)
      if (partial) {
        console.log(`[定位] 部分匹配找到关键词: Start=${partial.Start}, End=${partial.End}`)
        return partial
      }

      const textMatch = this._findByTextScan(doc, cleanKeyword)
      if (textMatch) {
        console.log(`[定位] 文本扫描找到关键词: Start=${textMatch.Start}, End=${textMatch.End}`)
        return textMatch
      }

      console.warn(`[定位] 未找到关键词: "${cleanKeyword.substring(0, 30)}..."`)
      return null
    } catch (error) {
      console.error('查找关键词失败:', error)
      return null
    }
  }

  _findTextInDoc(doc, keyword, normalize = false) {
    try {
      const searchKeyword = normalize ? this._normalizeForSearch(keyword) : keyword
      const searchRange = doc.Range(0, 0)
      searchRange.Find.ClearFormatting()
      searchRange.Find.Text = searchKeyword
      searchRange.Find.MatchCase = false
      searchRange.Find.MatchWholeWord = false
      searchRange.Find.MatchWildcards = false
      searchRange.Find.Forward = true
      searchRange.Find.Wrap = 0

      if (searchRange.Find.Execute()) {
        const matchStart = searchRange.Start
        const matchEnd = searchRange.End
        if (matchStart >= 0 && matchEnd > matchStart) {
          return doc.Range(matchStart, matchEnd)
        }
      }
    } catch (e) {
      console.warn('[定位] Find.Execute 搜索失败:', e.message)
    }
    return null
  }

  _normalizeForSearch(text) {
    return text
      .replace(/[\u3000]/g, ' ')
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/[，]/g, ',')
      .replace(/[。]/g, '.')
      .replace(/[；]/g, ';')
      .replace(/[：]/g, ':')
      .replace(/[""'']/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
  }

  _findPartialInDoc(doc, keyword) {
    if (keyword.length < 6) return null

    try {
      const chunks = this._splitKeyword(keyword)
      for (const chunk of chunks) {
        if (chunk.length < 4) continue
        const found = this._findTextInDoc(doc, chunk)
        if (found) return found
      }
    } catch (e) {
      console.warn('[定位] 部分匹配搜索失败:', e)
    }
    return null
  }

  _splitKeyword(keyword) {
    const chunks = []
    for (let len = Math.floor(keyword.length * 0.6); len >= Math.min(6, keyword.length); len--) {
      for (let offset = 0; offset + len <= keyword.length; offset += Math.max(1, Math.floor(len / 2))) {
        chunks.push(keyword.substring(offset, offset + len))
      }
    }
    return chunks
  }

  _findByTextScan(doc, keyword) {
    try {
      const fullText = doc.Range().Text
      const normalizedFull = this._normalizeForSearch(fullText)
      const normalizedKeyword = this._normalizeForSearch(keyword)

      let idx = normalizedFull.indexOf(normalizedKeyword)
      if (idx === -1 && normalizedKeyword.length >= 6) {
        const partial = normalizedKeyword.substring(0, Math.ceil(normalizedKeyword.length * 0.7))
        idx = normalizedFull.indexOf(partial)
      }
      if (idx === -1) return null

      const paraStarts = this._getParagraphStartPositions(doc)
      let paraIdx = -1
      for (let i = paraStarts.length - 1; i >= 0; i--) {
        if (paraStarts[i] <= idx) {
          paraIdx = i
          break
        }
      }
      if (paraIdx < 0) return null

      const para = doc.Paragraphs.Item(paraIdx + 1)
      const paraRange = para.Range
      if (paraRange) {
        return doc.Range(paraRange.Start, paraRange.End)
      }
    } catch (e) {
      console.warn('[定位] 文本扫描失败:', e)
    }
    return null
  }

  _getParagraphStartPositions(doc) {
    const positions = []
    try {
      for (let i = 1; i <= doc.Paragraphs.Count; i++) {
        const paraRange = doc.Paragraphs.Item(i).Range
        positions.push(paraRange.Start)
      }
    } catch (e) {
      console.warn('[定位] 获取段落位置失败:', e)
    }
    return positions
  }

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

  addRevision(range, suggestedText, reason) {
    this.checkWPSEnvironment()
    if (!range) {
      console.warn('Range 为空，无法添加修订')
      return false
    }

    try {
      const originalStart = range.Start
      const originalEnd = range.End
      const keywordLen = originalEnd - originalStart

      if (keywordLen <= 0 || keywordLen > 500) {
        console.warn(`[修订] Range 长度异常: ${keywordLen}，Start=${originalStart}, End=${originalEnd}，可能指向了全文`)
        return false
      }

      const doc = this.getDocument()
      const docEnd = doc.Range().End
      const ratio = keywordLen / docEnd
      if (ratio > 0.5) {
        console.warn(`[修订] Range 覆盖文档 ${Math.round(ratio * 100)}%，可能指向了全文，拒绝执行`)
        return false
      }

      wpsCore.enableRevisionMode()
      range.Text = suggestedText
      if (reason) {
        try {
          const newRange = doc.Range(originalStart, originalStart + suggestedText.length)
          newRange.Comments?.Add(newRange, `修订原因：${reason}`)
        } catch {
          console.warn('[修订] 添加修订原因批注失败，跳过')
        }
      }
      return true
    } catch (error) {
      console.error('添加修订失败:', error)
      return false
    }
  }

  locateAndSelect(keyword, action) {
    this.checkWPSEnvironment()
    const cleanKeyword = keyword.trim().replace(/\s+/g, ' ')
    if (!cleanKeyword || cleanKeyword.length < 2) return false

    try {
      if (cleanKeyword.length >= 10) {
        const range = this.findRangeByKeyword(cleanKeyword)
        if (range) {
          range.Select()
          return true
        }
      }

      if (action?.type === 'revision' && action.newText) {
        const ctxCandidate = this._extractContextFromRevision(action)
        if (ctxCandidate) {
          const range = this.findRangeByKeyword(ctxCandidate)
          if (range) {
            range.Select()
            return true
          }
        }
      }

      if (cleanKeyword.length >= 4 && cleanKeyword.length < 10) {
        const range = this.findRangeByKeyword(cleanKeyword)
        const doc = this.getDocument()
        if (range && doc) {
          const matchLen = range.End - range.Start
          const docEnd = doc.Range().End
          if (docEnd > 0 && matchLen / docEnd < 0.3) {
            range.Select()
            return true
          }
        }
      }

      console.warn(`[定位] 所有策略均未找到关键词: "${cleanKeyword.substring(0, 30)}..."`)
      return false
    } catch (error) {
      console.error('定位关键词失败:', error)
      return false
    }
  }

  _extractContextFromRevision(action) {
    const keyword = (action.keyword || '').trim()
    const newText = (action.newText || '').trim()
    if (!newText) return null

    const commonParts = newText.split(/[。；，、\n]/).filter(p => p.trim().length >= 6)
    for (const part of commonParts) {
      const trimmed = part.trim()
      if (trimmed.length >= 6 && !keyword.includes(trimmed.substring(0, 4))) {
        return trimmed
      }
    }

    if (newText.length >= 8) {
      return newText.substring(0, Math.min(30, newText.length))
    }

    return null
  }

  isDocumentAvailable() {
    try {
      return this.getDocument() !== null
    } catch {
      return false
    }
  }

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

  getDocumentId(doc) {
    return doc?.FullName || doc?.Name || ''
  }
}

export const wpsDocument = new WPSDocumentService()

export { WPSDocumentService, wpsDocument as wpsDocumentService }
