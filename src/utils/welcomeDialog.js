// 欢迎弹窗工具函数 - 使用WPS原生ShowDialog API

// 显示欢迎弹窗
export function showWelcomeDialog() {
  console.log('准备显示WPS原生欢迎弹窗')
  
  try {
    if (typeof window.Application === 'undefined') {
      console.warn('WPS Application对象未找到')
      alert('欢迎使用AI律师工具箱！请在WPS环境中使用。')
      return
    }

    // 获取home页面的URL
    const homeUrl = window.location.origin + window.location.pathname + '#/'
    console.log('打开欢迎页面URL:', homeUrl)
    
    // 计算适合的对话框尺寸（考虑设备像素比）
    const pixelRatio = window.devicePixelRatio || 1
    const width = Math.round(600 * pixelRatio)
    const height = Math.round(450 * pixelRatio)
    
    console.log('对话框尺寸:', { width, height, pixelRatio })
    
    // 使用正确的WPS API创建无边框对话框
    window.Application.ShowDialog(
      homeUrl,           // url
      '',                // caption (无边框时标题为空)
      width,             // width (物理像素)
      height,            // height (物理像素)
      true,              // bModal (模态)
      false,             // hasCaption (无标题栏，无边框)
      2                  // resizeEdge (缩放边框宽度)
    )
    
    console.log('WPS ShowDialog 调用成功')
    
  } catch (error) {
    console.error('显示WPS对话框失败:', error)
    // 降级到简单的alert
    alert('欢迎使用AI律师工具箱！\n' + error.message)
  }
}

// 清理函数
export function cleanupWelcomeDialog() {
  const container = document.getElementById('welcome-dialog-container')
  if (container) {
    container.remove()
    dialogInstance = null
  }
}
