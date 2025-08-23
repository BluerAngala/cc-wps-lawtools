// ribbon.js 初始化 wps 加载项

import Util from './util.js'
import routeManager from './RouteManager.js'

function OnAction(control) {
  const eleId = control.Id
  const { wpsService } = Util

  switch (eleId) {
    case 'btnShowAI':
      {
        const taskPane = window.Application.CreateTaskPane('yuanqi.tencent.com/agent/oRCZyC6JyFcn?from=share')
        taskPane.Visible = true
      }
      break
    case 'btnAboutME':
      {
        const taskPane = window.Application.CreateTaskPane('lawyerch.feishu.cn/wiki/space/7467382510423506963')
        taskPane.Visible = true
        taskPane.Visible = false
      }
      break
    case 'btnShowTaskPane':
      {
        routeManager.openTaskPane('taskpane')
      }
      break
    case 'btnContractReview':
      {
        routeManager.openTaskPane('contractreview')
      }
      break
    default:
      break
  }
}


// 这个函数是给ribbon.xml中的getImage属性调用的，用于获取图片路径
function GetImage(control) {
  // 根据不同的按钮ID返回不同的图片
  const buttonId = control ? control.Id : 'default'

  switch (buttonId) {
    case 'btnShowAI':
      return './images/logo_card.png'
    case 'btnContractReview':
      return './images/3.svg'
    case 'btnAboutME':
      return './images/2.png'
    default:
      return './images/1.svg'
  }
}


export default {
  OnAction: OnAction,
  GetImage: GetImage
}
