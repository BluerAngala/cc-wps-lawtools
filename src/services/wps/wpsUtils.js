//在后续的wps版本中，wps的所有枚举值都会通过wps.Enum对象来自动支持，现阶段先人工定义
var WPS_Enum = {
  msoCTPDockPositionLeft: 0,
  msoCTPDockPositionRight: 2,
  wdAlignParagraphRight: 2
}

/**
 * 统一的WPS服务工具类
 * 整合了所有WPS相关的通用操作
 */
class WPSService {
  constructor() {
    this.initializeEnum()
    this.currentTaskPane = null // 当前活动的任务窗格
    this.taskPanes = new Map() // 存储不同功能的任务窗格
  }

  initializeEnum() {
    if (typeof window.Application?.Enum !== 'object') {
      window.Application.Enum = WPS_Enum
    }
  }

  // 获取活动文档
  getActiveDoc() {
    if (!window.Application) {
      console.error('WPS Application对象不存在，插件可能未正确加载')
      return null
    }

    const doc = window.Application.ActiveDocument
    if (!doc) {
      console.error('当前没有打开任何文档')
      return null
    }

    return doc
  }

  // 获取文档名称
  getDocName() {
    const doc = this.getActiveDoc()
    return doc?.Name || '当前没有打开任何文档'
  }

  // 获取任务窗格
  getTaskPane(key = 'default') {
    return this.taskPanes.get(key) || null
  }

  // 创建任务窗格（确保只有一个窗格显示）
  createTaskPane(url, key = 'default', options = {}) {
    // 先关闭当前活动的任务窗格
    this.hideCurrentTaskPane()
    
    // 检查是否已存在该功能的窗格
    let taskPane = this.taskPanes.get(key)
    
    if (!taskPane) {
      // 创建新窗格
      taskPane = window.Application.CreateTaskPane(url)
      this.taskPanes.set(key, taskPane)
    }
    
    // 显示窗格
    taskPane.Visible = true
    
    // 应用配置参数
    if (options.width) taskPane.Width = options.width
    if (options.height) taskPane.Height = options.height
    if (options.dockPosition !== undefined) taskPane.DockPosition = options.dockPosition
    
    this.currentTaskPane = taskPane
    return taskPane
  }

  // 隐藏当前活动的任务窗格
  hideCurrentTaskPane() {
    if (this.currentTaskPane && this.currentTaskPane.Visible) {
      this.currentTaskPane.Visible = false
    }
  }

  // 创建外部URL任务窗格
  createExternalTaskPane(url, width = 850) {
    // 使用统一的创建方法，key使用URL作为标识
    const key = 'external_' + url.replace(/[^a-zA-Z0-9]/g, '_')
    return this.createTaskPane(url, key, { width })
  }

  // 停靠任务窗格
  dockTaskPane(position, key = 'default') {
    const taskPane = this.getTaskPane(key)
    if (taskPane) {
      const dockPosition =
        position === 'left'
          ? window.Application?.Enum?.msoCTPDockPositionLeft
          : window.Application?.Enum?.msoCTPDockPositionRight
      taskPane.DockPosition = dockPosition
    }
  }

  // 隐藏指定任务窗格
  hideTaskPane(key = 'default') {
    const taskPane = this.getTaskPane(key)
    if (taskPane) {
      taskPane.Visible = false
      // 如果隐藏的是当前活动窗格，清空引用
      if (this.currentTaskPane === taskPane) {
        this.currentTaskPane = null
      }
    }
  }

  // 删除任务窗格
  deleteTaskPane(key = 'default') {
    const taskPane = this.getTaskPane(key)
    if (taskPane) {
      taskPane.Delete()
      this.taskPanes.delete(key)
      // 如果删除的是当前活动窗格，清空引用
      if (this.currentTaskPane === taskPane) {
        this.currentTaskPane = null
      }
    }
  }

  // 启用修订模式
  enableRevisionMode(doc = null) {
    const document = doc || this.getActiveDoc()
    if (document) {
      document.TrackRevisions = true
      document.ShowRevisions = true
    }
  }

  // 在文档开头添加文本
  addStringToDoc(text = 'Hello, wps加载项!') {
    const doc = this.getActiveDoc()
    if (!doc) return

    doc.Range(0, 0).Text = text
    const rgSel = window.Application?.Selection?.Range
    rgSel?.Select()
  }

  // 插入当前时间
  insertDateTime() {
    const doc = this.getActiveDoc()
    if (!doc) return

    const selection = window.Application.Selection
    if (selection) {
      selection.Text = new Date().toLocaleString()
    }
  }

  // 创建新文档
  createNewDoc() {
    window.Application.Documents.Add()
  }

  // 关闭文档
  closeDoc() {
    if (window.Application.Documents.Count < 2) {
      alert('当前只有一个文档，别关了。')
      return
    }

    const doc = window.Application.ActiveDocument
    if (doc) doc.Close()
  }

  // 重命名文档
  renameDoc(prefix = '已修订') {
    const doc = this.getActiveDoc()
    if (!doc) return

    const originalName = doc.Name
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const extension = originalName.match(/\.[^/.]+$/)?.[0] || ''
    const newName = `${prefix}${nameWithoutExt}${extension}`

    try {
      doc.SaveAs2(newName)
      console.log(`文档已重命名为: ${newName}`)
    } catch (error) {
      console.error('重命名文档失败:', error)
    }
  }
}

// URL相关工具函数
function GetUrlPath() {
  // 在本地网页的情况下获取路径
  if (window.location.protocol === 'file:') {
    const path = window.location.href
    // 删除文件名以获取根路径
    return path.substring(0, path.lastIndexOf('/'))
  }

  // 在非本地网页的情况下获取根路径
  const { protocol, hostname, port } = window.location
  const portPart = port ? `:${port}` : ''
  return `${protocol}//${hostname}${portPart}`
}

function GetRouterHash() {
  if (window.location.protocol === 'file:') {
    return ''
  }

  return '/#'
}

// 创建单例实例
const wpsService = new WPSService()

export default {
  WPS_Enum,
  GetUrlPath,
  GetRouterHash,
  WPSService,
  wpsService
}
