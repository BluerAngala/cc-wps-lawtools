/**
 * WPS 核心服务
 * 提供环境检查、枚举、任务窗格、对话框等基础功能
 */

import unifiedLogger from '@/utils/UnifiedLogger.js'

// WPS 枚举值定义
export const WPS_Enum = {
  msoCTPDockPositionLeft: 0,
  msoCTPDockPositionRight: 2,
  wdAlignParagraphRight: 2
}

/**
 * 获取 URL 路径
 */
export function getUrlPath() {
  if (window.location.protocol === 'file:') {
    const path = decodeURIComponent(window.location.href)
    return path.substring(0, path.lastIndexOf('/'))
  }
  const { protocol, hostname, port } = window.location
  const portPart = port ? `:${port}` : ''
  return `${protocol}//${hostname}${portPart}`
}

/**
 * 获取路由 Hash
 */
export function getRouterHash() {
  return window.location.protocol === 'file:' ? '' : '/#'
}

/**
 * WPS 核心服务类
 */
class WPSCoreService {
  constructor() {
    this.currentTaskPane = null
    this.taskPanes = new Map()
    this.initializeEnum()
  }

  initializeEnum() {
    if (typeof window.Application?.Enum !== 'object') {
      window.Application.Enum = WPS_Enum
    }
  }

  // ========== 环境检查 ==========

  /**
   * 检查 WPS 环境
   */
  checkEnvironment() {
    if (typeof window.Application === 'undefined') {
      throw new Error('请在 WPS 环境中使用此功能')
    }
    return true
  }

  /**
   * 获取活动文档
   */
  getActiveDocument() {
    if (!window.Application) {
      console.error('WPS Application 对象不存在')
      return null
    }
    const doc = window.Application.ActiveDocument
    if (!doc) {
      console.error('当前没有打开任何文档')
      return null
    }
    return doc
  }

  /**
   * 获取活动文档（兼容旧版方法名）
   */
  getActiveDoc() {
    return this.getActiveDocument()
  }

  /**
   * 获取文档名称
   */
  getDocumentName() {
    const doc = this.getActiveDocument()
    return doc?.Name || '当前没有打开任何文档'
  }

  // ========== 任务窗格管理 ==========

  /**
   * 获取任务窗格
   */
  getTaskPane(key = 'default') {
    return this.taskPanes.get(key) || null
  }

  /**
   * 创建任务窗格
   */
  createTaskPane(key = 'default', options = {}) {
    try {
      if (!window.Application) {
        unifiedLogger.error('WPS Application 对象不存在', { method: 'createTaskPane', key })
        return null
      }

      const path = key.startsWith('/') ? key : `/${key}`
      let taskPaneUrl = getUrlPath() + getRouterHash() + path

      if (options.url) {
        taskPaneUrl = options.url.startsWith('http')
          ? options.url
          : getUrlPath() + getRouterHash() + options.url
      }

      console.log(`[创建任务窗格] URL: ${taskPaneUrl}, Key: ${key}`)

      this.hideCurrentTaskPane()

      // 删除已存在的窗格
      let taskPane = this.taskPanes.get(key)
      if (taskPane) {
        try {
          taskPane.Delete()
        } catch (e) {
          console.warn('删除任务窗格失败:', e)
        }
        this.taskPanes.delete(key)
      }

      taskPane = window.Application.CreateTaskPane(taskPaneUrl)
      if (!taskPane) {
        unifiedLogger.error('创建任务窗格失败', { method: 'createTaskPane', url: taskPaneUrl, key })
        return null
      }

      this.taskPanes.set(key, taskPane)
      taskPane.Visible = true

      if (options.width) taskPane.Width = options.width
      if (options.height) taskPane.Height = options.height
      if (options.dockPosition !== undefined) taskPane.DockPosition = options.dockPosition

      this.currentTaskPane = taskPane
      return taskPane
    } catch (error) {
      unifiedLogger.error('创建任务窗格异常', {
        method: 'createTaskPane',
        key,
        error: error.message
      })
      return null
    }
  }

  /**
   * 隐藏当前任务窗格
   */
  hideCurrentTaskPane() {
    if (this.currentTaskPane?.Visible) {
      this.currentTaskPane.Visible = false
    }
  }

