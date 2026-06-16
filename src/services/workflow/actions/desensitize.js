/**
 * 信息脱敏操作
 * 对文档中的敏感信息进行脱敏处理
 */

import { BaseAction, createSuccessResult, createErrorResult } from './BaseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocumentService } from '../../wps/index.js'
import { Desensitizer } from '../../document/Desensitizer.js'
import { SENSITIVE_TYPES } from '../../../config/sensitivePatterns.js'

export class DesensitizeAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.DESENSITIZE,
      name: '信息脱敏',
      description: '对文档中的敏感信息（身份证、手机号、银行卡等）进行脱敏处理',
      icon: '🔒'
    })
  }

  parseTextToArray(text) {
    if (!text || typeof text !== 'string') return []
    return text
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  async execute(params, context) {
    try {
      const fullText = context.documentText || wpsDocumentService.getFullText()
      if (!fullText) {
        return createErrorResult('无法获取文档内容')
      }

      const whitelist =
        this.parseTextToArray(params.whitelist) || context.data.scanParams?.whitelist || []
      const blacklist =
        this.parseTextToArray(params.blacklist) || context.data.scanParams?.blacklist || []

      const desensitizer = new Desensitizer({
        whitelist,
        customSensitiveWords: blacklist.map((word) => ({ word, replacement: null }))
      })

      let { desensitizedText, sensitiveInfoList } = desensitizer.desensitizeText(fullText)

      const scanTypes = params.scanTypes || context.data.scanParams?.scanTypes || []
      if (scanTypes.length > 0) {
        sensitiveInfoList = sensitiveInfoList.filter((info) => scanTypes.includes(info.type))
      }

      if (sensitiveInfoList.length === 0) {
        return createSuccessResult('未发现需要脱敏的敏感信息', {
          sensitiveCount: 0,
          sensitiveInfoList: []
        })
      }

      if (params.autoApply !== false) {
        const doc = window.Application?.ActiveDocument
        const useRevision = params.useRevision === true

        if (doc) {
          doc.TrackRevisions = useRevision
        }

        try {
          for (const info of sensitiveInfoList) {
            const range = wpsDocumentService.findRangeByKeyword(info.original)
            if (range) {
              range.Text = info.desensitized
            }
          }
        } finally {
          if (!useRevision && doc) {
            doc.TrackRevisions = false
          }
        }
      }

      context.data.desensitizeResult = {
        sensitiveCount: sensitiveInfoList.length,
        sensitiveInfoList,
        desensitizedText
      }

      const typeStats = {}
      sensitiveInfoList.forEach((info) => {
        typeStats[info.type] = (typeStats[info.type] || 0) + 1
      })

      const statsText = Object.entries(typeStats)
        .map(([type, count]) => `${type}: ${count}处`)
        .join('、')

      return createSuccessResult(`已脱敏 ${sensitiveInfoList.length} 处敏感信息（${statsText}）`, {
        sensitiveCount: sensitiveInfoList.length,
        sensitiveInfoList,
        typeStats
      })
    } catch (error) {
      return createErrorResult(error.message || '脱敏处理失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        autoApply: {
          type: 'boolean',
          title: '自动应用',
          description: '是否自动将脱敏结果应用到文档',
          default: true
        },
        useRevision: {
          type: 'boolean',
          title: '修订模式',
          description: '是否开启修订模式，方便审阅脱敏修改',
          default: false
        },
        scanTypes: {
          type: 'array',
          title: '脱敏类型',
          description: '选择要脱敏的敏感信息类型，不选则脱敏全部',
          options: SENSITIVE_TYPES.map((type) => ({ label: type, value: type })),
          default: []
        },
        whitelist: {
          type: 'string',
          inputType: 'textarea',
          title: '白名单',
          description: '不需要脱敏的内容，多个用逗号或换行分隔',
          placeholder: '例如：张三，李四',
          default: ''
        },
        blacklist: {
          type: 'string',
          inputType: 'textarea',
          title: '自定义敏感词',
          description: '额外需要脱敏的敏感词，多个用逗号或换行分隔',
          placeholder: '例如：机密项目，内部代号',
          default: ''
        }
      },
      required: []
    }
  }
}

export const desensitizeAction = new DesensitizeAction()
