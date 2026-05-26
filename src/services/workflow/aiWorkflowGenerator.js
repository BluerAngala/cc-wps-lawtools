/**
 * AI 工作流生成器
 * 将用户自然语言描述转换为可执行的工作流配置
 */

import { actionRegistry } from './actionRegistry.js'
import { nonStreamChatCompletions } from '../ai/siliconflow.js'

/**
 * AI 工作流生成器类
 */
class AIWorkflowGenerator {
  /**
   * 获取所有可用操作的描述信息
   * @returns {Array} 操作信息数组
   */
  getAvailableActions() {
    const actions = actionRegistry.list()
    return actions.map((action) => {
      const schema = action.getSchema()
      const params = {}

      // 提取参数信息
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          // 跳过 function 类型
          if (prop.type === 'function') return

          params[key] = {
            type: prop.type,
            title: prop.title || key,
            description: prop.description || '',
            default: prop.default,
            enum: prop.enum,
            enumLabels: prop.enumLabels
          }
        })
      }

      return {
        type: action.type,
        name: action.name,
        description: action.description,
        icon: action.icon,
        params,
        required: schema.required || []
      }
    })
  }

  /**
   * 构建 AI 提示词
   * @param {string} userInput - 用户输入的自然语言描述
   * @returns {string} 完整的提示词
   */
  buildPrompt(userInput) {
    const actions = this.getAvailableActions()

    // 构建操作列表描述
    const actionsDescription = actions
      .map((action) => {
        let desc = `- **${action.type}** (${action.name}): ${action.description}`

        // 添加参数说明
        const paramKeys = Object.keys(action.params)
        if (paramKeys.length > 0) {
          const paramDescs = paramKeys.map((key) => {
            const p = action.params[key]
            let paramStr = `    - ${key}: ${p.title}`
            if (p.enum) {
              paramStr += ` (可选值: ${p.enum.join(', ')})`
            }
            if (p.default !== undefined) {
              paramStr += ` [默认: ${p.default}]`
            }
            return paramStr
          })
          desc += '\n  参数:\n' + paramDescs.join('\n')
        }

        return desc
      })
      .join('\n\n')

    return `你是一个工作流配置助手。根据用户的自然语言描述，生成对应的工作流步骤配置。

## 可用操作列表

${actionsDescription}

## 输出要求

请根据用户描述，生成一个 JSON 格式的工作流配置。格式如下：

\`\`\`json
{
  "steps": [
    {
      "actionType": "操作类型（必须是上面列表中的 type）",
      "name": "步骤名称（可自定义，简短描述）",
      "params": {
        "参数名": "参数值"
      }
    }
  ],
  "explanation": "简要说明生成的工作流做了什么"
}
\`\`\`

## 规则

1. actionType 必须是上面列表中存在的操作类型，不要编造
2. params 中的参数值必须符合参数定义（类型、枚举值等）
3. 如果用户没有明确指定某个参数，使用默认值或合理推断
4. 如果用户的需求无法用现有操作实现，在 explanation 中说明
5. 步骤顺序要合理，比如需要先读取文档才能进行其他操作
6. 只返回 JSON，不要包含其他文字

## 用户需求

${userInput}`
  }

  /**
   * 解析 AI 响应
   * @param {string} response - AI 返回的响应
   * @returns {Object} 解析后的工作流配置
   */
  parseResponse(response) {
    // 尝试提取 JSON
    let jsonStr = response.trim()

    // 移除可能的 markdown 代码块标记
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    try {
      const result = JSON.parse(jsonStr)

      if (!result.steps || !Array.isArray(result.steps)) {
        throw new Error('响应格式错误：缺少 steps 数组')
      }

      return result
    } catch (error) {
      console.error('解析 AI 响应失败:', error, '原始响应:', response)
      throw new Error(`解析失败: ${error.message}`)
    }
  }

  /**
   * 验证生成的工作流
   * @param {Array} steps - 步骤数组
   * @returns {Object} 验证结果 { valid, errors, warnings, validSteps }
   */
  validateWorkflow(steps) {
    const errors = []
    const warnings = []
    const validSteps = []

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepNum = i + 1

      // 检查 actionType 是否存在
      if (!step.actionType) {
        errors.push(`步骤 ${stepNum}: 缺少 actionType`)
        continue
      }

      const action = actionRegistry.get(step.actionType)
      if (!action) {
        errors.push(`步骤 ${stepNum}: 未知的操作类型 "${step.actionType}"`)
        continue
      }

      // 验证参数
      const schema = action.getSchema()
      const params = step.params || {}

      // 检查必填参数
      if (schema.required) {
        for (const field of schema.required) {
          if (params[field] === undefined || params[field] === null || params[field] === '') {
            const prop = schema.properties?.[field]
            warnings.push(
              `步骤 ${stepNum} (${action.name}): 缺少必填参数 "${prop?.title || field}"，将使用默认值`
            )
          }
        }
      }

      // 验证枚举值
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (prop.enum && params[key] !== undefined) {
            if (!prop.enum.includes(params[key])) {
              warnings.push(
                `步骤 ${stepNum} (${action.name}): 参数 "${key}" 的值 "${params[key]}" 不在允许范围内，将使用默认值`
              )
              // 使用默认值
              if (prop.default !== undefined) {
                params[key] = prop.default
              } else {
                params[key] = prop.enum[0]
              }
            }
          }
        }
      }

      // 补充默认参数
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (params[key] === undefined && prop.default !== undefined) {
            params[key] = prop.default
          }
        }
      }

      validSteps.push({
        actionType: step.actionType,
        name: step.name || action.name,
        params
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validSteps
    }
  }

  /**
   * 根据自然语言生成工作流
   * @param {string} userInput - 用户输入的自然语言描述
   * @param {Object} options - 选项
   * @param {Function} options.onProgress - 进度回调
   * @returns {Promise<Object>} 生成的工作流 { steps, explanation, validation }
   */
  async generate(userInput, options = {}) {
    if (!userInput || !userInput.trim()) {
      throw new Error('请输入工作流描述')
    }

    const { onProgress } = options

    try {
      // 构建提示词
      if (onProgress) onProgress({ stage: '正在分析需求...' })
      const prompt = this.buildPrompt(userInput.trim())

      // 调用 AI
      if (onProgress) onProgress({ stage: '正在生成工作流...' })
      const response = await nonStreamChatCompletions({
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: 0.1,
          maxTokens: 2000
        }
      })

      // 解析响应
      if (onProgress) onProgress({ stage: '正在解析结果...' })
      const parsed = this.parseResponse(response)

      // 验证工作流
      if (onProgress) onProgress({ stage: '正在验证配置...' })
      const validation = this.validateWorkflow(parsed.steps)

      return {
        steps: validation.validSteps,
        explanation: parsed.explanation || '',
        validation
      }
    } catch (error) {
      console.error('生成工作流失败:', error)
      throw error
    }
  }
}

// 导出单例
export const aiWorkflowGenerator = new AIWorkflowGenerator()

export { AIWorkflowGenerator }
