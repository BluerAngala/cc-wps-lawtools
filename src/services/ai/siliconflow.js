// SiliconFlow AI 调用管理
import axios from 'axios'
import contractElementsPrompt from './prompt/提取合同要素.txt?raw'
import {
  generateContractExtractionPrompt,
  validateExtractTags,
  generateContractReviewPrompt
} from './promptGenerator.js'
import { appConfig } from '../../utils/appConfig.js'

const aiConfig = appConfig.getAIConfig()

if (!aiConfig.apiKey || !aiConfig.baseUrl) {
  console.warn('AI API 未配置，请在设置页面配置')
}

const createApiClient = () => {
  const config = appConfig.getAIConfig()
  console.log('[API Client] 创建实例，Timeout:', config.timeout, 'ms')
  return axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    }
  })
}

export const reinitializeAIClient = () => {
  console.log('AI 客户端配置已更新（将在下次请求时生效）')
}

// 配置拦截器的辅助函数
const setupInterceptors = (client) => {
  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      console.log('发送请求:', config.method?.toUpperCase(), config.url)
      return config
    },
    (error) => {
      console.error('请求拦截器错误:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      console.log('收到响应:', response.status, response.config.url)
      return response
    },
    (error) => {
      console.error('响应拦截器错误:', error)

      // 统一错误处理
      if (error.response) {
        // 服务器返回错误状态码
        const { status, data } = error.response
        console.error(`HTTP ${status}:`, data)

        switch (status) {
          case 401:
            throw new Error('API 密钥无效或已过期，请在设置页面检查配置')
          case 403:
            // 检查是否是余额不足
            if (data?.code === 30011 || data?.message?.includes('insufficient') || data?.message?.includes('balance')) {
              throw new Error(`余额不足或模型需要付费。当前模型: ${data?.message?.match(/model[:\s]+([^\s,]+)/)?.[1] || '未知'}\n建议：1) 充值后继续使用 2) 在设置中更换免费模型`)
            }
            throw new Error('没有权限访问此 API，请检查 API 密钥权限')
          case 429:
            throw new Error('请求频率过高，请稍后重试')
          case 500:
            throw new Error('AI 服务器内部错误，请稍后重试')
          default:
            throw new Error(`请求失败 (${status}): ${data?.message || data?.error || '未知错误'}`)
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        if (error.code === 'ECONNABORTED') {
          throw new Error('请求超时，文档内容可能过长或网络较慢。建议：1) 检查网络连接 2) 减少提取标签数量 3) 在设置中增加超时时间')
        }
        throw new Error('网络连接失败，请检查：1) 网络是否连接 2) API地址是否正确 3) 是否需要代理')
      } else {
        // 请求配置错误
        throw new Error(`请求配置错误: ${error.message}`)
      }
    }
  )
  
  return client
}

/**
 * 流式调用 SiliconFlow AI（SSE）
 * @param {Object} params - 参数对象
 * @param {Array} params.messages - 消息数组
 * @param {string} params.model - 使用的模型名称
 * @param {Function} params.onChunk - 接收数据块的回调函数 (chunk: string) => void
 * @param {Function} params.onProgress - 接收进度信息的回调 ({stage: string, content: string}) => void
 * @param {Object} params.options - 其他选项（temperature, max_tokens, response_format等）
 * @returns {Promise<string>} 完整的响应内容
 */
