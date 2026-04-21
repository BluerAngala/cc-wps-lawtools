/**
 * WPS 任务处理服务
 * 处理按钮点击、AI任务调度等业务逻辑
 */

import { wpsCore } from './core.js'
import { wpsDocument } from './document.js'
import { wpsFile } from './file.js'
import { kdocsHandler } from '../kdocs/kdocs.js'
import TaskScheduler from '../ai/TaskScheduler.js'
import unifiedLogger from '@/utils/unifiedLogger.js'
import { appConfig } from '@/utils/appConfig.js'

/**
 * 任务处理类
 */
class TaskHandler {
  constructor() {
    this.taskScheduler = new TaskScheduler({
      maxConcurrentTasks: 3,
      taskTimeout: 30000,
      retryAttempts: 2
    })
    console.log('TaskHandler AI框架已初始化')
  }

  /**
   * 确保文档可用
   */
  ensureDocument() {
    try {
      return wpsDocument.checkWPSEnvironment()
    } catch (error) {
      window.$message?.error(error?.message || '当前未检测到可用文档')
      return null
    }
  }

  /**
   * 按钮点击处理入口
   */
  async onbuttonclick(idStr, param) {
    console.log('=== TaskHandler 处理按钮点击 ===', idStr, param)

    try {
      const action = this.getAction(idStr, param)
      if (action) {
        return await action()
      }
      console.warn(`未找到对应的操作: ${idStr}`)
      return { success: false, message: `未找到操作: ${idStr}` }
    } catch (error) {
      console.error(`执行操作 ${idStr} 时出错:`, error)
      throw error
    }
  }

  /**
   * 获取操作映射
   */
  getAction(idStr, param) {
    const actions = {
      // 基础操作
      insertDateTime: () => wpsCore.insertDateTime(),
      dockLeft: () => wpsCore.dockTaskPane('left'),
      dockRight: () => wpsCore.dockTaskPane('right'),
      hideTaskPane: () => wpsCore.hideTaskPane(),
      addString: () => wpsCore.addTextToDocument(),
      getDocName: () => wpsCore.getDocumentName(),
      
      // 文件操作
      addHeader: () => this.addHeader(param),
      renameDoc: () => wpsFile.renameDocument(),
      
      // 文档操作
      addComment: () => this.addComment(param),
      extractText: () => this.extractText(param),
      contractReview: () => this.contractReview(param),
      extractFormatted: () => this.extractFormatted(),
      updateDocumentText: () => this.updateDocumentText(param),
      
      // AI 操作
      processWithAI: () => this.processWithAI(),
      analyzeDocStructure: () => this.analyzeDocStructure(),
      
      // 脱敏操作
      desensitizeText: () => this.desensitizeText(),
      applyDesensitization: () => this.applyDesensitization(param),
      
      // 其他
      openWeb: () => this.openWeb(param)
    }
    return actions[idStr]
  }

  /**
   * 添加页眉（调用 wpsFile 服务）
   */
  async addHeader(param) {
    const doc = this.ensureDocument()
    if (!doc || !param?.headerText) {
      return { success: false, message: '文档不存在或页眉文本为空' }
    }

    wpsCore.enableRevisionMode(doc)
    return await wpsFile.addHeader({
      text: param.headerText,
      fontSize: parseInt(param.fontSize) || 12,
      alignment: param.alignment || '居中'
    })
  }

  /**
   * 处理关键词批注和修订
   */
  async addComment(param) {
    const doc = this.ensureDocument()
    if (!doc) return { success: false, message: '未找到活动文档' }

    const keywordList = param?.keywordList
    if (!keywordList?.length) {
      window.$message?.warning('请先配置关键词列表')
      return { success: false, message: '关键词列表为空' }
    }

    wpsCore.enableRevisionMode(doc)

    let commentCount = 0
    let revisionCount = 0

    keywordList.forEach((item) => {
      const keyword = item?.keyword?.trim()
      if (!keyword) return

      const actionType = item?.actionType || '批注'
      const comment = item?.comment || `关键词 "${keyword}" 需要重点关注`
      const suggestedText = item?.suggestedText || ''
      const range = wpsDocument.findRangeByKeyword(keyword)

      if (!range) return

      if (actionType === '修订' && suggestedText) {
        if (wpsDocument.addRevision(range, suggestedText, item?.reason || comment)) {
          revisionCount++
        }
      } else if (wpsDocument.addComment(range, comment)) {
        commentCount++
      }
    })

    const totalCount = commentCount + revisionCount
    if (totalCount > 0) {
      window.$message?.success(`成功处理 ${commentCount} 个批注和 ${revisionCount} 个修订`)
      return { success: true, commentCount, revisionCount }
    }

    window.$message?.warning('未找到任何指定的关键词')
    return { success: false, message: '未找到指定关键词' }
  }

