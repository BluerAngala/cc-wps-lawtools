// 金山文档接口转发工具
import axios from 'axios'
import { appConfig } from '../../utils/appConfig.js'

// 获取金山文档配置
const getKdocsConfig = () => {
  const config = appConfig.get('kdocs')
  return {
    webhookUrl: config.webhookUrl || import.meta.env.VITE_KDOCS_WEBHOOK_URL,
    token: config.token || import.meta.env.VITE_KDOCS_TOKEN,
    sheetId: config.sheetId || Number(import.meta.env.VITE_KDOCS_SHEETID) || 5,
    apiUrl: import.meta.env.DEV 
      ? '/api/kdocs' 
      : (config.apiUrl || import.meta.env.VITE_KDOCS_API_URL || 'https://env-00jxg9mus2ok.dev-hz.cloudbasefunction.cn/wps-kdocs')
  }
}

/**
 * 金山文档操作接口
 * @param {Object} options - 请求参数
 * @param {string} options.webhookUrl - 金山文档webhook地址
 * @param {string} options.token - 金山文档访问令牌
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
 *   webhookUrl: 'https://www.kdocs.cn/api/v3/ide/file/xxx/script/xxx/sync_task',
 *   token: '3ni99kXAPkxxxx',
 *   type: 'createRecords',
 *   recordID: "",

 *   sheetID: 1,
 *   inputData: [
 *     {
 *       fields: {
 *         "备注": "合同名称",
 *         "状态": "待处理"
 *       }
 *     }
 *   ]
 * })
 */
async function kdocsHandler({
  type,
  recordID,
  sheetID,
  inputData,
  isAsync = false
}) {
  // 动态获取最新配置
  const config = getKdocsConfig()
  const currentWebhookUrl = config.webhookUrl
  const currentToken = config.token
  
  if (!currentWebhookUrl || !currentToken || !type || !sheetID || !inputData) {
    throw new Error('webhookUrl、token、type、sheetID、inputData不能为空，请在设置页面配置')
  }


  const requestData = JSON.stringify({
    webhookUrl: currentWebhookUrl,
    token: currentToken,
    type,
    sheetID,
    inputData,
    isAsync,
    ...(recordID && { recordID }),
  });

  try {
    const config = getKdocsConfig()
    const response = await axios.post(config.apiUrl, requestData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    })
    
    console.log('金山文档操作成功')
    return response.data
    
  } catch (error) {
    console.error('金山文档操作失败:', error.message)
    throw new Error('金山文档服务暂时不可用，请稍后重试')
  }
}

export { kdocsHandler }
