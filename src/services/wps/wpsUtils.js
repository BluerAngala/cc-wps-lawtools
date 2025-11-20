import unifiedLogger from '@/utils/unifiedLogger.js'

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
  createTaskPane(key = 'default', options = {}) {
    try {
      // 检查 WPS Application 对象
      if (!window.Application) {
        const errorMsg = '❌ WPS Application 对象不存在，插件可能未正确加载'
        unifiedLogger.error(errorMsg, { method: 'createTaskPane', key })
        return null
      }

      // 构建任务窗格URL
      // 根据 key 构建对应的路由路径，如果 key 有斜杠前缀则直接使用，否则加上斜杠
      const path = key.startsWith('/') ? key : `/${key}`
      let taskPaneUrl = GetUrlPath() + GetRouterHash() + path
      console.log('taskPaneUrl', taskPaneUrl)
      
      // 如果传入的是外部URL（用于createExternalTaskPane调用），使用传入的URL
      if (options.url) {
        if (options.url.startsWith('http://') || options.url.startsWith('https://')) {
          taskPaneUrl = options.url
        } else if (options.url) {
          taskPaneUrl = GetUrlPath() + GetRouterHash() + options.url
        }
      }

      console.log(`[创建任务窗格] URL: ${taskPaneUrl}, Key: ${key}`)

      // 先关闭当前活动的任务窗格
      this.hideCurrentTaskPane()
      
      // 检查是否已存在该功能的窗格，如果存在则删除以确保加载新的URL
      let taskPane = this.taskPanes.get(key)
      if (taskPane) {
        try {
          taskPane.Delete()
          console.log(`[删除旧窗格] Key: ${key}`)
        } catch (e) {
          console.warn('删除任务窗格失败:', e)
        }
        this.taskPanes.delete(key)
      }
      
      // 创建新窗格
      console.log('[开始创建窗格]', taskPaneUrl)
      taskPane = window.Application.CreateTaskPane(taskPaneUrl)
      
      if (!taskPane) {
        const errorMsg = `❌ 创建任务窗格失败 - URL: ${taskPaneUrl} - 可能原因：URL路径不正确、文件不存在或WPS API调用失败`
        unifiedLogger.error(errorMsg, { method: 'createTaskPane', url: taskPaneUrl, key })
        return null
      }

      this.taskPanes.set(key, taskPane)
      console.log('[窗格创建成功] ID:', taskPane.ID)
      
      // 显示窗格
      taskPane.Visible = true
      
      // 应用配置参数
      if (options.width) taskPane.Width = options.width
      if (options.height) taskPane.Height = options.height
      if (options.dockPosition !== undefined) taskPane.DockPosition = options.dockPosition
      
      this.currentTaskPane = taskPane
      console.log('[任务窗格已激活]')
      return taskPane

    } catch (error) {
      const errorMsg = `❌ 创建任务窗格异常 - ${error.message || error} - 可能原因：页面文件不存在、URL路径配置错误、服务器部署问题或WPS版本不兼容`
      unifiedLogger.error(errorMsg, { method: 'createTaskPane', key, error: error.message || String(error) })
      return null
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
    // 使用统一的创建方法，key使用URL作为标识
    const key = 'external_' + url.replace(/[^a-zA-Z0-9]/g, '_')
    return this.createTaskPane(key, { width, url })
  }

  // 显示 WPS 原生对话框
  showDialog(page, options = {}) {
    const {
      width = 600,
      height = 450,
      modal = true,
      hasCaption = false,
      resizeEdge = 2,
      caption = ''
    } = options

    console.log(`准备显示 WPS 对话框: ${page}`, options)
    
    try {
      if (typeof window.Application === 'undefined') {
        console.warn('WPS Application 对象未找到')
        unifiedLogger.error('请在 WPS 环境中使用此功能', { method: 'showDialog', page })
        return
      }

      // 使用 Hash 路由构建 URL
      const dialogUrl = GetUrlPath() + GetRouterHash() + page
      console.log('对话框 URL:', dialogUrl)
      
      // 计算物理像素（考虑设备像素比）
      const pixelRatio = window.devicePixelRatio || 1
      const physicalWidth = Math.round(width * pixelRatio)
      const physicalHeight = Math.round(height * pixelRatio)
      
      console.log('对话框尺寸:', { 
        logical: { width, height }, 
        physical: { width: physicalWidth, height: physicalHeight }, 
        pixelRatio 
      })
      
      // 调用 WPS API 创建对话框
      window.Application.ShowDialog(
        dialogUrl,
        caption,
        physicalWidth,
        physicalHeight,
        modal,
        hasCaption,
        resizeEdge
      )
      
      console.log('WPS ShowDialog 调用成功')
      
    } catch (error) {
      console.error('显示 WPS 对话框失败:', error)
      unifiedLogger.error('显示对话框失败', { method: 'showDialog', page, error: error.message })
    }
  }

  // 按照官方示例的方式创建/切换任务窗格（使用 PluginStorage 持久化）
  toggleTaskPaneByStorage(url, storageKey = 'taskpane_id') {
    if (!window.Application) {
      console.error('WPS Application对象不存在')
      return null
    }

    try {
      // 从 PluginStorage 获取任务窗格 ID
      const tsId = window.Application.PluginStorage.getItem(storageKey)

      if (!tsId) {
        // 如果没有，创建新任务窗格
        const taskPane = window.Application.CreateTaskPane(url)
        const id = taskPane.ID
        // 保存 ID 到 PluginStorage
        window.Application.PluginStorage.setItem(storageKey, id)
        taskPane.Visible = true
        return taskPane
      } else {
        // 如果已有，获取任务窗格并切换可见性
        const taskPane = window.Application.GetTaskPane(tsId)
        if (taskPane) {
          taskPane.Visible = !taskPane.Visible
          return taskPane
        } else {
          // 如果获取失败，可能是窗格已被删除，重新创建
          const newTaskPane = window.Application.CreateTaskPane(url)
          const id = newTaskPane.ID
          window.Application.PluginStorage.setItem(storageKey, id)
          newTaskPane.Visible = true
          return newTaskPane
        }
      }
    } catch (error) {
      console.error('切换任务窗格失败:', error)
      return null
    }
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
      const msg = '当前只有一个文档，无法关闭'
      unifiedLogger.error(msg, { method: 'closeDoc' })
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

function GetUrlPath() {
  // 在本地网页的情况下获取路径
  if (window.location.protocol === 'file:') {
    const path = window.location.href;
    // 删除文件名以获取根路径
    return path.substring(0, path.lastIndexOf('/'));
  }

  // 在非本地网页的情况下获取根路径
  const { protocol, hostname, port } = window.location;
  const portPart = port ? `:${port}` : '';
  return `${protocol}//${hostname}${portPart}`;
}

function GetRouterHash() {
  if (window.location.protocol === 'file:') {
    return '';
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
