import Util from './util.js'
import { kdocsHandler } from '../utils/kdocs.js'
import TaskScheduler from '../services/ai/TaskScheduler.js'

// 任务窗格处理类 负责处理任务窗格的各个操作
class TaskPaneHandler {
  constructor() {
    this.wpsService = Util.wpsService
    // 初始化AI框架
    this.taskScheduler = new TaskScheduler({
      maxConcurrentTasks: 3,
      taskTimeout: 30000,
      retryAttempts: 2
    })
    console.log('TaskPaneHandler AI框架已初始化')
  }

  // 使用统一的WPS服务
  getActiveDoc() {
    return this.wpsService.getActiveDoc()
  }

  getTaskPane() {
    return this.wpsService.getTaskPane()
  }

  enableRevisionMode(doc) {
    this.wpsService.enableRevisionMode(doc)
  }

  async onbuttonclick(idStr, param) {
    console.log('=== TaskPane处理按钮点击 ===')
    console.log('idStr:', idStr, 'param:', param)
    console.log('WPS Application存在:', !!window.Application)
    console.log('当前活动文档:', !!this.getActiveDoc())

    try {
      const action = this.getAction(idStr, param)
      console.log('找到的操作函数:', !!action)
      
      if (action) {
        console.log(`开始执行操作: ${idStr}`)
        const result = await action()
        console.log(`操作 ${idStr} 执行完成，结果:`, result)
        return result
      }

      console.warn(`未找到对应的操作: ${idStr}`)
      return { success: false, message: `未找到操作: ${idStr}` }
    } catch (error) {
      console.error(`执行操作 ${idStr} 时出错:`, error)
      throw error
    }
  }

  getAction(idStr, param) {
    const actions = {
      insertDateTime: () => this.wpsService.insertDateTime(),
      addHeader: () => this.addHeader(param),
      dockLeft: () => this.wpsService.dockTaskPane('left'),
      dockRight: () => this.wpsService.dockTaskPane('right'),
      hideTaskPane: () => this.wpsService.hideTaskPane(),
      addString: () => this.wpsService.addStringToDoc(),
      getDocName: () => this.wpsService.getDocName(),
      addComment: () => this.addComment(param),
      extractText: () => this.extractText(param),
      contractReview: () => this.contractReview(param),
      extractFormatted: () => this.extractFormatted(),
      renameDoc: () => this.wpsService.renameDoc(),
      updateDocumentText: () => this.updateDocumentText(param),
      processWithAI: () => this.processWithAI(),
      desensitizeText: () => this.desensitizeText(),
      applyDesensitization: () => this.applyDesensitization(param),
      analyzeDocStructure: () => this.analyzeDocStructure(),
      openWeb: () => this.openWeb(param)
    }
    return actions[idStr]
  }

  async addHeader(param) {
    const doc = this.getActiveDoc()
    if (!doc || !param?.headerText) {
      return { success: false, message: '文档不存在或页眉文本为空' }
    }

    try {
      this.enableRevisionMode(doc)

      const sections = doc.Sections
      if (sections.Count > 0) {
        const header = sections.Item(1).Headers.Item(1)
        const range = header.Range

        // 检查是否已有页眉内容
        const existingText = range.Text?.trim() || ''
        let newHeaderText = param.headerText

        // 如果已有页眉内容，将新内容追加到现有内容后面
        if (existingText && existingText !== param.headerText) {
          // 检查是否已包含要添加的内容，避免重复
          if (!existingText.includes(param.headerText)) {
            newHeaderText = existingText + '\t' + param.headerText
          } else {
            // 如果已包含相同内容，直接返回成功
            return { success: true, message: '页眉内容已存在，无需重复添加' }
          }
        }

        range.Text = newHeaderText
        range.Font.Name = '宋体'
        range.Font.Size = parseInt(param.fontSize) || 12

        const alignmentMap = { 左对齐: 0, 居中: 1, 右对齐: 2 }
        range.Paragraphs.Alignment = alignmentMap[param.alignment] ?? 1

        await new Promise((resolve) => setTimeout(resolve, 200))

        return {
          success: true,
          message: '页眉添加成功',
          headerText: newHeaderText
        }
      } else {
        return { success: false, message: '文档中没有找到节或页眉' }
      }
    } catch (error) {
      console.error('添加页眉时出错:', error)
      return {
        success: false,
        message: `添加页眉失败: ${error.message}`
      }
    }
  }

