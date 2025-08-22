import Util from './util.js'
import { processContractElements } from '../utils/ai/siliconflow.js'
import { kdocsHandler } from '../utils/kdocs.js'

class TaskPaneHandler {
  constructor() {
    this.initializeEnum()
  }

  initializeEnum() {
    if (typeof window.Application.Enum != 'object') {
      window.Application.Enum = Util.WPS_Enum
    }
  }

  getActiveDoc() {
    const doc = window.Application?.ActiveDocument
    if (!doc) {
      alert('当前没有打开任何文档')
      return null
    }
    return doc
  }

  getTaskPane() {
    const tsId = window.Application?.PluginStorage?.getItem('taskpane_id')
    return tsId ? window.Application?.GetTaskPane(tsId) : null
  }

  enableRevisionMode(doc) {
    doc.TrackRevisions = true
    doc.ShowRevisions = true
  }

  async onbuttonclick(idStr, param) {
    console.log('idStr', idStr, 'param', param)

    try {
      const action = this.getAction(idStr, param)
      if (action) {
        return await action()
      }

      console.warn(`未找到对应的操作: ${idStr}`)
    } catch (error) {
      console.error('执行出错:', error)
      throw error
    }
  }

  getAction(idStr, param) {
    const actions = {
      insertDateTime: () => this.insertDateTime(),
      addHeader: () => this.addHeader(param),
      dockLeft: () => this.dock('left'),
      dockRight: () => this.dock('right'),
      hideTaskPane: () => this.hideTaskPane(),
      addString: () => this.addString(),
      getDocName: () => this.getDocName(),
      addComment: () => this.addComment(param),
      extractText: () => this.extractText(),
      extractFormatted: () => this.extractFormatted(),
      renameDoc: () => this.renameDoc(),
      updateDocumentText: () => this.updateDocumentText(param),
      processWithAI: () => this.processWithAI(),
      desensitizeText: () => this.desensitizeText(),
      applyDesensitization: () => this.applyDesensitization(param)
    }
    return actions[idStr]
  }

  insertDateTime() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const selection = window.Application.Selection
    if (selection) {
      selection.Text = new Date().toLocaleString()
    }
  }

  async addHeader(param) {
    const doc = this.getActiveDoc()
    if (!doc || !param?.headerText) return

    this.enableRevisionMode(doc)

    const sections = doc.Sections
    if (sections.Count > 0) {
      const header = sections.Item(1).Headers.Item(1)
      const range = header.Range

      range.Text = param.headerText
      range.Font.Name = '宋体'
      range.Font.Size = parseInt(param.fontSize) || 12

      const alignmentMap = { '左对齐': 0, '居中': 1, '右对齐': 2 }
      range.Paragraphs.Alignment = alignmentMap[param.alignment] ?? 1
    }

    await new Promise(resolve => setTimeout(resolve, 200))
  }

  dock(position) {
    const taskPane = this.getTaskPane()
    if (taskPane) {
      const dockPosition = position === 'left'
        ? window.Application?.Enum?.msoCTPDockPositionLeft
        : window.Application?.Enum?.msoCTPDockPositionRight
      taskPane.DockPosition = dockPosition
    }
  }

  hideTaskPane() {
    const taskPane = this.getTaskPane()
    if (taskPane) {
      taskPane.Visible = false
    }
  }

  addString() {
    const doc = this.getActiveDoc()
    if (!doc) return

    doc.Range(0, 0).Text = 'Hello, wps加载项!'
    const rgSel = window.Application?.Selection?.Range
    rgSel?.Select()
  }

  getDocName() {
    const doc = this.getActiveDoc()
    return doc?.Name || '当前没有打开任何文档'
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

    keywordList.forEach(item => {
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

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  // 抽取文档中的特定数据要素
  extractText() {
    const doc = this.getActiveDoc()
    if (!doc) return
    // 构建抽取合同要素的提示词
    console.log('正在处理抽取文案~未完待续~')
    
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

  renameDoc() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const currentName = doc.Name
    const newName = '「已修订」' + currentName
    const newFullPath = doc.Path + '\\' + newName

    doc.SaveAs2(newFullPath)
    doc.Close()
    window.Application.Documents.Open(newFullPath)

    alert('文件已重命名为：' + newName)
    return newName
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
    const result = await processContractElements({ content: extractedText })
    console.log(result)

    const text = result
      .replace(/```json\n/g, '')
      .replace(/\n```/g, '')
      .replace(/[“”]/g, '"')
      .replace(/'/g, '"')

    let json = null
    try {
      json = JSON.parse(text)
      console.log('AI处理结果 json', json)
    } catch (error) {
      console.error('AI处理结果 json parse error', error)
      return text
    }

    let amount = json?.合同金额
    if (typeof amount === 'string') {
      const matched = amount.match(/\d+(?:\.\d+)?/)
      amount = matched ? parseFloat(matched[0]) : NaN
    }

    const fields = {
      合同名称: json?.合同名称 ?? '',
      甲方: json?.甲方 ?? '',
      乙方: json?.乙方 ?? '',
      合同期限: json?.合同期限 ?? '',
      合同摘要: json?.合同摘要 ?? ''
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
      .replace(/\d{15,18}/g, match => match.substring(0, 6) + '*'.repeat(match.length - 10) + match.substring(match.length - 4))
      .replace(/1[3-9]\d{9}/g, match => match.substring(0, 3) + '*'.repeat(4) + match.substring(7))
      .replace(/[\u4e00-\u9fa5]{2,4}/g, match => match.length > 2 ? match[0] + '*'.repeat(match.length - 2) + match[match.length - 1] : match)

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
}

const taskPaneHandler = new TaskPaneHandler()

export default {
  onbuttonclick: (idStr, param) => taskPaneHandler.onbuttonclick(idStr, param)
}
