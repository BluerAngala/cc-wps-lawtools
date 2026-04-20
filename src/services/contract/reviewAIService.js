/**
 * 合同审查AI服务
 * 提供合同类型识别、条款审查等功能
 */

import { streamChatCompletions, nonStreamChatCompletions } from '../ai/siliconflow.js'
import { appConfig } from '../../utils/appConfig.js'
import { PromptBuilder } from '../../config/prompts.js'
import unifiedLogger from '../../utils/unifiedLogger.js'
import { JSONLParser } from './jsonlParser.js'

export class ReviewAIService {
  constructor() {
    this.getAIConfig = () => {
      const config = appConfig.getAIConfig()
      return {
        model: config.model || 'Qwen/Qwen2.5-7B-Instruct',
        temperature: config.temperature !== undefined ? config.temperature : 0.1,
        maxTokens: config.maxTokens || 16000
      }
    }
  }

  /**
   * 识别合同类型（使用非流式，因为需要JSON格式）
   */
  async identifyContractType(documentText, onProgress) {
    const config = this.getAIConfig()
    const maxAttempts = 2
    let attempt = 0
    let lastError = null
    let lastResult = {
      type: '未知',
      subtype: '',
      confidence: 'low'
    }
    let lastResponse = ''

    while (attempt < maxAttempts) {
      attempt += 1
      let messages = PromptBuilder.forContractClassification(documentText)
      if (attempt > 1) {
        messages = [
          ...messages,
          {
            role: 'user',
            content: '如果无法完全确定，请选择最接近的合同类型并给出理由，不要返回未知类型。'
          }
        ]
      }

      try {
        if (onProgress) {
          onProgress({
            stage: attempt === 1 ? '正在识别合同类型...' : '合同类型未知，正在重新识别...',
            content: ''
          })
        }

        const response = await nonStreamChatCompletions({
          messages,
          model: config.model,
          options: {
            temperature: attempt === 1 ? config.temperature : Math.min(config.temperature + 0.2, 0.6),
            maxTokens: 1000, // 类型识别不需要太长
            response_format: { type: 'json_object' }
          }
        })

        const result = this.parseJSONResponse(response)
        lastResponse = response
        lastResult = {
          type: result.type || '未知',
          subtype: result.subtype || '',
          confidence: result.confidence || 'medium'
        }

        if (lastResult.type && lastResult.type !== '未知') {
          if (onProgress) {
            onProgress({ stage: '合同类型识别完成', content: response })
          }
          return lastResult
        }
      } catch (error) {
        lastError = error
        unifiedLogger.error('识别合同类型失败', { error: error.message, type: 'contract_identification' })
      }
    }

    if (onProgress && lastResponse) {
      onProgress({ stage: '合同类型识别完成', content: lastResponse })
    }

    if (lastError && (!lastResult || lastResult.type === '未知')) {
      unifiedLogger.warn('多次识别仍未得到明确合同类型，返回默认结果', { type: 'contract_identification' })
    }

    return lastResult
  }

