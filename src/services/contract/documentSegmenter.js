/**
 * 智能文档分段模块
 * 支持多种分段策略：章节标题、段落、长度
 */

export class DocumentSegmenter {
  /**
   * 智能分段：结合多种策略，避免重复审查
   * @param {string} documentText - 文档文本
   * @param {Array} paragraphs - WPS段落信息（可选）
   * @returns {Array} 分段数组
   */
  segmentDocument(documentText, paragraphs = null) {
    if (!documentText || !documentText.trim()) {
      return []
    }

    // 策略0：如果提供了段落信息，优先使用段落信息分段（最准确）
    if (paragraphs && paragraphs.length > 0) {
      const paraSegments = this.segmentByWPSParagraphs(documentText, paragraphs)
      if (paraSegments.length > 1) {
        console.log(`[分段] 使用WPS段落信息分段，共 ${paraSegments.length} 段`)
        return this.optimizeSegmentsByLength(paraSegments, 1500, 3000)
      }
    }

    // 策略1：基于章节标题分段（最准确，合同文档通常有明确的章节结构）
    const sectionSegments = this.segmentBySections(documentText)
    if (sectionSegments.length > 1) {
      console.log(`[分段] 使用章节标题分段，共 ${sectionSegments.length} 段`)
      return this.optimizeSegmentsByLength(sectionSegments, 1500, 3000)
    }

    // 策略2：基于语义分段（识别合同关键结构）
    const semanticSegments = this.segmentBySemantics(documentText)
    if (semanticSegments.length > 1) {
      console.log(`[分段] 使用语义分段，共 ${semanticSegments.length} 段`)
      return this.optimizeSegmentsByLength(semanticSegments, 1500, 3000)
    }

    // 策略3：基于段落分段（次优）
    const paragraphSegments = this.segmentByParagraphs(documentText)
    if (paragraphSegments.length > 1) {
      console.log(`[分段] 使用段落分段，共 ${paragraphSegments.length} 段`)
      return this.optimizeSegmentsByLength(paragraphSegments, 1500, 3000)
    }

    // 注：所有策略的最大长度都是3000字符，超过此长度会按照章节段落自然边界切割

    // 策略4：基于长度分段（最后兜底）- 只在确实无法识别结构时使用
    console.warn(`[分段] 无法识别文档结构，使用长度分段（每段1500-3000字符）`)
    const lengthSegments = this.segmentByLength(documentText, 2000)
    console.log(`[分段] 长度分段完成，共 ${lengthSegments.length} 段`)
    return lengthSegments
  }

  /**
   * 优化分段长度：避免过长或过短的段落，减少重复审查
   * @param {Array} segments - 原始分段
   * @param {number} minLength - 最小长度（字符）
   * @param {number} maxLength - 最大长度（字符）
   * @returns {Array} 优化后的分段
   */
  optimizeSegmentsByLength(segments, minLength = 1500, maxLength = 3000) {
    if (!segments || segments.length === 0) {
      return segments
    }

    const optimized = []
    let i = 0

    while (i < segments.length) {
      const segment = segments[i]
      const contentLength = segment.content.length

      // 情况1：当前段长度合适，直接添加
      if (contentLength >= minLength && contentLength <= maxLength) {
        optimized.push(segment)
        i++
      }
      // 情况2：当前段太短，尝试与下一段合并
      else if (contentLength < minLength && i + 1 < segments.length) {
        const merged = this.mergeSegments(segment, segments[i + 1])
        
        // 如果合并后仍然太短，继续合并
        if (merged.content.length < minLength && i + 2 < segments.length) {
          const merged2 = this.mergeSegments(merged, segments[i + 2])
          optimized.push(merged2)
          i += 3
        } else {
          optimized.push(merged)
          i += 2
        }
      }
      // 情况3：当前段太长，需要拆分
      else if (contentLength > maxLength) {
        const splits = this.splitSegment(segment, maxLength)
        optimized.push(...splits)
        i++
      }
      // 情况4：当前段太短且是最后一段，合并到前一段
      else if (contentLength < minLength && optimized.length > 0) {
        const lastSegment = optimized[optimized.length - 1]
        lastSegment.content += '\n\n' + segment.content
        lastSegment.endChar = segment.endChar
        i++
      }
      // 情况5：当前段太短且是唯一段，保留
      else {
        optimized.push(segment)
        i++
      }
    }

    console.log(`[分段优化] 原始分段: ${segments.length}, 优化后: ${optimized.length}`)
    return this.enrichSegments(optimized)
  }

