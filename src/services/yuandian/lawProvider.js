/**
 * 元典开放平台 - 法条 Provider 实现
 *
 * 实现 ILawProvider 接口。
 * API 文档参考：https://open.chineselaw.com/llms-full.txt
 */

import { ILawProvider } from './interfaces.js'

/**
 * 元典时间戳(YYYYMMDD) → YYYY-MM-DD
 */
function ymdToIso(v) {
  if (v == null || v === '') return undefined
  const s = String(v)
  if (s.length === 8 && /^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  if (s.length === 10 && s.includes('-')) return s
  return s
}

/**
 * 构造元典法条 Provider
 * @param {Object} args
 * @param {import('./httpClient.js').HttpClient} args.http
 */
export function createYuandianLawProvider({ http }) {
  return new YuandianLawProvider(http)
}

class YuandianLawProvider extends ILawProvider {
  constructor(http) {
    super()
    this.http = http
  }

  getMeta() {
    return {
      id: 'yuandian',
      name: '元典',
      icon: '📚',
      homepage: 'https://open.chineselaw.com',
      capabilities: ['law']
    }
  }

  /**
   * 语义检索法条（推荐接口）
   * 元典：law_vector_search
   * 文档：/law_vector_search POST
   */
  async searchClauses(query, options = {}) {
    const { topK = 10, rewrite = true, filter = {} } = options
    const body = {
      query,
      rewrite_flag: rewrite,
      return_num: topK
    }
    if (filter && Object.keys(filter).length) {
      body.fatiao_filter = filter
    }
    const r = await this.http.post('/law_vector_search', body)
    return mapSearchResponse(r, 'fatiao', mapLawClauseFromVector)
  }

  /**
   * 获取法条详情
   * 元典：rh_ft_detail
   */
  async getClause(id) {
    const r = await this.http.post('/rh_ft_detail', { id })
    if (!r.data) return null
    return {
      clause: {
        id: r.data.id,
        statuteName: r.data.fgmc || r.data.title,
        articleNumber: r.data.ft_num || r.data.ftmc,
        content: r.data.content,
        effective: r.data.sxx,
        level: r.data.xljb_1,
        publishDate: r.data.fbrq,
        implementDate: r.data.ssrq,
        url: r.data.url
      }
    }
  }
}

/**
 * 关键词检索（兜底接口）
 * @param {import('./httpClient.js').HttpClient} http
 * @param {string} keyword
 * @param {Object} [options]
 */
export async function searchClausesByKeyword(http, keyword, options = {}) {
  const { topK = 10, filter = {} } = options
  const body = { keyword, top_k: topK, ...filter }
  const r = await http.post('/rh_ft_search', body)
  return mapSearchResponse(r, 'data', mapLawClauseFromKeyword)
}

/**
 * @internal
 */
function mapSearchResponse(r, key, mapper) {
  const raw = r.raw || {}
  const list = key === 'data' ? raw.data || [] : r.data?.[key] || r.data || []
  const items = Array.isArray(list) ? list.map(mapper).filter(Boolean) : []
  return {
    success: true,
    items,
    total: items.length,
    raw
  }
}

/**
 * 映射 law_vector_search 返回的法条
 * 原始结构见 API 文档
 */
function mapLawClauseFromVector(raw) {
  if (!raw) return null
  return {
    id: raw.ftid,
    statuteName: raw.fgtitle,
    articleNumber: raw.num,
    content: raw.content,
    effective: raw.sxx,
    level: raw.effect1 || raw.effect2,
    publishDate: ymdToIso(raw.start),
    implementDate: ymdToIso(raw.start),
    region: raw.location,
    score: raw.score,
    url: undefined
  }
}

/**
 * 映射 rh_ft_search 返回的法条
 */
function mapLawClauseFromKeyword(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    statuteName: raw.fgmc,
    articleNumber: raw.ft_num,
    content: raw.content,
    effective: raw.sxx,
    level: raw.xljb_1 || raw.xljb_2,
    publishDate: raw.fbrq,
    implementDate: raw.ssrq,
    department: raw.fbbm,
    documentNo: raw.fwzh,
    region: raw.dy,
    llmContent: raw.llm_content,
    score: raw._score,
    url: raw.url
  }
}
