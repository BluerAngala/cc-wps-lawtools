

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
