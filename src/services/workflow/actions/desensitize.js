/**
 * 信息脱敏操作
 * 对文档中的敏感信息进行脱敏处理
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { wpsDocumentService } from '../../wps/index.js'
import { Desensitizer } from '../../document/desensitizeAdvanced.js'

// 支持的敏感信息类型
const SENSITIVE_TYPES = [
  '身份证号',
  '银行卡号',
  '手机号',
  '邮箱',
  'MAC地址',
  '护照号',
  '案件号',
  '公司编号',
  '中文地址',
  '合同主体',
  '姓名',
  '银行账号',
  '纳税人识别号'
]

export class DesensitizeAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.DESENSITIZE,
      name: '信息脱敏',
      description: '对文档中的敏感信息（身份证、手机号、银行卡等）进行脱敏处理',
      icon: '🔒'
    })
  }

  // 解析文本输入为数组（支持逗号、换行分隔）
  parseTextToArray(text) {
    if (!text || typeof text !== 'string') return []
    return text
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  async execute(params, context) {
    try {
      // 获取文档内容
      const fullText = context.documentText || wpsDocumentService.getFullText()
      if (!fullText) {
        return createErrorResult('无法获取文档内容')
      }

      // 解析白名单和黑名单（优先使用当前参数，否则使用扫描步骤的参数）
      const whitelist = this.parseTextToArray(params.whitelist) || context.data.scanParams?.whitelist || []
      const blacklist = this.parseTextToArray(params.blacklist) || context.data.scanParams?.blacklist || []

      // 创建脱敏器
      const desensitizer = new Desensitizer({
        whitelist,
        customSensitiveWords: blacklist.map(word => ({ word, replacement: null }))
      })

      // 执行脱敏
      let { desensitizedText, sensitiveInfoList } = desensitizer.desensitizeText(fullText)

      // 如果指定了脱敏类型，过滤结果
      const scanTypes = params.scanTypes || context.data.scanParams?.scanTypes || []
      if (scanTypes.length > 0) {
        sensitiveInfoList = sensitiveInfoList.filter(info => scanTypes.includes(info.type))
      }

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
        scanTypes: {
          type: 'array',
          title: '脱敏类型',
          description: '选择要脱敏的敏感信息类型，不选则脱敏全部',
          options: SENSITIVE_TYPES.map(type => ({ label: type, value: type })),
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