  /**
   * 创建外部 URL 任务窗格
   */
  createExternalTaskPane(url, width = 850) {
    const key = 'external_' + url.replace(/[^a-zA-Z0-9]/g, '_')
    return this.createTaskPane(key, { width, url })
  }

  /**
   * 停靠任务窗格
   */
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

  /**
   * 隐藏任务窗格
   */
  hideTaskPane(key = 'default') {
    const taskPane = this.getTaskPane(key)
    if (taskPane) {
      taskPane.Visible = false
      if (this.currentTaskPane === taskPane) {
        this.currentTaskPane = null
      }
    }
  }

  /**
   * 删除任务窗格
   */
  deleteTaskPane(key = 'default') {
    const taskPane = this.getTaskPane(key)
    if (taskPane) {
      taskPane.Delete()
      this.taskPanes.delete(key)
      if (this.currentTaskPane === taskPane) {
        this.currentTaskPane = null
      }
    }
  }

  /**
   * 使用 PluginStorage 切换任务窗格
   */
  toggleTaskPaneByStorage(url, storageKey = 'taskpane_id') {
    if (!window.Application) return null

    try {
      const tsId = window.Application.PluginStorage.getItem(storageKey)

      if (!tsId) {
        const taskPane = window.Application.CreateTaskPane(url)
        window.Application.PluginStorage.setItem(storageKey, taskPane.ID)
        taskPane.Visible = true
        return taskPane
      }

      const taskPane = window.Application.GetTaskPane(tsId)
      if (taskPane) {
        taskPane.Visible = !taskPane.Visible
        return taskPane
      }

      const newTaskPane = window.Application.CreateTaskPane(url)
      window.Application.PluginStorage.setItem(storageKey, newTaskPane.ID)
      newTaskPane.Visible = true
      return newTaskPane
    } catch (error) {
      console.error('切换任务窗格失败:', error)
      return null
    }
  }

  // ========== 对话框 ==========

  /**
   * 显示 WPS 对话框
   */
  showDialog(page, options = {}) {
    const {
      width = 600,
      height = 450,
      modal = true,
      hasCaption = false,
      resizeEdge = 2,
      caption = ''
    } = options

    try {
      this.checkEnvironment()

      const dialogUrl = getUrlPath() + getRouterHash() + page
      const pixelRatio = window.devicePixelRatio || 1
      const physicalWidth = Math.round(width * pixelRatio)
      const physicalHeight = Math.round(height * pixelRatio)

      window.Application.ShowDialog(
        dialogUrl,
        caption,
        physicalWidth,
        physicalHeight,
        modal,
        hasCaption,
        resizeEdge
      )
    } catch (error) {
      console.error('显示对话框失败:', error)
      unifiedLogger.error('显示对话框失败', { method: 'showDialog', page, error: error.message })
    }
  }

  // ========== 文档基础操作 ==========

  /**
   * 启用修订模式
   */
  enableRevisionMode(doc = null) {
    const document = doc || this.getActiveDocument()
    if (document) {
      document.TrackRevisions = true
      document.ShowRevisions = true
    }
  }

  /**
   * 在文档开头添加文本
   */
  addTextToDocument(text = 'Hello, wps加载项!') {
    const doc = this.getActiveDocument()
    if (!doc) return
    doc.Range(0, 0).Text = text
  }

  /**
   * 插入当前时间
   */
  insertDateTime() {
    const doc = this.getActiveDocument()
    if (!doc) return
    const selection = window.Application.Selection
    if (selection) {
      selection.Text = new Date().toLocaleString()
    }
  }

  /**
   * 创建新文档
   */
  createNewDocument() {
    window.Application.Documents.Add()
  }

  /**
   * 关闭文档
   */
  closeDocument() {
    if (window.Application.Documents.Count < 2) {
      unifiedLogger.error('当前只有一个文档，无法关闭', { method: 'closeDocument' })
      return
    }
    const doc = window.Application.ActiveDocument
    if (doc) doc.Close()
  }
}

// 创建单例
export const wpsCore = new WPSCoreService()

// 兼容旧版导出（供 ribbon.js 等使用）
export default {
  WPS_Enum,
  GetUrlPath: getUrlPath,
  GetRouterHash: getRouterHash,
  WPSService: WPSCoreService,
  wpsService: wpsCore
}
