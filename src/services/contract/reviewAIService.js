/**
 * 合同审查AI服务
 * 提供合同类型识别、条款审查等功能
 */

import { streamChatCompletions, nonStreamChatCompletions } from '../ai/siliconflow.js'
import { appConfig } from '../../utils/appConfig.js'

export class ReviewAIService {
  constructor() {
    // 获取AI配置
    this.getAIConfig = () => {
      const config = appConfig.get('ai') || {}
      return {
        model: config.model || 'Qwen/Qwen2.5-7B-Instruct', // 改用更快的 Qwen2.5-7B 模型
        temperature: config.temperature !== undefined ? config.temperature : 0.1,
        maxTokens: config.maxTokens || 8000
      }
    }
  }

  /**
   * 识别合同类型（使用非流式，因为需要JSON格式）
   */
  async identifyContractType(documentText, onProgress) {
    const config = this.getAIConfig()
    
    const systemMessage = {
      role: 'system',
      content: '你是一个专业的合同审查专家，擅长快速准确地识别合同类型。请以JSON格式返回结果，包含字段：type（合同类型），subtype（子类型），confidence（置信度：high/medium/low）。'
    }

    const userMessage = {
      role: 'user',
      content: `请识别以下合同的类型。

合同内容：
${documentText.substring(0, 5000)}${documentText.length > 5000 ? '\n\n[内容已截断]' : ''}`
    }

    try {
      if (onProgress) {
        onProgress({ stage: '正在识别合同类型...', content: '' })
      }

      const response = await nonStreamChatCompletions({
        messages: [systemMessage, userMessage],
        model: config.model,
        options: {
          temperature: config.temperature,
          maxTokens: 1000, // 类型识别不需要太长
          response_format: { type: 'json_object' }
        }
      })

      const result = this.parseJSONResponse(response)
      
      if (onProgress) {
        onProgress({ stage: '合同类型识别完成', content: response })
      }

      return {
        type: result.type || '未知',
        subtype: result.subtype || '',
        confidence: result.confidence || 'medium'
      }
    } catch (error) {
      console.error('识别合同类型失败:', error)
      return {
        type: '未知',
        subtype: '',
        confidence: 'low'
      }
    }
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
        console.log('[AI审查] ===== 请求详情 =====')
        console.log('[AI审查] 模型:', config.model)
        console.log('[AI审查] Temperature:', config.temperature)
        console.log('[AI审查] MaxTokens:', config.maxTokens)
        console.log('[AI审查] System Message (前200字):', messages[0]?.content?.substring(0, 200) + '...')
        console.log('[AI审查] User Message (前500字):', messages[1]?.content?.substring(0, 500) + '...')
        console.log('[AI审查] ====================')
        
        response = await nonStreamChatCompletions({
          messages,
          model: config.model,
          options: {
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            response_format: { type: 'json_object' }
          }
        })

        console.log('[AI审查] ===== 响应详情 =====')
        console.log(`[AI审查] 响应长度: ${response.length}字符`)
        console.log(`[AI审查] 完整响应内容:`, response)
        console.log('[AI审查] ====================')

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
      return {
        issues: [],
        risks: []
      }
    }
  }

  /**
   * 构建审查消息（使用 system message + 优化后的提示词）
   */
  buildReviewMessages(context, contractType) {
    // 构建审查清单部分
    const checklistText = context.checklist && context.checklist.length > 0
      ? this.formatChecklist(context.checklist)
      : ''

    // System Message：定义角色和核心规则
    const systemContent = `你是一个专业的合同审查专家，擅长识别法律风险并提供具体建议。

核心任务：
1. 审查合同条款的完整性和法律风险
2. 检查条款是否与合同其他部分一致
3. 识别潜在的法律问题和风险点
4. 提供具体、可操作的建议

**必须以 JSON 格式返回审查结果**，格式如下：
{
  "issues": [
    {
      "severity": "high|medium|low",
      "position": "章节位置（如：第六条）",
      "keyword": "问题相关的完整文本片段",
      "searchKeyword": "精确的搜索关键词（5-20字符，文档中实际存在的连续文本）",
      "comment": "问题描述和建议",
      "checklistId": "对应的审查清单项ID（如果适用）"
    }
  ],
  "risks": [
    {
      "severity": "high|medium|low",
      "description": "风险描述",
      "suggestion": "建议"
    }
  ]
}

重要规则：
- 必须返回有效的 JSON 格式
- searchKeyword 必须是文档中实际存在的连续文本（5-20字符）
- keyword 保留完整的问题文本片段（用于显示）
- position 准确标注章节号（如"第六条"）
- 发现问题时，issues 数组不能为空
- 只做批注，不做修订`

    // User Message：具体审查任务
    let userContent = `请审查以下合同条款。

合同类型：${contractType.type}${contractType.subtype ? ` (${contractType.subtype})` : ''}

当前审查的章节：${context.segmentPosition?.section || '未知'}

当前章节内容：
${context.currentSegment}`

    // 优化上下文传递：使用摘要而非全文
    if (context.fullDocument && context.fullDocument.length > 0) {
      // 生成关键信息摘要（而非完整文档）
      const summary = this.generateDocumentSummary(context.fullDocument, context.currentSegment)
      if (summary) {
        userContent += `\n\n合同关键信息摘要（用于上下文理解）：\n${summary}`
      }
    }

    // 添加审查清单
    if (checklistText) {
      userContent += `\n\n审查清单（按优先级）：\n${checklistText}`
      userContent += `\n\n审查要求：
- 对于"必需"条款，必须检查是否存在、是否完整
- 对于"高优先级"条款，必须进行深度审查
- 如果条款缺失或不完整，必须指出问题
- 如果条款存在但有问题，必须指出具体问题`
    }

    // 强调返回格式
    userContent += `\n\n请以 JSON 格式返回审查结果，包含 issues 和 risks 两个数组。如果发现问题，请详细列出；如果没有发现问题，返回空数组。`

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ]
  }

  /**
   * 全局分析：识别合同类型、结构和风险区域（使用非流式，因为需要JSON格式）
   * 这是分层审查的第一阶段
   */
  async analyzeGlobal(documentText, onProgress) {
    const config = this.getAIConfig()
    
    const systemMessage = {
      role: 'system',
      content: '你是一个专业的合同审查专家，擅长快速识别合同结构和潜在风险区域。请以JSON格式返回结果。'
    }

    const userMessage = {
      role: 'user',
      content: `请对以下合同进行全局分析，识别：
1. 合同类型和子类型
2. 主要章节结构
3. 潜在高风险区域（章节位置和风险等级）

合同内容：
${documentText.substring(0, 8000)}${documentText.length > 8000 ? '\n\n[内容已截断]' : ''}`
    }

    try {
      if (onProgress) {
        onProgress({ stage: '正在进行全局分析...', content: '' })
      }

      const response = await nonStreamChatCompletions({
        messages: [systemMessage, userMessage],
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
    
    return {
      issues: Array.isArray(result.issues) ? result.issues : [],
      risks: Array.isArray(result.risks) ? result.risks : []
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
      console.warn('直接解析失败，尝试清理...', firstError.message)
      
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
        console.error('清理后解析失败:', secondError.message)
        console.error('原始响应（前500字符）:', response.substring(0, 500))
        
        // 最后尝试：完全移除控制字符
        try {
          // eslint-disable-next-line no-control-regex
          const sanitized = response.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ' ').trim()
          
          const jsonMatch = sanitized.match(/(\{[\s\S]*\})/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[1])
          }
        } catch (finalError) {
          console.error('所有解析尝试均失败:', finalError.message)
        }
        
        return {}
      }
    }
  }
}

export const reviewAIService = new ReviewAIService()

