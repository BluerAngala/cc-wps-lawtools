// ribbon.js 初始化 wps 加载项

import Util from './wps/wpsUtils.js'
import { wpsConfigManager } from './utils/wpsConfigManager.js'
import { showWelcomeDialog } from './utils/welcomeDialog.js'

console.log('ribbon.js 已加载并初始化')

// WPS加载项加载完成时的回调函数
function OnAddinLoad() {
  console.log('WPS加载项已加载完成')
  
  // 延迟一点时间确保WPS完全初始化
  setTimeout(() => {
    const isFirstLoad = wpsConfigManager.isFirstLoad()
    
    if (isFirstLoad) {
      console.log('检测到首次加载，显示欢迎页面')
      showWelcomeDialog()
      wpsConfigManager.markFirstLoadCompleted()
    } else {
      console.log('非首次加载，跳过欢迎页面')
    }
  }, 1000)
}

// 注意：showWelcomeDialog 现在从 utils/welcomeDialog.js 导入

// 点击wps功能区按钮的回调
function OnAction(control) {
  const eleId = control.Id

  console.log('点击了 ribbon.js 的 OnAction', eleId)
  switch (eleId) {
    case 'btnShowAI':
      {
        const taskPane = window.Application.CreateTaskPane(
          'https://yuanqi.tencent.com/agent/oRCZyC6JyFcn?from=share'
        )
        taskPane.Visible = true
        taskPane.Width = 850
      }
      break
    case 'btnCommonNav':
      {
        const taskPane = window.Application.CreateTaskPane('https://yesen.cn')
        taskPane.Visible = true
        // taskPane.Visible = false
      }
      break
    case 'btnAboutME':
      {
        const taskPane = window.Application.CreateTaskPane(
          'https://lawyerch.feishu.cn/wiki/space/7467382510423506963'
        )
        taskPane.Visible = true
        taskPane.Visible = false
      }
      break
    case 'btnContractReview':
      {
        // 构建本地网页的路径
        const url = Util.GetUrlPath() + Util.GetRouterHash() + '/contractreview'
        // 打开任务窗格
        const taskPane = Util.wpsService.createTaskPane(url, 'contractreview_id')
        // 设置任务窗格宽度
        if (taskPane) {
          taskPane.Width = 850
        }
      }
      break
    case 'btnShowWelcome':
      {
        console.log('点击了欢迎页面按钮')
        showWelcomeDialog()
      }
      break
    case 'btnResetFirstLoad':
      {
        console.log('点击了重置首次加载按钮')
        try {
          const result = wpsConfigManager.resetFirstLoad()
          console.log('重置首次加载结果:', result)
          window.$message?.success('首次加载状态已重置，下次启动将显示欢迎页面')
        } catch (error) {
          console.error('重置首次加载失败:', error)
          window.$message?.error('重置失败: ' + error.message)
        }
      }
      break
    default:
      break
  }
}

// 这个函数是给ribbon.xml中的getImage属性调用的，用于获取图片路径
// 获取wps功能区按钮的图片路径
function GetImage(control) {
  // 根据不同的按钮ID返回不同的图片
  const buttonId = control ? control.Id : 'default'

  switch (buttonId) {
    case 'btnShowAI':
      return './images/logo_card.png'
    case 'btnContractReview':
      return './images/3.svg'
    case 'btnCommonNav':
      return './images/3.svg'
    case 'btnAboutME':
      return './images/2.png'
    default:
      return './images/1.svg'
  }
}

export default {
  OnAction: OnAction,
  GetImage: GetImage,
  OnAddinLoad: OnAddinLoad
}
