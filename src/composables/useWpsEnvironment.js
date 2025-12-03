/**
 * WPS 环境检查 Composable
 * 统一的 WPS 环境检查和文档操作工具
 */
import { ref, computed } from 'vue'

/**
 * WPS 环境检查 composable
 * @returns {Object} WPS 环境状态和方法
 */
export function useWpsEnvironment() {
  // 响应式状态
  const error = ref(null)

  // 计算属性：WPS 环境是否可用
  const isAvailable = computed(() => {
    return typeof window !== 'undefined' && 
           typeof window.Application !== 'undefined'
  })

  // 计算属性：WPS Application 对象
  const application = computed(() => {
    return isAvailable.value ? window.Application : null
  })

  // 计算属性：当前活动文档
  const activeDocument = computed(() => {
    if (!isAvailable.value) return null
    return window.Application.ActiveDocument || null
  })

  /**
   * 检查 WPS 环境并显示错误提示
   * @returns {boolean} 环境是否可用
   */
  const checkEnvironment = () => {
    if (!isAvailable.value) {
      error.value = '请在 WPS 环境中使用此功能'
      window.$message?.error(error.value)
      return false
    }
    error.value = null
    return true
  }

  /**
   * 获取当前文档（带错误提示）
   * @returns {Document|null} 文档对象或 null
   */
  const getDocument = () => {
    if (!checkEnvironment()) return null
    
    const doc = activeDocument.value
    if (!doc) {
      error.value = '未找到活动文档'
      window.$message?.error(error.value)
      return null
    }
    
    error.value = null
    return doc
  }

  /**
   * 获取文档全文
   * @returns {string|null} 文档全文或 null
   */
  const getFullText = () => {
    const doc = getDocument()
    if (!doc) return null
    
    try {
      const text = doc.Range().Text
      if (!text || text.trim().length === 0) {
        error.value = '文档内容为空'
        window.$message?.warning(error.value)
        return null
      }
      return text
    } catch (err) {
      error.value = '读取文档内容失败: ' + err.message
      window.$message?.error(error.value)
      return null
    }
  }

  /**
   * 执行需要 WPS 环境的操作（带统一错误处理）
   * @param {Function} fn 要执行的函数
   * @param {Object} options 选项
   * @returns {any} 函数返回值或 null
   */
  const withDocument = async (fn, options = {}) => {
    const { requireDocument = true } = options
    
    if (!checkEnvironment()) return null
    
    if (requireDocument) {
      const doc = getDocument()
      if (!doc) return null
      
      try {
        return await fn(doc, application.value)
      } catch (err) {
        error.value = err.message || '操作失败'
        window.$message?.error(error.value)
        return null
      }
    }
    
    try {
      return await fn(null, application.value)
    } catch (err) {
      error.value = err.message || '操作失败'
      window.$message?.error(error.value)
      return null
    }
  }

  return {
    // 状态
    isAvailable,
    application,
    activeDocument,
    error,
    // 方法
    checkEnvironment,
    getDocument,
    getFullText,
    withDocument
  }
}

export default useWpsEnvironment
