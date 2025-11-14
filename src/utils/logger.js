/**
 * 完善的日志系统
 * 支持不同级别的日志记录，特别关注文件路径相关的操作
 */

class Logger {
  constructor() {
    this.logs = []
    this.maxLogs = 500 // 最多保存500条日志
    this.storageKey = 'wps_addon_logs'
    this.enableStorage = true // 是否保存到 localStorage
    this.enableConsole = true // 是否输出到控制台
    this.logLevel = 'debug' // 日志级别：debug, info, warn, error
    this.loadLogs()
  }

  /**
   * 从 localStorage 加载历史日志
   */
  loadLogs() {
    if (!this.enableStorage) return
    
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        this.logs = JSON.parse(saved)
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(0, this.maxLogs)
        }
      }
    } catch (e) {
      console.warn('[Logger] 加载历史日志失败:', e)
    }
  }

  /**
   * 保存日志到 localStorage
   */
  saveLogs() {
    if (!this.enableStorage) return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
    } catch (e) {
      // localStorage 可能已满，尝试清理旧日志
      if (e.name === 'QuotaExceededError') {
        this.logs = this.logs.slice(0, Math.floor(this.maxLogs / 2))
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
        } catch (e2) {
          console.warn('[Logger] 保存日志失败，已清理部分日志:', e2)
        }
      } else {
        console.warn('[Logger] 保存日志失败:', e)
      }
    }
  }

  /**
   * 检查日志级别是否应该记录
   */
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, extra = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...extra
    }

    // 格式化控制台输出
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    const extraInfo = Object.keys(extra).length > 0 ? '\n' + JSON.stringify(extra, null, 2) : ''
    
    return { logEntry, consoleMessage: `${prefix} ${message}${extraInfo}` }
  }

  /**
   * 记录日志（内部方法）
   */
  _log(level, message, extra = {}) {
    if (!this.shouldLog(level)) return

    const { logEntry, consoleMessage } = this.formatMessage(level, message, extra)

    // 保存到内存
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 保存到 localStorage
    this.saveLogs()

    // 输出到控制台
    if (this.enableConsole) {
      const consoleMethod = console[level] || console.log
      consoleMethod(consoleMessage)
    }
  }

  /**
   * 记录调试日志
   */
  debug(message, extra = {}) {
    this._log('debug', message, extra)
  }

  /**
   * 记录信息日志
   */
  info(message, extra = {}) {
    this._log('info', message, extra)
  }

  /**
   * 记录警告日志
   */
  warn(message, extra = {}) {
    this._log('warn', message, extra)
  }

  /**
   * 记录错误日志
   */
  error(message, extra = {}) {
    this._log('error', message, extra)
  }

  /**
   * 记录文件路径相关操作（特殊方法，自动记录路径信息）
   */
  logPath(level, message, pathInfo = {}) {
    const extra = {
      type: 'path_operation',
      ...pathInfo
    }
    this._log(level, message, extra)
  }

  /**
   * 记录文件操作（读取、写入、删除等）
   */
  logFileOperation(operation, filePath, result = null, error = null) {
    const level = error ? 'error' : 'info'
    const message = `文件操作: ${operation}`
    const extra = {
      type: 'file_operation',
      operation,
      filePath,
      result,
      error: error ? error.message : null,
      stack: error ? error.stack : null
    }
    this._log(level, message, extra)
  }

  /**
   * 记录网络请求（fetch、axios 等）
   */
  logRequest(method, url, status = null, error = null) {
    const level = error ? 'error' : status && status >= 400 ? 'error' : 'info'
    const message = `网络请求: ${method} ${url}`
    const extra = {
      type: 'network_request',
      method,
      url,
      status,
      error: error ? error.message : null
    }
    this._log(level, message, extra)
  }

  /**
   * 记录模板相关操作
   */
  logTemplate(operation, templateInfo = {}, result = null, error = null) {
    const level = error ? 'error' : 'info'
    const message = `模板操作: ${operation}`
    const extra = {
      type: 'template_operation',
      operation,
      ...templateInfo,
      result,
      error: error ? error.message : null
    }
    this._log(level, message, extra)
  }

  /**
   * 获取所有日志
   */
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return this.logs
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count = 50) {
    return this.logs.slice(0, count)
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    this.saveLogs()
    this.info('日志已清空')
  }

  /**
   * 导出日志为文本
   */
  exportLogsAsText(level = null) {
    const logsToExport = level ? this.getLogs(level) : this.logs
    return logsToExport
      .map(log => {
        const { timestamp, level, message, ...extra } = log
        const extraStr = Object.keys(extra).length > 0 
          ? '\n' + JSON.stringify(extra, null, 2)
          : ''
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${extraStr}`
      })
      .join('\n\n---\n\n')
  }

  /**
   * 下载日志文件
   */
  downloadLogs(level = null) {
    const content = this.exportLogsAsText(level)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const levelSuffix = level ? `-${level}` : ''
    a.download = `wps-addon-logs${levelSuffix}-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level) {
    const validLevels = ['debug', 'info', 'warn', 'error']
    if (validLevels.includes(level)) {
      this.logLevel = level
      this.info(`日志级别已设置为: ${level}`)
    } else {
      this.warn(`无效的日志级别: ${level}，有效值: ${validLevels.join(', ')}`)
    }
  }

  /**
   * 启用/禁用存储
   */
  setStorageEnabled(enabled) {
    this.enableStorage = enabled
  }

  /**
   * 启用/禁用控制台输出
   */
  setConsoleEnabled(enabled) {
    this.enableConsole = enabled
  }
}

// 创建单例实例
const logger = new Logger()

// 在开发环境设置为 debug 级别，生产环境设置为 info 级别
if (import.meta.env.DEV) {
  logger.setLogLevel('debug')
} else {
  logger.setLogLevel('info')
}

export default logger