  /**
   * 合并两个相邻的分段
   */
  mergeSegments(segment1, segment2) {
    return {
      section: segment1.section,
      content: segment1.content + '\n\n' + segment2.content,
      startChar: segment1.startChar,
      endChar: segment2.endChar,
      startLine: segment1.startLine,
      endLine: segment2.endLine
    }
  }

  /**
   * 拆分过长的分段 - 按照章节段落的自然边界切割
   * 优先在章节标题、段落分隔符处切割，避免破坏原文意思
   */
  splitSegment(segment, maxLength) {
    const splits = []
    const content = segment.content
    let start = 0
    let partIndex = 1

    // 章节标题模式（用于识别自然的切割点）
    const sectionPatterns = [
      /^第([一二三四五六七八九十百千万\d]+)[条款章]\s*(.+)$/m,
      /^第([一二三四五六七八九十百千万\d]+)条\s*(.+)$/m,
      /^第([一二三四五六七八九十百千万\d]+)[条款章]$/m,
      /^([一二三四五六七八九十百千万]+)[、．.]\s*(.+)$/m,
      /^(\d+)[、．.]\s*(.+)$/m,
      /^[（(](\d+)[）)]\s*(.+)$/m,
      /^第([一二三四五六七八九十百千万\d]+)章[：:]\s*(.+)$/m,
      /^第([一二三四五六七八九十百千万\d]+)节[：:]\s*(.+)$/m
    ]

    while (start < content.length) {
      const preferredEnd = Math.min(start + maxLength, content.length)

      // 优先在章节标题处切割
      let actualEnd = this.findSectionBreakPoint(content, start, preferredEnd, sectionPatterns)
      
      // 如果没找到章节标题，再在句号/段落边界处切割
      if (actualEnd === preferredEnd) {
        actualEnd = this.findBreakPoint(content, start, preferredEnd)
      }

      // 如果剩余内容太少（少于300字符），合并到当前段
      if (actualEnd >= content.length - 300) {
        actualEnd = content.length
      }

      splits.push({
        section: {
          title: partIndex === 1 
            ? segment.section.title 
            : `${segment.section.title}（续${partIndex - 1}）`,
          number: segment.section.number,
          titleText: segment.section.titleText
        },
        content: content.substring(start, actualEnd),
        startChar: segment.startChar + start,
        endChar: segment.startChar + actualEnd
      })

      start = actualEnd
      partIndex++

      // 防止无限循环
      if (start >= content.length) break
      if (actualEnd === start) {
        // 如果没有进展，强制前进
        start = Math.min(start + 500, content.length)
      }
    }

    return splits
  }

  /**
   * 查找章节标题的切割点（在章节标题处切割，保留原文结构）
   */
  findSectionBreakPoint(text, start, preferredEnd, sectionPatterns) {
    // 从preferredEnd往后查找，找到第一个章节标题
    let searchStart = preferredEnd
    let searchEnd = Math.min(preferredEnd + 500, text.length)

    const searchText = text.substring(searchStart, searchEnd)
    const lines = searchText.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 检查是否是章节标题
      for (const pattern of sectionPatterns) {
        if (pattern.test(line)) {
          // 找到章节标题，返回该位置
          let pos = searchStart
          for (let j = 0; j < i; j++) {
            pos += lines[j].length + 1 // +1 for \n
          }
          return pos
        }
      }
    }

