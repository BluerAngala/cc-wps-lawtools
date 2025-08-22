import Util from './util.js'

import { processContractElements } from '../utils/ai/siliconflow.js'

// 引入金山文档工具
import { kdocsHandler } from '../utils/kdocs.js'

// 处理按钮点击事件
async function onbuttonclick(idStr, param) {
  console.log('idStr', idStr, 'param', param)

  if (typeof window.Application.Enum != 'object') {
    // 如果没有内置枚举值
    window.Application.Enum = Util.WPS_Enum
  }
  switch (idStr) {
    case 'insertDateTime': {
      let doc = window.Application.ActiveDocument
      if (doc) {
        let now = new Date()
        let dateTimeStr = now.toLocaleString()
        let selection = window.Application.Selection
        if (selection) {
          selection.Text = dateTimeStr
        }
      }
      break
    }
    case 'addHeader': {
      console.log('addHeader', param)

      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }
      
      // 检查参数是否存在
      if (!param || !param.contractNumber) {
        console.warn('addHeader: 缺少contractNumber参数')
        return
      }
      
      // 开启修订模式
      doc.TrackRevisions = true

      const sections = doc.Sections
      if (sections.Count > 0) {
        const header = sections.Item(1).Headers.Item(1)
        const range = header.Range

        // 在修订模式下添加内容
        range.Text = param.contractNumber
        range.Font.Name = '宋体'
        range.Font.Size = 12 // 小四对应12磅
        range.Paragraphs.Alignment = 2 // 2表示右对齐

        // 显示修订标记
        doc.ShowRevisions = true
      }
      break
    }
    case 'dockLeft': {
      let tsId = window.Application.PluginStorage.getItem('taskpane_id')
      if (tsId) {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.DockPosition = window.Application.Enum.msoCTPDockPositionLeft
      }
      break
    }
    case 'dockRight': {
      let tsId = window.Application.PluginStorage.getItem('taskpane_id')
      if (tsId) {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.DockPosition = window.Application.Enum.msoCTPDockPositionRight
      }
      break
    }
    case 'hideTaskPane': {
      let tsId = window.Application.PluginStorage.getItem('taskpane_id')
      if (tsId) {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.Visible = false
      }
      break
    }
    case 'addString': {
      let doc = window.Application.ActiveDocument
      if (doc) {
        doc.Range(0, 0).Text = 'Hello, wps加载项!'
        //好像是wps的bug, 这两句话触发wps重绘
        let rgSel = window.Application.Selection.Range
        if (rgSel) rgSel.Select()
      }
      break
    }
    case 'getDocName': {
      let doc = window.Application.ActiveDocument
      if (!doc) {
        return '当前没有打开任何文档'
      }
      return doc.Name
    }
    case 'openWeb': {
      break
    }
    case 'addComment': {
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }

      // 开启修订模式
      doc.TrackRevisions = true

      // 查找文档中第一个"规定"词语
      const selection = doc.Range()
      selection.Find.ClearFormatting()
      selection.Find.Text = '规定'

      if (selection.Find.Execute()) {
        // 在找到的"规定"后面添加批注
        const commentRange = selection.Duplicate
        commentRange.Collapse(0) // 0表示折叠到末尾
        commentRange.Comments.Add(commentRange, '测试自动添加批注')

        // 显示修订标记
        doc.ShowRevisions = true
      } else {
        alert('未找到"规定"词语')
      }
      break
    }
    case 'extractText': {
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return '当前没有打开任何文档'
      }

      // 提取纯文本内容
      const text = doc.Range().Text
      return text
    }
    case 'extractFormatted': {
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return '当前没有打开任何文档'
      }

      // 保存文档为HTML格式到临时文件
      const tempPath = 'temp.html'
      doc.SaveAs(tempPath, 'wdFormatHTML')

      // 使用XMLHttpRequest读取HTML文件内容
      const xhr = new XMLHttpRequest()
      xhr.open('GET', tempPath, false) // 同步请求
      xhr.send()

      if (xhr.status === 200) {
        const htmlContent = xhr.responseText

        // 删除临时文件 (如果可能)
        try {
          const fso = new window.ActiveXObject('Scripting.FileSystemObject')
          fso.DeleteFile(tempPath)
        } catch (e) {
          console.warn('无法删除临时文件:', e)
        }

        return htmlContent
      } else {
        console.error('读取HTML文件失败，状态码:', xhr.status)
        return '读取HTML文件失败'
      }
    }
    case 'renameDoc': {
      let doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }

      // 获取当前文件名
      let currentName = doc.Name

      // 构造新文件名
      let newName = '「已修订」' + currentName

      // 获取文件所在目录
      let fileDirectory = doc.Path

      // 构造新的完整路径
      let newFullPath = fileDirectory + '\\' + newName

      // 直接保存文件，覆盖原文件
      doc.SaveAs2(newFullPath)

      // 关闭原文件并打开新文件以实现重命名效果
      doc.Close()
      // 打开新文件
      window.Application.Documents.Open(newFullPath)

      // 提示用户
      alert('文件已重命名为：' + newName)
      // 更新显示的文件名
      return newName
    }
    case 'updateDocumentText': {
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }

      // 获取新的文本内容
      const newText = param

      // 更新文档内容
      const range = doc.Range()
      range.Text = newText

      // 重新选择文档开始位置，触发WPS重绘
      const selection = window.Application.Selection
      if (selection) {
        selection.GoTo(0) // 跳转到文档开始
      }

      alert('文档内容已更新')
      break
    }
    case 'processWithAI': {
      // AI处理文本功能
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }

      // 提取文档文本
      const extractedText = doc.Range().Text

      const result = await processContractElements({ content: extractedText })
      console.log(result)

      // 去除可能存在的一些```json\n```,将中文引号换位英文双引号 ，将单引号转为双引号
      const text = result
        .replace(/```json\n/g, '')
        .replace(/\n```/g, '')
        .replace(/[“”]/g, '"')
        .replace(/'/g, '"')
      // 判断是否可以转为json

      let json = null
      try {
        json = JSON.parse(text)
        console.log('AI处理结果 json', json)
      } catch (error) {
        console.error('AI处理结果 json parse error', error)
        return text
      }


      // 2025年8月2日 跨域问题没解决啊
      let amount = json.合同金额
      if (typeof amount === 'string') {
        const matched = amount.match(/\d+(?:\.\d+)?/)
        amount = matched ? parseFloat(matched[0]) : NaN
      }

      const fields = {
        合同名称: json.合同名称 ?? '',
        甲方: json.甲方 ?? '',
        乙方: json.乙方 ?? '',
        合同期限: json.合同期限 ?? '',
        合同摘要: json.合同摘要 ?? ''
      }
      if (typeof amount === 'number' && !Number.isNaN(amount)) {
        fields['合同金额'] = amount
      }

      console.log('创建金山文档行记录 fields', fields)
      const res = await kdocsHandler({
        type: 'createRecords',
        sheetID: Number(import.meta.env.VITE_KDOCS_SHEETID),
        inputData: [
          {
            fields
          }
        ]
      })
      console.log('res', res)

      // 获取到新建的行id
      let recordID = res?.data?.[0]?.id
      console.log('recordID', recordID)
      if ( !recordID) {
        alert('创建金山文档行记录失败或者没有返回id')
        return
      }

      return res?.data?.[0]
    }
    case 'desensitizeText': {
      // 脱敏文本功能
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }

      // 提取文档文本用于脱敏处理
      const extractedText = doc.Range().Text

      // 返回提取的文本，脱敏处理逻辑需要在Vue组件中实现
      return extractedText
    }
    case 'applyDesensitization': {
      // 应用脱敏到文档
      const doc = window.Application.ActiveDocument
      if (!doc) {
        alert('当前没有打开任何文档')
        return
      }

      // 获取脱敏参数
      const { sensitiveInfoList } = param || {}

      if (!sensitiveInfoList || sensitiveInfoList.length === 0) {
        alert('没有脱敏信息需要应用')
        return
      }

      // 启用修订模式
      doc.TrackRevisions = true
      doc.ShowRevisions = true

      const find = doc.Content.Find
      const wdReplaceOne = 2 // WPS常量，替换一个匹配项
      const wdColorBlue = 5 // WPS颜色常量，蓝色

      sensitiveInfoList.forEach((item) => {
        // 清除之前的查找设置
        find.ClearFormatting()
        find.Replacement.ClearFormatting()

        // 设置查找和替换文本
        find.Text = item.original
        find.Replacement.Text = item.desensitized

        // 执行替换
        find.Execute(
          false, // MatchCase
          false, // MatchWholeWord
          false, // MatchWildcards
          false, // MatchSoundsLike
          false, // MatchAllWordForms
          false, // Forward
          true, // Wrap
          1, // Format
          true, // Replace
          wdReplaceOne // ReplaceAll/ReplaceOne
        )

        // 在相同位置插入脱敏文本并记录为插入修订
        if (find.Found) {
          const range = find.Parent
          range.Text = item.desensitized
          range.Font.ColorIndex = wdColorBlue // 用蓝色标记插入的脱敏文本
        }
      })

      alert('敏感信息已成功替换')
      break
    }
  }
}

export default {
  onbuttonclick
}
