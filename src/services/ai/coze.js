import axios from 'axios'
import { appConfig } from '../../utils/appConfig.js'

/**
 * 获取企业信息
 * @param {string} companyName - 企业名称
 * @returns {Promise<Object>} - 企业信息
 */
export async function fetchCompanyInfo(companyName) {
  if (!companyName || !companyName.trim()) {
    throw new Error('企业名称不能为空')
  }

  // 从配置中获取Coze API密钥和工作流ID
  const config = appConfig.get('kdocs') || {}
  const cozeApiKey = config.cozeApiKey || ''
  const companyInfoWorkflowId = config.companyInfoWorkflowId || ''

  if (!cozeApiKey) {
    throw new Error('Coze API Key未配置，请在设置页面配置')
  }

  const url = 'https://api.coze.cn/v1/workflow/run'
  const requestData = {
    parameters: {
      companyName: companyName.trim()
    },
    // 新版添加检查公司名称
    workflow_id: companyInfoWorkflowId
  }

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        Authorization: `Bearer ${cozeApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
    })

    // 检查响应数据是否存在
    if (!response.data || !response.data.data) {
      console.error('Coze API 响应异常:', response.data)
      throw new Error(response.data?.msg || 'Coze API 返回数据为空')
    }

    const companyInfo = JSON.parse(response.data.data)
    console.log('companyInfo', companyInfo)
    const {
      company_name,
      credit_no,
      legal_person,
      company_type,
      industry,
      business_scope,
      company_address,
      establish_date,
      msg
    } = companyInfo.output

    return {
      code: !msg.includes('查询失败'),
      msg: msg,
      name: company_name || '【未查询到企业名称，请检查！】',
      creditCode: credit_no || '【未查询到统一信用代码，请检查！】',
      legalPersonName: legal_person || '【未查询到法定代表人，请检查！】',
      companyOrgType: company_type || '【未查询到企业类型，请检查！】',
      industry: industry || '【未查询到所属行业，请检查！】',
      businessScope: business_scope || '【未查询到经营范围，请检查！】',
      address: company_address || '【未查询到地址，请检查！】',
      establishDate: establish_date || '【未查询到成立日期，请检查！】'
    }
  } catch (error) {
    console.error('获取企业信息失败:', error)
    throw error
  }
}
