import { appConfig } from '@/utils/appConfig.js'

class QdrantClient {
  constructor() {
    this._configCache = null
    this._configTime = 0
  }

  _getConfig() {
    const now = Date.now()
    if (this._configCache && now - this._configTime < 30000) {
      return this._configCache
    }
    const config = appConfig.getConfig()
    const rag = config.rag || {}
    this._configCache = {
      url: (rag.qdrantUrl || '').replace(/\/+$/, ''),
      apiKey: rag.qdrantApiKey || '',
      enabled: rag.enabled || false
    }
    this._configTime = now
    return this._configCache
  }

  _headers() {
    const cfg = this._getConfig()
    const headers = { 'Content-Type': 'application/json' }
    if (cfg.apiKey) {
      headers['api-key'] = cfg.apiKey
    }
    return headers
  }

  async _request(method, path, body = null) {
    const cfg = this._getConfig()
    if (!cfg.url) throw new Error('Qdrant 地址未配置')
    const url = `${cfg.url}${path}`
    const opts = {
      method,
      headers: this._headers(),
      signal: AbortSignal.timeout(30000)
    }
    if (body) {
      opts.body = JSON.stringify(body)
    }
    const res = await fetch(url, opts)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Qdrant ${method} ${path} 失败 (${res.status}): ${text.substring(0, 200)}`)
    }
    if (res.status === 204) return null
    return res.json()
  }

  async healthCheck() {
    try {
      const cfg = this._getConfig()
      if (!cfg.url) return { ok: false, error: '地址未配置' }
      const res = await fetch(`${cfg.url}/healthz`, {
        method: 'GET',
        headers: this._headers(),
        signal: AbortSignal.timeout(15000)
      })
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` }
      }
      const text = await res.text()
      if (text.includes('pass') || res.ok) {
        return { ok: true }
      }
      return { ok: false, error: text.substring(0, 100) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  async createCollection(name, vectorSize = 1024) {
    return this._request('PUT', `/collections/${name}`, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine'
      },
      optimizers_config: {
        indexing_threshold: 20000
      }
    })
  }

  async deleteCollection(name) {
    return this._request('DELETE', `/collections/${name}`)
  }

  async listCollections() {
    const res = await this._request('GET', '/collections')
    return res?.result?.collections || []
  }

  async collectionInfo(name) {
    return this._request('GET', `/collections/${name}`)
  }

  async upsert(collectionName, points) {
    return this._request('PUT', `/collections/${collectionName}/points`, {
      points,
      wait: true
    })
  }

  async search(collectionName, vector, limit = 5, filter = null) {
    const body = {
      vector,
      limit,
      with_payload: true
    }
    if (filter) {
      body.filter = filter
    }
    return this._request('POST', `/collections/${collectionName}/points/search`, body)
  }

  async scroll(collectionName, limit = 10, offset = null, filter = null) {
    const body = { limit, with_payload: true }
    if (offset) body.offset = offset
    if (filter) body.filter = filter
    return this._request('POST', `/collections/${collectionName}/points/scroll`, body)
  }

  async deletePoints(collectionName, ids) {
    return this._request('POST', `/collections/${collectionName}/points/delete`, {
      points: ids,
      wait: true
    })
  }

  async batchUpsert(collectionName, points, batchSize = 100) {
    const results = []
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize)
      const res = await this.upsert(collectionName, batch)
      results.push(res)
    }
    return results
  }

  clearConfigCache() {
    this._configCache = null
    this._configTime = 0
  }
}

export const qdrantClient = new QdrantClient()

export const COLLECTIONS = {
  DOCUMENT_CHUNKS: 'doc_chunks',
  CONVERSATION_MEMORY: 'conv_memory',
  REVIEW_HISTORY: 'review_history',
  LAW_KNOWLEDGE: 'law_knowledge'
}
