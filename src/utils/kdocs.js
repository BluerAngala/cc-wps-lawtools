// 金山文档接口转发工具
import axios from 'axios'

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
  webhookUrl,
  token,
  type,
  recordID,
  sheetID,
  inputData,
  isAsync = false
}) {
  
  if (!webhookUrl || !token || !type || !sheetID || !inputData) {
    throw new Error('webhookUrl、token、type、sheetID、inputData不能为空')
  }


  const requestData = JSON.stringify({
    Context: {
      argv: {
        type,
        sheetID,
        data: inputData,
        isAsync,
        ...(recordID && { recordID }),
      },
    },
  });

  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://env-00jxg9mus2ok.dev-hz.cloudbasefunction.cn/wps-kdocs',
      headers: {
        'Content-Type': 'application/json',
      },
      data: requestData,
    })
    
    return response.data
    
  } catch (error) {
    console.error('金山文档操作失败:', error)
    throw error
  }
}

export { kdocsHandler }
