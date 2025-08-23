import Util from './util.js'
import routeManager from './RouteManager.js'

function onbuttonclick(idStr, param) {
  const { wpsService } = Util

  switch (idStr) {
    case 'getDocName': {
      return wpsService.getDocName()
    }
    case 'createTaskPane': {
      routeManager.openTaskPane('taskpane')
      break
    }
    case 'newDoc': {
      wpsService.createNewDoc()
      break
    }
    case 'addString': {
      wpsService.addStringToDoc()
      break
    }
    case 'closeDoc': {
      wpsService.closeDoc()
      break
    }
    case 'openWeb': {
      break
    }
  }
}

export default {
  onbuttonclick
}
