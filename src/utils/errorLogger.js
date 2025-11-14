/**
 * 错误日志管理工具
 * 用于记录和管理应用程序中的错误信息
 */
class ErrorLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 100 // 最多保存100条日志
    this.storageKey = 'wps_addon_error_logs'
    this.loadLogs()
  }

  /**
   * 从 localStorage 加载历史日志
   */
  loadLogs() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        this.logs = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('加载历史日志失败:', e)
    }
  }

  /**
   * 保存日志到 localStorage
   */
  saveLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
    } catch (e) {
      console.warn('保存日志失败:', e)
    }
  }

  /**
   * 记录错误日志
   * @param {string} message - 错误消息
   * @param {object} extra - 额外信息
   */
  log(message, extra = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      ...extra
    }

    this.logs.unshift(logEntry)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    this.saveLogs()

    // 同时输出到控制台
    console.error('[错误日志]', logEntry)

    // 如果有 NaiveUI 的 message 组件，显示提示
    if (window.$message) {
      window.$message.error(message)
    }
  }

  /**
   * 获取所有日志
   */
  getLogs() {
    return this.logs
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    this.saveLogs()
  }

  /**
   * 导出日志为文本
   */
  exportLogsAsText() {
    return this.logs
      .map(
        (log) =>
          `[${log.timestamp}] ${log.message}\n${log.url ? `URL: ${log.url}\n` : ''}${log.key ? `Key: ${log.key}\n` : ''}${log.error ? `Error: ${log.error}\n` : ''}\n`
      )
      .join('\n---\n\n')
  }

  /**
   * 下载日志文件
   */
  downloadLogs() {
    const content = this.exportLogsAsText()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wps-addon-error-logs-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// 创建单例实例
const errorLogger = new ErrorLogger()

export default errorLogger

