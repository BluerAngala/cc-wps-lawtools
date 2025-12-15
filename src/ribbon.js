// ribbon.js 初始化 wps 加载项

import { Util } from './services/wps'

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
        Util.wpsService.createTaskPane('template', { width: 850 })
      }
      break

    // 合同审查
    case 'btnContractReview':
      {
        Util.wpsService.createTaskPane('contractreview', { width: 850 })
      }
      break

    // 风险扫描
    case 'btnRiskScan':
      {
        Util.wpsService.createTaskPane('riskscan', { width: 850 })
      }
      break

    // 信息脱敏
    case 'btnDesensitize':
      {
        Util.wpsService.createTaskPane('desensitize', { width: 850 })
      }
      break

    // AI助理
    case 'btnShowAI':
      {
        const url = 'https://yuanqi.tencent.com/webim/#/chat/tigQTg?appid=1995670616961503232&experience=true'
        console.log('url', url)
        Util.wpsService.createExternalTaskPane(
          url,
          850
        )
      }
      break

    // 常用导航
    case 'btnCommonNav':
      {
        const url = 'https://yesen.cn'
        console.log('url', url)
        Util.wpsService.createExternalTaskPane(url)
      }
      break

    // 关于我
    case 'btnAboutME':
      {
        const url = 'https://lawyerch.feishu.cn/wiki/space/7467382510423506963'
        console.log('url', url)
        const externalTaskPane = Util.wpsService.createExternalTaskPane(
          url
        )
        externalTaskPane.Visible = false
      }
      break

    // 设置
    case 'btnSettings':
      {
        Util.wpsService.showDialog('/settings', { width: 800, height: 600 })
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
    case 'btnShowTaskPane':
      return './images/1.svg'
    default:
      return './images/1.svg'
  }
}

export default {
  OnAction: OnAction,
  GetImage: GetImage,
  OnAddinLoad: OnAddinLoad
}
