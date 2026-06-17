/**
 * 法律数据 Provider 接口定义
 *
 * 所有 provider（不论供应商）必须实现对应接口。
 * 调用方只依赖接口，不依赖具体实现。
 */

/**
 * @typedef {import('./types.js').LawClause} LawClause
 * @typedef {import('./types.js').CaseDoc} CaseDoc
 * @typedef {import('./types.js').CompanyBaseInfo} CompanyBaseInfo
 * @typedef {import('./types.js').SearchResult} SearchResult
 * @typedef {import('./types.js').LawClauseDetail} LawClauseDetail
 * @typedef {import('./types.js').CaseDocDetail} CaseDocDetail
 * @typedef {import('./types.js').CompanyDetail} CompanyDetail
 * @typedef {import('./types.js').CompanyAggregation} CompanyAggregation
 * @typedef {import('./types.js').ProviderMeta} ProviderMeta
 */

/**
 * 公共 Provider 配置
 * @typedef {Object} ProviderConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 * @property {number} [timeout]
 */

/**
 * 法条检索选项
 * @typedef {Object} LawSearchOptions
 * @property {number} [topK=10]         - 返回条数
 * @property {boolean} [rewrite=true]   - 是否启用查询改写
 * @property {Object} [filter]          - 过滤条件（如时效性、效力级别、日期范围）
 */

/**
 * 案例检索选项
 * @typedef {Object} CaseSearchOptions
 * @property {number} [topK=10]
 * @property {boolean} [rewrite=true]
 * @property {Object} [filter]          - 过滤条件（案由、法院层级、地域、案件类别、文书种类 等）
 */

/**
 * 企业检索选项
 * @typedef {Object} CompanySearchOptions
 * @property {number} [topK=10]         - 名称模糊匹配的候选数
 */

/**
 * @interface ILawProvider
 */
export class ILawProvider {
  /** @returns {ProviderMeta} */
  getMeta() {
    throw new Error('not implemented')
  }

  /**
   * 语义/关键词检索法条
   * @param {string} query
   * @param {LawSearchOptions} [options]
   * @returns {Promise<SearchResult<LawClause>>}
   */
  async searchClauses(_query, _options) {
    throw new Error('not implemented')
  }

  /**
   * 获取法条详情
   * @param {string} id
   * @returns {Promise<LawClauseDetail|null>}
   */
  async getClause(_id) {
    throw new Error('not implemented')
  }
}

/**
 * @interface ICaseProvider
 */
export class ICaseProvider {
  /** @returns {ProviderMeta} */
  getMeta() {
    throw new Error('not implemented')
  }

  /**
   * 语义/关键词检索案例
   * @param {string} query
   * @param {CaseSearchOptions} [options]
   * @returns {Promise<SearchResult<CaseDoc>>}
   */
  async searchCases(_query, _options) {
    throw new Error('not implemented')
  }

  /**
   * 获取案例详情
   * @param {string} id
   * @param {Object} [options]
   * @returns {Promise<CaseDocDetail|null>}
   */
  async getCase(_id, _options) {
    throw new Error('not implemented')
  }
}

/**
 * @interface ICompanyProvider
 */
export class ICompanyProvider {
  /** @returns {ProviderMeta} */
  getMeta() {
    throw new Error('not implemented')
  }

  /**
   * 按名称搜索企业候选
   * @param {string} name
   * @param {CompanySearchOptions} [options]
   * @returns {Promise<SearchResult<CompanyBaseInfo>>}
   */
  async searchCompanies(_name, _options) {
    throw new Error('not implemented')
  }

  /**
   * 获取企业详情
   * @param {string} id
   * @param {Object} [options]
   * @returns {Promise<CompanyDetail|null>}
   */
  async getCompany(_id, _options) {
    throw new Error('not implemented')
  }

  /**
   * 获取企业聚合统计
   * @param {string} id
   * @returns {Promise<CompanyAggregation|null>}
   */
  async getAggregation(_id) {
    throw new Error('not implemented')
  }
}

/**
 * 一站式 Provider 聚合
 * @interface IUnifiedProvider
 * @property {string} id
 * @property {string} name
 * @property {string} [icon]
 * @property {ILawProvider} [law]
 * @property {ICaseProvider} [case]
 * @property {ICompanyProvider} [company]
 */

/**
 * 构造统一 Provider
 * @param {Object} args
 * @param {ProviderMeta} args.meta
 * @param {ILawProvider} [args.law]
 * @param {ICaseProvider} [args.case]
 * @param {ICompanyProvider} [args.company]
 * @returns {IUnifiedProvider}
 */
export function buildUnifiedProvider({ meta, law, case: caseProvider, company }) {
  return {
    id: meta.id,
    name: meta.name,
    icon: meta.icon,
    homepage: meta.homepage,
    law,
    case: caseProvider,
    company
  }
}
