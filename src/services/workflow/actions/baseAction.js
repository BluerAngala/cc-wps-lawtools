/**
 * 基础操作类
 * 所有原子操作的基类，提供默认实现
 */

import { createSuccessResult, createErrorResult } from '../types.js'

export class BaseAction {
  constructor({ type, name, description, icon = '⚙️' }) {
    this.type = type
    this.name = name
    this.description = description
    this.icon = icon
  }

  /**
   * 执行操作（子类必须实现）
   * @param {Object} params - 参数
   * @param {Object} context - 工作流上下文
   * @returns {Promise<Object>} StepResult
   */
  async execute(_params, _context) {
    return createErrorResult('execute 方法未实现')
  }

  /**
   * 验证参数
   * @param {Object} params - 参数
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(params) {
    const schema = this.getSchema()
    const errors = []

    if (schema.required) {
      for (const field of schema.required) {
        if (params[field] === undefined || params[field] === null || params[field] === '') {
          const prop = schema.properties?.[field]
          errors.push(`缺少必填参数: ${prop?.title || field}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * 获取参数 Schema
   * @returns {Object}
   */
  getSchema() {
    return {
      type: 'object',
      properties: {},
      required: []
    }
  }

  /**
   * 获取操作信息（用于 UI 展示）
   * @returns {Object}
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      icon: this.icon,
      schema: this.getSchema()
    }
  }
}

// 导出工具函数
export { createSuccessResult, createErrorResult }
