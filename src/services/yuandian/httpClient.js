/**
 * 法律数据 Provider 共享 HTTP 客户端
 *
 * 提供统一的：
 * - 鉴权头注入
 * - 超时控制
 * - 错误归一化（HTTP 200 + code != 200 仍视为错误）
 *
 * 不同供应商只需传入 baseUrl / headerBuilder / responseParser 即可复用。
 */

import { ProviderError } from './types.js'

/**
 * @typedef {Object} HttpRequest
 * @property {string} method
 * @property {string} path
 * @property {Object} [params]    - GET query 或 POST body（视 method 而定）
 * @property {Object} [headers]
 * @property {number} [timeout]
 * @property {string} [responseType] - 'json' (默认) | 'text'
 */

/**
 * @typedef {Object} HttpClientOptions
 * @property {string} baseUrl
 * @property {string} providerId          - 用于错误标记，如 'yuandian'
 * @property {Object<string,string>} [defaultHeaders]
 * @property {(req: HttpRequest) => Record<string,string>} [headerBuilder]
 * @property {number} [defaultTimeout=30000]
 * @property {boolean} [bodyForPost=true] - POST 是否用 JSON body（部分供应商用表单）
 * @property {boolean} [useProxy=false]   - true 时 baseUrl 视为相对路径（如 '/api/yuandian'），
 *                                          走 vite 反向代理，避免 WPS WebView CORS 拦截
 */

/**
 * 统一业务错误结构
 * @param {Object} body
 * @param {number} status
 * @returns {ProviderError}
 */
function buildError(body, status, providerId) {
  const code = body?.code ?? body?.error_code ?? status
  const message =
    body?.message ||
    body?.msg ||
    body?.error ||
    (typeof body === 'string' ? body : null) ||
    `HTTP ${status}`

  if (status === 401 || code === 401) {
    return new ProviderError(`${providerId}: API Key 无效或已过期`, {
      code: 'UNAUTHORIZED',
      provider: providerId
    })
  }
  if (status === 429) {
    return new ProviderError(`${providerId}: 请求频率过高，请稍后重试`, {
      code: 'RATE_LIMIT',
      provider: providerId
    })
  }
  if (status >= 500) {
    return new ProviderError(`${providerId}: 服务异常 - ${message}`, {
      code: 'UPSTREAM_ERROR',
      provider: providerId
    })
  }
  return new ProviderError(`${providerId}: ${message}`, {
    code: typeof code === 'number' || typeof code === 'string' ? String(code) : 'PROVIDER_ERROR',
    provider: providerId
  })
}

export class HttpClient {
  /**
   * @param {HttpClientOptions} options
   */
  constructor({
    baseUrl,
    providerId,
    defaultHeaders = {},
    headerBuilder = null,
    defaultTimeout = 30000,
    bodyForPost = true,
    useProxy = false
  }) {
    if (!baseUrl) throw new Error('HttpClient: baseUrl 必填')
    if (!providerId) throw new Error('HttpClient: providerId 必填')
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.providerId = providerId
    this.defaultHeaders = defaultHeaders
    this.headerBuilder = headerBuilder
    this.defaultTimeout = defaultTimeout
    this.bodyForPost = bodyForPost
    this.useProxy = useProxy
  }

  /**
   * 发送请求
   * @param {HttpRequest} req
   * @returns {Promise<{status: number, body: any, headers: Headers}>}
   */
  async request(req) {
    const method = (req.method || 'GET').toUpperCase()
    const url = this._buildUrl(req.path, method === 'GET' ? req.params : null)

    const headers = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...(this.headerBuilder ? this.headerBuilder(req) : {}),
      ...(req.headers || {})
    }

    const init = { method, headers }
    if (this._getAbortController) init.signal = this._getAbortController()
    if (method === 'GET') {
      // GET 不带 body
    } else if (this.bodyForPost) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json; charset=utf-8'
      init.body = JSON.stringify(req.params || {})
    } else {
      // 表单模式
      headers['Content-Type'] =
        headers['Content-Type'] || 'application/x-www-form-urlencoded; charset=utf-8'
      init.body = new URLSearchParams(req.params || {}).toString()
    }

    let res
    try {
      res = await fetch(url, init)
    } catch (e) {
      throw new ProviderError(`${this.providerId}: 网络请求失败 - ${e.message}`, {
        code: 'NETWORK_ERROR',
        provider: this.providerId,
        cause: e
      })
    }

    const text = await res.text()
    let body
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }

    if (!res.ok) {
      throw buildError(body, res.status, this.providerId)
    }

    return { status: res.status, body, headers: res.headers }
  }

  /**
   * 便捷方法：GET
   * @param {string} path
   * @param {Object} [params]
   * @param {Object} [options]
   * @returns {Promise<any>} 解析后的 body
   */
  async get(path, params, options = {}) {
    const r = await this.request({ method: 'GET', path, params, ...options })
    return this._unifyBusinessCode(r)
  }

  /**
   * 便捷方法：POST
   * @param {string} path
   * @param {Object} [params]
   * @param {Object} [options]
   * @returns {Promise<any>} 解析后的 body
   */
  async post(path, params, options = {}) {
    const r = await this.request({ method: 'POST', path, params, ...options })
    return this._unifyBusinessCode(r)
  }

  /**
   * 业务码归一化：HTTP 200 + 业务 code 200/201 视为成功；
   * 其他视为 ProviderError。
   * 解析后的对象始终包含 { data, code, message, raw }。
   */
  _unifyBusinessCode({ body }) {
    if (body == null) {
      return { data: null, code: 0, message: '', raw: body }
    }
    if (typeof body !== 'object') {
      return { data: body, code: 200, message: '', raw: body }
    }

    const code = body.code ?? body.error_code
    if (code !== undefined && code !== 200 && code !== 201 && code !== '200' && code !== '201') {
      // 业务失败
      throw buildError(body, 200, this.providerId)
    }

    return {
      data: body.data ?? body.extra ?? null,
      code: code ?? 200,
      message: body.message || body.msg || '',
      raw: body
    }
  }

  _buildUrl(path, params) {
    let url
    if (this.useProxy) {
      // 代理模式：baseUrl 视为相对路径，path 拼接到其后
      url = this.baseUrl + (path.startsWith('/') ? path : `/${path}`)
    } else if (/^https?:\/\//i.test(path)) {
      url = path
    } else {
      url = this.baseUrl + (path.startsWith('/') ? path : `/${path}`)
    }
    if (params && Object.keys(params).length) {
      const usp = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue
        if (Array.isArray(v)) {
          v.forEach((item) => usp.append(k, String(item)))
        } else if (typeof v === 'object') {
          // 复杂对象序列化为 JSON 字符串
          usp.set(k, JSON.stringify(v))
        } else {
          usp.set(k, String(v))
        }
      }
      const qs = usp.toString()
      if (qs) url += (url.includes('?') ? '&' : '?') + qs
    }
    return url
  }
}
