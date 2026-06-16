/**
 * 文档监听器
 * 监听 WPS 文档切换事件
 */

/**
 * 文档监听器类
 */
export class DocumentWatcher {
  constructor() {
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
   * 文档切换事件处理
   */
  onDocumentChanged(docName, docId) {
    console.log(`文档切换事件: ${docName}`)

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('documentChanged', {
          detail: { docName, docId }
        })
      )
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
