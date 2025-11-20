// WPS 弹窗工具函数 - 通用对话框创建方法

import Util from '../services/wps/wpsUtils.js'
import unifiedLogger from './unifiedLogger.js'

/**
 * 显示 WPS 原生对话框
 * @param {string} page - 页面路径，如 '/settings' 或 '/contractreview'
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
      unifiedLogger.error('请在 WPS 环境中使用此功能', { method: 'showWPSDialog', page })
      return
    }

    // 使用 Hash 路由构建 URL
    const dialogUrl = Util.GetUrlPath() + Util.GetRouterHash() + page
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
    unifiedLogger.error('显示对话框失败', { method: 'showWPSDialog', page, error: error.message })
  }
}



// 显示设置弹窗
export function showSettingsDialog() {
  showWPSDialog('/settings', { width: 800, height: 600 })
}