  async addComment(param) {
    const doc = this.getActiveDoc()
    if (!doc) return

    const keywordList = param?.keywordList
    if (!keywordList?.length) {
      alert('请先在前端配置关键词列表')
      return
    }

    this.enableRevisionMode(doc)
    let foundCount = 0

    keywordList.forEach((item) => {
      const keyword = item?.keyword?.trim()
      if (!keyword) return

      const comment = item?.comment || `关键词"${keyword}"需要重点关注`
      const selection = doc.Range()
      selection.Find?.ClearFormatting()
      selection.Find.Text = keyword

      if (selection.Find?.Execute()) {
        const commentRange = selection.Duplicate
        commentRange?.Collapse(0)
        commentRange?.Comments?.Add(commentRange, comment)
        foundCount++
      }
    })

    if (foundCount > 0) {
      console.log(`成功为${foundCount}个关键词添加批注`)
    } else {
      alert('未找到任何指定的关键词')
    }

    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  // 抽取文档中的特定数据要素
  async extractText(param) {
    const doc = this.getActiveDoc()
    if (!doc) {
      console.error('extractText: 无法获取活动文档')
      return ''
    }

    // 如果只是获取文档内容，直接返回
    if (!param || Object.keys(param).length === 0) {
      try {
        // 调试文档对象的可用方法
        console.log('extractText: 文档对象可用方法检查')
        console.log('doc.Range:', typeof doc.Range)
        console.log('doc.Content:', typeof doc.Content)
        console.log('window.Application.Selection:', !!window.Application?.Selection)

        // 尝试多种方式获取文档内容
        let extractedText = ''

        // 方法1: 使用Range获取全部内容
        if (doc.Range) {
          console.log('extractText: 尝试使用Range方法')
          try {
            extractedText = doc.Range().Text
            console.log('extractText: Range方法成功，内容长度:', extractedText?.length || 0)
          } catch (rangeError) {
            console.error('extractText: Range方法失败:', rangeError)
          }
        }

        // 方法2: 如果Range方法失败，尝试使用Content
        if (!extractedText && doc.Content) {
          console.log('extractText: 尝试使用Content方法')
          try {
            extractedText = doc.Content.Text
            console.log('extractText: Content方法成功，内容长度:', extractedText?.length || 0)
          } catch (contentError) {
            console.error('extractText: Content方法失败:', contentError)
          }
        }

        // 方法3: 如果还是失败，尝试使用Selection
        if (!extractedText && window.Application?.Selection) {
          console.log('extractText: 尝试使用Selection方法')
          try {
            // 先选择全部内容
            window.Application.Selection.WholeStory()
            extractedText = window.Application.Selection.Text
            console.log('extractText: Selection方法成功，内容长度:', extractedText?.length || 0)
          } catch (selectionError) {
            console.error('extractText: Selection方法失败:', selectionError)
          }
        }

        console.log('获取文档内容，长度:', extractedText?.length || 0)
        console.log('文档内容预览:', extractedText?.substring(0, 100) + '...')

        if (!extractedText || extractedText.trim().length === 0) {
          console.warn('extractText: 文档内容为空，可能文档未正确加载或没有内容')
          return ''
        }

        return extractedText
      } catch (error) {
        console.error('extractText: 获取文档内容时出错:', error)
        return ''
      }
    }

    // 获取用户配置的提取标签
    const extractTags = param?.extractContent || ['甲方名称', '乙方名称', '合同金额']
    console.log('正在处理抽取文案，提取标签:', extractTags)

    const extractedText = doc.Range().Text

    try {
      // 使用新的AI框架
      const taskConfig = {
        type: 'extractText',
        content: extractedText,
        options: { extractTags }
      }

      const taskId = await this.taskScheduler.addTask(taskConfig)

      // 监听任务完成
      this.taskScheduler.on('taskCompleted', (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          console.log('AI处理结果:', result)

          try {
            const json =
              typeof result.content === 'string' ? JSON.parse(result.content) : result.content
            console.log('AI处理结果 json', json)
          } catch (error) {
            console.error('AI处理结果 json parse error', error)
          }
        }
      })

      // 监听任务错误
      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          console.error('AI处理出错:', error)
          alert('AI处理出错，请稍后重试')
        }
      })
    } catch (error) {
      console.error('创建AI任务失败:', error)
      alert('创建AI任务失败，请稍后重试')
    }
  }

  // AI合同预审
  async contractReview(param) {
    const doc = this.getActiveDoc()
    if (!doc) return

    const { actionType = 'comment' } = param || {}
    console.log('开始合同预审，操作类型:', actionType)

    const extractedText = doc.Range().Text
    console.log('提取的文档内容:', extractedText)

    try {
      // 使用新的AI框架进行合同预审
      const taskId = await this.taskScheduler.addTask({
        type: 'contractReview',
        content: extractedText,
        options: { actionType }
      })

      // 监听任务完成
      this.taskScheduler.on('taskCompleted', (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          try {
            const reviewData = result.data
            console.log('AI预审结果:', reviewData)

            if (actionType === 'comment') {
              this.addReviewComments(doc, reviewData)
            } else if (actionType === 'revision') {
              this.addReviewRevisions(doc, reviewData)
            }

            console.log('合同预审完成')
          } catch (error) {
            console.error('处理AI预审结果时出错:', error)
            alert('处理AI预审结果时出错，请稍后重试')
          }
        }
      })

      // 监听任务错误
      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          console.error('AI预审任务失败:', error)
          alert('AI预审失败，请稍后重试')
        }
      })
    } catch (error) {
      console.error('创建AI预审任务失败:', error)
      alert('创建AI预审任务失败，请稍后重试')
    }
  }

  // 添加预审批注
  async addReviewComments(doc, reviewData) {
    if (!reviewData?.issues || !Array.isArray(reviewData.issues)) {
      console.log('没有发现需要批注的问题')
      return
    }

    let addedCount = 0
    reviewData.issues.forEach((issue) => {
      const { keyword, comment } = issue
      if (!keyword || !comment) return

      const selection = doc.Range()
      selection.Find?.ClearFormatting()
      selection.Find.Text = keyword

      if (selection.Find?.Execute()) {
        const commentRange = selection.Duplicate
        commentRange?.Collapse(0)
        commentRange?.Comments?.Add(commentRange, comment)
        addedCount++
      }
    })

    if (addedCount > 0) {
      console.log(`成功添加${addedCount}个预审批注`)
    } else {
      alert('未找到需要批注的内容')
    }
  }

  // 添加预审修订
  async addReviewRevisions(doc, reviewData) {
    if (!reviewData?.revisions || !Array.isArray(reviewData.revisions)) {
      console.log('没有发现需要修订的内容')
      return
    }

    this.enableRevisionMode(doc)
    let revisedCount = 0

    reviewData.revisions.forEach((revision) => {
      const { original, suggested, reason } = revision
      if (!original || !suggested) return

      const selection = doc.Range()
      selection.Find?.ClearFormatting()
      selection.Find.Text = original

      if (selection.Find?.Execute()) {
        selection.Text = suggested
        if (reason) {
          const commentRange = selection.Duplicate
          commentRange?.Collapse(0)
          commentRange?.Comments?.Add(commentRange, `修订原因: ${reason}`)
        }
        revisedCount++
      }
    })

    if (revisedCount > 0) {
      console.log(`成功进行${revisedCount}处预审修订`)
    } else {
      alert('未找到需要修订的内容')
    }
  }

  extractFormatted() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const selection = doc?.Selection
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
      console.log('提取的格式化数据:', formattedData)
      window.Application?.PluginStorage?.setItem('formatted_data', JSON.stringify(formattedData))
      alert('格式化文本已提取并保存')
    } else {
      alert('请先选择要提取的文本')
    }
  }

  updateDocumentText(param) {
    const doc = this.getActiveDoc()
    if (!doc) return

    const range = doc?.Range()
    if (range) {
      range.Text = param
      window.Application?.Selection?.GoTo(0)
      alert('文档内容已更新')
    }
  }

  async processWithAI() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const extractedText = doc.Range().Text
    console.log('开始AI处理合同元素提取')

    try {
      // 使用新的AI框架进行合同元素提取
      const taskId = await this.taskScheduler.addTask({
        type: 'extractText',
        content: extractedText
      })

      // 监听任务完成
      this.taskScheduler.on('taskCompleted', async (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          try {
            const extractedData = result.data
            console.log('AI提取结果:', extractedData)

            // 处理合同金额
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

            console.log('创建金山文档行记录 fields', fields)
            const res = await kdocsHandler({
              type: 'createRecords',
              sheetID: Number(import.meta.env.VITE_KDOCS_SHEETID),
              inputData: [{ fields }]
            })
            console.log('res', res)

            const recordID = res?.data?.[0]?.id
            console.log('recordID', recordID)
            if (!recordID) {
              alert('创建金山文档行记录失败或者没有返回id')
              return
            }

            return res?.data?.[0]
          } catch (error) {
            console.error('处理AI提取结果时出错:', error)
            alert('处理AI提取结果时出错，请稍后重试')
          }
        }
      })

      // 监听任务错误
      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          console.error('AI处理任务失败:', error)
          alert('AI处理失败，请稍后重试')
        }
      })
    } catch (error) {
      console.error('创建AI处理任务失败:', error)
      alert('创建AI处理任务失败，请稍后重试')
    }
  }

  desensitizeText() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const selection = doc?.Selection
    if (!selection?.Text) {
      alert('请先选择要脱敏的文本')
      return
    }

    const originalText = selection.Text
    const desensitizedText = originalText
      .replace(
        /\d{15,18}/g,
        (match) =>
          match.substring(0, 6) + '*'.repeat(match.length - 10) + match.substring(match.length - 4)
      )
      .replace(
        /1[3-9]\d{9}/g,
        (match) => match.substring(0, 3) + '*'.repeat(4) + match.substring(7)
      )
      .replace(/[\u4e00-\u9fa5]{2,4}/g, (match) =>
        match.length > 2 ? match[0] + '*'.repeat(match.length - 2) + match[match.length - 1] : match
      )

    window.Application?.PluginStorage?.setItem('original_text', originalText)
    window.Application?.PluginStorage?.setItem('desensitized_text', desensitizedText)

    selection.Text = desensitizedText
    alert('文本脱敏完成')
  }

  applyDesensitization(param) {
    const doc = this.getActiveDoc()
    if (!doc) return

    const desensitizedText = param?.desensitizedText
    if (!desensitizedText) {
      alert('没有提供脱敏文本')
      return
    }

    const selection = doc?.Selection
    if (selection) {
      selection.Text = desensitizedText
      console.log('脱敏文本已应用')
    } else {
      alert('请先选择要替换的文本区域')
    }
  }

  async analyzeDocStructure() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const content = doc.Range().Text
    console.log('开始AI文档结构分析...')

    try {
      // 使用新的AI框架进行文档结构分析
      const taskId = await this.taskScheduler.addTask({
        type: 'analyzeStructure',
        content: content
      })

      // 监听任务完成
      this.taskScheduler.on('taskCompleted', (completedTaskId, result) => {
        if (completedTaskId === taskId) {
          try {
            const structureData = result.data
            console.log('AI文档结构分析完成:', structureData)
            // 这里可以根据需要处理结构分析结果
            alert('文档结构分析完成，请查看控制台输出')
          } catch (error) {
            console.error('处理AI结构分析结果时出错:', error)
            alert('处理AI结构分析结果时出错，请稍后重试')
          }
        }
      })

      // 监听任务错误
      this.taskScheduler.on('taskError', (errorTaskId, error) => {
        if (errorTaskId === taskId) {
          console.error('AI文档结构分析任务失败:', error)
          alert('AI文档结构分析失败，请稍后重试')
        }
      })
    } catch (error) {
      console.error('创建AI文档结构分析任务失败:', error)
      alert('创建AI文档结构分析任务失败，请稍后重试')
    }
  }

  // 打开网页
  openWeb(url) {
    console.log('打开网页:', url)
    if (url && typeof url === 'string') {
      try {
        // 检查是否在 WPS 环境中
        if (window.Application && window.Application.ShowDialog) {
          // 使用 WPS 官方 API 打开网页
          console.log('使用 WPS ShowDialog API 打开网页')
          window.Application.ShowDialog(url, 'WPS开发文档', 1200, 800, false)
          return { success: true, message: '网页已通过 WPS API 打开' }
        } else {
          // 回退到普通浏览器方式
          console.log('回退到普通浏览器方式打开网页')
          window.open(url, '_blank')
          return { success: true, message: '网页已在新窗口中打开' }
        }
      } catch (error) {
        console.error('打开网页失败:', error)
        return { success: false, message: `打开网页失败: ${error.message}` }
      }
    } else {
      console.warn('未提供有效的网页地址')
      return { success: false, message: '未提供有效的网页地址' }
    }
  }
}

const taskPaneHandler = new TaskPaneHandler()

export default {
  onbuttonclick: (idStr, param) => taskPaneHandler.onbuttonclick(idStr, param)
}
