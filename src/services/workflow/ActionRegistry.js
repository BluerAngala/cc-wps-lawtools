/**
 * 操作注册表
 * 管理所有可用的原子操作
 */

class ActionRegistry {
  constructor() {
    this._actions = new Map()
  }

  /**
   * 注册操作
   * @param {Object} action - 操作实例，必须包含 type 属性
   */
  register(action) {
    if (!action || !action.type) {
      throw new Error('操作必须包含 type 属性')
    }
    this._actions.set(action.type, action)
  }

  /**
   * 获取操作
   * @param {string} type - 操作类型
   * @returns {Object|undefined}
   */
  get(type) {
    return this._actions.get(type)
  }

  /**
   * 检查操作是否存在
   * @param {string} type - 操作类型
   * @returns {boolean}
   */
  has(type) {
    return this._actions.has(type)
  }

  /**
   * 列出所有操作
   * @returns {Object[]}
   */
  list() {
    return Array.from(this._actions.values())
  }

  /**
   * 获取操作数量
   * @returns {number}
   */
  get size() {
    return this._actions.size
  }

  /**
   * 清空注册表
   */
  clear() {
    this._actions.clear()
  }
}

// 创建默认实例
export const actionRegistry = new ActionRegistry()

export { ActionRegistry }