async function streamChatCompletions({ messages, model, onChunk, onProgress, options = {} }) {
  const config = appConfig.getAIConfig()
  const currentModel = model || options.model || config.model || 'moonshotai/Kimi-K2-Instruct-0905'
  
  const requestBody = {
    model: currentModel,
    messages,
    stream: true,
    temperature: options.temperature !== undefined ? options.temperature : config.temperature,
    max_tokens: options.maxTokens || config.maxTokens
  }

  // 注意：JSON模式不支持流式输出，需要使用非流式
  if (options.response_format) {
    console.warn('检测到response_format，将使用非流式请求（JSON模式不支持流式）')
    return await nonStreamChatCompletions({ messages, model: currentModel, options })
  }

  console.log('=== 流式请求详情 ===')
  console.log('模型:', currentModel)
  console.log('API地址:', config.baseUrl)
  console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '未配置')
  console.log('Temperature:', requestBody.temperature)
  console.log('Max Tokens:', requestBody.max_tokens)
  console.log('Messages 数量:', messages.length)
  messages.forEach((msg, idx) => {
    console.log(`  Message ${idx + 1} [${msg.role}]:`, msg.content.substring(0, 100) + '...')
  })
  console.log('Messages 总长度:', messages.reduce((sum, m) => sum + (m.content?.length || 0), 0))
  console.log('==================')
  
  // 检查 API Key
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('API Key 未配置，请在设置页面配置 AI API Key')
  }

  try {
    if (onProgress) {
      onProgress({ stage: '正在连接AI服务...', content: '' })
    }

    console.log('[流式] 开始发送请求...')

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[流式] 收到响应:', response.status, response.statusText)

    if (!response.ok) {
      console.error('[流式] 请求失败:', response.status, response.statusText)
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.message || errorData.error || '请求失败'
      console.error('[流式] 错误详情:', errorData)
      
      // 统一错误处理
      if (response.status === 401) {
        throw new Error('API 密钥无效或已过期，请在设置页面检查配置')
      } else if (response.status === 429) {
        throw new Error('请求频率过高，请稍后重试')
      }
      throw new Error(`HTTP ${response.status}: ${errorMsg}`)
    }

    console.log('[流式] 开始读取响应流...')
    
    if (onProgress) {
      onProgress({ stage: '正在接收AI响应...', content: '' })
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''
    let chunkCount = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('[流式] 读取完成，共接收', chunkCount, '个数据块')
        break
      }

      chunkCount++
      if (chunkCount === 1) {
        console.log('[流式] 收到第一个数据块')
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            console.log('[流式] 收到结束标记 [DONE]')
            continue
          }

          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              if (onChunk) {
                onChunk(delta)
              }
              if (onProgress) {
                onProgress({ stage: '正在接收AI响应...', content: fullContent })
              }
            }
          } catch (e) {
            console.warn('[流式] 解析SSE数据失败:', e, '原始数据:', data.substring(0, 100))
          }
        }
      }
    }

    // 处理剩余的buffer
    if (buffer.trim()) {
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6)
        if (data !== '[DONE]') {
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              if (onChunk) {
                onChunk(delta)
              }
            }
          } catch (e) {
            console.warn('解析SSE数据失败:', e)
          }
        }
      }
    }

    console.log('[流式] 响应接收完成，总长度:', fullContent.length, '字符')

    if (onProgress) {
      onProgress({ stage: '响应接收完成', content: fullContent })
    }

    return fullContent
  } catch (error) {
    console.error('[流式] 调用失败:', error)
    console.error('[流式] 错误堆栈:', error.stack)
    throw error
  }
}

/**
 * 非流式调用 SiliconFlow AI（用于JSON模式等场景）
 * @param {Object} params - 参数对象
 * @param {Array} params.messages - 消息数组
 * @param {string} params.model - 使用的模型名称
 * @param {Object} params.options - 其他选项（temperature, max_tokens, response_format等）
 * @returns {Promise<string>} 完整的响应内容
 */
