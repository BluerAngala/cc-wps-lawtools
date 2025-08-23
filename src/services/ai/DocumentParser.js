/**
 * 文档解析器 - 智能文档分块处理
 * 将合同文档按逻辑结构分解为可独立处理的块
 */

import crypto from 'crypto-js'

export class DocumentParser {
  constructor() {
    // 合同常见的章节标识符
    this.sectionPatterns = [
      /第[一二三四五六七八九十\d]+章[：:]?\s*(.+)/g,
      /第[一二三四五六七八九十\d]+条[：:]?\s*(.+)/g,
      /[一二三四五六七八九十\d]+[、．.]\s*(.+)/g,
      /\d+[、．.]\s*(.+)/g
    ]
    
    // 当事人信息识别模式
    this.partyPatterns = [
      /甲方[：:]?\s*(.+?)(?=乙方|\n|$)/g,
      /乙方[：:]?\s*(.+?)(?=甲方|\n|$)/g,
      /委托方[：:]?\s*(.+?)(?=受托方|\n|$)/g,
      /受托方[：:]?\s*(.+?)(?=委托方|\n|$)/g,
      /买方[：:]?\s*(.+?)(?=卖方|\n|$)/g,
      /卖方[：:]?\s*(.+?)(?=买方|\n|$)/g
    ]
    
    // 关键条款识别模式
    this.clausePatterns = [
      /违约责任[：:]?([\s\S]*?)(?=第[一二三四五六七八九十\d]+条|\d+[、．.]|$)/g,
      /争议解决[：:]?([\s\S]*?)(?=第[一二三四五六七八九十\d]+条|\d+[、．.]|$)/g,
      /合同金额[：:]?([\s\S]*?)(?=第[一二三四五六七八九十\d]+条|\d+[、．.]|$)/g,
      /履行期限[：:]?([\s\S]*?)(?=第[一二三四五六七八九十\d]+条|\d+[、．.]|$)/g,
      /付款方式[：:]?([\s\S]*?)(?=第[一二三四五六七八九十\d]+条|\d+[、．.]|$)/g
    ]
  }

  /**
   * 解析文档主入口
   * @param {string} content - 文档内容
   * @returns {Object} 解析后的文档结构
   */
  parseDocument(content) {
    if (!content || typeof content !== 'string') {
      console.error('DocumentParser.parseDocument: 文档内容无效', {
        content: content,
        type: typeof content,
        length: content?.length || 0
      })
      throw new Error('文档内容不能为空')
    }
    
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      console.error('DocumentParser.parseDocument: 文档内容为空白')
      throw new Error('文档内容不能为空')
    }

    const documentHash = this.generateContentHash(trimmedContent)
    
