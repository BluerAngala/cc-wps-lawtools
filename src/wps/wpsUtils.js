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
  getTaskPane(storageKey = 'taskpane_id') {
    const tsId = window.Application?.PluginStorage?.getItem(storageKey)
    return tsId ? window.Application?.GetTaskPane(tsId) : null
  }

  // 创建任务窗格（确保只有一个窗格显示）
  createTaskPane(url, storageKey = 'taskpane_id') {
    // 先关闭当前活动的任务窗格
    this.hideCurrentTaskPane()
    
    let tsId = window.Application.PluginStorage.getItem(storageKey)
    if (!tsId) {
      const tskpane = window.Application.CreateTaskPane(url)
      const id = tskpane.ID
      window.Application.PluginStorage.setItem(storageKey, id)
      tskpane.Visible = true
      this.currentTaskPane = tskpane
      return tskpane
    } else {
      const tskpane = window.Application.GetTaskPane(tsId)
      tskpane.Visible = true
      this.currentTaskPane = tskpane
      return tskpane
    }
  }

  // 隐藏当前活动的任务窗格
  hideCurrentTaskPane() {
    if (this.currentTaskPane && this.currentTaskPane.Visible) {
      this.currentTaskPane.Visible = false
    }
  }

  // 创建外部URL任务窗格
  createExternalTaskPane(url, width = 850) {
    this.hideCurrentTaskPane()
    const taskPane = window.Application.CreateTaskPane(url)
    taskPane.Visible = true
    taskPane.Width = width
    this.currentTaskPane = taskPane
    return taskPane
  }

  // 停靠任务窗格
  dockTaskPane(position, storageKey = 'taskpane_id') {
    const taskPane = this.getTaskPane(storageKey)
    if (taskPane) {
      const dockPosition =
        position === 'left'
          ? window.Application?.Enum?.msoCTPDockPositionLeft
          : window.Application?.Enum?.msoCTPDockPositionRight
      taskPane.DockPosition = dockPosition
    }
  }

  // 隐藏任务窗格
  hideTaskPane(storageKey = 'taskpane_id') {
    const taskPane = this.getTaskPane(storageKey)
    if (taskPane) {
      taskPane.Visible = false
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
