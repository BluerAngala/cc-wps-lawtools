/**
 * 法律数据查询 - 中性数据模型
 *
 * 这些类型与具体 API 供应商解耦。
 * 任何 provider（元典、北大法宝、威科先行等）都应将这些字段映射到同一形态。
 */

/**
 * 法条
 * @typedef {Object} LawClause
 * @property {string} id            - 唯一 id（用于详情查询）
 * @property {string} statuteName   - 法规名称（如"中华人民共和国民法典"）
 * @property {string} articleNumber - 法条号（如"第一百二十二条"）
 * @property {string} content       - 法条正文
 * @property {string} [effective]   - 时效性：现行有效/失效/已被修改/部分失效/尚未生效
 * @property {string} [level]       - 效力级别：法律/司法解释/行政法规/部门规章/地方性法规 等
 * @property {string} [publishDate] - 发布日期 YYYY-MM-DD
 * @property {string} [implementDate] - 实施日期 YYYY-MM-DD
 * @property {string} [department]  - 发布部门
 * @property {string} [documentNo]  - 发文字号
 * @property {string} [region]      - 地域（中央/省级 等）
 * @property {string} [url]         - 详情页地址
 * @property {string} [llmContent]  - LLM 友好拼接文本（《法规名》第X条##内容）
 * @property {number} [score]        - 相似度评分
 */

/**
 * 案例
 * @typedef {Object} CaseDoc
 * @property {string} id            - 唯一 id
 * @property {string} [caseNumber]  - 案号
 * @property {string} title         - 标题
 * @property {string} [content]     - 正文/摘要
 * @property {string} [caseType]    - 案件类别：刑事案件/民事案件/行政案件 等
 * @property {string} [cause]       - 案由
 * @property {string} [court]       - 经办法院
 * @property {string} [judgeLevel]  - 法院层级：基层/中级/高级/最高
 * @property {string} [region]      - 地域
 * @property {string} [docType]     - 文书种类：判决书/裁定书/调解书/决定书
 * @property {string} [judgeDate]   - 裁判/结案日期 YYYY-MM-DD
 * @property {string} [source]      - 案例来源：典型案例/参考案例/公报案例 等
 * @property {string} [url]         - 详情页地址
 * @property {number} [score]        - 相似度评分
 * @property {string} [llmContent]  - LLM 友好拼接文本
 */

/**
 * 企业基本信息
 * @typedef {Object} CompanyBaseInfo
 * @property {string} id            - 企业 ID
 * @property {string} name          - 企业名称
 * @property {string} [creditCode]  - 统一社会信用代码
 * @property {string} [legalPerson] - 法定代表人
 * @property {string} [regCapital] - 注册资本
 * @property {string} [companyType] - 企业类型
 * @property {string} [industry]    - 所属行业
 * @property {string} [establishDate] - 成立日期
 * @property {string} [businessTerm] - 营业期限
 * @property {string} [regAuthority] - 登记机关
 * @property {string} [address]     - 注册地址
 * @property {string} [status]      - 经营状态
 * @property {string} [businessScope] - 经营范围
 * @property {string} [regNo]       - 工商注册号
 * @property {string} [orgCode]     - 组织机构代码
 */

/**
 * 统一响应包装
 * @template T
 * @typedef {Object} SearchResult
 * @property {boolean} success
 * @property {string} [message]
 * @property {T[]} items
 * @property {number} [total]
 * @property {Object} [raw]         - 原始响应（供调试）
 */

/**
 * 法条详情
 * @typedef {Object} LawClauseDetail
 * @property {LawClause} clause
 * @property {string} [statuteContent]  - 所属法规全文（可选）
 */

/**
 * 案例详情
 * @typedef {Object} CaseDocDetail
 * @property {CaseDoc} case
 * @property {string} [fullText]    - 完整正文（若与 content 不同）
 */

/**
 * 企业详情
 * @typedef {Object} CompanyDetail
 * @property {CompanyBaseInfo} base
 * @property {Object} [extended]    - 扩展信息（股东、知识产权、风险等）
 */

/**
 * 企业聚合统计
 * @typedef {Object} CompanyAggregation
 * @property {string} id
 * @property {string} name
 * @property {Object<string, {总数: number, [dimension: string]: Array<{key: string, count: number}>}>} stats
 */

/**
 * Provider 元信息
 * @typedef {Object} ProviderMeta
 * @property {string} id            - 唯一 id，如 'yuandian'
 * @property {string} name          - 显示名，如 '元典'
 * @property {string} [icon]        - emoji 或图标
 * @property {string} [homepage]    - 官网
 * @property {string[]} [capabilities] - 提供的能力：['law', 'case', 'company']
 */

/**
 * 业务错误
 */
export class ProviderError extends Error {
  constructor(message, { code, provider, cause } = {}) {
    super(message)
    this.name = 'ProviderError'
    this.code = code || 'PROVIDER_ERROR'
    this.provider = provider
    if (cause) this.cause = cause
  }
}
