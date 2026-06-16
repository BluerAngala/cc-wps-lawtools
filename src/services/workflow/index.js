/**
 * 工作流引擎模块入口
 */

export {
  ActionTypes,
  createSuccessResult,
  createErrorResult,
  createInitialContext
} from './types.js'

export { ActionRegistry, actionRegistry } from './ActionRegistry.js'

export {
  allActions,
  documentActions,
  aiActions,
  registerAllActions,
  BaseAction,
  AIBaseAction
} from './actions/index.js'

// 自动注册所有 Action（模块加载时执行）
import { registerAllActions as _registerAllActions } from './actions/index.js'
import { actionRegistry as _actionRegistry } from './ActionRegistry.js'
if (_actionRegistry.size === 0) {
  _registerAllActions()
}
