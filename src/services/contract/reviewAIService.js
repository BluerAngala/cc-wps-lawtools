/**
 * 合同审查AI服务
 * 提供合同类型识别、条款审查等功能
 */

import { TaskScheduler } from '../ai/TaskScheduler.js'

export class ReviewAIService {
  constructor() {
    this.taskScheduler = new TaskScheduler()
  }

  /**
   * 识别合同类型
   */
  async identifyContractType(documentText) {
    const prompt = `你是一个专业的合同审查专家。请识别以下合同的类型。

## 合同内容
${documentText.substring(0, 5000)}${documentText.length > 5000 ? '\n\n[内容已截断]' : ''}

## 输出格式
请以JSON格式返回：
{
  "type": "合同类型（如：买卖合同、服务合同、租赁合同等）",
  "subtype": "子类型（可选，如：技术服务合同、房屋租赁合同等）",
  "confidence": "置信度（high|medium|low）"
}

请直接返回JSON，不要包含其他内容。`

    try {
      const response = await this.taskScheduler.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 500,
        timeout: 120000
      })

      const result = this.parseJSONResponse(response)
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
   * 审查条款（带完整上下文）
   */
  async reviewClause(context, contractType, options = {}) {
    const prompt = this.buildReviewPrompt(context, contractType, options)

    try {
      console.log(`[AI审查] 审查条款: ${context.segmentPosition?.section || '未知'}`)
      console.log(`[AI审查] Prompt长度: ${prompt.length}字符`)

      const response = await this.taskScheduler.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 2000,
        timeout: 120000
      })

      console.log(`[AI审查] 响应长度: ${response.length}字符`)
      console.log(`[AI审查] 响应内容:`, response)

      const result = this.parseResponse(response)
      console.log(`[AI审查] 解析结果:`, JSON.stringify(result, null, 2))

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
   * 构建审查提示词（关键：包含完整上下文和审查清单）
   */
  buildReviewPrompt(context, contractType) {
    // 构建审查清单部分
    const checklistText = context.checklist && context.checklist.length > 0
      ? this.formatChecklist(context.checklist)
      : ''

    return `你是一个专业的合同审查专家。请审查以下合同中的特定条款。

## 合同类型
${contractType.type}${contractType.subtype ? ` (${contractType.subtype})` : ''}

## 当前审查的条款
**章节：** ${context.segmentPosition?.section || '未知'}
**内容：**
${context.currentSegment}

## 完整合同上下文
（以下为完整合同内容，用于理解上下文和条款间关系）
${context.fullDocument.substring(0, 15000)}${context.fullDocument.length > 15000 ? '\n\n[内容已截断]' : ''}

${checklistText ? `## 审查清单
请重点审查以下条款（按优先级）：
${checklistText}

**审查要求：**
1. 对于"必需"条款，必须检查是否存在、是否完整
2. 对于"高优先级"条款，必须进行深度审查
3. 对于用户自定义规则，必须严格按照要求审查
4. 如果条款缺失或不完整，必须指出问题
5. 如果条款存在但有问题，必须指出具体问题

` : ''}## 审查要求
1. 基于完整合同上下文，审查当前条款
2. 检查条款是否完整、明确
3. 检查条款是否存在法律风险
4. 检查条款是否与合同其他部分一致
5. 检查条款是否合理、公平
${checklistText ? '6. **严格按照审查清单进行审查**，确保不遗漏关键条款' : ''}

## 重要提示
- **必须基于完整合同上下文进行审查**，不要只看当前条款
${checklistText ? '- **必须按照审查清单逐项检查**，确保不遗漏关键条款' : ''}
- **keyword字段**：必须是从当前条款中提取的实际文本片段（至少3-15个字符）
- **position字段**：必须准确标注章节号（如"第六条"、"第七条"等）
- **keyword必须与position匹配**：如果position是"第十条"，keyword必须是从第十条中提取的文本
- **只做批注，不做修订**

## 输出格式
请以JSON格式返回审查结果：
{
  "issues": [
    {
      "keyword": "当前条款中的实际文本片段（用于定位）",
      "comment": "问题描述和建议",
      "position": "${context.segmentPosition?.section || '未知'}",
      "severity": "high|medium|low"
    }
  ],
  "risks": [
    {
      "description": "风险描述",
      "severity": "high|medium|low",
      "suggestion": "风险控制建议"
    }
  ]
}

请直接返回JSON，不要包含其他内容。`
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
   * 解析JSON响应（处理代码块、纯JSON等格式）
   */
  parseJSONResponse(response) {
    if (!response) {
      return {}
    }

    // 尝试提取JSON（可能在代码块中）
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                     response.match(/(\{[\s\S]*\})/)

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch (error) {
        console.error('JSON解析失败:', error)
      }
    }

    // 尝试直接解析
    try {
      return JSON.parse(response)
    } catch (error) {
      console.error('直接解析JSON失败:', error)
      return {}
    }
  }
}

export const reviewAIService = new ReviewAIService()

