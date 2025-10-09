// ribbon.js 初始化 wps 加载项

import Util from './services/wps/wpsUtils.js'
import { wpsConfigManager } from './services/wps/wpsConfigManager.js'
import { showWelcomeDialog, showSettingsDialog } from './utils/dialogHelper.js'

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

    // AI助理
    case 'btnShowAI':
      {
        Util.wpsService.createExternalTaskPane(
          'https://yuanqi.tencent.com/agent/oRCZyC6JyFcn?from=share',
          850
        )
      }
      break

    // 合同审查
    case 'btnContractReview':
      {
        // 构建本地网页的路径
        const url = Util.GetUrlPath() + Util.GetRouterHash() + '/contractreview'
        // 打开任务窗格并配置参数
        Util.wpsService.createTaskPane(url, 'contractreview', { width: 850 })
      }
      break

    // 常用导航
    case 'btnCommonNav':
      {
        Util.wpsService.createExternalTaskPane('https://yesen.cn')
      }
      break

    // 关于我
    case 'btnAboutME':
      {
       const externalTaskPane = Util.wpsService.createExternalTaskPane(
          'https://lawyerch.feishu.cn/wiki/space/7467382510423506963'
        )
        externalTaskPane.Visible = false
      }
      break

    // 设置
    case 'btnSettings':
      {
        console.log('点击了设置按钮')
        showSettingsDialog()
      }
      break

    // 欢迎页面
    case 'btnShowWelcome':
      {
        console.log('点击了欢迎页面按钮')
        showWelcomeDialog()
      }
      break

    // 重置首次加载
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

    // 调试窗格
    case 'btnShowTaskPane':
      {
        // 构建本地网页的路径
        const url = Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane'
        // 打开任务窗格并配置参数
        Util.wpsService.createTaskPane(url, 'taskpane', { width: 850 })
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
