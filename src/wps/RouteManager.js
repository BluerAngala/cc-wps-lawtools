// 统一的路由和导航管理器

import Util from './util.js'

// wps 路由管理类，负责管理wps的各个路由
class RouteManager {
  constructor() {
    this.routes = {
      taskpane: '/taskpane',
      contractreview: '/contractreview',
      dialog: '/dialog'
    }

    this.taskPanes = {
      taskpane: 'taskpane_id',
      contractreview: 'contractreview_id',
      dialog: 'dialog_id'
    }
  }

  // 获取完整的URL
  getFullUrl(routeName) {
    const route = this.routes[routeName]
    if (!route) {
      throw new Error(`路由 ${routeName} 不存在`)
    }
    return Util.GetUrlPath() + Util.GetRouterHash() + route
  }

  // 创建或切换任务窗格
  openTaskPane(routeName) {
    const url = this.getFullUrl(routeName)
    const storageKey = this.taskPanes[routeName]

    if (!storageKey) {
      throw new Error(`任务窗格 ${routeName} 的存储键不存在`)
    }

    console.log(`打开任务窗格: ${routeName}`)
    return Util.wpsService.createTaskPane(url, storageKey)
  }

  // 隐藏任务窗格
  hideTaskPane(routeName) {
    const storageKey = this.taskPanes[routeName]
    if (storageKey) {
      Util.wpsService.hideTaskPane(storageKey)
    }
  }

  // 停靠任务窗格
  dockTaskPane(routeName, position = 'right') {
    const storageKey = this.taskPanes[routeName]
    if (storageKey) {
      Util.wpsService.dockTaskPane(position, storageKey)
    }
  }

  // 获取所有可用路由
  getAvailableRoutes() {
    return Object.keys(this.routes)
  }
}

// 创建单例实例
const routeManager = new RouteManager()

export default routeManager
