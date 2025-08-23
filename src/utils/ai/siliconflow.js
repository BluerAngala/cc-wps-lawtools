// SiliconFlow AI 调用管理
import axios from 'axios'
import contractElementsPrompt from './prompt/提取合同要素.txt?raw'
import { generateContractExtractionPrompt, validateExtractTags } from './promptGenerator.js'

// 替换为你的 SiliconFlow API 密钥
const API_KEY = import.meta.env.VITE_AI_API_KEY

// SiliconFlow API 的基础 URL
const BASE_URL = import.meta.env.VITE_AI_API_BASE_URL

if (!API_KEY || !BASE_URL) {
  throw new Error('SiliconFlow API 密钥或基础 URL 未配置')
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
})

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
          throw new Error('API 密钥无效或已过期')
        case 403:
          throw new Error('没有权限访问此 API')
        case 429:
          throw new Error('请求频率过高，请稍后重试')
        case 500:
          throw new Error('服务器内部错误')
        default:
          throw new Error(`请求失败: ${status} - ${data?.message || '未知错误'}`)
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      throw new Error('网络连接失败，请检查网络设置')
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
async function processContractElements({ content, extractTags, model = 'deepseek-ai/DeepSeek-V3' }) {
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
  getAvailableModels, 
  apiClient,
  test
}
