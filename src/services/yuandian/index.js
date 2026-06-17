/**
 * 法律数据 Provider 统一入口
 *
 * 支持多供应商并存，调用方通过 `getActiveProvider()` 获取当前激活的 provider。
 * 配置存于 appConfig.yuandian.providers（数组），每个 provider 有独立 API Key。
 *
 * 用法：
 *   import { getActiveProviders, providerManager } from '@/services/yuandian'
 *   const { law, case: caseP, company } = getActiveProviders()
 *   const result = await law.searchClauses('民法典 违约责任')
 */

import { appConfig } from '../../utils/appConfig.js'
import { HttpClient } from './httpClient.js'
import {
  createYuandianLawProvider,
  searchClausesByKeyword
} from './lawProvider.js'
import {
  createYuandianCaseProvider,
  searchCasesByKeyword,
  searchAuthoritativeCases
} from './caseProvider.js'
import { createYuandianCompanyProvider } from './companyProvider.js'
import { buildUnifiedProvider } from './interfaces.js'

const PROVIDER_ID = 'yuandian'

/**
 * Provider 能力清单
 */
export const CAPABILITIES = ['law', 'case', 'company']

/**
 * 创建元典 provider（含三个子能力）
 * @param {Object} config
 * @param {string} config.apiKey
 * @param {string} [config.baseUrl]
 * @param {boolean} [config.useProxy]   - 显式覆盖默认代理行为
 */
export function createYuandianProvider(config) {
  if (!config || !config.apiKey) {
    throw new Error('createYuandianProvider: 缺少 apiKey')
  }
  // dev 模式默认走 vite 代理（解决 WPS WebView CORS 限制）
  // 生产环境用户可通过 config.useProxy=true 配合自有反向代理使用
  const useProxy = config.useProxy !== undefined ? config.useProxy : import.meta.env.DEV
  const baseUrl = useProxy
    ? '/api/yuandian'
    : (config.baseUrl || 'https://open.chineselaw.com/open')

  const http = new HttpClient({
    baseUrl,
    providerId: PROVIDER_ID,
    defaultHeaders: { 'X-API-Key': config.apiKey },
    defaultTimeout: 30000,
    useProxy
  })
  const law = createYuandianLawProvider({ http })
  const caseProvider = createYuandianCaseProvider({ http })
  const company = createYuandianCompanyProvider({ http })
  return buildUnifiedProvider({
    meta: { id: PROVIDER_ID, name: '元典', icon: '📚', homepage: 'https://open.chineselaw.com' },
    law,
    case: caseProvider,
    company
  })
}

/**
 * API Key 最小长度（防止误把空字符串当已配置）
 */
const MIN_KEY_LENGTH = 8

/**
 * 判定一个 provider 配置是否「已配置」：有非空 API Key
 */
function isProviderConfigured(p) {
  return p && typeof p.apiKey === 'string' && p.apiKey.trim().length >= MIN_KEY_LENGTH
}

/**
 * 判定一个 provider 配置是否「启用」
 */
function isProviderEnabled(p) {
  return p && p.enabled !== false
}

/**
 * 从 appConfig 读取 provider 配置并实例化
 * @returns {Array<Object>}  provider 实例数组（按用户配置顺序）
 */
export function getAvailableProviders() {
  const cfg = appConfig.get('yuandian') || {}
  const providers = Array.isArray(cfg.providers) && cfg.providers.length
    ? cfg.providers
    : []

  const result = []
  for (const p of providers) {
    try {
      if (p.id === PROVIDER_ID) {
        result.push({
          ...createYuandianProvider(p),
          nickname: p.nickname || '元典',
          configured: isProviderConfigured(p),
          enabled: isProviderEnabled(p),
          config: p
        })
      } else {
        console.warn(`[yuandian] 未知的 provider id: ${p.id}`)
      }
    } catch (e) {
      console.warn(`[yuandian] 初始化 provider ${p.id} 失败:`, e.message)
    }
  }
  return result
}

/**
 * 获取当前激活的 provider
 * 激活规则：activeProviderId 指向的 provider 必须 ①已配置 API Key ②处于启用状态
 * 都不满足则从已配置+已启用的列表中取第一个，都没有则返回 null
 */
export function getActiveProvider() {
  const list = getAvailableProviders().filter((p) => p.configured && p.enabled)
  if (!list.length) return null
  const cfg = appConfig.get('yuandian') || {}
  const activeId = cfg.activeProviderId
  const found = list.find((p) => p.config.id === activeId)
  return found || list[0]
}

/**
 * 获取当前激活的各能力 provider
 * @returns {{provider: Object|null, law: ILawProvider|null, case: ICaseProvider|null, company: ICompanyProvider|null}}
 */
export function getActiveProviders() {
  const provider = getActiveProvider()
  if (!provider) {
    return { provider: null, law: null, case: null, company: null }
  }
  return {
    provider,
    law: provider.law || null,
    case: provider.case || null,
    company: provider.company || null
  }
}

/**
 * Provider 管理器：处理配置的读取与切换
 * 配置形态（存于 appConfig.yuandian）：
 * {
 *   providers: [
 *     { id: 'yuandian', nickname: '元典主账号', enabled: true, apiKey: 'xxx', baseUrl?: '' }
 *   ],
 *   activeProviderId: 'yuandian'
 * }
 */