    // 如果没找到章节标题，返回preferredEnd表示未找到
    return preferredEnd
  }

  /**
   * 策略0：基于WPS段落信息分段（最准确，利用WPS API的段落结构）
   */
  segmentByWPSParagraphs(documentText, paragraphs) {
    const segments = []
    let currentSegment = null
    let currentContent = []
    let charOffset = 0
    const MIN_SEGMENT_LENGTH = 500 // 最小段长度，避免过度分段

    // 章节标题模式（用于识别段落是否为章节标题）
    const sectionPatterns = [
      /^第([一二三四五六七八九十百千万\d]+)[条款章]\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)条\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)[条款章]$/,
      /^([一二三四五六七八九十百千万]+)[、．.]\s*(.+)$/,
      /^(\d+)[、．.]\s*(.+)$/,
      /^[（(](\d+)[）)]\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)章[：:]\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)节[：:]\s*(.+)$/,
      /^(合同主体|合同标的|服务内容|合同金额|付款方式|履行期限|违约责任|争议解决|合同生效)[：:]\s*(.+)$/,
      /^(甲方|乙方|委托方|受托方|服务方|接受服务方)[：:]\s*(.+)$/
    ]

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i]
      const paraText = para.text.trim()

      // 跳过空段落
      if (!paraText || paraText.length < 3) {
        continue
      }

      // 检查是否是章节标题
      let isSection = false
      let sectionInfo = null

      for (const pattern of sectionPatterns) {
        const match = paraText.match(pattern)
        if (match) {
          isSection = true
          sectionInfo = {
            title: paraText,
            number: match[1] || match[0],
            titleText: match[2] || ''
          }
          break
        }
      }

      // 如果当前段落是章节标题，保存上一个段
      if (isSection && currentSegment) {
        const content = currentContent.join('\n')
        // 如果段太短，合并到新章节（避免过度分段）
        // 但如果已经有内容，还是保存（即使是短段）
        if (content.length > 0) {
          segments.push({
            section: currentSegment,
            content: content,
            startChar: charOffset - content.length,
            endChar: charOffset
          })
        }
        currentContent = []
      }

      // 开始新章节或继续当前章节
      if (isSection) {
        currentSegment = sectionInfo
      } else if (!currentSegment) {
        // 如果还没有章节，创建一个默认章节
        currentSegment = {
          title: paraText.substring(0, 30),
          number: 1,
          titleText: paraText.substring(0, 30)
        }
      }

      currentContent.push(paraText)
      charOffset += paraText.length + 1 // +1 for \n
      
      // 如果当前段已经很长（超过3000字符），强制分段（避免单段过长）
      const currentContentLength = currentContent.join('\n').length
      if (currentContentLength > 3000 && currentSegment) {
        const content = currentContent.join('\n')
        segments.push({
          section: currentSegment,
          content: content,
          startChar: charOffset - content.length,
          endChar: charOffset
        })
        // 创建新段，继续累积
        currentSegment = {
          title: `${currentSegment.title}（续）`,
          number: segments.length + 1,
          titleText: currentSegment.titleText
        }
        currentContent = []
      }
    }

    // 保存最后一个段
    if (currentSegment && currentContent.length > 0) {
      const content = currentContent.join('\n')
      // 如果最后一段太短，合并到上一段
      if (content.length < MIN_SEGMENT_LENGTH && segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
        lastSegment.content += '\n' + content
        lastSegment.endChar = charOffset
      } else {
        segments.push({
          section: currentSegment,
          content: content,
          startChar: charOffset - content.length,
          endChar: charOffset
        })
      }
    }

    return segments
  }

  /**
   * 策略1：基于章节标题分段
   */
  segmentBySections(text) {
    const segments = []
    const lines = text.split('\n')

    // 章节标题模式（增强版，支持更多格式）
    const sectionPatterns = [
      /^第([一二三四五六七八九十百千万\d]+)[条款章]\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)条\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)[条款章]$/,
      /^([一二三四五六七八九十百千万]+)[、．.]\s*(.+)$/,
      /^(\d+)[、．.]\s*(.+)$/,
      /^[（(](\d+)[）)]\s*(.+)$/,
      // 增强：支持更多格式
      /^第([一二三四五六七八九十百千万\d]+)章[：:]\s*(.+)$/,
      /^第([一二三四五六七八九十百千万\d]+)节[：:]\s*(.+)$/,
      /^([一二三四五六七八九十百千万\d]+)[、．]\s*(.+)$/,
      /^(\d+)[、．]\s*(.+)$/,
      // 支持合同常见标题格式
      /^(合同主体|合同标的|服务内容|合同金额|付款方式|履行期限|违约责任|争议解决|合同生效)[：:]\s*(.+)$/,
      /^(甲方|乙方|委托方|受托方|服务方|接受服务方)[：:]\s*(.+)$/
    ]

    let currentSection = null
    let currentStart = 0
    let currentContent = []
    let charOffset = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // 检查是否是章节标题
      let isSection = false
      for (const pattern of sectionPatterns) {
        const match = trimmedLine.match(pattern)
        if (match) {
          // 保存上一个章节
          if (currentSection) {
            const content = currentContent.join('\n')
            segments.push({
              section: currentSection,
              content: content,
              startLine: currentStart,
              endLine: i - 1,
              startChar: charOffset - content.length,
              endChar: charOffset
            })
          }

          // 开始新章节
          currentSection = {
            title: trimmedLine,
            number: match[1] || match[0],
            titleText: match[2] || ''
          }
          currentStart = i
          currentContent = [line]
          charOffset += line.length + 1 // +1 for \n
          isSection = true
          break
        }
      }

      if (!isSection) {
        if (currentSection) {
          currentContent.push(line)
        }
        charOffset += line.length + 1
      }
    }

    // 保存最后一个章节
    if (currentSection) {
      const content = currentContent.join('\n')
      segments.push({
        section: currentSection,
        content: content,
        startLine: currentStart,
        endLine: lines.length - 1,
        startChar: charOffset - content.length,
        endChar: charOffset
      })
    }

    return segments
  }

  /**
   * 策略2：基于语义分段（识别合同关键结构）
   */
  segmentBySemantics(text) {
    const segments = []
    const lines = text.split('\n')
    
    // 合同常见的关键结构标识
    const semanticMarkers = [
      // 合同主体信息
      /^(甲方|乙方|丙方)[：:]/,
      /^(委托方|受托方|服务方|接受服务方)[：:]/,
      /^(发包方|承包方)[：:]/,
      /^(出租方|承租方)[：:]/,
      /^(转让方|受让方)[：:]/,
      
      // 合同关键条款
      /^(合同标的|标的物|服务内容|项目内容)[：:]/,
      /^(合同金额|总金额|价款|费用|服务费)[：:]/,
      /^(付款方式|支付方式|付款条件)[：:]/,
      /^(履行期限|服务期限|合同期限)[：:]/,
      /^(违约责任|违约处理)[：:]/,
      /^(争议解决|纠纷处理)[：:]/,
      /^(合同生效|生效条件)[：:]/,
      
      // 其他常见结构
      /^(第一条|第二条|第三条|第四条|第五条|第六条|第七条|第八条|第九条|第十条)/,
      /^(一[、．]|二[、．]|三[、．]|四[、．]|五[、．]|六[、．]|七[、．]|八[、．]|九[、．]|十[、．])/,
      /^(\d+[、．])/,
    ]
    
    let currentSegment = null
    let currentContent = []
    let charOffset = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()
      
      // 检查是否是语义标记
      let isMarker = false
      for (const marker of semanticMarkers) {
        if (marker.test(trimmedLine)) {
          // 保存上一个段
          if (currentSegment) {
            const content = currentContent.join('\n')
            segments.push({
              section: currentSegment,
              content: content,
              startChar: charOffset - content.length,
              endChar: charOffset
            })
          }
          
          // 开始新段
          currentSegment = {
            title: trimmedLine.substring(0, 50), // 取前50字符作为标题
            number: segments.length + 1,
            titleText: trimmedLine
          }
          currentContent = [line]
          charOffset += line.length + 1
          isMarker = true
          break
        }
      }
      
      if (!isMarker) {
        if (currentSegment) {
          currentContent.push(line)
        } else {
          // 如果还没有开始第一段，开始第一段
          currentSegment = {
            title: '合同开头',
            number: 1,
            titleText: '合同开头'
          }
          currentContent = [line]
        }
        charOffset += line.length + 1
      }
    }
    
    // 保存最后一段
    if (currentSegment) {
      const content = currentContent.join('\n')
      segments.push({
        section: currentSegment,
        content: content,
        startChar: charOffset - content.length,
        endChar: charOffset
      })
    }
    
    return segments
  }

  /**
   * 策略3：基于段落分段
   */
  segmentByParagraphs(text) {
    const segments = []
    // 改进：支持多种段落分隔符
    const paragraphSeparators = [
      /\n\s*\n/,  // 空行分隔
      /\n{2,}/,   // 多个换行符
      /[。！？]\s*\n/  // 句号+换行
    ]
    
    let paragraphs = [text]
    for (const separator of paragraphSeparators) {
      const newParagraphs = []
      for (const para of paragraphs) {
        newParagraphs.push(...para.split(separator))
      }
      paragraphs = newParagraphs
      if (paragraphs.length > 1) break // 如果已经分段成功，停止
    }

    let charOffset = 0

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim()
      if (!para || para.length < 50) {
        // 跳过太短的段落（可能是空行或格式字符）
        charOffset += para.length + 2
        continue
      }

      // 尝试识别段落标题
      const titleMatch = para.match(/^(.{1,50}?)[：:]/)
      const title = titleMatch ? titleMatch[1] : `第${i + 1}段`

      segments.push({
        section: {
          title: title,
          number: i + 1,
          titleText: title
        },
        content: para,
        startChar: charOffset,
        endChar: charOffset + para.length
      })

      charOffset += para.length + 2 // +2 for separator
    }

    return segments
  }

  /**
   * 策略4：基于长度分段（最后兜底方案，尽量少用）
   * 优化：使用1500-3000字符的范围，避免段落过长或过短
   */
  segmentByLength(text, segmentSize = 2000) {
    const segments = []
    let start = 0
    let segmentIndex = 1

    while (start < text.length) {
      const preferredEnd = Math.min(start + segmentSize, text.length)

      // 尝试在句号、段落边界处截断
      const actualEnd = this.findBreakPoint(text, start, preferredEnd)

      // 如果剩余内容太少（少于500字符），合并到最后一段
      if (actualEnd >= text.length - 500 && segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
        lastSegment.content += text.substring(start)
        lastSegment.endChar = text.length
        break
      }

      segments.push({
        section: {
          title: `第${segmentIndex}段`,
          number: segmentIndex,
          titleText: ''
        },
        content: text.substring(start, actualEnd),
        startChar: start,
        endChar: actualEnd
      })

      start = actualEnd
      segmentIndex++
    }

    return segments
  }

  /**
   * 查找合适的分段点（优先章节标题、段落边界、句号）
   * 按照自然的文档结构切割，避免破坏原文意思
   */
  findBreakPoint(text, start, preferredEnd) {
    // 优先级顺序：章节标题 > 段落分隔 > 句号 > 换行
    const breakPatterns = [
      // 最高优先级：章节标题（在章节标题前切割）
      { pattern: /\n(第([一二三四五六七八九十百千万\d]+)[条款章]\s*(.+)?)$/m, offset: 0, priority: 10 },
      { pattern: /\n(([一二三四五六七八九十百千万]+)[、．.]\s*(.+)?)$/m, offset: 0, priority: 10 },
      { pattern: /\n((\d+)[、．.]\s*(.+)?)$/m, offset: 0, priority: 10 },
      // 高优先级：段落分隔（空行）
      { pattern: /\n\n/, offset: 2, priority: 8 },
      // 中优先级：句号+换行
      { pattern: /[。！？]\s*\n/, offset: 1, priority: 6 },
      // 低优先级：句号+空格
      { pattern: /[。！？]\s+/, offset: 1, priority: 4 },
      // 最低优先级：换行
      { pattern: /\n/, offset: 1, priority: 2 }
    ]

    // 按优先级排序
    const sortedPatterns = breakPatterns.sort((a, b) => b.priority - a.priority)

    for (const { pattern, offset } of sortedPatterns) {
      const segment = text.substring(start, preferredEnd)
      const matches = [...segment.matchAll(new RegExp(pattern, 'g'))]

      if (matches.length > 0) {
        // 从后往前找，找到最后一个合适的位置
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i]
          const breakPos = start + match.index + (match[0].length || offset)

          // 至少500字符，但不超过preferredEnd
          if (breakPos > start + 500 && breakPos <= preferredEnd) {
            return breakPos
          }
        }
      }
    }

    return preferredEnd
  }

  /**
   * 丰富分段信息：添加上下文
   */
  enrichSegments(segments) {
    return segments.map((seg, index) => {
      // 添加上下文（前一段的最后几句）
      const contextBefore = index > 0
        ? this.getContext(segments[index - 1].content, 3)
        : ''

      // 添加完整上下文（用于审查）
      const fullContext = contextBefore
        ? `${contextBefore}\n\n${seg.content}`
        : seg.content

      return {
        ...seg,
        contextBefore,
        fullContext
      }
    })
  }

  /**
   * 获取上下文（最后几句）
   */
  getContext(text, sentenceCount = 3) {
    const sentences = text.split(/[。！？]/).filter(s => s.trim())
    return sentences.slice(-sentenceCount).join('。') + '。'
  }
}

export const documentSegmenter = new DocumentSegmenter()

