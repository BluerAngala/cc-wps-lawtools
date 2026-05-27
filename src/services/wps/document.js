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
      return headingPatterns.some((pattern) => pattern.test(text))
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

      const paraMatch = this._findByParagraphScan(doc, cleanKeyword)
      if (paraMatch) {
        console.log(`[定位] 段落扫描找到关键词: Start=${paraMatch.Start}, End=${paraMatch.End}`)
        return paraMatch
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
    return this._stripControlChars(text)
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

  _stripControlChars(text) {
    const ctrl = '\u0001\u0005\u0007\u000B\u000C\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F\u007F\u200B\u200C\u200D\u200E\u200F\u2028\u2029\uFEFF'
    const re = new RegExp(`[${ctrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\r\n]`, 'g')
    return text.replace(re, '')
  }

  _isControlChar(ch) {
    const code = ch.charCodeAt(0)
    return code < 0x20 || code === 0x7F || (code >= 0x200B && code <= 0x200F) || code === 0xFEFF
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
      for (
        let offset = 0;
        offset + len <= keyword.length;
        offset += Math.max(1, Math.floor(len / 2))
      ) {
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

      let matchOffset = normalizedFull.indexOf(normalizedKeyword)
      if (matchOffset === -1 && normalizedKeyword.length >= 4) {
        const partial = normalizedKeyword.substring(0, Math.ceil(normalizedKeyword.length * 0.7))
        matchOffset = normalizedFull.indexOf(partial)
      }
      if (matchOffset === -1) return null

      let visibleCount = 0
      let charPosStart = -1
      let charPosEnd = -1
      for (let i = 0; i < fullText.length; i++) {
        const ch = fullText[i]
        if (!this._isControlChar(ch)) {
          if (visibleCount === matchOffset && charPosStart === -1) {
            charPosStart = i
          }
          visibleCount++
          if (charPosStart !== -1 && visibleCount >= matchOffset + normalizedKeyword.length) {
            charPosEnd = i + 1
            break
          }
        }
      }

      if (charPosStart >= 0 && charPosEnd > charPosStart) {
        return doc.Range(charPosStart, charPosEnd)
      }

      const paraStarts = this._getParagraphStartPositions(doc)
      let visibleIdx = 0
      let startPara = -1
      for (let i = 0; i < fullText.length; i++) {
        const ch = fullText[i]
        if (!this._isControlChar(ch)) {
          if (visibleIdx === matchOffset) startPara = i
          visibleIdx++
        }
      }
      if (startPara >= 0) {
        for (let p = paraStarts.length - 1; p >= 0; p--) {
          if (paraStarts[p] <= startPara) {
            const para = doc.Paragraphs.Item(p + 1)
            return doc.Range(para.Range.Start, para.Range.End)
          }
        }
      }
    } catch (e) {
      console.warn('[定位] 文本扫描失败:', e)
    }
    return null
  }

  _findByParagraphScan(doc, keyword) {
    try {
      const normalizedKeyword = this._normalizeForSearch(keyword)
      if (!normalizedKeyword) return null

      const count = doc.Paragraphs.Count
      for (let i = 1; i <= count; i++) {
        try {
          const para = doc.Paragraphs.Item(i)
          const paraText = para.Range.Text
          const normalizedPara = this._normalizeForSearch(paraText)

          if (normalizedPara.includes(normalizedKeyword)) {
            const charIdx = normalizedPara.indexOf(normalizedKeyword)
            let visibleCount = 0
            let rangeStart = -1
            let rangeEnd = -1
            for (let c = 0; c < paraText.length; c++) {
              const ch = paraText[c]
              if (!this._isControlChar(ch)) {
                if (visibleCount === charIdx && rangeStart === -1) {
                  rangeStart = para.Range.Start + c
                }
                visibleCount++
                if (rangeStart !== -1 && visibleCount >= charIdx + normalizedKeyword.length) {
                  rangeEnd = para.Range.Start + c + 1
                  break
                }
              }
            }

            if (rangeStart >= 0 && rangeEnd > rangeStart) {
              return doc.Range(rangeStart, rangeEnd)
            }

            return doc.Range(para.Range.Start, para.Range.End)
          }
        } catch {
          continue
        }
      }
    } catch (e) {
      console.warn('[定位] 段落扫描失败:', e)
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
        console.warn(
          `[修订] Range 长度异常: ${keywordLen}，Start=${originalStart}, End=${originalEnd}，可能指向了全文`
        )
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

    const commonParts = newText.split(/[。；，、\n]/).filter((p) => p.trim().length >= 6)
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

  getUndoCount() {
    try {
      const doc = this.getDocument()
      if (!doc) return 0
      if (doc.UndoRecord && typeof doc.UndoRecord.Count === 'number') {
        return doc.UndoRecord.Count
      }
      return 0
    } catch {
      return 0
    }
  }

  undo(steps = 1) {
    try {
      const doc = this.getDocument()
      if (!doc) return false
      const maxSteps = Math.min(steps, 100)
      for (let i = 0; i < maxSteps; i++) {
        try {
          const result = doc.Undo()
          if (result === false) break
        } catch {
          break
        }
      }
      return true
    } catch (e) {
      console.warn('撤销失败:', e)
      return false
    }
  }

  revertAction(action) {
    const type = action.type
    const app = window.Application
    if (!app) return { success: false, message: 'WPS不可用' }

    try {
      switch (type) {
        case 'addComment':
        case 'comment':
          return this._revertComment(action)
        case 'addRevision':
        case 'revision':
          return this._revertRevision(action)
        case 'addWatermark':
          return this._revertWatermark(action)
        case 'addHeader':
          return this._revertHeader(action)
        case 'addFooter':
          return this._revertFooter(action)
        case 'addPageNumber':
          return this._revertPageNumber(action)
        case 'desensitize':
          return this._revertDesensitize(action)
        case 'batchKeyword':
          return this._revertBatchKeyword(action)
        default:
          return { success: false, message: '该操作不支持回撤' }
      }
    } catch (e) {
      console.warn('[回撤] 失败:', e)
      return { success: false, message: e.message || '回撤失败' }
    }
  }

  _revertComment(action) {
    const doc = this.getDocument()
    if (!doc) return { success: false, message: '文档不可用' }
    const keyword = action.keyword
    if (!keyword) return { success: false, message: '缺少关键词' }

    const comments = doc.Comments
    for (let i = comments.Count; i >= 1; i--) {
      try {
        const c = comments.Item(i)
        const scopeText = c.Scope?.Text || ''
        if (scopeText.includes(keyword)) {
          c.Delete()
          return { success: true, message: `已删除批注: ${keyword}` }
        }
      } catch {
        continue
      }
    }
    return { success: false, message: '未找到对应批注' }
  }

  _revertRevision(action) {
    const doc = this.getDocument()
    if (!doc) return { success: false, message: '文档不可用' }
    const keyword = action.keyword
    const newText = action.newText
    if (!keyword || !newText) return { success: false, message: '缺少参数' }

    const range = this.findRangeByKeyword(newText)
    if (range) {
      range.Text = keyword
      return { success: true, message: `已恢复: "${newText}" → "${keyword}"` }
    }

    const replacements = doc.Range().Text.split(newText).length - 1
    if (replacements > 0) {
      const app2 = window.Application
      app2.Selection.HomeKey(6)
      const findObj = app2.Selection.Find
      findObj.Text = newText
      findObj.Replacement.Text = keyword
      findObj.Execute(2101, false, false, false, false, false, true, 1, false, keyword, 2)
      return { success: true, message: '已恢复修订' }
    }
    return { success: false, message: '未找到修订后的文本' }
  }

  _revertWatermark(_action) {
    const doc = this.getDocument()
    if (!doc) return { success: false, message: '文档不可用' }

    let deleted = 0
    const sections = doc.Sections
    for (let i = 1; i <= sections.Count; i++) {
      try {
        const section = sections.Item(i)
        const header = section.Headers.Item(1)
        const shapes = header.Shapes
        for (let j = shapes.Count; j >= 1; j--) {
          try {
            const shape = shapes.Item(j)
            if (shape.Type === 15) {
              shape.Delete()
              deleted++
            }
          } catch {
            continue
          }
        }
      } catch {
        continue
      }
    }
    if (deleted > 0) {
      return { success: true, message: `已删除 ${deleted} 个水印` }
    }
    return { success: false, message: '未找到水印' }
  }

  _revertHeader(_action) {
    const doc = this.getDocument()
    if (!doc) return { success: false, message: '文档不可用' }

    let cleared = 0
    const sections = doc.Sections
    for (let i = 1; i <= sections.Count; i++) {
      try {
        const section = sections.Item(i)
        const header = section.Headers.Item(1)
        const range = header.Range
        const shapes = header.Shapes
        for (let j = shapes.Count; j >= 1; j--) {
          try {
            shapes.Item(j).Delete()
          } catch {
            continue
          }
        }
        if (range.Text.trim()) {
          range.Text = ''
          cleared++
        }
      } catch {
        continue
      }
    }
    return { success: true, message: cleared > 0 ? '已清除页眉' : '页眉已为空' }
  }

  _revertFooter(_action) {
    const doc = this.getDocument()
    if (!doc) return { success: false, message: '文档不可用' }

    let cleared = 0
    const sections = doc.Sections
    for (let i = 1; i <= sections.Count; i++) {
      try {
        const section = sections.Item(i)
        const footer = section.Footers.Item(1)
        const range = footer.Range
        const shapes = footer.Shapes
        for (let j = shapes.Count; j >= 1; j--) {
          try {
            shapes.Item(j).Delete()
          } catch {
            continue
          }
        }
        if (range.Text.trim()) {
          range.Text = ''
          cleared++
        }
      } catch {
        continue
      }
    }
    return { success: true, message: cleared > 0 ? '已清除页脚' : '页脚已为空' }
  }

  _revertPageNumber(_action) {
    const doc = this.getDocument()
    if (!doc) return { success: false, message: '文档不可用' }

    let deleted = 0
    const sections = doc.Sections
    for (let i = 1; i <= sections.Count; i++) {
      try {
        const section = sections.Item(i)
        const footer = section.Footers.Item(1)
        const header = section.Headers.Item(1)
        for (const part of [footer, header]) {
          const shapes = part.Shapes
          for (let j = shapes.Count; j >= 1; j--) {
            try {
              const shape = shapes.Item(j)
              if (shape.Type === 9) {
                shape.Delete()
                deleted++
              }
            } catch {
              continue
            }
          }
        }
      } catch {
        continue
      }
    }
    if (deleted > 0) {
      return { success: true, message: `已删除 ${deleted} 个页码` }
    }
    return { success: false, message: '未找到页码' }
  }

  _revertDesensitize(action) {
    if (action._originalItems && action._originalItems.length > 0) {
      let restored = 0
      for (const item of action._originalItems) {
        const range = this.findRangeByKeyword(item.desensitized)
        if (range) {
          range.Text = item.original
          restored++
        }
      }
      return { success: true, message: `已恢复 ${restored} 处脱敏` }
    }
    return { success: false, message: '无脱敏记录，无法回撤' }
  }

  _revertBatchKeyword(_action) {
    return { success: false, message: '批量关键词操作暂不支持回撤' }
  }
}

export const wpsDocument = new WPSDocumentService()

export { WPSDocumentService, wpsDocument as wpsDocumentService }