export const providerManager = {
  list() {
    return getAvailableProviders()
  },

  getActive() {
    return getActiveProvider()
  },

  /**
   * 获取所有 provider 的摘要（不含 apiKey 完整值）
   */
  listMeta() {
    return getAvailableProviders().map((p) => ({
      id: p.id,
      nickname: p.nickname,
      enabled: p.enabled,
      hasKey: !!p.config.apiKey,
      baseUrl: p.config.baseUrl,
      capabilities: [p.law && 'law', p.case && 'case', p.company && 'company'].filter(Boolean),
      homepage: p.homepage
    }))
  },

  /**
   * 切换激活的 provider
   * @param {string} providerConfigId
   */
  setActive(providerConfigId) {
    const cfg = appConfig.get('yuandian') || {}
    const list = Array.isArray(cfg.providers) ? cfg.providers : []
    const target = list.find((p) => p.id === providerConfigId)
    if (!target) throw new Error(`provider ${providerConfigId} 不存在`)
    if (!isProviderConfigured(target)) {
      throw new Error('请先填写该 provider 的 API Key')
    }
    if (!isProviderEnabled(target)) {
      throw new Error('该 provider 已停用，请先启用')
    }
    cfg.activeProviderId = providerConfigId
    return appConfig.set('yuandian', cfg)
  },

  /**
   * 添加/更新 provider 配置
   * @param {Object} config
   */
  upsert(config) {
    if (!config.id) throw new Error('provider config 必须有 id')
    const cfg = appConfig.get('yuandian') || { providers: [], activeProviderId: '' }
    if (!Array.isArray(cfg.providers)) cfg.providers = []
    const idx = cfg.providers.findIndex((p) => p.id === config.id)
    if (idx >= 0) {
      cfg.providers[idx] = { ...cfg.providers[idx], ...config }
    } else {
      // 新增默认启用
      cfg.providers.push({ enabled: true, ...config })
    }
    return appConfig.set('yuandian', cfg)
  },

  /**
   * 移除 provider 配置
   */
  remove(providerConfigId) {
    const cfg = appConfig.get('yuandian') || { providers: [], activeProviderId: '' }
    if (!Array.isArray(cfg.providers)) return false
    cfg.providers = cfg.providers.filter((p) => p.id !== providerConfigId)
    if (cfg.activeProviderId === providerConfigId) {
      cfg.activeProviderId = cfg.providers.find(
        (p) => isProviderConfigured(p) && isProviderEnabled(p)
      )?.id || ''
    }
    return appConfig.set('yuandian', cfg)
  },

  /**
   * 启用/停用单个 provider
   */
  setEnabled(providerConfigId, enabled) {
    const cfg = appConfig.get('yuandian') || { providers: [], activeProviderId: '' }
    const p = (cfg.providers || []).find((x) => x.id === providerConfigId)
    if (!p) return false
    p.enabled = enabled !== false
    // 停用当前激活的 provider 时，自动切到下一个可用 provider
    if (!p.enabled && cfg.activeProviderId === providerConfigId) {
      cfg.activeProviderId = cfg.providers.find(
        (x) => x.id !== providerConfigId && isProviderConfigured(x) && isProviderEnabled(x)
      )?.id || ''
    }
    return appConfig.set('yuandian', cfg)
  },

  /**
   * 测试 provider 连接（接收实时输入值，不读 config）
   * 用于「输入即测」流程：测的是 draft，不是已保存的 config
   * @param {{apiKey: string, baseUrl?: string}} input
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async testConnection({ apiKey, baseUrl } = {}) {
    const key = (apiKey || '').trim()
    if (key.length < 8) {
      return { ok: false, error: 'API Key 不能为空（至少 8 位）' }
    }
    try {
      const tmp = createYuandianProvider({ apiKey: key, baseUrl })
      const r = await tmp.law.searchClauses('民法典', { topK: 1 })
      if (r && Array.isArray(r.items)) return { ok: true }
      return { ok: false, error: '返回数据异常' }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  /**
   * 启用 provider（同时设为激活）
   * 先测试 draft，通过才持久化。
   * @param {string} providerConfigId
   * @param {{apiKey: string, baseUrl?: string, nickname?: string}} draft
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async enable(providerConfigId, draft) {
    const result = await this.testConnection(draft)
    if (!result.ok) return result

    // 持久化最新值
    this.upsert({
      id: providerConfigId,
      nickname: draft.nickname || '元典',
      apiKey: draft.apiKey,
      baseUrl: draft.baseUrl
    })
    // 启用
    this.setEnabled(providerConfigId, true)
    // 设为激活
    const cfg = appConfig.get('yuandian') || {}
    cfg.activeProviderId = providerConfigId
    appConfig.set('yuandian', cfg)
    return { ok: true }
  },

  /**
   * 停用 provider
   * @param {string} providerConfigId
   */
  disable(providerConfigId) {
    this.setEnabled(providerConfigId, false)
  }
}

// Re-export 兜底搜索工具
export { searchClausesByKeyword, searchCasesByKeyword, searchAuthoritativeCases }

// 重新导出接口与类型方便调用方引用
export { ILawProvider, ICaseProvider, ICompanyProvider, buildUnifiedProvider } from './interfaces.js'
export { ProviderError } from './types.js'
