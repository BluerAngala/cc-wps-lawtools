// WPS 弹窗工具函数 - 通用对话框创建方法

/**
 * 显示 WPS 原生对话框
 * @param {string} routePath - 路由路径，如 '/' 或 '/settings'
 * @param {Object} options - 可选配置项
 * @param {number} options.width - 对话框宽度（逻辑像素），默认 600
 * @param {number} options.height - 对话框高度（逻辑像素），默认 450
 * @param {boolean} options.modal - 是否模态，默认 true
 * @param {boolean} options.hasCaption - 是否有标题栏，默认 false（无边框）
 * @param {number} options.resizeEdge - 缩放边框宽度，默认 2
 * @param {string} options.caption - 标题文字，默认空（无边框时忽略）
 */
export function showWPSDialog(routePath, options = {}) {
  const {
    width = 600,
    height = 450,
    modal = true,
    hasCaption = false,
    resizeEdge = 2,
    caption = ''
  } = options

  console.log(`准备显示 WPS 对话框: ${routePath}`, options)
  
  try {
    if (typeof window.Application === 'undefined') {
      console.warn('WPS Application 对象未找到')
      alert('请在 WPS 环境中使用此功能')
      return
    }

    // 构建完整 URL
    const dialogUrl = window.location.origin + window.location.pathname + '#' + routePath
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

// 显示欢迎弹窗（兼容旧接口）
export function showWelcomeDialog() {
  showWPSDialog('/', { width: 600, height: 450 })
}

// 显示设置弹窗（兼容旧接口）
export function showSettingsDialog() {
  showWPSDialog('/settings', { width: 600, height: 500 })
}

