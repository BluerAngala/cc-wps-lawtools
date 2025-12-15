/**
 * WPS 文件操作服务
 * 提供页眉添加、文档重命名、PDF导出、文件删除等功能
 */

import { wpsDocument } from './document.js'

/**
 * WPS 文件服务类
 */
class WPSFileService {
  /**
   * 检查环境并返回文档（复用 document 服务的方法）
   */
  checkEnvironment() {
    return wpsDocument.checkWPSEnvironment()
  }

  /**
   * 添加页眉
   * @param {Object} options - 配置选项
   * @param {string} options.text - 页眉文本
   * @param {number} options.fontSize - 字体大小，默认12
   * @param {string} options.alignment - 对齐方式：左对齐/居中/右对齐，默认右对齐
   */
  async addHeader({ text, fontSize = 12, alignment = '右对齐' }) {
    const doc = this.checkEnvironment()
    if (!text) {
      return { success: false, message: '页眉文本为空' }
    }

    try {
      const sections = doc.Sections
      if (sections.Count === 0) {
        return { success: false, message: '文档没有节' }
      }

      sections.Item(1).PageSetup.DifferentFirstPageHeaderFooter = false
      const header = sections.Item(1).Headers.Item(1)
      const range = header.Range

      const existingText = range.Text?.trim() || ''
      let newHeaderText = text

      if (existingText && !existingText.includes(text)) {
        newHeaderText = existingText + '\t' + text
      } else if (existingText.includes(text)) {
        return { success: true, message: '页眉内容已存在' }
      }

      range.Text = newHeaderText
      range.Font.Name = '宋体'
      range.Font.Size = fontSize

      const alignmentMap = { 左对齐: 0, 居中: 1, 右对齐: 2 }
      range.Paragraphs.Alignment = alignmentMap[alignment] ?? 2

      // 退出页眉编辑模式
      this.closeHeaderFooter()

      return { success: true, message: '页眉添加成功' }
    } catch (error) {
      return { success: false, message: error.message || '页眉添加失败' }
    }
  }

  /**
   * 文档重命名（另存为新文件名）
   * @param {Object} options - 配置选项
   * @param {string} options.prefix - 文件名前缀，默认「已修订」
   * @param {boolean} options.deleteOriginal - 是否删除原文件，默认false
   */
  async renameDocument({ prefix = '「已修订」', deleteOriginal = false } = {}) {
    const doc = this.checkEnvironment()

    try {
      const directory = doc.Path || ''
      const originalName = doc.Name
      const pathSeparator = directory.includes('/') ? '/' : '\\'
      const originalFullPath = directory ? `${directory}${pathSeparator}${originalName}` : originalName

      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
      const extension = originalName.match(/\.[^/.]+$/)?.[0] || ''
      const newFileName = `${prefix}${nameWithoutExt}${extension}`
      const newFullPath = directory ? `${directory}${pathSeparator}${newFileName}` : newFileName

      doc.SaveAs2(newFullPath)

      let deleteResult = null
      if (deleteOriginal) {
        deleteResult = await this.deleteFile(originalFullPath)
      }

      return { success: true, message: '文档重命名成功', newFileName, newFullPath, deleteResult }
    } catch (error) {
      return { success: false, message: error.message || '文档重命名失败' }
    }
  }

