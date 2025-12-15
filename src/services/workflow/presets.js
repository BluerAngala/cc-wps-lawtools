/**
 * 预设工作流模板
 * 提供常用场景的工作流配置
 */

import { ActionTypes } from './types.js'

/**
 * AI 工作流预设
 */
export const aiWorkflowPresets = {
  // 甲方快速审查
  partyAQuickReview: {
    id: 'party-a-quick-review',
    name: '甲方快速审查',
    description: '从甲方视角快速识别重大风险',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '甲方视角审查',
        params: {
          perspective: 'partyA',
          depth: 'quick',
          focusAreas: ['liability', 'payment'],
          autoApply: true
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 乙方深度审查
  partyBDeepReview: {
    id: 'party-b-deep-review',
    name: '乙方深度审查',
    description: '从乙方视角逐条详细分析',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.EXTRACT_CONTRACT,
        name: '提取要素',
        params: { extractMode: 'full' }
      },
      {
        actionType: ActionTypes.GLOBAL_ANALYSIS,
        name: '全局分析',
        params: { depth: 'deep' }
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '乙方深度审查',
        params: {
          perspective: 'partyB',
          depth: 'deep',
          focusAreas: ['liability', 'payment', 'ip'],
          autoApply: true
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 签约前风险扫描
  preSignRiskScan: {
    id: 'pre-sign-risk-scan',
    name: '签约前风险扫描',
    description: '签约前快速识别潜在风险',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.GLOBAL_ANALYSIS,
        name: '风险扫描',
        params: { depth: 'quick' }
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '风险审查',
        params: {
          perspective: 'neutral',
          depth: 'quick',
          focusAreas: ['liability', 'dispute'],
          autoApply: false
        }
      }
    ]
  },

  // 续签合同审查
  renewalReview: {
    id: 'renewal-review',
    name: '续签合同审查',
    description: '续签时重点关注变更条款',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.EXTRACT_CONTRACT,
        name: '提取要素',
        params: { extractMode: 'basic' }
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '续签审查',
        params: {
          perspective: 'neutral',
          depth: 'standard',
          focusAreas: ['payment', 'liability'],
          customPrompt: '重点关注与原合同相比的变更条款',
          autoApply: true
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 劳动合同审查
  laborContractReview: {
    id: 'labor-contract-review',
    name: '劳动合同审查',
    description: '专门针对劳动合同的审查',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.IDENTIFY_CONTRACT,
        name: '识别合同类型',
        params: { customPrompt: '这是一份劳动合同' }
      },
      {
        actionType: ActionTypes.EXTRACT_CONTRACT,
        name: '提取要素',
        params: { extractMode: 'full' }
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '劳动合同审查',
        params: {
          perspective: 'partyB',
          depth: 'standard',
          focusAreas: ['liability', 'confidential'],
          customPrompt: '重点关注试用期、竞业限制、加班规定等劳动法相关条款',
          autoApply: true
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 采购合同审查
  purchaseContractReview: {
    id: 'purchase-contract-review',
    name: '采购合同审查',
    description: '专门针对采购合同的审查',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.IDENTIFY_CONTRACT,
        name: '识别合同类型',
        params: { customPrompt: '这是一份采购合同' }
      },
      {
        actionType: ActionTypes.EXTRACT_CONTRACT,
        name: '提取要素',
        params: { extractMode: 'full' }
      },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '采购合同审查',
        params: {
          perspective: 'partyA',
          depth: 'standard',
          focusAreas: ['payment', 'liability', 'ip'],
          customPrompt: '重点关注交付条款、质量标准、验收流程',
          autoApply: true
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 合同要素提取
  contractExtraction: {
    id: 'contract-extraction',
    name: '合同要素提取',
    description: '读取文档 → 识别类型 → 提取要素',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.EXTRACT_CONTRACT,
        name: '提取合同要素',
        params: { extractMode: 'full' }
      }
    ]
  },

  // 快速风险扫描（保留旧版兼容）
  quickRiskScan: {
    id: 'quick-risk-scan',
    name: '快速风险扫描',
    description: '读取文档 → 全局分析（识别高风险区域）',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.GLOBAL_ANALYSIS,
        name: '全局风险分析',
        params: { depth: 'quick' }
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
