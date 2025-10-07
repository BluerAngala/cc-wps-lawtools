// 跟金山文档的交互

// SiliconFlow AI 调用管理
import axios from 'axios'

//金山文档 webhookUrl
// const webhookUrl ='https://www.kdocs.cn/api/v3/ide/file/cioWOLlut07T/script/V2-100H1lzYx1IndTaqK66HJZ'
const webhookUrl = import.meta.env.VITE_KDOCS_WEBHOOK_URL

//金山文档 token
// const token = '3ni99kXAPkCVPWaL2El0ZC'
const token = import.meta.env.VITE_KDOCS_TOKEN

// 金山文档的表id
// const sheetID = 5
const sheetID = import.meta.env.VITE_KDOCS_SHEETID

if (!webhookUrl || !token || !sheetID) {
  throw new Error('金山文档 webhookUrl 或 token 或 sheetID 未配置')
}

// 直接连接金山文档
const baseURL = webhookUrl

// 创建 axios 实例
const apiClient = axios.create({
  baseURL,
  timeout: 60000, // 60秒超时
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'AirScript-Token': token,
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
 * 与金山文档交互
 * @param {Object} options - 参数对象
 * @param {string} options.type - 类型
 * @param {number} options.sheetID - 表格ID
 * @param {string} options.recordID - 记录ID
 * @param {Array} options.input - 要操作处理的数据
 * @param {boolean} options.isAsync - 是否异步执行，默认为 false
 * @returns {Promise<Array>} 添加结果
 */
async function kdocsHandler(options) {
  const { type, sheetID, recordID, inputData, isAsync = false } = options
  try {
    if (!type || !sheetID || !inputData) {
      throw new Error('type 或 sheetID 或 inputData 不能为空')
    }
    let argv = {}

    if (recordID) {
      argv.recordID = recordID
    }

    const data = JSON.stringify({
      Context: {
        argv: {
          type,
          sheetID,
          data: inputData
        }
      }
    })

    // 是否异步执行
    if (isAsync) {
      const response = await apiClient.post('', data)
      const payload = response?.data
      console.log('KDocs响应体(异步):', payload)
      if (payload?.error) {
        throw new Error(payload?.error_details?.msg || payload.error)
      }
      const result = payload?.data?.result ?? payload?.result ?? payload
      return result
    } else {
      const response = await apiClient.post('/sync_task', data)
      const payload = response?.data
      console.log('KDocs响应体(同步):', payload)
      if (payload?.error) {
        throw new Error(payload?.error_details?.msg || payload.error)
      }
      const result = payload?.data?.result ?? payload?.result ?? payload
      return result
    }
  } catch (error) {
    console.error('添加数据失败:', error)
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

// 测试新增数据
// 根据需要调整参数，type 为 createRecords 或 updateRecords
// 根据需要可以添加 recordID ,注意recordID 可以在sheeid同级别,也可以在inputData中,具体看接口文档
// 接口文档：https://365.kdocs.cn/l/ctzsgDlAGF0l

// 测试
// kdocsHandler({
//   type: 'updateRecords',
//   sheetID: sheetID,
//   inputData: [
//     {
//       id: 'CA7',
//       fields: {
//         合同名称: '测试合同名称'
//       }
//     }
//   ]
// })
//   .then((res) => {
//     console.log(JSON.stringify(res, null, 2))
//   })
//   .catch((err) => {
//     console.log(err)
//   })

// 导出
export { kdocsHandler, test }