  /**
   * 导出PDF
   * @param {Object} options - 配置选项
   * @param {string} options.outputPath - 输出路径，默认与文档同目录
   */
  async exportPDF({ outputPath } = {}) {
    const doc = this.checkEnvironment()

    try {
      const directory = doc.Path || ''
      const currentName = doc.Name
      const pathSeparator = directory.includes('/') ? '/' : '\\'
      const pdfFileName = currentName.replace(/\.[^/.]+$/, '.pdf')
      const pdfFullPath = outputPath || (directory ? `${directory}${pathSeparator}${pdfFileName}` : pdfFileName)

      doc.ExportAsFixedFormat(pdfFullPath, 17, false, 0, 0, 1, 1, 7, true, true, 0, true, true, false)
      await new Promise(resolve => setTimeout(resolve, 1000))

      return { success: true, message: 'PDF导出成功', pdfFileName, pdfFullPath }
    } catch (error) {
      let errorMessage = 'PDF导出失败'
      if (error.number) {
        const errorMap = {
          '-2146827284': '文件路径不存在或无访问权限',
          '-2146827850': '磁盘空间不足',
          '-2147467259': '未指定的错误，请检查文档内容'
        }
        errorMessage = errorMap[String(error.number)] || `错误代码 ${error.number}`
      }
      return { success: false, message: errorMessage }
    }
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   */
  async deleteFile(filePath) {
    try {
      const fs = window.Application?.FileSystem
      if (!fs || typeof fs.unlinkSync !== 'function') {
        return { success: false, message: '当前环境不支持文件删除', unsupported: true }
      }
      fs.unlinkSync(filePath)
      return { success: true, message: '文件删除成功' }
    } catch (error) {
      return { success: false, message: error.message || '文件删除失败' }
    }
  }

  /**
   * 获取文档信息
   */
  getDocumentInfo() {
    const doc = this.checkEnvironment()
    const directory = doc.Path || ''
    const pathSeparator = directory.includes('/') ? '/' : '\\'
    return {
      name: doc.Name,
      path: directory,
      fullPath: directory ? `${directory}${pathSeparator}${doc.Name}` : doc.Name,
      pathSeparator
    }
  }

  /**
   * 保存文档
   */
  saveDocument() {
    const doc = this.checkEnvironment()
    try {
      doc.Save()
      return { success: true, message: '文档保存成功' }
    } catch (error) {
      return { success: false, message: error.message || '文档保存失败' }
    }
  }

  /**
   * 退出页眉页脚编辑模式，返回正文编辑
   */
  closeHeaderFooter() {
    try {
      const doc = this.checkEnvironment()
      const view = doc.ActiveWindow?.View
      // 如果当前在页眉页脚视图，切换回正文
      if (view?.SeekView !== 0) {
        // wdSeekMainDocument = 0
        view.SeekView = 0
      }
      // 将光标移到文档开头
      doc.Range(0, 0).Select()
    } catch {
      // 忽略错误，不影响主流程
    }
  }

  /**
   * 添加页码
   * @param {Object} options - 配置选项
   * @param {string} options.format - 页码格式：'page' | 'pageOfTotal'，默认 'pageOfTotal'
   * @param {string} options.position - 位置：'bottom' | 'top'，默认 'bottom'
   * @param {string} options.alignment - 对齐方式：'左对齐' | '居中' | '右对齐'，默认 '居中'
   * @param {number} options.fontSize - 字体大小，默认 10
   */
  async addPageNumber({ format = 'pageOfTotal', position = 'bottom', alignment = '居中', fontSize = 10 } = {}) {
    const doc = this.checkEnvironment()

    try {
      const sections = doc.Sections
      if (sections.Count === 0) {
        return { success: false, message: '文档没有节' }
      }

      // 获取页脚或页眉
      const section = sections.Item(1)
      const headerFooter = position === 'top' ? section.Headers.Item(1) : section.Footers.Item(1)
      const range = headerFooter.Range

      // 清空现有内容
      range.Text = ''

      // 对齐方式映射
      const alignmentMap = { 左对齐: 0, 居中: 1, 右对齐: 2 }
      range.Paragraphs.Alignment = alignmentMap[alignment] ?? 1

      // 插入页码
      if (format === 'pageOfTotal') {
        // 格式：第 X 页 / 共 Y 页
        range.InsertAfter('第 ')
        range.Collapse(0) // wdCollapseEnd
        headerFooter.PageNumbers.Add(alignmentMap[alignment] ?? 1)
        range.InsertAfter(' 页 / 共 ')
        // 插入总页数域
        const endRange = headerFooter.Range
        endRange.Collapse(0)
        endRange.Fields.Add(endRange, -1, 'NUMPAGES', false)
        const finalRange = headerFooter.Range
        finalRange.Collapse(0)
        finalRange.InsertAfter(' 页')
      } else {
        // 简单页码
        headerFooter.PageNumbers.Add(alignmentMap[alignment] ?? 1)
      }

      // 设置字体
      headerFooter.Range.Font.Name = '宋体'
      headerFooter.Range.Font.Size = fontSize

      // 退出页眉页脚编辑模式
      this.closeHeaderFooter()

      return { success: true, message: '页码添加成功' }
    } catch (error) {
      return { success: false, message: error.message || '页码添加失败' }
    }
  }

  /**
   * 添加水印
   * @param {Object} options - 配置选项
   * @param {string} options.text - 水印文本，默认 '草稿'
   * @param {string} options.fontName - 字体名称，默认 '宋体'
   * @param {number} options.fontSize - 字体大小，默认 48
   * @param {string} options.color - 颜色（灰色深度），默认 'light'：'light' | 'medium' | 'dark'
   * @param {boolean} options.diagonal - 是否斜向，默认 true
   */
  async addWatermark({ text = '草稿', fontName = '宋体', fontSize = 48, color = 'light', diagonal = true } = {}) {
    const doc = this.checkEnvironment()

    try {
      const sections = doc.Sections
      if (sections.Count === 0) {
        return { success: false, message: '文档没有节' }
      }

      // 颜色映射（灰色深度）
      const colorMap = {
        light: 0xc0c0c0, // 浅灰
        medium: 0x808080, // 中灰
        dark: 0x404040 // 深灰
      }
      const watermarkColor = colorMap[color] || colorMap.light

      // 遍历所有节添加水印
      for (let i = 1; i <= sections.Count; i++) {
        const section = sections.Item(i)
        const header = section.Headers.Item(1)

        // 激活页眉编辑
        header.Range.Select()

        // 添加艺术字作为水印
        const shapes = header.Shapes
        const shape = shapes.AddTextEffect(
          0, // msoTextEffect1
          text,
          fontName,
          fontSize,
          false, // Bold
          false, // Italic
          0, // Left
          0 // Top
        )

        // 设置水印属性
        shape.Fill.Visible = true
        shape.Fill.Solid()
        shape.Fill.ForeColor.RGB = watermarkColor
        shape.Line.Visible = false

        // 设置位置和旋转
        shape.RelativeHorizontalPosition = 1 // wdRelativeHorizontalPositionPage
        shape.RelativeVerticalPosition = 1 // wdRelativeVerticalPositionPage
        shape.Left = -999995 // wdShapeCenter
        shape.Top = -999995 // wdShapeCenter

        if (diagonal) {
          shape.Rotation = -45
        }

        // 设置为衬于文字下方
        shape.WrapFormat.Type = 3 // wdWrapBehind
        shape.WrapFormat.AllowOverlap = true
      }

      // 退出页眉编辑模式
      this.closeHeaderFooter()

      return { success: true, message: '水印添加成功' }
    } catch (error) {
      return { success: false, message: error.message || '水印添加失败' }
    }
  }
}

// 创建单例
export const wpsFile = new WPSFileService()

// 兼容旧版导出
export { WPSFileService, wpsFile as wpsFileService }
