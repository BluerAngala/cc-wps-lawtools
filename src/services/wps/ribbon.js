// ribbon.js 初始化 wps 加载项

import Util from './util.js'

function OnAction(control) {
  const eleId = control.Id

  let taskPane;
  switch (eleId) {
    case 'btnShowAI':
      {
        taskPane = window.Application.CreateTaskPane('yuanqi.tencent.com/agent/oRCZyC6JyFcn?from=share');
        taskPane.Visible = true;
      }
      break
    case 'btnAboutME':
      {
        taskPane = window.Application.CreateTaskPane('lawyerch.feishu.cn/wiki/space/7467382510423506963');
        taskPane.Visible = true;
        taskPane.Visible = false;
      }
      break
    case 'btnShowTaskPane':
      // 显示任务窗格
      {
        console.log('显示任务窗格!')
        let tsId = window.Application.PluginStorage.getItem('taskpane_id')
        if (!tsId) {
          console.log('创建任务窗格!' , Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane')
          let tskpane = window.Application.CreateTaskPane(
            Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane'
          )
          let id = tskpane.ID
          window.Application.PluginStorage.setItem('taskpane_id', id)
          tskpane.Visible = true
        } else {
          let tskpane = window.Application.GetTaskPane(tsId)
          tskpane.Visible = !tskpane.Visible
        }
      }
      break
    case 'btnContractReview':
      // 显示合同审查窗格
      {
        console.log('显示合同审查窗格!')
        let tsId = window.Application.PluginStorage.getItem('contractreview_id')
        if (!tsId) {
          console.log('创建合同审查窗格!' , Util.GetUrlPath() + Util.GetRouterHash() + '/contractreview')
          let tskpane = window.Application.CreateTaskPane(
            Util.GetUrlPath() + Util.GetRouterHash() + '/contractreview'
          )
          let id = tskpane.ID
          window.Application.PluginStorage.setItem('contractreview_id', id)
          tskpane.Visible = true
        } else {
          let tskpane = window.Application.GetTaskPane(tsId)
          tskpane.Visible = !tskpane.Visible
        }
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
