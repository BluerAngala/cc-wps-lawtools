// WPS 弹窗工具函数 - 通用对话框创建方法

/**
 * 显示 WPS 原生对话框
 * @param {string} page - 页面名称，如 'home' 或 'settings'
 * @param {Object} options - 可选配置项
 * @param {number} options.width - 对话框宽度（逻辑像素），默认 600
 * @param {number} options.height - 对话框高度（逻辑像素），默认 450
 * @param {boolean} options.modal - 是否模态，默认 true
 * @param {boolean} options.hasCaption - 是否有标题栏，默认 false（无边框）
 * @param {number} options.resizeEdge - 缩放边框宽度，默认 2
 * @param {string} options.caption - 标题文字，默认空（无边框时忽略）
 */
export function showWPSDialog(page, options = {}) {
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
      alert('请在 WPS 环境中使用此功能')
      return
    }

    // 构建完整 URL，使用 URL 参数指定页面
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/index.html')
    const dialogUrl = `${baseUrl}?page=${page}`
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
    alert('显示对话框失败: ' + error.message)
  }
}

// 显示欢迎弹窗
export function showWelcomeDialog() {
  showWPSDialog('home', { width: 600, height: 450 })
}

// 显示设置弹窗
export function showSettingsDialog() {
  showWPSDialog('settings', { width: 800, height: 600 })
}

