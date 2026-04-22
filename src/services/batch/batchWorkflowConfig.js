/**
 * 批量工作流配置
 * 预定义常用的批量处理工作流
 */

import { ActionTypes } from '../workflow/types.js'

/**
 * 合同标准化处理工作流
 * 识别合同 -> 提交金山文档 -> 获取合同编号 -> 写入页眉 -> 关键词批注
 */
export const contractStandardizationWorkflow = {
  id: 'contract_standardization',
  name: '合同标准化处理',
  description: '识别合同信息、提交金山文档、写入编号、添加关键词批注',
  steps: [
    {
      actionType: ActionTypes.READ_DOCUMENT,
      name: '读取文档内容',
      params: {}
    },
    {
      actionType: ActionTypes.IDENTIFY_CONTRACT,
      name: '识别合同类型',
      params: {}
    },
    {
      actionType: ActionTypes.EXTRACT_CONTRACT,
      name: '提取合同信息',
      params: {}
    },
    {
      actionType: ActionTypes.SUBMIT_KDOCS,
      name: '提交金山文档',
      params: {}
    },
    {
      actionType: ActionTypes.ADD_HEADER,
      name: '写入合同编号',
      params: {
        text: '{{contractNumber}}',
        fontSize: 10,
        alignment: '右对齐'
      }
    },
    {
      actionType: ActionTypes.BATCH_KEYWORD,
      name: '添加关键词批注',
      params: {
        keywordList: []
      }
    },
    {
      actionType: ActionTypes.SAVE_DOCUMENT,
      name: '保存文档',
      params: {}
    }
  ]
}

/**
 * 合同信息提取工作流
 */
export const contractExtractionWorkflow = {
  id: 'contract_extraction',
  name: '合同信息提取',
  description: '识别合同类型并提取关键信息',
  steps: [
    {
      actionType: ActionTypes.READ_DOCUMENT,
      name: '读取文档内容',
      params: {}
    },
    {
      actionType: ActionTypes.IDENTIFY_CONTRACT,
      name: '识别合同类型',
      params: {}
    },
    {
      actionType: ActionTypes.EXTRACT_CONTRACT,
      name: '提取合同信息',
      params: {}
    },
    {
      actionType: ActionTypes.SAVE_DOCUMENT,
      name: '保存文档',
      params: {}
    }
  ]
}

/**
 * 合同编号写入工作流
 */
export const contractNumberWorkflow = {
  id: 'contract_number',
  name: '合同编号写入',
  description: '提交金山文档并获取合同编号写入页眉',
  steps: [
    {
      actionType: ActionTypes.READ_DOCUMENT,
      name: '读取文档内容',
      params: {}
    },
    {
      actionType: ActionTypes.EXTRACT_CONTRACT,
      name: '提取合同信息',
      params: {}
    },
    {
      actionType: ActionTypes.SUBMIT_KDOCS,
      name: '提交金山文档',
      params: {}
    },
    {
      actionType: ActionTypes.ADD_HEADER,
      name: '写入合同编号',
      params: {
        text: '{{contractNumber}}',
        fontSize: 10,
        alignment: '右对齐'
      }
    },
    {
      actionType: ActionTypes.SAVE_DOCUMENT,
      name: '保存文档',
      params: {}
    }
  ]
}

/**
 * 关键词批注工作流
 */
export const keywordCommentWorkflow = {
  id: 'keyword_comment',
  name: '关键词批注',
  description: '批量为关键词添加批注',
  steps: [
    {
      actionType: ActionTypes.BATCH_KEYWORD,
      name: '添加关键词批注',
      params: {
        keywordList: []
      }
    },
    {
      actionType: ActionTypes.SAVE_DOCUMENT,
      name: '保存文档',
      params: {}
    }
  ]
}

/**
 * 预设工作流列表
 */
export const presetBatchWorkflows = [
  contractStandardizationWorkflow,
  contractExtractionWorkflow,
  contractNumberWorkflow,
  keywordCommentWorkflow
]

/**
 * 根据ID获取预设工作流
 * @param {string} id - 工作流ID
 * @returns {Object|null} 工作流配置
 */
export function getPresetBatchWorkflow(id) {
  return presetBatchWorkflows.find(w => w.id === id) || null
}

/**
 * 克隆并自定义工作流
 * @param {string} presetId - 预设工作流ID
 * @param {Object} customizations - 自定义配置
 * @returns {Object} 自定义后的工作流
 */
export function cloneBatchWorkflow(presetId, customizations = {}) {
  const preset = getPresetBatchWorkflow(presetId)
  if (!preset) {
    throw new Error(`未找到预设工作流: ${presetId}`)
  }

  const cloned = JSON.parse(JSON.stringify(preset))
  cloned.id = `${presetId}_custom_${Date.now()}`
  cloned.name = customizations.name || cloned.name

  // 应用自定义参数
  if (customizations.params) {
    cloned.steps.forEach(step => {
      if (customizations.params[step.actionType]) {
        step.params = {
          ...step.params,
          ...customizations.params[step.actionType]
        }
      }
    })
  }

  return cloned
}

/**
 * 构建关键词列表
 * @param {Array} keywords - 关键词配置
 * @returns {Array} 格式化的关键词列表
 */
export function buildKeywordList(keywords) {
  return keywords.map(k => ({
    keyword: k.keyword || k,
    actionType: k.actionType || '批注',
    comment: k.comment || `关键词"${k.keyword || k}"需要重点关注`,
    suggestedText: k.suggestedText || ''
  }))
}
