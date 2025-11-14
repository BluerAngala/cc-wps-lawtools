/**
 * 合同审查AI服务
 * 提供合同类型识别、条款审查等功能
 */

import { streamChatCompletions, nonStreamChatCompletions } from '../ai/siliconflow.js'
import { appConfig } from '../../utils/appConfig.js'
import { PromptBuilder } from '../../config/prompts.js'

export class ReviewAIService {
  constructor() {
    // 获取AI配置
    this.getAIConfig = () => {
      const config = appConfig.get('ai') || {}
      return {
        model: config.model || 'Qwen/Qwen2.5-7B-Instruct', // 改用更快的 Qwen2.5-7B 模型
        temperature: config.temperature !== undefined ? config.temperature : 0.1,
        maxTokens: config.maxTokens || 16000 // 增加到 16000，确保有足够的输出空间
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
        console.error('识别合同类型失败:', error)
      }
    }

    if (onProgress && lastResponse) {
      onProgress({ stage: '合同类型识别完成', content: lastResponse })
    }

    if (lastError && (!lastResult || lastResult.type === '未知')) {
      console.warn('多次识别仍未得到明确合同类型，返回默认结果')
    }

    return lastResult
  }

  /**
   * 审查条款（带完整上下文，支持流式和非流式）
   * 注意：合同审查需要结构化 JSON 输出，默认使用非流式请求
   */
  async reviewClause(context, contractType, options = {}) {
    const config = this.getAIConfig()
    const messages = this.buildReviewMessages(context, contractType, options)
    
    // 合同审查必须返回 JSON 格式，因此默认使用非流式
    // 只有明确设置 stream=true 且不需要 JSON 时才使用流式
    const needJsonFormat = options.response_format !== false // 默认需要 JSON
    const useStream = options.stream === true && !needJsonFormat

    try {
      console.log(`[AI审查] 审查条款: ${context.segmentPosition?.section || '未知'}`)
      const totalLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0)
      console.log(`[AI审查] Messages数量: ${messages.length}, 总长度: ${totalLength}字符`)
      console.log(`[AI审查] 使用${useStream ? '流式' : '非流式'}请求，需要JSON: ${needJsonFormat}`)

      let response
      
      if (options.onProgress && Array.isArray(context.checklist) && context.checklist.length > 0) {
        try {
          options.onProgress({
            stage: '审查清单已准备',
            content: context.checklist
          })
        } catch (error) {
          console.warn('[AI审查] 进度回调（审查清单）失败:', error)
        }
      }

      if (useStream) {
        // 流式请求（仅用于展示，不解析为 JSON）
        console.log('[AI审查] 使用流式模式（展示用）')
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
        
        console.log(`[AI审查] 流式响应长度: ${response.length}字符`)
      } else {
        // 非流式请求（默认，支持JSON模式）
        if (options.onProgress) {
          options.onProgress({ stage: '正在审查条款...', content: '' })
        }

        console.log('[AI审查] 使用非流式模式（JSON格式）')
        console.log('[AI审查] ========== 审查请求详情 ==========')
        console.log('[AI审查] 🤖 模型:', config.model)
        console.log('[AI审查] 🌡️ Temperature:', config.temperature)
        console.log('[AI审查] 📏 MaxTokens:', config.maxTokens)
        console.log('[AI审查] 📍 审查位置:', context.segmentPosition?.section || '未知')
        console.log('[AI审查] 📝 当前段落长度:', context.currentSegment?.length || 0, '字符')
        console.log('[AI审查] 📚 完整文档长度:', context.fullDocument?.length || 0, '字符')
        console.log('[AI审查] 📋 审查清单项数:', context.checklist?.length || 0)
        console.log('[AI审查] 💬 System Message:', messages[0]?.content)
        console.log('[AI审查] 💬 User Message:', messages[1]?.content)
        console.log('[AI审查] 📊 Messages 总长度:', messages.reduce((sum, m) => sum + (m.content?.length || 0), 0), '字符')
        console.log('[AI审查] =======================================')
        
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

        console.log('[AI审查] ========== 审查响应详情 ==========')
        console.log('[AI审查] ⏱️ 请求耗时:', requestDuration, 'ms (', (requestDuration / 1000).toFixed(2), '秒)')
        console.log('[AI审查] 📝 响应长度:', response?.length || 0, '字符')
        console.log('[AI审查] 📝 完整响应内容:')
        console.log(response)
        console.log('[AI审查] =======================================')

        if (options.onProgress) {
          options.onProgress({ stage: '审查完成', content: response })
        }
      }

      const result = this.parseResponse(response)
      console.log('[AI审查] ===== 解析结果 =====')
      console.log(`[AI审查] Issues 数组:`, result.issues)
      console.log(`[AI审查] Risks 数组:`, result.risks)
      console.log(`[AI审查] 统计: ${result.issues?.length || 0} 个问题, ${result.risks?.length || 0} 个风险`)
      console.log('[AI审查] ====================')


      return result
    } catch (error) {
      console.error(`[AI审查] 审查失败:`, error)
      console.error(`[AI审查] 错误详情 - 类型: ${error.name}, 消息: ${error.message}`)
      
      // 不要吞掉错误，应该向上抛出让调用者处理
      throw error
    }
  }

  /**
   * 构建审查消息（三层提示词结构：系统级 + 角色级 + 任务级）
   * 使用统一的提示词配置管理
   */
  buildReviewMessages(context, contractType) {
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

    // 使用 PromptBuilder 构建消息
    return PromptBuilder.forContractReview(enhancedContext, contractType, checklistText)
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
      console.error('全局分析失败:', error)
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
        console.warn('直接解析失败，尝试清理...', firstError.message)
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
          console.error('JSON解析失败，返回空对象')
        }
        
        return {}
      }
    }
  }
}

export const reviewAIService = new ReviewAIService()


