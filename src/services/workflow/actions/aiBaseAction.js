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
   * 构建增强的 AI prompt
   * 根据参数（视角、深度、关注领域、自定义指令）构建增强 prompt
   * @param {string} basePrompt - 基础 prompt
   * @param {Object} params - 操作参数
   * @returns {string} 增强后的 prompt
   */
  buildEnhancedPrompt(basePrompt, params = {}) {
    const parts = [basePrompt]

    // 审查视角
    if (params.perspective) {
      const perspectiveMap = {
        partyA: '请从甲方（委托方/采购方）的视角进行分析，重点识别对甲方不利的条款和风险。',
        partyB: '请从乙方（服务方/供应方）的视角进行分析，重点识别对乙方不利的条款和风险。',
        neutral: '请从中立视角进行分析，平衡评估双方的权利义务。'
      }
      if (perspectiveMap[params.perspective]) {
        parts.push(perspectiveMap[params.perspective])
      }
    }

    // 审查深度
    if (params.depth) {
      const depthMap = {
        quick: '请进行快速审查，只识别重大风险点和明显问题。',
        standard: '请进行标准审查，全面分析合同条款。',
        deep: '请进行深度审查，逐条详细分析每个条款的法律风险。'
      }
      if (depthMap[params.depth]) {
        parts.push(depthMap[params.depth])
      }
    }

    // 关注领域
    if (params.focusAreas && params.focusAreas.length > 0) {
      const areaLabels = {
        liability: '违约责任',
        payment: '付款条款',
        confidential: '保密条款',
        ip: '知识产权',
        dispute: '争议解决',
        forceMajeure: '不可抗力'
      }
      const areas = params.focusAreas
        .map(a => areaLabels[a] || a)
        .filter(Boolean)
        .join('、')
      if (areas) {
        parts.push(`请重点关注以下领域：${areas}。`)
      }
    }

    // 提取模式
    if (params.extractMode) {
      const extractModeMap = {
        basic: '请只提取基础要素：甲乙方名称、合同金额、签订日期、合同期限等核心信息。',
        full: '请提取所有可识别的合同要素，包括但不限于：当事人信息、金额、日期、标的物、权利义务、违约条款等。'
      }
      if (extractModeMap[params.extractMode]) {
        parts.push(extractModeMap[params.extractMode])
      }
    }

    // 自定义指令
    if (params.customPrompt && params.customPrompt.trim()) {
      parts.push(`用户特别要求：${params.customPrompt.trim()}`)
    }

    return parts.join('\n\n')
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
