/**
 * 工作流存储服务
 * 管理用户自定义工作流的保存、读取、删除
 */

const STORAGE_KEY = 'user_workflows'

class WorkflowStorage {
  /**
   * 获取所有用户工作流
   * @returns {Array}
   */
  getAll() {
    try {
      // 优先使用 WPS PluginStorage
      if (window.Application?.PluginStorage) {
        const data = window.Application.PluginStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
      }
      // 回退到 localStorage
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取工作流失败:', error)
      return []
    }
  }

  /**
   * 保存工作流
   * @param {Object} workflow - 工作流定义
   * @returns {boolean}
   */
  save(workflow) {
    try {
      if (!workflow.id || !workflow.name || !workflow.steps) {
        throw new Error('工作流缺少必要字段')
      }

      const workflows = this.getAll()
      const existingIndex = workflows.findIndex((w) => w.id === workflow.id)

      if (existingIndex >= 0) {
        // 更新已有工作流
        workflows[existingIndex] = { ...workflow, updatedAt: Date.now() }
      } else {
        // 添加新工作流
        workflows.push({
          ...workflow,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }

      this._persist(workflows)
      return true
    } catch (error) {
      console.error('保存工作流失败:', error)
      return false
    }
  }

  /**
   * 删除工作流
   * @param {string} id - 工作流ID
   * @returns {boolean}
   */
  delete(id) {
    try {
      const workflows = this.getAll()
      const filtered = workflows.filter((w) => w.id !== id)
      this._persist(filtered)
      return true
    } catch (error) {
      console.error('删除工作流失败:', error)
      return false
    }
  }

  /**
   * 根据ID获取工作流
   * @param {string} id - 工作流ID
   * @returns {Object|null}
   */
  get(id) {
    const workflows = this.getAll()
    return workflows.find((w) => w.id === id) || null
  }

  /**
   * 生成唯一ID
   * @returns {string}
   */
  generateId() {
    return 'wf_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  /**
   * 验证工作流配置
   * @param {Object} workflow - 工作流定义
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(workflow) {
    const errors = []

    if (!workflow) {
      errors.push('工作流不能为空')
      return { valid: false, errors }
    }

    if (!workflow.name || !workflow.name.trim()) {
      errors.push('工作流名称不能为空')
    }

    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      errors.push('工作流步骤必须是数组')
    } else if (workflow.steps.length === 0) {
      errors.push('工作流至少需要一个步骤')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * 持久化存储
   * @private
   */
  _persist(workflows) {
    const data = JSON.stringify(workflows)
    if (window.Application?.PluginStorage) {
      window.Application.PluginStorage.setItem(STORAGE_KEY, data)
    } else {
      localStorage.setItem(STORAGE_KEY, data)
    }
  }
}

export const workflowStorage = new WorkflowStorage()