    return {
      hash: documentHash,
      content: trimmedContent, // 保存原始内容
      metadata: this.extractMetadata(trimmedContent),
      sections: this.extractSections(trimmedContent),
      clauses: this.extractClauses(trimmedContent),
      parties: this.extractParties(trimmedContent),
      terms: this.extractKeyTerms(trimmedContent),
      structure: this.analyzeStructure(trimmedContent)
    }
  }

  /**
   * 生成内容哈希值，用于缓存和变更检测
   * @param {string} content - 文档内容
   * @returns {string} 哈希值
   */
  generateContentHash(content) {
    return crypto.MD5(content.trim()).toString()
  }

  /**
   * 提取文档元数据
   * @param {string} content - 文档内容
   * @returns {Object} 元数据
   */
  extractMetadata(content) {
    const lines = content.split('\n')
    const firstLine = lines[0]?.trim() || ''
    
    return {
      title: this.extractTitle(firstLine),
      length: content.length,
      lineCount: lines.length,
      wordCount: content.replace(/\s/g, '').length,
      extractedAt: new Date().toISOString()
    }
  }

  /**
   * 提取文档标题
   * @param {string} firstLine - 第一行内容
   * @returns {string} 标题
   */
  extractTitle(firstLine) {
    // 移除常见的格式字符，提取可能的标题
    return firstLine.replace(/[【】《》""'']/g, '').trim() || '未命名合同'
  }

  /**
   * 按章节提取内容
   * @param {string} content - 文档内容
   * @returns {Array} 章节数组
   */
  extractSections(content) {
    const sections = []
    const lines = content.split('\n')
    let currentSection = null
    let sectionContent = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 检查是否是章节标题
      const sectionMatch = this.matchSectionTitle(line)
      
      if (sectionMatch) {
        // 保存上一个章节
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: sectionContent.join('\n').trim(),
            hash: this.generateContentHash(sectionContent.join('\n'))
          })
        }
        
        // 开始新章节
        currentSection = {
          title: sectionMatch.title,
          level: sectionMatch.level,
          startLine: i + 1
        }
        sectionContent = [line]
      } else if (currentSection) {
        sectionContent.push(line)
      }
    }
    
    // 保存最后一个章节
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: sectionContent.join('\n').trim(),
        hash: this.generateContentHash(sectionContent.join('\n'))
      })
    }

    return sections
  }

  /**
   * 匹配章节标题
   * @param {string} line - 行内容
   * @returns {Object|null} 匹配结果
   */
  matchSectionTitle(line) {
    for (let i = 0; i < this.sectionPatterns.length; i++) {
      const pattern = new RegExp(this.sectionPatterns[i].source, 'g')
      const match = pattern.exec(line)
      
      if (match) {
        return {
          title: match[1] || line,
          level: i + 1,
          fullMatch: match[0]
        }
      }
    }
    return null
  }

  /**
   * 提取关键条款
   * @param {string} content - 文档内容
   * @returns {Array} 条款数组
   */
  extractClauses(content) {
    const clauses = []
    
    this.clausePatterns.forEach((pattern, index) => {
      const regex = new RegExp(pattern.source, 'gi')
      let match
      
      while ((match = regex.exec(content)) !== null) {
        clauses.push({
          type: this.getClauseType(index),
          content: match[0].trim(),
          details: match[1]?.trim() || '',
          hash: this.generateContentHash(match[0])
        })
      }
    })
    
    return clauses
  }

  /**
   * 获取条款类型
   * @param {number} index - 模式索引
   * @returns {string} 条款类型
   */
  getClauseType(index) {
    const types = ['违约责任', '争议解决', '合同金额', '履行期限', '付款方式']
    return types[index] || '其他条款'
  }

  /**
   * 提取当事人信息
   * @param {string} content - 文档内容
   * @returns {Array} 当事人数组
   */
  extractParties(content) {
    const parties = []
    
    this.partyPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.source, 'gi')
      let match
      
      while ((match = regex.exec(content)) !== null) {
        const partyInfo = match[0].trim()
        const partyName = match[1]?.trim() || ''
        
        if (partyName) {
          parties.push({
            role: this.extractPartyRole(partyInfo),
            name: partyName,
            fullInfo: partyInfo,
            hash: this.generateContentHash(partyInfo)
          })
        }
      }
    })
    
    return parties
  }

  /**
   * 提取当事人角色
   * @param {string} info - 当事人信息
   * @returns {string} 角色
   */
  extractPartyRole(info) {
    if (info.includes('甲方')) return '甲方'
    if (info.includes('乙方')) return '乙方'
    if (info.includes('委托方')) return '委托方'
    if (info.includes('受托方')) return '受托方'
    if (info.includes('买方')) return '买方'
    if (info.includes('卖方')) return '卖方'
    return '未知角色'
  }

  /**
   * 提取关键术语
   * @param {string} content - 文档内容
   * @returns {Array} 术语数组
   */
  extractKeyTerms(content) {
    const terms = []
    const termPatterns = [
      /合同[编号|号码][：:]?\s*([\w\-\/]+)/gi,
      /签署日期[：:]?\s*([\d年月日\-\/]+)/gi,
      /有效期[：:]?\s*([\d年月日\-\/至]+)/gi,
      /金额[：:]?\s*([\d,，.．万千百十元]+)/gi
    ]
    
    termPatterns.forEach((pattern, index) => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        terms.push({
          type: this.getTermType(index),
          value: match[1]?.trim() || '',
          context: match[0].trim(),
          hash: this.generateContentHash(match[0])
        })
      }
    })
    
    return terms
  }

  /**
   * 获取术语类型
   * @param {number} index - 模式索引
   * @returns {string} 术语类型
   */
  getTermType(index) {
    const types = ['合同编号', '签署日期', '有效期', '金额']
    return types[index] || '其他术语'
  }

  /**
   * 分析文档结构
   * @param {string} content - 文档内容
   * @returns {Object} 结构分析结果
   */
  analyzeStructure(content) {
    const lines = content.split('\n')
    const structure = {
      totalLines: lines.length,
      emptyLines: 0,
      titleLines: 0,
      contentLines: 0,
      hasNumberedSections: false,
      hasPartyInfo: false,
      hasSignature: false
    }
    
    lines.forEach(line => {
      const trimmed = line.trim()
      
      if (!trimmed) {
        structure.emptyLines++
      } else if (this.matchSectionTitle(trimmed)) {
        structure.titleLines++
        structure.hasNumberedSections = true
      } else {
        structure.contentLines++
      }
      
      if (trimmed.includes('甲方') || trimmed.includes('乙方')) {
        structure.hasPartyInfo = true
      }
      
      if (trimmed.includes('签字') || trimmed.includes('盖章') || trimmed.includes('签署')) {
        structure.hasSignature = true
      }
    })
    
    return structure
  }

  /**
   * 检测文档变更
   * @param {Object} oldParsed - 旧的解析结果
   * @param {Object} newParsed - 新的解析结果
   * @returns {Object} 变更检测结果
   */
  detectChanges(oldParsed, newParsed) {
    if (!oldParsed || !newParsed) {
      return { hasChanges: true, changedSections: [], isNewDocument: true }
    }
    
    const changes = {
      hasChanges: oldParsed.hash !== newParsed.hash,
      changedSections: [],
      addedSections: [],
      removedSections: [],
      isNewDocument: false
    }
    
    if (!changes.hasChanges) {
      return changes
    }
    
    // 检测章节变更
    const oldSectionHashes = new Set(oldParsed.sections.map(s => s.hash))
    const newSectionHashes = new Set(newParsed.sections.map(s => s.hash))
    
    newParsed.sections.forEach(section => {
      if (!oldSectionHashes.has(section.hash)) {
        changes.changedSections.push(section)
      }
    })
    
    return changes
  }
}

export default DocumentParser