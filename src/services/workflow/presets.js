/**
 * 预设工作流模板
 * 提供常用场景的工作流配置
 */

import { ActionTypes } from './types.js'

/**
 * AI 工作流预设
 */
export const aiWorkflowPresets = {
  // 完整合同审查
  fullContractReview: {
    id: 'full-contract-review',
    name: '完整合同审查',
    description: '读取文档 → 识别类型 → 全局分析 → 详细审查 → 保存',
    category: 'ai',
    steps: [
      {
        actionType: ActionTypes.READ_DOCUMENT,
        name: '读取文档'
      },
      {
        actionType: ActionTypes.IDENTIFY_CONTRACT,
        name: '识别合同类型'
      },
      {
        actionType: ActionTypes.GLOBAL_ANALYSIS,
        name: '全局分析'
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '详细审查',
        params: {
          strategy: 'full',
          autoApply: true
        }
      },
      {
        actionType: ActionTypes.SAVE_DOCUMENT,
        name: '保存文档'
      }
    ]
  },

  // 合同要素提取
  contractExtraction: {
    id: 'contract-extraction',
    name: '合同要素提取',
    description: '读取文档 → 识别类型 → 提取要素',
    category: 'ai',
    steps: [
      {
        actionType: ActionTypes.READ_DOCUMENT,
        name: '读取文档'
      },
      {
        actionType: ActionTypes.IDENTIFY_CONTRACT,
        name: '识别合同类型'
      },
      {
        actionType: ActionTypes.EXTRACT_CONTRACT,
        name: '提取合同要素'
      }
    ]
  },

  // 快速风险扫描
  quickRiskScan: {
    id: 'quick-risk-scan',
    name: '快速风险扫描',
    description: '读取文档 → 全局分析（识别高风险区域）',
    category: 'ai',
    steps: [
      {
        actionType: ActionTypes.READ_DOCUMENT,
        name: '读取文档'
      },
      {
        actionType: ActionTypes.GLOBAL_ANALYSIS,
        name: '全局风险分析'
      }
    ]
  },

  // 合同审查（不自动批注）
  contractReviewOnly: {
    id: 'contract-review-only',
    name: '合同审查（仅分析）',
    description: '读取文档 → 识别类型 → 审查（不添加批注）',
    category: 'ai',
    steps: [
      {
        actionType: ActionTypes.READ_DOCUMENT,
        name: '读取文档'
      },
      {
        actionType: ActionTypes.IDENTIFY_CONTRACT,
        name: '识别合同类型'
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '审查合同',
        params: {
          strategy: 'full',
          autoApply: false
        }
      }
    ]
  }
}

/**
 * 文档工作流预设
 */
export const documentWorkflowPresets = {
  // 添加页眉并保存
  addHeaderAndSave: {
    id: 'add-header-save',
    name: '添加页眉并保存',
    description: '读取文档 → 添加页眉 → 保存',
    category: 'document',
    steps: [
      {
        actionType: ActionTypes.READ_DOCUMENT,
        name: '读取文档'
      },
      {
        actionType: ActionTypes.ADD_HEADER,
        name: '添加页眉',
        params: {
          text: ''
        }
      },
      {
        actionType: ActionTypes.SAVE_DOCUMENT,
        name: '保存文档'
      }
    ]
  },

  // 导出 PDF
  exportToPDF: {
    id: 'export-pdf',
    name: '导出为 PDF',
    description: '读取文档 → 导出 PDF',
    category: 'document',
    steps: [
      {
        actionType: ActionTypes.READ_DOCUMENT,
        name: '读取文档'
      },
      {
        actionType: ActionTypes.EXPORT_PDF,
        name: '导出 PDF'
      }
    ]
  }
}

/**
 * 所有预设工作流
 */
export const allPresets = {
  ...aiWorkflowPresets,
  ...documentWorkflowPresets
}

/**
 * 获取预设工作流列表
 * @param {string} [category] - 可选的分类过滤
 * @returns {Array} 预设列表
 */
export function getPresetList(category = null) {
  const presets = Object.values(allPresets)

  if (category) {
    return presets.filter(preset => preset.category === category)
  }

  return presets
}

/**
 * 根据 ID 获取预设工作流
 * @param {string} id - 预设 ID
 * @returns {Object|null} 预设工作流定义
 */
export function getPresetById(id) {
  return Object.values(allPresets).find(preset => preset.id === id) || null
}

/**
 * 从预设创建工作流定义
 * @param {string} presetId - 预设 ID
 * @param {Object} [overrides] - 覆盖参数
 * @returns {Object} 工作流定义
 */
export function createWorkflowFromPreset(presetId, overrides = {}) {
  const preset = getPresetById(presetId)

  if (!preset) {
    throw new Error(`未找到预设工作流: ${presetId}`)
  }

  return {
    id: overrides.id || `${preset.id}-${Date.now()}`,
    name: overrides.name || preset.name,
    description: overrides.description || preset.description,
    steps: preset.steps.map(step => ({
      ...step,
      params: {
        ...step.params,
        ...(overrides.stepParams?.[step.actionType] || {})
      }
    }))
  }
}

/**
 * 克隆工作流（深拷贝）
 * @param {Object} workflow - 工作流定义
 * @returns {Object} 克隆后的工作流
 */
export function cloneWorkflow(workflow) {
  return JSON.parse(JSON.stringify(workflow))
}

/**
 * 根据 ID 获取预设工作流（兼容旧版本）
 * @param {string} id - 预设 ID
 * @returns {Object|null}
 */
export function getPresetWorkflow(id) {
  return getPresetById(id)
}

// 向后兼容的导出（旧版本使用的名称）
export const presetWorkflows = Object.values(allPresets)
export const archiveWorkflow = documentWorkflowPresets.addHeaderAndSave
export const quickCommentWorkflow = aiWorkflowPresets.quickRiskScan
export const revisionWorkflow = aiWorkflowPresets.contractReviewOnly
