/**
 * 文档监听器
 * 监听 WPS 文档切换事件，自动清除旧缓存
 */

/**
 * 文档监听器类
 */
export class DocumentWatcher {
  constructor(cacheManager) {
    this.cacheManager = cacheManager
    this.currentDocumentName = null
    this.currentDocumentId = null
    this.checkInterval = 1000
    this.intervalId = null
    console.log('文档监听器已初始化')
  }

  /**
   * 开始监听文档变化
   */
  startWatching() {
    if (this.intervalId) {
      console.log('文档监听器已在运行')
      return
    }

    this.updateCurrentDocument()
    this.intervalId = setInterval(() => this.checkDocumentChange(), this.checkInterval)
    console.log('开始监听文档变化')
  }

  /**
   * 停止监听文档变化
   */
  stopWatching() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('停止监听文档变化')
    }
  }

  /**
   * 检查文档是否发生变化
   */
  checkDocumentChange() {
    try {
      const currentDoc = this.getCurrentDocument()

      if (!currentDoc) {
        if (this.currentDocumentName !== null) {
          console.log('所有文档已关闭')
          this.currentDocumentName = null
          this.currentDocumentId = null
        }
        return
      }

      const { name: newDocName, id: newDocId } = currentDoc

      if (this.currentDocumentName !== newDocName || this.currentDocumentId !== newDocId) {
        console.log(`文档已切换: ${this.currentDocumentName || '无'} -> ${newDocName}`)

        if (this.currentDocumentName && this.cacheManager) {
          this.clearDocumentCache(this.currentDocumentName)
        }

        this.currentDocumentName = newDocName
        this.currentDocumentId = newDocId
        this.onDocumentChanged(newDocName, newDocId)
      }
    } catch (error) {
      console.warn('检查文档变化时出错:', error)
    }
  }

  /**
   * 获取当前活动文档信息
   */
  getCurrentDocument() {
    try {
      if (!window.Application?.ActiveDocument) return null

      const doc = window.Application.ActiveDocument
      return {
        name: doc.Name || 'Unknown',
        id: doc.FullName || doc.Name || Date.now().toString(),
        path: doc.FullName || ''
      }
    } catch (error) {
      console.warn('获取当前文档信息失败:', error)
      return null
    }
  }

  /**
   * 更新当前文档信息
   */
  updateCurrentDocument() {
    const currentDoc = this.getCurrentDocument()
    if (currentDoc) {
      this.currentDocumentName = currentDoc.name
      this.currentDocumentId = currentDoc.id
      console.log(`当前文档: ${this.currentDocumentName}`)
    }
  }

  /**
   * 清除指定文档的缓存
   */
  clearDocumentCache(docName) {
    if (!this.cacheManager) {
      console.warn('缓存管理器不可用')
      return
    }

    try {
      this.cacheManager.clear()
      console.log(`已清除文档 "${docName}" 的相关缓存`)
    } catch (error) {
      console.error('清除文档缓存失败:', error)
    }
  }

  /**
   * 文档切换事件处理
   */
  onDocumentChanged(docName, docId) {
    console.log(`文档切换事件: ${docName}`)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('documentChanged', {
        detail: { docName, docId }
      }))
    }
  }

  /**
   * 手动触发缓存清除
   */
  forceClearCache() {
    if (this.cacheManager) {
      this.cacheManager.clear()
      console.log('手动清除了所有缓存')
    }
  }

  /**
   * 获取当前文档信息
   */
  getCurrentDocumentInfo() {
    return {
      name: this.currentDocumentName,
      id: this.currentDocumentId,
      isWatching: this.intervalId !== null
    }
  }
}

export default DocumentWatcher
