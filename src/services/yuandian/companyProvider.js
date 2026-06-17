/**
 * 元典开放平台 - 企业 Provider 实现
 */

import { ICompanyProvider } from './interfaces.js'

/**
 * @param {Object} args
 * @param {import('./httpClient.js').HttpClient} args.http
 */
export function createYuandianCompanyProvider({ http }) {
  return new YuandianCompanyProvider(http)
}

class YuandianCompanyProvider extends ICompanyProvider {
  constructor(http) {
    super()
    this.http = http
  }

  getMeta() {
    return {
      id: 'yuandian',
      name: '元典',
      icon: '🏢',
      homepage: 'https://open.chineselaw.com',
      capabilities: ['company']
    }
  }

  /**
   * 按企业名称检索
   * 元典：rh_enterpriseSearch
   */
  async searchCompanies(name, options = {}) {
    const { topK = 10 } = options
    const r = await this.http.get('/rh_enterpriseSearch', { name, top_k: topK })
    const list = Array.isArray(r.data) ? r.data : []
    const items = list.map(mapCompanyBasic).filter(Boolean)
    return { success: true, items, total: items.length, raw: r.raw }
  }

  /**
   * 获取企业详情
   * 元典：rh_company_detail（id 优先，其次统一社会信用代码）
   */
  async getCompany(id, options = {}) {
    const params = {}
    if (options.creditCode) {
      params.tyshxydm = options.creditCode
    } else {
      params.id = id
    }
    const r = await this.http.get('/rh_company_detail', params)
    if (!r.data) return null
    return {
      base: mapCompanyBase(r.data),
      extended: r.data
    }
  }

  /**
   * 聚合总览
   * 元典：rh_enterpriseAggregationSummary
   */
  async getAggregation(id) {
    const r = await this.http.get('/rh_enterpriseAggregationSummary', { id })
    if (!r.data) return null
    return {
      id: r.data.id,
      name: r.data.name,
      stats: r.data
    }
  }
}

function mapCompanyBasic(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    name: raw.企业名称,
    creditCode: raw.统一社会信用代码
  }
}

function mapCompanyBase(raw) {
  if (!raw) return null
  return {
    id: raw.企业ID || raw.id,
    name: raw.企业名称 || raw.name,
    creditCode: raw.统一社会信用代码,
    legalPerson: raw.法定代表人,
    regCapital: raw.注册资本,
    companyType: raw.企业类型,
    industry: raw.行业,
    establishDate: raw.成立日期,
    businessTerm: raw.营业期限,
    regAuthority: raw.登记机关,
    address: raw.注册地址,
    status: raw.经营状态,
    businessScope: raw.经营范围,
    regNo: raw.工商注册号,
    orgCode: raw.组织机构代码
  }
}