  /**
   * 审查条款（带完整上下文，支持流式和非流式）
   * 注意：合同审查需要结构化 JSON 输出，默认使用非流式请求
   */
  async reviewClause(context, contractType, options = {}) {
    const config = this.getAIConfig()
    const messages = this.buildReviewMessages(context, contractType, {
      perspective: options.perspective,
      customPrompt: options.customPrompt
    })
    
    // 合同审查必须返回 JSON 格式，因此默认使用非流式
    // 只有明确设置 stream=true 且不需要 JSON 时才使用流式
    const needJsonFormat = options.response_format !== false // 默认需要 JSON
    const useStream = options.stream === true && !needJsonFormat

    try {
      unifiedLogger.info('审查条款', { section: context.segmentPosition?.section || '未知', type: 'contract_review' })
      const totalLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0)
      unifiedLogger.info('AI消息统计', { messageCount: messages.length, totalLength: totalLength, type: 'contract_review' })
      unifiedLogger.info('AI请求配置', { streamMode: useStream, needJson: needJsonFormat, type: 'contract_review' })

      let response
      
      if (options.onProgress && Array.isArray(context.checklist) && context.checklist.length > 0) {
        try {
          options.onProgress({
            stage: '审查清单已准备',
            content: context.checklist
          })
        } catch (error) {
          unifiedLogger.warn('进度回调（审查清单）失败', { error: error.message, type: 'contract_review' })
        }
      }

      if (useStream) {
        // 流式请求（仅用于展示，不解析为 JSON）
        unifiedLogger.info('使用流式模式', { type: 'contract_review' })
        response = await streamChatCompletions({
          messages,
          model: config.model,
          onChunk: options.onChunk,
          onProgress: options.onProgress,
          options: {
            temperature: config.temperature,
            maxTokens: config.maxTokens
          }
        })
        
        unifiedLogger.info('流式响应长度', { length: response.length, type: 'contract_review' })
      } else {
        // 非流式请求（默认，支持JSON模式）
        if (options.onProgress) {
          options.onProgress({ stage: '正在审查条款...', content: '' })
        }

        unifiedLogger.info('使用非流式模式', { type: 'contract_review' })
        unifiedLogger.info('审查请求开始', { type: 'contract_review' })
        unifiedLogger.info('AI模型', { model: config.model, type: 'contract_review' })
        unifiedLogger.info('AI温度', { temperature: config.temperature, type: 'contract_review' })
        unifiedLogger.info('AI最大令牌数', { maxTokens: config.maxTokens, type: 'contract_review' })
        unifiedLogger.info('审查位置', { section: context.segmentPosition?.section || '未知', type: 'contract_review' })
        unifiedLogger.info('当前段落长度', { length: context.currentSegment?.length || 0, type: 'contract_review' })
        unifiedLogger.info('完整文档长度', { length: context.fullDocument?.length || 0, type: 'contract_review' })
        unifiedLogger.info('审查清单项数', { count: context.checklist?.length || 0, type: 'contract_review' })
        unifiedLogger.info('系统消息', { content: messages[0]?.content?.substring(0, 100) + '...', type: 'contract_review' })
        unifiedLogger.info('用户消息', { content: messages[1]?.content?.substring(0, 100) + '...', type: 'contract_review' })
        unifiedLogger.info('消息总长度', { totalLength: messages.reduce((sum, m) => sum + (m.content?.length || 0), 0), type: 'contract_review' })
        unifiedLogger.info('请求详情结束', { type: 'contract_review' })
        
        const requestStartTime = Date.now()
        // 注意：某些模型对 response_format 支持不佳，尝试不使用该参数
        response = await nonStreamChatCompletions({
          messages,
          model: config.model,
          options: {
            temperature: config.temperature,
            maxTokens: config.maxTokens
            // 暂时移除 response_format，因为 Qwen2.5-7B 可能不支持或支持不好
            // response_format: { type: 'json_object' }
          }
        })
        const requestDuration = Date.now() - requestStartTime

        
        unifiedLogger.info('请求耗时', { duration: requestDuration, type: 'contract_review' })
        unifiedLogger.info('响应长度', { length: response?.length || 0, type: 'contract_review' })
        unifiedLogger.info('完整响应内容', { content: response?.substring(0, 100) + '...', type: 'contract_review' })

        if (options.onProgress) {
          options.onProgress({ stage: '审查完成', content: response })
        }
      }

      const result = this.parseResponse(response)
      unifiedLogger.info('解析结果开始', { type: 'contract_review' })
      unifiedLogger.info('问题数组', { count: result.issues?.length || 0, type: 'contract_review' })
      unifiedLogger.info('风险数组', { count: result.risks?.length || 0, type: 'contract_review' })
      unifiedLogger.info('审查统计', { issues: result.issues?.length || 0, risks: result.risks?.length || 0, type: 'contract_review' })
      unifiedLogger.info('解析结果结束', { type: 'contract_review' })


      return result
    } catch (error) {
      unifiedLogger.error('审查失败', { error: error.message, type: 'contract_review' })
      unifiedLogger.error('审查错误详情', { errorType: error.name, errorMessage: error.message, type: 'contract_review' })
      
      // 不要吞掉错误，应该向上抛出让调用者处理
      throw error
    }
  }

  /**
   * 构建审查消息（三层提示词结构：系统级 + 角色级 + 任务级）
   * 使用统一的提示词配置管理
   * @param {Object} context - 审查上下文
   * @param {Object} contractType - 合同类型
   * @param {Object} options - 选项（包含 perspective、customPrompt 等）
   */
  buildReviewMessages(context, contractType, options = {}) {
    // 生成文档摘要（用于上下文）
    const summary = context.fullDocument && context.fullDocument.length > 0
      ? this.generateDocumentSummary(context.fullDocument, context.currentSegment)
      : null

    // 格式化审查清单
    const checklistText = context.checklist && context.checklist.length > 0
      ? this.formatChecklist(context.checklist)
      : null

    // 构建增强的上下文对象
    const enhancedContext = {
      ...context,
      summary,
      checklistText
    }

    // 使用 PromptBuilder 构建消息，传递视角和自定义指令
    return PromptBuilder.forContractReview(enhancedContext, contractType, checklistText, {
      perspective: options.perspective,
      customPrompt: options.customPrompt
    })
  }

  /**
   * 全局分析：识别合同类型、结构和风险区域（使用非流式，因为需要JSON格式）
   * 这是分层审查的第一阶段
   */
  async analyzeGlobal(documentText, onProgress) {
    const config = this.getAIConfig()
    
    // 使用 PromptBuilder 构建消息
    const messages = PromptBuilder.forContractAnalysis(documentText)

    try {
      if (onProgress) {
        onProgress({ stage: '正在进行全局分析...', content: '' })
      }

      const response = await nonStreamChatCompletions({
        messages,
        model: config.model,
        options: {
          temperature: config.temperature,
          maxTokens: 2000, // 全局分析需要较多token
          response_format: { type: 'json_object' }
        }
      })

      const result = this.parseJSONResponse(response)
      
      if (onProgress) {
        onProgress({ stage: '全局分析完成', content: response })
      }

      return {
        type: result.type || '未知',
        subtype: result.subtype || '',
        structure: result.structure || [],
        riskAreas: result.riskAreas || [] // [{section: "第六条", riskLevel: "high", reason: "..."}]
      }
    } catch (error) {
      unifiedLogger.error('全局分析失败', { error: error.message, type: 'contract_analysis' })
      // 降级：只识别类型
      const typeInfo = await this.identifyContractType(documentText, onProgress)
      return {
        type: typeInfo.type,
        subtype: typeInfo.subtype,
        structure: [],
        riskAreas: []
      }
    }
  }

  /**
   * 生成文档摘要（用于上下文，而非完整文档）
   * 提取关键信息：合同主体、金额、期限、关键条款等
   */
  generateDocumentSummary(fullDocument) {
    // 提取关键信息（简化版，后续可以优化为AI提取）
    const keyPatterns = [
      { pattern: /(甲方|乙方|委托方|受托方)[：:]\s*([^\n]{1,100})/g, label: '合同主体' },
      { pattern: /(合同金额|总金额|价款|费用|服务费)[：:]\s*([^\n]{1,100})/g, label: '金额' },
      { pattern: /(履行期限|服务期限|合同期限)[：:]\s*([^\n]{1,100})/g, label: '期限' },
      { pattern: /(付款方式|支付方式)[：:]\s*([^\n]{1,100})/g, label: '付款方式' }
    ]

    const summary = []
    for (const { pattern, label } of keyPatterns) {
      const matches = [...fullDocument.matchAll(pattern)]
      if (matches.length > 0) {
        const values = matches.slice(0, 2).map(m => m[2]?.trim()).filter(Boolean)
        if (values.length > 0) {
          summary.push(`${label}：${values.join('；')}`)
        }
      }
    }

    // 如果提取到关键信息，返回摘要；否则返回空（不使用全文）
    return summary.length > 0 ? summary.join('\n') : null
  }

  /**
   * 格式化审查清单为文本
   */
  formatChecklist(checklist) {
    if (!checklist || checklist.length === 0) {
      return ''
    }

    // 按优先级分组
    const highPriority = checklist.filter(item => item.priority === 'high' && item.required)
    const mediumPriority = checklist.filter(item => item.priority === 'medium' || (!item.required && item.priority === 'high'))
    const lowPriority = checklist.filter(item => item.priority === 'low')

    let text = ''

    if (highPriority.length > 0) {
      text += '**高优先级（必需）条款：**\n'
      highPriority.forEach((item, index) => {
        text += `${index + 1}. ${item.name}${item.reviewRequirements ? ` - ${item.reviewRequirements}` : ''}\n`
      })
      text += '\n'
    }

    if (mediumPriority.length > 0) {
      text += '**中优先级条款：**\n'
      mediumPriority.forEach((item, index) => {
        text += `${index + 1}. ${item.name}${item.reviewRequirements ? ` - ${item.reviewRequirements}` : ''}\n`
      })
      text += '\n'
    }

    if (lowPriority.length > 0) {
      text += '**低优先级条款：**\n'
      lowPriority.forEach((item, index) => {
        text += `${index + 1}. ${item.name}${item.reviewRequirements ? ` - ${item.reviewRequirements}` : ''}\n`
      })
      text += '\n'
    }

    return text
  }

  /**
   * 解析AI响应
   */
  parseResponse(response) {
    const result = this.parseJSONResponse(response)
    
    // 确保返回正确的结构，包括 issues 和 risks
    const issues = Array.isArray(result.issues) ? result.issues : []
    const risks = Array.isArray(result.risks) ? result.risks : []
    
    // 如果没有 risks 但有 revisions（修订模式），转换为 risks
    if (risks.length === 0 && Array.isArray(result.revisions)) {
      // revisions 模式下不需要转换，直接返回
    }
    
    return {
      issues,
      risks
    }
  }

  /**
   * 解析JSON响应
   * 使用 response_format 后，响应应该是纯 JSON，直接解析即可
   */
  parseJSONResponse(response) {
    if (!response) {
      return {}
    }

    try {
      // 先尝试直接解析（最快路径）
      return JSON.parse(response)
    } catch (firstError) {
      // 检查是否是已知的畸形格式，如果是则不输出警告
      if (!response.match(/^\{":"/)) {
        unifiedLogger.warn('直接解析失败，尝试清理', { error: firstError.message, type: 'response_parsing' })
      }
      
      try {
        // 清理响应内容
        let cleanResponse = response.trim()
        
        // 尝试提取 JSON 代码块（如果有）
        const jsonBlockMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
        if (jsonBlockMatch) {
          cleanResponse = jsonBlockMatch[1].trim()
        }
        
        // 尝试提取纯 JSON（去除前后可能的非 JSON 内容）
        const jsonMatch = cleanResponse.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          cleanResponse = jsonMatch[1]
        }
        
        // 特殊处理：修复模型返回的畸形JSON格式
        if (cleanResponse === '{":":"}') {
          // 处理完全畸形的响应：{":":"}
          return {
            type: '未知',
            subtype: '',
            confidence: 'low'
          }
        } else if (cleanResponse.match(/^\{":"/)) {
          // 处理格式如 {":"服务合同",...} 的情况（模型的已知问题，自动修复）
          cleanResponse = cleanResponse.replace(/^\{":/, '{"type":')
        } else if (cleanResponse.startsWith('{"":')) {
          // 处理格式如 {"":"服务合同",...} 的情况
          cleanResponse = cleanResponse.replace(/^\{"":/, '{"type":')
        } else if (cleanResponse.startsWith('{":')) {
          // 处理其他缺少属性名的格式
          cleanResponse = cleanResponse.replace(/^\{":/, '{"type":')
        }
        
        // 修复常见的 JSON 字符串问题
        // 1. 找到所有字符串值（在引号之间的内容）
        // 2. 修复其中的控制字符
        cleanResponse = cleanResponse.replace(/"([^"]*?)"/g, (match, content) => {
          // 在字符串内容中转义控制字符
          const fixed = content
            .replace(/\\/g, '\\\\')  // 先转义反斜杠
            .replace(/\n/g, '\\n')   // 转义换行
            .replace(/\r/g, '\\r')   // 转义回车
            .replace(/\t/g, '\\t')   // 转义制表符
            .replace(/"/g, '\\"')    // 转义双引号
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // 移除其他控制字符
          return `"${fixed}"`
        })
        
        // 尝试解析修复后的 JSON
        return JSON.parse(cleanResponse)
      } catch (secondError) {
        // 最后尝试：完全移除控制字符
        try {
          // eslint-disable-next-line no-control-regex
          const sanitized = response.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ' ').trim()
          
          const jsonMatch = sanitized.match(/(\{[\s\S]*\})/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[1])
          }
        } catch (finalError) {
          unifiedLogger.error('JSON解析失败，返回空对象', { type: 'response_parsing' })
        }
        
        return {}
      }
    }
  }

  /**
   * 流式审查条款（边接收边解析，实时触发回调）
   * @param {Object} context - 审查上下文
   * @param {Object} contractType - 合同类型
   * @param {Object} options - 选项
   * @param {Function} options.onIssue - 发现问题时的回调
   * @param {Function} options.onRisk - 发现风险时的回调
   * @param {Function} options.onProgress - 进度回调
   * @returns {Promise<Object>} 审查结果 { issues, risks }
   */
  async reviewClauseStreaming(context, contractType, options = {}) {
    const config = this.getAIConfig()
    const messages = PromptBuilder.forContractReviewStreaming(context, contractType)

    const issues = []
    const risks = []

    // 创建增量解析器
    const parser = new JSONLParser({
      onLine: (obj) => {
        if (obj.type === 'issue') {
          // 转换为标准格式
          const issue = {
            severity: obj.severity || 'medium',
            position: obj.position || '',
            searchKeyword: obj.searchKeyword || obj.keyword || '',
            comment: obj.comment || '',
            checklistId: obj.checklistId || null
          }
          issues.push(issue)
          options.onIssue?.(issue)
          unifiedLogger.info('流式解析到问题', { 
            keyword: issue.searchKeyword?.substring(0, 20),
            type: 'streaming_review' 
          })
        } else if (obj.type === 'risk') {
          const risk = {
            severity: obj.severity || 'medium',
            description: obj.description || '',
            suggestion: obj.suggestion || ''
          }
          risks.push(risk)
          options.onRisk?.(risk)
          unifiedLogger.info('流式解析到风险', { 
            description: risk.description?.substring(0, 20),
            type: 'streaming_review' 
          })
        }
      },
      onError: (msg) => {
        unifiedLogger.warn('JSONL解析警告', { message: msg, type: 'streaming_review' })
      }
    })

    try {
      unifiedLogger.info('开始流式审查', { 
        section: context.segmentPosition?.section || '未知',
        type: 'streaming_review' 
      })

      if (options.onProgress) {
        options.onProgress({ stage: '正在流式审查...', content: '' })
      }

      // 使用流式请求
      await streamChatCompletions({
        messages,
        model: config.model,
        onChunk: (chunk) => {
          // 将数据块喂给解析器
          parser.feed(chunk)
        },
        options: {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      })

      // 处理剩余缓冲区
      parser.flush()

      unifiedLogger.info('流式审查完成', { 
        issueCount: issues.length,
        riskCount: risks.length,
        type: 'streaming_review' 
      })

      if (options.onProgress) {
        options.onProgress({ stage: '流式审查完成', content: '' })
      }

      return { issues, risks }
    } catch (error) {
      unifiedLogger.error('流式审查失败', { 
        error: error.message,
        type: 'streaming_review' 
      })
      throw error
    }
  }
}

export const reviewAIService = new ReviewAIService()


