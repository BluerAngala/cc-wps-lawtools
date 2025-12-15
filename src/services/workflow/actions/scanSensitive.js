/**
 * 扫描敏感信息操作
 * 扫描文档中的敏感信息并返回结果，不进行脱敏处理
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

export class ScanSensitiveAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.SCAN_SENSITIVE,
      name: '扫描敏感信息',
      description: '扫描文档中的敏感信息（身份证、手机号、银行卡等），仅检测不处理',
      icon: '🔍'
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

      // 解析白名单和黑名单
      const whitelist = this.parseTextToArray(params.whitelist)
      const blacklist = this.parseTextToArray(params.blacklist)

      // 创建脱敏器（仅用于扫描）
      const desensitizer = new Desensitizer({
        whitelist,
        customSensitiveWords: blacklist.map(word => ({ word, replacement: null }))
      })

      // 执行扫描
      let { sensitiveInfoList } = desensitizer.desensitizeText(fullText)

      // 如果指定了扫描类型，过滤结果
      if (params.scanTypes && params.scanTypes.length > 0) {
        sensitiveInfoList = sensitiveInfoList.filter(info => params.scanTypes.includes(info.type))
      }

      // 存储扫描结果到上下文，供后续脱敏操作使用
      context.data.sensitiveInfoList = sensitiveInfoList
      // 同时存储扫描参数，供脱敏操作复用
      context.data.scanParams = {
        whitelist,
        blacklist,
        scanTypes: params.scanTypes || []
      }

      if (sensitiveInfoList.length === 0) {
        return createSuccessResult('未发现敏感信息', {
          sensitiveCount: 0,
          sensitiveInfoList: [],
          typeStats: {}
        })
      }

      // 按类型统计
      const typeStats = {}
      sensitiveInfoList.forEach(info => {
        typeStats[info.type] = (typeStats[info.type] || 0) + 1
      })

      const statsText = Object.entries(typeStats)
        .map(([type, count]) => `${type}: ${count}处`)
        .join('、')

      return createSuccessResult(`发现 ${sensitiveInfoList.length} 处敏感信息（${statsText}）`, {
        sensitiveCount: sensitiveInfoList.length,
        sensitiveInfoList,
        typeStats
      })
    } catch (error) {
      return createErrorResult(error.message || '扫描敏感信息失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        scanTypes: {
          type: 'array',
          title: '扫描类型',
          description: '选择要扫描的敏感信息类型，不选则扫描全部',
          options: SENSITIVE_TYPES.map(type => ({ label: type, value: type })),
          default: []
        },
        whitelist: {
          type: 'string',
          inputType: 'textarea',
          title: '白名单',
          description: '不需要检测的内容，多个用逗号或换行分隔',
          placeholder: '例如：张三，李四',
          default: ''
        },
        blacklist: {
          type: 'string',
          inputType: 'textarea',
          title: '自定义敏感词',
          description: '额外需要检测的敏感词，多个用逗号或换行分隔',
          placeholder: '例如：机密项目，内部代号',
          default: ''
        }
      },
      required: []
    }
  }
}

export const scanSensitiveAction = new ScanSensitiveAction()
