import { qdrantClient, COLLECTIONS } from './QdrantClient.js'
import { embeddingService } from './EmbeddingService.js'
import { appConfig } from '@/utils/AppConfig.js'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 100

function _simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

function _generatePointId(text) {
  return _simpleHash(text)
}

function _isRagEnabled() {
  const config = appConfig.getConfig()
  const rag = config.rag || {}
  return rag.enabled && rag.qdrantUrl
}

function _splitIntoChunks(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text) return []

  const paragraphs = text.split(/\n{2,}/)
  const chunks = []
  let currentChunk = ''

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    if (currentChunk.length + trimmed.length + 1 <= size) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed
    } else {
      if (currentChunk) {
        chunks.push(currentChunk)
        if (overlap > 0 && currentChunk.length > overlap) {
          currentChunk = currentChunk.slice(-overlap) + '\n\n' + trimmed
        } else {
          currentChunk = trimmed
        }
      } else {
        for (let i = 0; i < trimmed.length; i += size - overlap) {
          chunks.push(trimmed.slice(i, i + size))
        }
        currentChunk = ''
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

class RagService {
  constructor() {
    this._initialized = false
  }

  static isRagEnabled() {
    return _isRagEnabled()
  }

  async ensureCollections() {
    if (this._initialized) return

    const existing = await qdrantClient.listCollections()
    const existingNames = new Set(existing.map((c) => c.name))

    for (const name of Object.values(COLLECTIONS)) {
      if (!existingNames.has(name)) {
        await qdrantClient.createCollection(name, embeddingService.vectorSize)
      }
    }

    this._initialized = true
  }

  async indexDocument(docText, metadata = {}) {
    if (!_isRagEnabled()) return { indexed: 0, reason: 'RAG 未启用' }

    try {
      await this.ensureCollections()

      const chunks = _splitIntoChunks(docText)
      if (chunks.length === 0) return { indexed: 0, reason: '文档为空' }

      const vectors = await embeddingService.embedBatch(chunks)

      const points = []
      for (let i = 0; i < chunks.length; i++) {
        if (!vectors[i]) continue
        points.push({
          id: _generatePointId(`${metadata.docName || 'doc'}_${i}_${chunks[i].substring(0, 50)}`),
          vector: vectors[i],
          payload: {
            text: chunks[i],
            chunk_index: i,
            total_chunks: chunks.length,
            doc_name: metadata.docName || '',
            doc_type: metadata.docType || 'contract',
            indexed_at: new Date().toISOString(),
            ...metadata
          }
        })
      }

      await qdrantClient.batchUpsert(COLLECTIONS.DOCUMENT_CHUNKS, points)
      return { indexed: points.length }
    } catch (e) {
      console.error('[RAG] 索引文档失败:', e)
      return { indexed: 0, error: e.message }
    }
  }

  async searchDocumentContext(query, limit = 5, docName = null) {
    if (!_isRagEnabled()) return []

    try {
      await this.ensureCollections()

      const queryVector = await embeddingService.embed(query)
      if (!queryVector) return []

      const filter = docName
        ? {
            must: [
              {
                key: 'doc_name',
                match: { value: docName }
              }
            ]
          }
        : null

      const results = await qdrantClient.search(
        COLLECTIONS.DOCUMENT_CHUNKS,
        queryVector,
        limit,
        filter
      )

      return (results?.result || []).map((r) => ({
        text: r.payload?.text || '',
        score: r.score,
        docName: r.payload?.doc_name || '',
        chunkIndex: r.payload?.chunk_index ?? -1
      }))
    } catch (e) {
      console.error('[RAG] 检索文档上下文失败:', e)
      return []
    }
  }

  async indexConversationMemory(messages, metadata = {}) {
    if (!_isRagEnabled()) return { indexed: 0, reason: 'RAG 未启用' }

    try {
      await this.ensureCollections()

      const summary = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map(
          (m) =>
            `${m.role === 'user' ? '用户' : 'AI'}: ${typeof m.content === 'string' ? m.content.substring(0, 200) : ''}`
        )
        .join('\n')

      if (!summary.trim()) return { indexed: 0, reason: '无有效对话内容' }

      const vector = await embeddingService.embed(summary)
      if (!vector) return { indexed: 0, error: 'Embedding 失败' }

      const pointId = _generatePointId(`${metadata.docName || 'conv'}_${Date.now()}`)
      await qdrantClient.upsert(COLLECTIONS.CONVERSATION_MEMORY, [
        {
          id: pointId,
          vector,
          payload: {
            summary,
            message_count: messages.length,
            doc_name: metadata.docName || '',
            session_id: metadata.sessionId || '',
            created_at: new Date().toISOString()
          }
        }
      ])

      return { indexed: 1 }
    } catch (e) {
      console.error('[RAG] 索引对话记忆失败:', e)
      return { indexed: 0, error: e.message }
    }
  }

  async searchConversationMemory(query, limit = 3) {
    if (!_isRagEnabled()) return []

    try {
      await this.ensureCollections()

      const queryVector = await embeddingService.embed(query)
      if (!queryVector) return []

      const results = await qdrantClient.search(COLLECTIONS.CONVERSATION_MEMORY, queryVector, limit)

      return (results?.result || []).map((r) => ({
        summary: r.payload?.summary || '',
        score: r.score,
        docName: r.payload?.doc_name || '',
        createdAt: r.payload?.created_at || ''
      }))
    } catch (e) {
      console.error('[RAG] 检索对话记忆失败:', e)
      return []
    }
  }

  async indexReviewHistory(reviewData, metadata = {}) {
    if (!_isRagEnabled()) return { indexed: 0, reason: 'RAG 未启用' }

    try {
      await this.ensureCollections()

      const actions = reviewData.actions || []
      const points = []

      for (const action of actions) {
        const text =
          action.type === 'revision'
            ? `修改：${action.keyword} → ${action.newText}（原因：${action.reason || '无'}）`
            : `批注：${action.keyword} - ${action.comment}`

        const vector = await embeddingService.embed(text)
        if (!vector) continue

        points.push({
          id: _generatePointId(`review_${metadata.docName || ''}_${text}`),
          vector,
          payload: {
            text,
            action_type: action.type,
            keyword: action.keyword,
            doc_name: metadata.docName || '',
            reviewed_at: new Date().toISOString()
          }
        })
      }

      if (points.length === 0) return { indexed: 0, reason: '无有效操作记录' }

      await qdrantClient.batchUpsert(COLLECTIONS.REVIEW_HISTORY, points)
      return { indexed: points.length }
    } catch (e) {
      console.error('[RAG] 索引审查历史失败:', e)
      return { indexed: 0, error: e.message }
    }
  }

  async searchReviewHistory(query, limit = 5) {
    if (!_isRagEnabled()) return []

    try {
      await this.ensureCollections()

      const queryVector = await embeddingService.embed(query)
      if (!queryVector) return []

      const results = await qdrantClient.search(COLLECTIONS.REVIEW_HISTORY, queryVector, limit)

      return (results?.result || []).map((r) => ({
        text: r.payload?.text || '',
        score: r.score,
        actionType: r.payload?.action_type || '',
        docName: r.payload?.doc_name || '',
        reviewedAt: r.payload?.reviewed_at || ''
      }))
    } catch (e) {
      console.error('[RAG] 检索审查历史失败:', e)
      return []
    }
  }

  async indexLawKnowledge(entries) {
    if (!_isRagEnabled()) return { indexed: 0, reason: 'RAG 未启用' }

    try {
      await this.ensureCollections()

      const texts = entries.map((e) => e.text || e.content || '')
      const vectors = await embeddingService.embedBatch(texts)

      const points = []
      for (let i = 0; i < entries.length; i++) {
        if (!vectors[i]) continue
        points.push({
          id: _generatePointId(`law_${entries[i].title || ''}_${i}`),
          vector: vectors[i],
          payload: {
            text: texts[i],
            title: entries[i].title || '',
            category: entries[i].category || '',
            source: entries[i].source || '',
            indexed_at: new Date().toISOString()
          }
        })
      }

      await qdrantClient.batchUpsert(COLLECTIONS.LAW_KNOWLEDGE, points)
      return { indexed: points.length }
    } catch (e) {
      console.error('[RAG] 索引法律知识失败:', e)
      return { indexed: 0, error: e.message }
    }
  }

  async searchLawKnowledge(query, limit = 5) {
    if (!_isRagEnabled()) return []

    try {
      await this.ensureCollections()

      const queryVector = await embeddingService.embed(query)
      if (!queryVector) return []

      const results = await qdrantClient.search(COLLECTIONS.LAW_KNOWLEDGE, queryVector, limit)

      return (results?.result || []).map((r) => ({
        text: r.payload?.text || '',
        title: r.payload?.title || '',
        category: r.payload?.category || '',
        source: r.payload?.source || '',
        score: r.score
      }))
    } catch (e) {
      console.error('[RAG] 检索法律知识失败:', e)
      return []
    }
  }

  buildContextFromResults(results, label = '相关内容') {
    if (!results || results.length === 0) return ''

    const parts = results.map((r, i) => {
      const text = r.text || r.summary || ''
      const meta = []
      if (r.docName) meta.push(`文档: ${r.docName}`)
      if (r.score !== undefined) meta.push(`相关度: ${(r.score * 100).toFixed(0)}%`)
      const metaStr = meta.length > 0 ? ` [${meta.join(', ')}]` : ''
      return `[${i + 1}]${metaStr}\n${text}`
    })

    return `## ${label}\n\n${parts.join('\n\n')}`
  }

  async getStats() {
    if (!_isRagEnabled()) return { enabled: false }

    try {
      const stats = { enabled: true, collections: {} }
      for (const [key, name] of Object.entries(COLLECTIONS)) {
        try {
          const info = await qdrantClient.collectionInfo(name)
          stats.collections[key] = {
            name,
            points_count: info?.result?.points_count || 0,
            vector_count: info?.result?.vectors_count || 0,
            status: info?.result?.status || 'unknown'
          }
        } catch {
          stats.collections[key] = { name, points_count: 0, status: 'not_found' }
        }
      }
      return stats
    } catch (e) {
      return { enabled: true, error: e.message }
    }
  }
}

export const ragService = new RagService()
export { RagService }
