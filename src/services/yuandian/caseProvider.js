/**
 * 元典开放平台 - 案例 Provider 实现
 */

import { ICaseProvider } from './interfaces.js'

/**
 * @param {Object} args
 * @param {import('./httpClient.js').HttpClient} args.http
 */
export function createYuandianCaseProvider({ http }) {
  return new YuandianCaseProvider(http)
}

class YuandianCaseProvider extends ICaseProvider {
  constructor(http) {
    super()
    this.http = http
  }

  getMeta() {
    return {
      id: 'yuandian',
      name: '元典',
      icon: '⚖️',
      homepage: 'https://open.chineselaw.com',
      capabilities: ['case']
    }
  }

  /**
   * 语义检索案例（推荐接口）
   * 元典：case_vector_search
   */
  async searchCases(query, options = {}) {
    const { topK = 10, rewrite = true, filter = {} } = options
    const body = {
      query,
      rewrite_flag: rewrite,
      return_num: topK
    }
    if (filter && Object.keys(filter).length) {
      body.wenshu_filter = filter
    }
    const r = await this.http.post('/case_vector_search', body)
    const raw = r.raw || {}
    const list = r.data?.wenshu || []
    const items = Array.isArray(list) ? list.map(mapCaseFromVector).filter(Boolean) : []
    return { success: true, items, total: items.length, raw }
  }

  /**
   * 获取案例详情
   * 元典：rh_case_details
   * @param {string} id
   * @param {Object} [options] {type: 'ptal' | 'qwal'}
   */
  async getCase(id, options = {}) {
    const params = { id }
    if (options.type) params.type = options.type
    const r = await this.http.get('/rh_case_details', params)
    const list = Array.isArray(r.data) ? r.data : []
    if (!list.length) return null
    const first = list[0]
    return {
      case: mapCaseFromDetail(first),
      fullText: first.content
    }
  }
}

/**
 * 关键词检索（普通案例，兜底）
 * @param {import('./httpClient.js').HttpClient} http
 * @param {Object} params
 */
export async function searchCasesByKeyword(http, params = {}) {
  const body = { top_k: 10, ...params }
  const r = await http.post('/rh_ptal_search', body)
  const raw = r.raw || {}
  const list = (r.data && r.data.lst) || []
  const items = Array.isArray(list) ? list.map(mapCaseFromKeyword).filter(Boolean) : []
  return {
    success: true,
    items,
    total: (r.data && r.data.total) || items.length,
    raw
  }
}

/**
 * 关键词检索（权威案例）
 */
export async function searchAuthoritativeCases(http, params = {}) {
  const body = { top_k: 10, ...params }
  const r = await http.post('/rh_qwal_search', body)
  const raw = r.raw || {}
  const list = (r.data && r.data.lst) || []
  const items = Array.isArray(list) ? list.map(mapCaseFromKeyword).filter(Boolean) : []
  return {
    success: true,
    items,
    total: (r.data && r.data.total) || items.length,
    raw
  }
}

function mapCaseFromVector(raw) {
  if (!raw) return null
  return {
    id: raw.scid,
    caseNumber: raw.ah,
    title: raw.title,
    content: raw.content,
    caseType: raw.ajlb,
    cause: Array.isArray(raw.ay) ? raw.ay.join(' / ') : raw.ay,
    court: raw.jbdw,
    judgeLevel: raw.cj,
    region: raw.xzqh_p,
    docType: raw.wszl,
    judgeDate: ymdToIso(raw.jaDate || raw.jand),
    source: raw.db,
    score: raw.score,
    url: undefined
  }
}

function mapCaseFromKeyword(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    caseNumber: raw.ah,
    title: raw.title,
    content: raw.content,
    caseType: raw.ajlb,
    cause: Array.isArray(raw.ay) ? raw.ay.join(' / ') : raw.ay,
    court: raw.jbdw,
    judgeLevel: raw.cj,
    region: raw.xzqh_p,
    docType: raw.wszl,
    judgeDate: raw.cprq,
    source: raw.type,
    llmContent: raw.llm_content,
    score: raw.score,
    url: raw.url
  }
}

function mapCaseFromDetail(raw) {
  return {
    id: raw.id,
    caseNumber: raw.ah,
    title: raw.title,
    content: raw.content,
    caseType: raw.ajlb,
    cause: Array.isArray(raw.ay) ? raw.ay.join(' / ') : raw.ay,
    court: raw.jbdw,
    judgeLevel: raw.cj,
    region: raw.xzqh_p,
    docType: raw.wszl,
    judgeDate: raw.cprq,
    source: raw.type,
    url: raw.url
  }
}

function ymdToIso(v) {
  if (v == null || v === '') return undefined
  const s = String(v)
  if (s.length === 8 && /^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  if (s.length === 4 && /^\d{4}$/.test(s)) return s
  return s
}
