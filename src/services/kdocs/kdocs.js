// 金山文档接口 - 使用 Coze 工作流
import axios from 'axios'
import { appConfig } from '../../utils/appConfig.js'

// 获取金山文档配置
const getKdocsConfig = () => {
  const config = appConfig.get('kdocs') || {}
  return {
    webhookUrl: config.webhookUrl || '',
    token: config.token || '',
    sheetId: config.sheetId || 5,
    cozeApiKey: config.cozeApiKey || '',
    workflowId: config.workflowId || ''
  }
}

/**
 * 金山文档操作接口（通过 Coze 工作流）
 * @param {Object} options - 请求参数
 * @param {string} options.type - 操作类型，如 'createRecords'、'updateRecords'、'deleteRecords'
 * @param {number} options.sheetID - 表格ID，指定要操作的工作表
 * @param {Array<Object>} options.inputData - 输入数据数组
 * @param {Object} options.inputData[].fields - 字段数据对象，键为字段名，值为字段值
 * @param {string} [options.inputData[].id] - 记录ID，更新或删除操作时需要
 * @param {boolean} [options.isAsync=false] - 是否异步执行
 * @returns {Promise<Object>} 操作结果
 * @example
 * // 创建记录
 * await kdocsHandler({
 *   type: 'createRecords',
 *   sheetID: 5,
 *   inputData: [
 *     {
 *       fields: {
 *         "合同名称": "合同名称",
 *         "状态": "待处理"
 *       }
 *     }
 *   ]
 * })
 */
async function kdocsHandler({ type, recordID, sheetID, inputData, isAsync = false }) {
  // 动态获取最新配置
  const config = getKdocsConfig()
  const { webhookUrl, token, cozeApiKey, workflowId } = config

  if (!webhookUrl || !token || !cozeApiKey || !workflowId) {
    throw new Error('webhookUrl、token、cozeApiKey、workflowId不能为空，请在设置页面配置')
  }

  if (!type || !sheetID || !inputData) {
    throw new Error('type、sheetID、inputData不能为空')
  }

  // 构建 Coze 工作流请求数据
  const requestData = {
    parameters: {
      data: {
        Context: {
          argv: {
            data: inputData,
            sheetID: sheetID,
            type: type,
            ...(recordID && { recordID })
          }
        }
      },
      token: token,
      webhook: webhookUrl
    },
    workflow_id: workflowId,
    is_async: isAsync
  }

  try {
    const response = await axios.post('https://api.coze.cn/v1/workflow/run', requestData, {
      headers: {
        Authorization: `Bearer ${cozeApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    // 解析响应数据（data 字段是字符串，需要解析）
    let result = { ...response.data }
    let parsedData = null

    if (result.data && typeof result.data === 'string') {
      try {
        parsedData = JSON.parse(result.data)
      } catch (e) {
        console.warn('解析响应 data 字段失败:', e)
      }
    }

    // 如果解析成功，将解析后的数据合并到结果中
    // 新结构：output.data.result，需要解析 parsedData.data.result
    if (parsedData) {
      // 检查是否有错误
      if (parsedData.error) {
        console.error('Coze 工作流执行错误:', parsedData.error)
        throw new Error(`工作流执行失败: ${parsedData.error}`)
      }

      // 尝试获取 result（新结构：data.result）
      const resultData = parsedData.data?.result || parsedData.result
      if (resultData) {
        result.data = resultData
        result.result = resultData
      }
    }

    console.log('金山文档操作成功')
    return {
      ...result,
      _requestInfo: {
        url: 'https://api.coze.cn/v1/workflow/run',
        requestData: requestData,
        method: 'POST',
        headers: {
          Authorization: `Bearer ***`,
          'Content-Type': 'application/json'
        }
      }
    }
  } catch (error) {
    console.error('金山文档操作失败:', error.message)
    if (error.response) {
      console.error('响应错误:', error.response.data)
      throw new Error(error.response.data?.msg || '金山文档服务暂时不可用，请稍后重试')
    }
    throw new Error('金山文档服务暂时不可用，请稍后重试')
  }
}

export { kdocsHandler }
