/**
 * 信息脱敏操作
 * 对文档中的敏感信息进行脱敏处理
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocumentService } from '../../wps/index.js'
import { Desensitizer } from '../../document/desensitizeAdvanced.js'

export class DesensitizeAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.DESENSITIZE,
      name: '信息脱敏',
      description: '对文档中的敏感信息（身份证、手机号、银行卡等）进行脱敏处理',
      icon: '🔒'
    })
  }

  async execute(params, context) {
    try {
      // 获取文档内容
      const fullText = context.documentText || wpsDocumentService.getFullText()
      if (!fullText) {
        return createErrorResult('无法获取文档内容')
      }

      // 创建脱敏器
      const desensitizer = new Desensitizer({
        whitelist: params.whitelist || [],
        customSensitiveWords: params.customWords || []
      })

      // 执行脱敏
      const { desensitizedText, sensitiveInfoList } = desensitizer.desensitizeText(fullText)

      if (sensitiveInfoList.length === 0) {
        return createSuccessResult('未发现需要脱敏的敏感信息', {
          sensitiveCount: 0,
          sensitiveInfoList: []
        })
      }

      // 应用脱敏结果到文档
      if (params.autoApply !== false) {
        const doc = window.Application?.ActiveDocument
        const useRevision = params.useRevision === true

        // 根据参数设置修订模式
        if (doc) {
          doc.TrackRevisions = useRevision
        }

        try {
          // 逐个替换敏感信息
          for (const info of sensitiveInfoList) {
            const range = wpsDocumentService.findRangeByKeyword(info.original)
            if (range) {
              range.Text = info.desensitized
            }
          }
        } finally {
          // 如果不使用修订模式，确保关闭
          if (!useRevision && doc) {
            doc.TrackRevisions = false
          }
          // 如果使用修订模式，保持开启让用户审阅
        }
      }

      // 存储脱敏结果到上下文
      context.data.desensitizeResult = {
        sensitiveCount: sensitiveInfoList.length,
        sensitiveInfoList,
        desensitizedText
      }

      // 按类型统计
      const typeStats = {}
      sensitiveInfoList.forEach(info => {
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
        whitelist: {
          type: 'array',
          title: '白名单',
          description: '不需要脱敏的内容列表',
          items: { type: 'string' },
          default: []
        }
      },
      required: []
    }
  }
}

export const desensitizeAction = new DesensitizeAction()