  /**
   * 抽取文档文本
   */
  async extractText(param) {
    const doc = this.ensureDocument()
    if (!doc) return ''

    try {
      const extractedText = wpsDocument.getFullText()

      if (!param || Object.keys(param).length === 0) {
        return extractedText
      }

      const extractTags = param?.extractContent || [
        '合同名称', '对接人', '甲方', '甲方主体信息',
        '乙方', '乙方主体信息', '其他方', '合同金额'
      ]
      const taskId = await this.taskScheduler.addTask({
        type: 'extractText',
        content: extractedText,
        options: { extractTags }
      })

      this.taskScheduler.on('taskCompleted', (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          console.log('AI处理结果:', result)
        }
      })

      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          unifiedLogger.error('AI处理出错', { method: 'extractText', taskId, error: error.message })
        }
      })
    } catch (error) {
      console.error('extractText 出错:', error)
      return ''
    }
  }

  /**
   * AI 合同预审
   */
  async contractReview(param) {
    const doc = this.ensureDocument()
    if (!doc) return

    const { actionType = 'comment' } = param || {}
    const extractedText = wpsDocument.getFullText()

    try {
      const taskId = await this.taskScheduler.addTask({
        type: 'contractReview',
        content: extractedText,
        options: { actionType }
      })

      this.taskScheduler.on('taskCompleted', (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          const reviewData = result.data
          if (actionType === 'comment') {
            this.addReviewComments(reviewData)
          } else if (actionType === 'revision') {
            this.addReviewRevisions(reviewData)
          }
        }
      })

      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          unifiedLogger.error('AI预审失败', { method: 'contractReview', taskId, error: error.message })
        }
      })
    } catch (error) {
      unifiedLogger.error('创建AI预审任务失败', { method: 'contractReview', error: error.message })
    }
  }

  /**
   * 添加预审批注
   */
  addReviewComments(reviewData) {
    if (!reviewData?.issues?.length) return

    let addedCount = 0
    reviewData.issues.forEach((issue) => {
      const { keyword, comment } = issue
      if (!keyword || !comment) return

      const range = wpsDocument.findRangeByKeyword(keyword)
      if (range && wpsDocument.addComment(range, comment)) {
        addedCount++
      }
    })

    if (addedCount > 0) {
      window.$message?.success(`成功添加${addedCount}个预审批注`)
    }
  }

  /**
   * 添加预审修订
   */
  addReviewRevisions(reviewData) {
    if (!reviewData?.revisions?.length) return

    const doc = this.ensureDocument()
    if (!doc) return

    wpsCore.enableRevisionMode(doc)
    let revisedCount = 0

    reviewData.revisions.forEach((revision) => {
      const { original, suggested, reason } = revision
      if (!original || !suggested) return

      const range = wpsDocument.findRangeByKeyword(original)
      if (range && wpsDocument.addRevision(range, suggested, reason)) {
        revisedCount++
      }
    })

    if (revisedCount > 0) {
      window.$message?.success(`成功进行${revisedCount}处预审修订`)
    }
  }

  /**
   * 提取格式化文本
   */
  extractFormatted() {
    if (!wpsDocument.isDocumentAvailable()) {
      window.$message?.error('未检测到活动文档')
      return
    }

    const selection = window.Application?.Selection
    if (selection?.Text) {
      const range = selection.Range
      const formattedData = {
        text: selection.Text,
        font: {
          name: range?.Font?.Name,
          size: range?.Font?.Size,
          bold: range?.Font?.Bold,
          italic: range?.Font?.Italic,
          color: range?.Font?.Color
        },
        paragraph: {
          alignment: range?.ParagraphFormat?.Alignment,
          lineSpacing: range?.ParagraphFormat?.LineSpacing
        }
      }
      window.Application?.PluginStorage?.setItem('formatted_data', JSON.stringify(formattedData))
      window.$message?.success('格式化文本已提取并保存')
    } else {
      unifiedLogger.error('请先选择要提取的文本', { method: 'extractFormatted' })
    }
  }

  /**
   * 更新文档文本
   */
  updateDocumentText(param) {
    const doc = this.ensureDocument()
    if (!doc) return

    const range = doc?.Range()
    if (range) {
      range.Text = param
      window.Application?.Selection?.GoTo(0)
      window.$message?.success('文档内容已更新')
    }
  }

  /**
   * AI 处理合同元素提取
   */
  async processWithAI() {
    const doc = this.ensureDocument()
    if (!doc) return

    const extractedText = wpsDocument.getFullText()

    try {
      const taskId = await this.taskScheduler.addTask({
        type: 'extractText',
        content: extractedText
      })

      this.taskScheduler.on('taskCompleted', async (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          try {
            const extractedData = result.data
            let amount = extractedData?.合同金额
            if (typeof amount === 'string') {
              const matched = amount.match(/\d+(?:\.\d+)?/)
              amount = matched ? parseFloat(matched[0]) : NaN
            }

            const fields = {
              合同名称: extractedData?.合同名称 ?? '',
              甲方: extractedData?.甲方 ?? '',
              乙方: extractedData?.乙方 ?? '',
              合同期限: extractedData?.合同期限 ?? '',
              合同摘要: extractedData?.合同摘要 ?? ''
            }
            if (typeof amount === 'number' && !Number.isNaN(amount)) {
              fields['合同金额'] = amount
            }

            // 从配置获取 sheetId，如果没有则使用默认值
            const kdocsConfig = appConfig.get('kdocs') || {}
            const sheetID = kdocsConfig.sheetId || 5

            const res = await kdocsHandler({
              type: 'createRecords',
              sheetID: sheetID,
              inputData: [{ fields }]
            })

            return res?.data?.[0]
          } catch (error) {
            unifiedLogger.error('处理AI提取结果时出错', { method: 'processWithAI', error: error.message })
          }
        }
      })

      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          unifiedLogger.error('AI处理失败', { method: 'processWithAI', taskId, error: error.message })
        }
      })
    } catch (error) {
      unifiedLogger.error('创建AI处理任务失败', { method: 'processWithAI', error: error.message })
    }
  }

  /**
   * 文本脱敏
   */
  desensitizeText() {
    if (!wpsDocument.isDocumentAvailable()) {
      window.$message?.error('未检测到活动文档')
      return
    }

    const selection = window.Application?.Selection
    if (!selection?.Text) {
      unifiedLogger.error('请先选择要脱敏的文本', { method: 'desensitizeText' })
      return
    }

    const originalText = selection.Text
    const desensitizedText = originalText
      .replace(/\d{15,18}/g, (match) =>
        match.substring(0, 6) + '*'.repeat(match.length - 10) + match.substring(match.length - 4)
      )
      .replace(/1[3-9]\d{9}/g, (match) =>
        match.substring(0, 3) + '*'.repeat(4) + match.substring(7)
      )
      .replace(/[\u4e00-\u9fa5]{2,4}/g, (match) =>
        match.length > 2 ? match[0] + '*'.repeat(match.length - 2) + match[match.length - 1] : match
      )

    window.Application?.PluginStorage?.setItem('original_text', originalText)
    window.Application?.PluginStorage?.setItem('desensitized_text', desensitizedText)

    selection.Text = desensitizedText
    window.$message?.success('文本脱敏完成')
  }

  /**
   * 应用脱敏文本
   */
  applyDesensitization(param) {
    if (!wpsDocument.isDocumentAvailable()) {
      window.$message?.error('未检测到活动文档')
      return
    }

    const desensitizedText = param?.desensitizedText
    if (!desensitizedText) {
      unifiedLogger.error('没有提供脱敏文本', { method: 'applyDesensitization' })
      return
    }

    const selection = window.Application?.Selection
    if (selection) {
      selection.Text = desensitizedText
    } else {
      unifiedLogger.error('请先选择要替换的文本区域', { method: 'applyDesensitization' })
    }
  }

  /**
   * AI 文档结构分析
   */
  async analyzeDocStructure() {
    const doc = this.ensureDocument()
    if (!doc) return

    const content = wpsDocument.getFullText()

    try {
      const taskId = await this.taskScheduler.addTask({
        type: 'analyzeStructure',
        content
      })

      this.taskScheduler.on('taskCompleted', (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          console.log('AI文档结构分析完成:', result.data)
          window.$message?.success('文档结构分析完成')
        }
      })

      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          unifiedLogger.error('AI文档结构分析失败', { method: 'analyzeDocStructure', taskId, error: error.message })
        }
      })
    } catch (error) {
      unifiedLogger.error('创建AI文档结构分析任务失败', { method: 'analyzeDocStructure', error: error.message })
    }
  }

  /**
   * 打开网页
   */
  openWeb(url) {
    if (!url || typeof url !== 'string') {
      return { success: false, message: '未提供有效的网页地址' }
    }

    try {
      if (window.Application?.ShowDialog) {
        window.Application.ShowDialog(url, 'WPS开发文档', 1200, 800, false)
        return { success: true, message: '网页已通过 WPS API 打开' }
      }
      window.open(url, '_blank')
      return { success: true, message: '网页已在新窗口中打开' }
    } catch (error) {
      return { success: false, message: `打开网页失败: ${error.message}` }
    }
  }
}

// 创建单例
const taskHandler = new TaskHandler()

// 导出
export const wpsTaskHandler = taskHandler
export default {
  onbuttonclick: (idStr, param) => taskHandler.onbuttonclick(idStr, param)
}
