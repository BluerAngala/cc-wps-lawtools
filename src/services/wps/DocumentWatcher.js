/**
 * 文档监听器 - 监听WPS文档切换事件
 * 当打开新文档时自动清除旧的缓存
 */

export class DocumentWatcher {
  constructor(cacheManager) {
    this.cacheManager = cacheManager
    this.currentDocumentName = null
    this.currentDocumentId = null
    this.checkInterval = 1000 // 每秒检查一次
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

    // 获取初始文档信息
    this.updateCurrentDocument()

    // 定期检查文档变化
    this.intervalId = setInterval(() => {
      this.checkDocumentChange()
    }, this.checkInterval)

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
        // 没有打开的文档
        if (this.currentDocumentName !== null) {
          console.log('所有文档已关闭')
          this.currentDocumentName = null
          this.currentDocumentId = null
        }
        return
      }

      const newDocName = currentDoc.name
      const newDocId = currentDoc.id

      // 检查是否切换了文档
      if (this.currentDocumentName !== newDocName || this.currentDocumentId !== newDocId) {
        console.log(`文档已切换: ${this.currentDocumentName || '无'} -> ${newDocName}`)

        // 清除旧文档的缓存
        if (this.currentDocumentName && this.cacheManager) {
          this.clearDocumentCache(this.currentDocumentName, this.currentDocumentId)
        }

        // 更新当前文档信息
        this.currentDocumentName = newDocName
        this.currentDocumentId = newDocId

        // 触发文档切换事件
        this.onDocumentChanged(newDocName, newDocId)
      }
    } catch (error) {
      console.warn('检查文档变化时出错:', error)
    }
  }

  /**
   * 获取当前活动文档信息
   * @returns {Object|null} 文档信息
   */
  getCurrentDocument() {
    try {
      if (!window.Application || !window.Application.ActiveDocument) {
        return null
      }

      const doc = window.Application.ActiveDocument
      return {
        name: doc.Name || 'Unknown',
        id: doc.FullName || doc.Name || Date.now().toString(), // 使用完整路径作为ID
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
   * @param {string} docName - 文档名称
   * @param {string} docId - 文档ID
   */
  clearDocumentCache(docName) {
    if (!this.cacheManager) {
      console.warn('缓存管理器不可用，无法清除缓存')
      return
    }

    try {
      // 清除所有缓存（因为缓存是基于内容哈希的，无法精确匹配文档）
      this.cacheManager.clear()
      console.log(`已清除文档 "${docName}" 的相关缓存`)
    } catch (error) {
      console.error('清除文档缓存失败:', error)
    }
  }

  /**
   * 文档切换事件处理
   * @param {string} docName - 新文档名称
   * @param {string} docId - 新文档ID
   */
  onDocumentChanged(docName, docId) {
    console.log(`文档切换事件: ${docName}`)

    // 可以在这里添加其他文档切换时需要执行的逻辑
    // 比如重置UI状态、清除临时数据等

    // 触发自定义事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('documentChanged', {
        detail: { docName, docId }
      })
      window.dispatchEvent(event)
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
   * @returns {Object} 当前文档信息
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
