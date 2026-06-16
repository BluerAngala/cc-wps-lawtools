import { Util } from './services/wps'

function OnAddinLoad() {
  console.log('WPS加载项已加载完成')
}

function OnAction(control) {
  const eleId = control.Id
  switch (eleId) {
    case 'btnAIChat':
      Util.wpsService.createTaskPane('aichat', { width: 360 })
      break
    case 'btnSettings':
      Util.wpsService.showDialog('/settings', { width: 880, height: 720, caption: '陈恒律师 AI 工具箱 — 设置' })
      break
    case 'btnAboutME':
      {
        const url = 'https://lawyerch.feishu.cn/wiki/space/7467382510423506963'
        const pane = Util.wpsService.createExternalTaskPane(url)
        pane.Visible = false
      }
      break
    default:
      break
  }
}

function GetImage(control) {
  const buttonId = control ? control.Id : 'default'
  switch (buttonId) {
    case 'btnAIChat':
      return './images/logo_card.png'
    case 'btnSettings':
      return './images/设置.svg'
    case 'btnAboutME':
      return './images/关于我.svg'
    default:
      return './images/1.svg'
  }
}

export default {
  OnAction,
  GetImage,
  OnAddinLoad
}
