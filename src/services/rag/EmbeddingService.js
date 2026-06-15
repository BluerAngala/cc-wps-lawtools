import { appConfig } from '@/utils/AppConfig.js'

const DEFAULT_EMBEDDING_MODEL = 'Qwen/Qwen3-Embedding-8B'
const EMBEDDING_DIMENSION = 1024

class EmbeddingService {
  constructor() {
    this._cache = new Map()
    this._cacheMaxSize = 500
    this._vectorSize = EMBEDDING_DIMENSION
  }

  get vectorSize() {
    return this._vectorSize
  }

  _getConfig() {
    const config = appConfig.getConfig()
    const ai = config.ai || {}
    const rag = config.rag || {}
    return {
      baseUrl: (rag.embeddingBaseUrl || ai.baseUrl || '').replace(/\/+$/, ''),
      apiKey: rag.embeddingApiKey || ai.apiKey || '',
      model: rag.embeddingModel || DEFAULT_EMBEDDING_MODEL
    }
  }

  _cacheKey(text, model) {
    return `${model}:${text.substring(0, 100)}`
  }

  _trimCache() {
    if (this._cache.size > this._cacheMaxSize) {
      const keys = [...this._cache.keys()]
      const toRemove = keys.slice(0, keys.length - this._cacheMaxSize)
      toRemove.forEach((k) => this._cache.delete(k))
    }
  }

  async embed(text) {
    if (!text || !text.trim()) return null

    const cfg = this._getConfig()
    if (!cfg.baseUrl || !cfg.apiKey) {
      throw new Error('Embedding API 未配置（需要 API 地址和 Key）')
    }

    const key = this._cacheKey(text, cfg.model)
    if (this._cache.has(key)) {
      return this._cache.get(key)
    }

    const res = await fetch(`${cfg.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        input: text,
        encoding_format: 'float'
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Embedding 请求失败 (${res.status}): ${errText.substring(0, 200)}`)
    }

    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Embedding 返回格式异常')
    }

    this._vectorSize = embedding.length

    const vector = embedding
    this._cache.set(key, vector)
    this._trimCache()
    return vector
  }

  async embedBatch(texts) {
    if (!texts || texts.length === 0) return []

    const results = []
    const uncached = []
    const uncachedIndices = []

    const cfg = this._getConfig()

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      if (!text || !text.trim()) {
        results[i] = null
        continue
      }
      const key = this._cacheKey(text, cfg.model)
      if (this._cache.has(key)) {
        results[i] = this._cache.get(key)
      } else {
        results[i] = null
        uncached.push(text)
        uncachedIndices.push(i)
      }
    }

    if (uncached.length === 0) return results

    const batchCfg = this._getConfig()
    if (!batchCfg.baseUrl || !batchCfg.apiKey) {
      throw new Error('Embedding API 未配置')
    }

    const batchSize = 20
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize)
      const res = await fetch(`${batchCfg.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${batchCfg.apiKey}`
        },
        body: JSON.stringify({
          model: batchCfg.model,
          input: batch,
          encoding_format: 'float'
        }),
        signal: AbortSignal.timeout(60000)
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Embedding 批量请求失败 (${res.status}): ${errText.substring(0, 200)}`)
      }

      const data = await res.json()
      const embeddings = data.data || []
      this._vectorSize = embeddings[0]?.embedding?.length || EMBEDDING_DIMENSION

      for (let j = 0; j < embeddings.length; j++) {
        const vector = embeddings[j].embedding
        const idx = uncachedIndices[i + j]
        results[idx] = vector
        const cacheKey = this._cacheKey(uncached[i + j], batchCfg.model)
        this._cache.set(cacheKey, vector)
      }
    }

    this._trimCache()
    return results
  }

  clearCache() {
    this._cache.clear()
  }
}

export const embeddingService = new EmbeddingService()
