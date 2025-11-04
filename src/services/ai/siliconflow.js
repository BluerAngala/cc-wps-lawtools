// SiliconFlow AI 调用管理
import axios from 'axios'
import contractElementsPrompt from './prompt/提取合同要素.txt?raw'
import {
  generateContractExtractionPrompt,
  validateExtractTags,
  generateContractReviewPrompt
} from './promptGenerator.js'
import { appConfig } from '../../utils/appConfig.js'

// 获取 AI 配置（优先使用统一配置，回退到环境变量）
const getAIConfig = () => {
  const config = appConfig.get('ai')
  return {
    apiKey: config.apiKey || import.meta.env.VITE_AI_API_KEY,
    baseUrl: config.baseUrl || import.meta.env.VITE_AI_API_BASE_URL,
    timeout: config.timeout || 30000
  }
}

const aiConfig = getAIConfig()

if (!aiConfig.apiKey || !aiConfig.baseUrl) {
  console.warn('AI API 未配置，请在设置页面配置')
}

// 创建 axios 实例
const createApiClient = () => {
  const config = getAIConfig()
  return axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    }
  })
}

let apiClient = createApiClient()

// 提供重新初始化方法（配置更新后调用）
export const reinitializeAIClient = () => {
  apiClient = createApiClient()
  console.log('AI 客户端已重新初始化')
}

// 请求拦截器
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
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

/**
 * 调用 SiliconFlow AI 处理文档内容
 * @param {Object} params - 参数对象
 * @param {string} params.content - 要处理的文档内容
 * @param {string} params.model - 使用的模型名称，默认为 'deepseek-ai/DeepSeek-V3'
 * @returns {Promise<string>} AI 处理后的结果
 * @returns {Promise<string>} AI 处理后的结果
 */
async function processDocumentContent({ content, model = 'deepseek-ai/DeepSeek-V3' }) {
  try {
    const response = await apiClient.post('/chat/completions', {
      model: model,
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
 * @param {string} params.model - 使用的模型名称
 * @returns {Promise<string>} AI 处理后的结果
 */
async function processContractElements({
  content,
  extractTags,
  model = 'deepseek-ai/DeepSeek-V3'
}) {
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

    const response = await apiClient.post('/chat/completions', {
      model: model,
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
async function processDocumentStructure({ content, model = 'deepseek-ai/DeepSeek-V3' }) {
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
  model = 'deepseek-ai/DeepSeek-V3'
}) {
  try {
    let promptContent

    // 处理新的规则数组格式
    if (Array.isArray(reviewRules)) {
      // 合并所有规则为一个综合提示词
      const allRules = reviewRules
        .map(
          (rule, index) =>
            `## 规则${index + 1}: ${rule.reviewRules}\n审查要求: ${rule.reviewRequirements}\n执行动作: ${rule.actionType}`
        )
        .join('\n\n')

      const actionType = reviewRules[0]?.actionType || '批注'
      promptContent = generateContractReviewPrompt('综合预审规则', allRules, actionType).replace(
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
 */
async function getAvailableModels() {
  try {
    const response = await apiClient.get('/models')
    return response.data.data || []
  } catch (error) {
    console.error('获取模型列表时出错:', error)
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
  processDocumentContent,
  processContractElements,
  processContractReview,
  processDocumentStructure,
  getAvailableModels,
  apiClient,
  test
}
