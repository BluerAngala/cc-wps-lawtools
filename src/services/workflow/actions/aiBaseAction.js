/**
 * AI 操作基类
 * 所有 AI 原子操作的基类，提供 AI 操作特有的功能
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'

export class AIBaseAction extends BaseAction {
  constructor(options) {
    super(options)
    this.category = 'ai' // AI 操作分类
  }

  /**
   * 发送进度事件
   * @param {Object} params - 操作参数
   * @param {string} stage - 当前阶段描述
   * @param {string} [content] - 当前内容
   */
  emitProgress(params, stage, content = '') {
    if (params.onProgress && typeof params.onProgress === 'function') {
      params.onProgress({ stage, content })
    }
  }

  /**
   * 检查文档内容是否存在
   * @param {Object} context - 工作流上下文
   * @returns {{valid: boolean, error?: string}}
   */
  checkDocumentText(context) {
    if (!context.documentText || context.documentText.trim().length === 0) {
      return { valid: false, error: '请先读取文档内容' }
    }
    return { valid: true }
  }

  /**
   * 获取操作信息（扩展基类，添加 category）
   * @returns {Object}
   */
  getInfo() {
    return {
      ...super.getInfo(),
      category: this.category
    }
  }
}

// 导出工具函数
export { createSuccessResult, createErrorResult }
