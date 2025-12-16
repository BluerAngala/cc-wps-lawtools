/**
 * 预设工作流模板
 * 提供常用场景的工作流配置
 */

import { ActionTypes } from './types.js'

/**
 * AI 工作流预设
 */
export const aiWorkflowPresets = {
  // 甲方立场审查
  partyAReview: {
    id: 'party-a-review',
    name: '甲方立场审查',
    description: '从甲方立场审查合同，分析可能对甲方不利的内容',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '甲方立场审查',
        params: {
          perspective: 'partyA',
          depth: 'standard',
          focusAreas: ['liability', 'payment'],
          autoApply: true
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 乙方立场审查
  partyBReview: {
    id: 'party-b-review',
    name: '乙方立场审查',
    description: '从乙方立场审查合同，分析可能对乙方不利的内容',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '乙方立场审查',
        params: {
          perspective: 'partyB',
          depth: 'standard',
          focusAreas: ['liability', 'payment', 'ip'],
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
    description: '专门针对劳动合同的审查（乙方视角）',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
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
          autoApply: true,
          // 直接指定合同类型，跳过 AI 识别
          contractType: { type: '劳动合同', subtype: '', confidence: 'high' }
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 采购合同审查
  purchaseContractReview: {
    id: 'purchase-contract-review',
    name: '采购合同审查',
    description: '专门针对采购合同的审查（甲方视角）',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
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
          autoApply: true,
          // 直接指定合同类型，跳过 AI 识别
          contractType: { type: '采购合同', subtype: '', confidence: 'high' }
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
  },

  // 合同风险扫描（中立视角，仅扫描不修改）
  contractRiskScan: {
    id: 'contract-risk-scan',
    name: '合同风险扫描',
    description: '读取文档 → 识别合同类型 → 审查风险（不修改文档）',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别合同类型' },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '风险扫描',
        params: {
          perspective: 'neutral',
          depth: 'standard',
          autoApply: false
        }
      }
    ]
  },

  // 生成审查清单（分步审查第一步）
  generateReviewChecklist: {
    id: 'generate-review-checklist',
    name: '生成审查清单',
    description: '读取文档 → 识别文档类型 → 生成审查清单',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.IDENTIFY_CONTRACT, name: '识别文档类型' },
      {
        actionType: ActionTypes.GENERATE_CHECKLIST,
        name: '生成审查清单',
        params: {
          perspective: 'neutral'
        }
      }
    ]
  },

  // 执行风险审查（分步审查第二步，使用确认的清单）
  executeRiskReview: {
    id: 'execute-risk-review',
    name: '执行风险审查',
    description: '读取文档 → 按确认的清单执行风险审查',
    category: 'ai',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.REVIEW_CONTRACT,
        name: '执行审查',
        params: {
          depth: 'standard',
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
    name: '添加页眉',
    description: '为文档添加页眉并保存',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.ADD_HEADER,
        name: '添加页眉',
        params: { text: '' }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 导出 PDF
  exportToPDF: {
    id: 'export-pdf',
    name: '导出 PDF',
    description: '将当前文档导出为 PDF 格式',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.EXPORT_PDF, name: '导出 PDF' }
    ]
  },

  // 另存为修订版
  saveAsRevision: {
    id: 'save-as-revision',
    name: '另存为修订版',
    description: '将文档另存为带「已修订」前缀的新文件',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.RENAME_DOCUMENT,
        name: '另存为修订版',
        params: {
          prefix: '「已修订」',
          deleteOriginal: false
        }
      }
    ]
  },

  // 另存为定稿
  saveAsFinal: {
    id: 'save-as-final',
    name: '另存为定稿',
    description: '将文档另存为带「定稿」前缀的新文件',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.RENAME_DOCUMENT,
        name: '另存为定稿',
        params: {
          prefix: '「定稿」',
          deleteOriginal: false
        }
      }
    ]
  },

  // 添加保密标识
  addConfidentialHeader: {
    id: 'add-confidential-header',
    name: '添加保密标识',
    description: '在页眉添加「保密」标识并保存',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.ADD_HEADER,
        name: '添加保密标识',
        params: { text: '【保密】' }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 归档文档（添加页眉 + 导出PDF + 另存）
  archiveDocument: {
    id: 'archive-document',
    name: '归档文档',
    description: '添加归档标识 → 导出PDF → 另存为归档版',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.ADD_HEADER,
        name: '添加归档标识',
        params: { text: '【归档】' }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' },
      { actionType: ActionTypes.EXPORT_PDF, name: '导出 PDF' },
      {
        actionType: ActionTypes.RENAME_DOCUMENT,
        name: '另存为归档版',
        params: {
          prefix: '「归档」',
          deleteOriginal: false
        }
      }
    ]
  },

  // 扫描敏感信息
  scanSensitive: {
    id: 'scan-sensitive',
    name: '扫描敏感信息',
    description: '扫描文档中的敏感信息（身份证、手机号、银行卡等），仅检测不处理',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.SCAN_SENSITIVE,
        name: '扫描敏感信息',
        params: {}
      }
    ]
  },

  // 信息脱敏
  desensitizeDocument: {
    id: 'desensitize-document',
    name: '信息脱敏',
    description: '扫描并脱敏文档中的敏感信息',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.SCAN_SENSITIVE, name: '扫描敏感信息' },
      {
        actionType: ActionTypes.DESENSITIZE,
        name: '执行脱敏',
        params: { autoApply: true }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 脱敏并另存
  desensitizeAndSaveAs: {
    id: 'desensitize-save-as',
    name: '脱敏并另存',
    description: '扫描并脱敏文档后另存为新文件',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      { actionType: ActionTypes.SCAN_SENSITIVE, name: '扫描敏感信息' },
      {
        actionType: ActionTypes.DESENSITIZE,
        name: '执行脱敏',
        params: { autoApply: true }
      },
      {
        actionType: ActionTypes.RENAME_DOCUMENT,
        name: '另存为脱敏版',
        params: {
          prefix: '「脱敏版」',
          deleteOriginal: false
        }
      }
    ]
  },

  // 添加页码
  addPageNumber: {
    id: 'add-page-number',
    name: '添加页码',
    description: '在文档页脚添加「第X页/共Y页」格式的页码',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.ADD_PAGE_NUMBER,
        name: '添加页码',
        params: {
          format: 'pageOfTotal',
          position: 'bottom',
          alignment: '居中'
        }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 添加草稿水印
  addDraftWatermark: {
    id: 'add-draft-watermark',
    name: '添加草稿水印',
    description: '在文档中添加「草稿」水印',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.ADD_WATERMARK,
        name: '添加草稿水印',
        params: { text: '草稿', color: 'light' }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
    ]
  },

  // 添加机密水印
  addConfidentialWatermark: {
    id: 'add-confidential-watermark',
    name: '添加机密水印',
    description: '在文档中添加「机密」水印',
    category: 'document',
    steps: [
      { actionType: ActionTypes.READ_DOCUMENT, name: '读取文档' },
      {
        actionType: ActionTypes.ADD_WATERMARK,
        name: '添加机密水印',
        params: { text: '机密', color: 'medium' }
      },
      { actionType: ActionTypes.SAVE_DOCUMENT, name: '保存文档' }
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