async function nonStreamChatCompletions({ messages, model, options = {} }) {
  const config = appConfig.getAIConfig()
  const currentModel = model || options.model || config.model || 'moonshotai/Kimi-K2-Instruct-0905'
  
  const requestBody = {
    model: currentModel,
    messages,
    stream: false,
    temperature: options.temperature !== undefined ? options.temperature : config.temperature,
    max_tokens: options.maxTokens || config.maxTokens
  }

  if (options.response_format) {
    requestBody.response_format = options.response_format
  }

  console.log('========== 非流式请求详情 ==========')
  console.log('🌐 API地址:', config.baseUrl)
  console.log('🔑 API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '未配置')
  console.log('🤖 模型:', currentModel)
  console.log('🌡️ Temperature:', requestBody.temperature)
  console.log('📏 Max Tokens:', requestBody.max_tokens)
  console.log('⏱️ Timeout:', config.timeout, 'ms')
  console.log('📨 Messages 数量:', messages.length)
  messages.forEach((msg, idx) => {
    console.log(`  📝 Message ${idx + 1} [${msg.role}]:`)
    console.log(`     长度: ${msg.content?.length || 0} 字符`)
    console.log(`     前200字符: ${(msg.content || '').substring(0, 200)}...`)
  })
  console.log('📊 Messages 总长度:', messages.reduce((sum, m) => sum + (m.content?.length || 0), 0), '字符')
  console.log('🎯 Response Format:', options.response_format ? JSON.stringify(options.response_format) : '无')
  console.log('📦 完整请求体:', JSON.stringify(requestBody, null, 2).substring(0, 1000) + '...')
  console.log('=====================================')

  const startTime = Date.now()
  try {
    console.log('⏳ 开始发送请求...', new Date().toLocaleTimeString())
    
    // 每次请求时创建新的客户端实例（使用最新配置）
    const apiClient = setupInterceptors(createApiClient())
    const response = await apiClient.post('/chat/completions', requestBody)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('========== 非流式响应详情 ==========')
    console.log('✅ 请求成功!')
    console.log('⏱️ 耗时:', duration, 'ms (', (duration / 1000).toFixed(2), '秒)')
    console.log('📊 响应状态:', response.status, response.statusText)
    console.log('📦 完整响应数据:', JSON.stringify(response.data, null, 2).substring(0, 2000) + '...')
    console.log('📝 响应内容长度:', response.data.choices?.[0]?.message?.content?.length || 0, '字符')
    console.log('📝 响应内容 (前500字符):', (response.data.choices?.[0]?.message?.content || '').substring(0, 500))
    console.log('💰 Token使用情况:', response.data.usage || '无')
    console.log('=====================================')
    
    return response.data.choices[0].message.content
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.error('========== 非流式请求失败 ==========')
    console.error('❌ 错误类型:', error.name)
    console.error('❌ 错误代码:', error.code)
    console.error('❌ 错误消息:', error.message)
    console.error('⏱️ 失败前耗时:', duration, 'ms (', (duration / 1000).toFixed(2), '秒)')
    
    if (error.response) {
      console.error('📊 响应状态:', error.response.status, error.response.statusText)
      console.error('📦 响应数据:', JSON.stringify(error.response.data, null, 2))
      console.error('📋 响应头:', JSON.stringify(error.response.headers, null, 2))
    } else if (error.request) {
      console.error('📨 请求已发送但无响应')
      console.error('📦 请求详情:', error.request)
    } else {
      console.error('⚙️ 请求配置错误:', error.config)
    }
    
    console.error('📚 完整错误堆栈:', error.stack)
    console.error('=====================================')
    
    throw error
  }
}

/**
 * 调用 SiliconFlow AI 处理文档内容（非流式，保持向后兼容）
 * @param {Object} params - 参数对象
 * @param {string} params.content - 要处理的文档内容
 * @param {string} params.model - 使用的模型名称，默认从配置读取
 * @returns {Promise<string>} AI 处理后的结果
 */
async function processDocumentContent({ content, model }) {
  const config = appConfig.getAIConfig()
  const currentModel = model || config.model || 'moonshotai/Kimi-K2-Instruct-0905'
  
  try {
    const apiClient = setupInterceptors(createApiClient())
    const response = await apiClient.post('/chat/completions', {
      model: currentModel,
      messages: [
        {
          role: 'user',
          content: content
        }
      ]
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('调用 SiliconFlow AI 时出错:', error)
    throw error
  }
}

/**
 * 识别合同要素（支持动态提取标签）
 * @param {Object} params - 参数对象
 * @param {string} params.content - 要处理的文档内容
 * @param {Array<string>} params.extractTags - 要提取的标签数组（可选）
 * @param {string} params.model - 使用的模型名称，默认从配置读取
 * @returns {Promise<string>} AI 处理后的结果
 */
async function processContractElements({
  content,
  extractTags,
  model
}) {
  const config = appConfig.getAIConfig()
  const currentModel = model || config.model || 'moonshotai/Kimi-K2-Instruct-0905'
  
  try {
    let promptContent

    // 如果提供了自定义提取标签，使用动态生成的提示词
    if (extractTags && extractTags.length > 0) {
      // 验证提取标签
      const validation = validateExtractTags(extractTags)
      if (!validation.isValid) {
        throw new Error(`提取标签验证失败: ${validation.errors.join(', ')}`)
      }

      // 输出警告信息
      if (validation.warnings.length > 0) {
        console.warn('提取标签警告:', validation.warnings.join(', '))
      }

      console.log('使用动态提示词，提取标签:', extractTags)
      promptContent = generateContractExtractionPrompt(extractTags, content)
    } else {
      // 使用默认的固定提示词
      console.log('使用默认提示词')
      promptContent = contractElementsPrompt.replace('{{input}}', content)
    }

    const apiClient = setupInterceptors(createApiClient())
    const response = await apiClient.post('/chat/completions', {
      model: currentModel,
      messages: [
        {
          role: 'system',
          content: promptContent
        }
      ]
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('处理合同要素时出错:', error)
    throw error
  }
}

/**
 * 文档结构分析处理
 * @param {Object} params - 参数对象
 * @param {string} params.content - 要分析的文档内容
 * @param {string} params.model - 使用的模型名称
 * @returns {Promise<string>} AI 处理后的结果
 */
async function processDocumentStructure({ content, model = 'moonshotai/Kimi-K2-Instruct-0905' }) {
  try {
    const promptContent = `请分析以下文档的内容结构，提取出所有的一级标题、二级标题、三级标题。

要求：
1. 识别文档中的标题层级结构
2. 按照层级分类列出所有标题
3. 如果没有明确的标题格式，请根据内容语义和格式特征推断标题
4. 输出格式如下：

一级标题
二级标题

---

一级标题
二级标题

直接显示标题内容，不需要前缀。
如果某个层级没有标题，则不显示该层级。

文档内容：
${content}`

    const apiClient = setupInterceptors(createApiClient())
    const response = await apiClient.post('/chat/completions', {
      model: model,
      messages: [
        {
          role: 'user',
          content: promptContent
        }
      ]
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('处理文档结构分析时出错:', error)
    throw error
  }
}

/**
 * 合同预审处理
 * @param {Object} params - 参数对象
 * @param {string} params.content - 要审查的合同内容
 * @param {Array|string} params.reviewRules - 规则数组或单个规则
 * @param {string} params.reviewRequirements - 审查要求（兼容旧格式）
 * @param {string} params.actionType - 执行动作类型（兼容旧格式）
 * @param {string} params.model - 使用的模型名称
 * @returns {Promise<string>} AI 处理后的结果
 */
async function processContractReview({
  content,
  reviewRules,
  reviewRequirements,
  actionType,
  model = 'moonshotai/Kimi-K2-Instruct-0905'
}) {
  try {
    let promptContent

    // 处理新的规则数组格式
    if (Array.isArray(reviewRules)) {
      // 合并所有规则为一个综合提示词
      const allRules = reviewRules
        .map(
          (rule, index) =>
            `规则${index + 1}: ${rule.reviewRules}`
        )
        .join('\n')

      const allRequirements = reviewRules
        .map(
          (rule, index) =>
            `规则${index + 1}的审查要求: ${rule.reviewRequirements}`
        )
        .join('\n')

      const actionType = reviewRules[0]?.actionType || '批注'
      promptContent = generateContractReviewPrompt(allRules, allRequirements, actionType).replace(
        '{{input}}',
        content
      )
    } else {
      // 兼容旧的单规则格式
      promptContent = generateContractReviewPrompt(
        reviewRules,
        reviewRequirements,
        actionType
      ).replace('{{input}}', content)
    }

    console.log('合同预审提示词:', promptContent)

    const apiClient = setupInterceptors(createApiClient())
    const response = await apiClient.post('/chat/completions', {
      model: model,
      messages: [
        {
          role: 'user',
          content: promptContent
        }
      ]
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('处理合同预审时出错:', error)
    throw error
  }
}

/**
 * 获取可用的模型列表
 * @returns {Promise<Array>} 可用模型列表
 * @throws {Error} 当 API 请求失败时抛出错误
 */
async function getAvailableModels() {
  const config = appConfig.getAIConfig()

  // 检查 API Key 是否配置
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('API Key 未配置，请先填写 API Key')
  }

  try {
    const response = await axios.get(`${config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      },
      timeout: 10000
    })

    // 过滤并排序模型列表
    const models = response.data.data || []

    // 推荐的模型顺序（速度快、适合法律文档）
    const recommendedModels = [
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
      'Qwen/Qwen2.5-32B-Instruct',
      'Qwen/Qwen2.5-72B-Instruct',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Pro/THUDM/glm-4-9b-chat',
      'THUDM/glm-4-9b-chat',
      'meta-llama/Llama-3.3-70B-Instruct',
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'meta-llama/Meta-Llama-3.1-405B-Instruct'
    ]

    // 按推荐顺序排序
    const sortedModels = models.sort((a, b) => {
      const indexA = recommendedModels.indexOf(a.id)
      const indexB = recommendedModels.indexOf(b.id)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    console.log('获取到模型列表:', sortedModels.length, '个模型')
    return sortedModels
  } catch (error) {
    console.error('获取模型列表时出错:', error)

    // 根据错误类型提供更有意义的错误信息
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          throw new Error('API Key 无效或已过期，请检查配置')
        case 403:
          throw new Error('没有权限访问此 API，请检查 API Key 权限')
        case 429:
          throw new Error('请求频率过高，请稍后重试')
        case 500:
          throw new Error('AI 服务器内部错误，请稍后重试')
        default:
          throw new Error(`请求失败 (${status}): ${data?.message || data?.error || '未知错误'}`)
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接')
      }
      throw new Error('网络连接失败，请检查 API 地址是否正确')
    }

    // 重新抛出原始错误
    throw error
  }
}

// 测试
async function test() {
  const res = await fetch('https://env-00jxgx7alqyz.dev-hz.cloudbasefunction.cn/test_kdocs', {
    method: 'get'
  })
  console.log(res)
  return res
}

export {
  streamChatCompletions,
  nonStreamChatCompletions,
  processDocumentContent,
  processContractElements,
  processContractReview,
  processDocumentStructure,
  getAvailableModels,
  test
}
