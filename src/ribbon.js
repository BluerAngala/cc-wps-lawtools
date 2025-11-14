// ribbon.js 初始化 wps 加载项

import Util from './services/wps/wpsUtils.js'
import { showSettingsDialog } from './utils/dialogHelper.js'

console.log('ribbon.js 已加载并初始化')

// WPS加载项加载完成时的回调函数
function OnAddinLoad() {
  console.log('WPS加载项已加载完成')
}

// 点击wps功能区按钮的回调
function OnAction(control) {
  const eleId = control.Id

  console.log('点击了 ribbon.js 的 OnAction', eleId)
  switch (eleId) {

    // 模板管理
    case 'btnTemplateManager':
      {
        const url = Util.GetUrlPath() + '/index.html?page=template'
        Util.wpsService.createTaskPane(url, 'template', { width: 850 })
      }
      break

    // 合同审查
    case 'btnContractReview':
      {
        // 构建本地网页的路径，使用 URL 参数指定页面
        const url = Util.GetUrlPath() + '/index.html?page=contractreview'
        // 打开任务窗格并配置参数
        Util.wpsService.createTaskPane(url, 'contractreview', { width: 850 })
      }
      break

    // 风险扫描
    case 'btnRiskScan':
      {
        const url = Util.GetUrlPath() + '/index.html?page=riskscan'
        Util.wpsService.createTaskPane(url, 'riskscan', { width: 850 })
      }
      break

    // 信息脱敏
    case 'btnDesensitize':
      {
        const url = Util.GetUrlPath() + '/index.html?page=desensitize'
        Util.wpsService.createTaskPane(url, 'desensitize', { width: 850 })
      }
      break

    // AI助理
    case 'btnShowAI':
      {
        Util.wpsService.createExternalTaskPane(
          'https://yuanqi.tencent.com/agent/oRCZyC6JyFcn?from=share',
          850
        )
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


    // 调试窗格
    case 'btnShowTaskPane':
      {
        // 构建本地网页的路径，使用 URL 参数指定页面
        const url = Util.GetUrlPath() + '/index.html?page=taskpane'
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
    case 'btnTemplateManager':
      return './images/合同模板.svg'
    case 'btnContractReview':
      return './images/合同审查.svg'
    case 'btnRiskScan':
      return './images/扫描.svg'
    case 'btnDesensitize':
      return './images/脱敏.svg'
    case 'btnShowAI':
      return './images/logo_card.png'
    case 'btnCommonNav':
      return './images/导航.svg'
    case 'btnSettings':
      return './images/设置.svg'
    case 'btnAboutME':
      return './images/关于我.svg'
    default:
      return './images/1.svg'
  }
}

export default {
  OnAction: OnAction,
  GetImage: GetImage,
  OnAddinLoad: OnAddinLoad
}
