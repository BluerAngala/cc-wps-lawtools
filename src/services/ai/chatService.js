import { wpsDocument } from '../wps/document.js'
import { appConfig } from '../../utils/appConfig.js'
import { buildSystemPrompt } from './promptTemplates.js'
import { ragService, RagService } from '../rag/index.js'
import { actionRegistry } from '../workflow/actionRegistry.js'
import { registerAllActions } from '../workflow/actions/index.js'

registerAllActions(actionRegistry)

const CHAT_TOOL_ACTIONS = [
  'addComment',
  'addRevision',
  'readDocument',
  'saveDocument',
  'addHeader',
  'addFooter',
  'addPageNumber',
  'addWatermark',
  'renameDocument',
  'exportPDF',
  'scanSensitive',
  'desensitize',
  'batchKeyword'
]

function _buildToolDefinitions() {
  return CHAT_TOOL_ACTIONS.map((type) => {
    const action = actionRegistry.get(type)
    if (!action) return null
    const schema = action.getSchema()
    const params = {}
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      params[key] = prop.description || prop.title || key
    }
    return { name: type, description: action.description, parameters: params }
  }).filter(Boolean)
}

const TOOL_DEFINITIONS = [
  ..._buildToolDefinitions(),
  {
    name: 'risk_assessment',
    description: '结构化风险评估，输出严重度×可能性矩阵',
    parameters: {
      items: '风险项数组，每项含 category/severity/likelihood/description/recommendation'
    }
  },
  {
    name: 'triage_nda',
    description: 'NDA快速分流，输出GREEN/YELLOW/RED评级',
    parameters: {
      level: 'GREEN/YELLOW/RED',
      summary: '分流结论摘要',
      issues: '问题列表',
      recommendation: '建议处理方式'
    }
  },
  {
    name: 'compare_contracts',
    description: '合同对比，输出条款差异',
    parameters: {
      items: '差异项数组，每项含 clause/standard/current/change/risk/suggestion'
    }
  }
]

const _LEGACY_TYPE_MAP = {
  comment: 'addComment',
  revision: 'addRevision'
}

function _pushAction(actions, action) {
  if (!action || !action.type) return

  const type = _LEGACY_TYPE_MAP[action.type] || action.type

  if (type === 'risk' && Array.isArray(action.items)) {
    actions.push({ type: 'risk', items: action.items })
  } else if (type === 'triage' && action.level) {
    actions.push({
      type: 'triage',
      level: action.level,
      summary: action.summary,
      issues: action.issues || [],
      recommendation: action.recommendation
    })
  } else if (type === 'compare' && Array.isArray(action.items)) {
    actions.push({ type: 'compare', items: action.items })
  } else if (actionRegistry.has(type)) {
    actions.push({ ...action, type })
  }
}

function parseActionsFromResponse(text) {
  const actions = []
  const cleanedText = text.replace(/```action\s*([\s\S]*?)\s*```/g, (_match, jsonStr) => {
    try {
      const raw = jsonStr.trim()
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach((a) => _pushAction(actions, a))
      } else {
        _pushAction(actions, parsed)
      }
    } catch (e) {
      const trimmed = jsonStr.trim()
      const arrMatch = trimmed.match(/^\[/)
      if (arrMatch) {
        const fixed = trimmed.replace(/,\s*]/g, ']').replace(/}\s*{/g, '},{')
        try {
          const parsed = JSON.parse(fixed)
          if (Array.isArray(parsed)) parsed.forEach((a) => _pushAction(actions, a))
        } catch {
          console.warn('解析操作指令失败:', e)
        }
      } else {
        console.warn('解析操作指令失败:', e)
      }
    }
    return ''
  })
  return { cleanedText: cleanedText.trim(), actions }
}

async function executeAction(action) {
  const { type } = action

  if (type === 'risk' || type === 'triage' || type === 'compare') {
    return { success: true, message: '分析结果已展示' }
  }

  const registryAction = actionRegistry.get(type)
  if (registryAction) {
    const schema = registryAction.getSchema()
    const propsDef = schema.properties || {}
    const params = {}
    for (const key of Object.keys(propsDef)) {
      if (action[key] !== undefined) {
        params[key] = action[key]
      }
    }
    const context = { documentText: null, documentInfo: null, previousResult: null, data: {} }
    return registryAction.execute(params, context)
  }

  return { success: false, message: `未知操作类型: ${type}` }
}

class ChatService {
  constructor() {
    this.conversationHistory = []
    this.isLoading = false
    this.currentAbortController = null
    this.currentMode = 'standard'
  }

  setMode(mode) {
    this.currentMode = mode
  }

  getMode() {
    return this.currentMode
  }

  async sendMessage(
    userMessage,
    {
      onChunk,
      onComplete,
      onError,
      onAction,
      onStatus,
      mode,
      referenceText,
      templateContent,
      inquiryType
    } = {}
  ) {
    if (this.isLoading) {
      onError?.('正在处理中，请等待当前操作完成')
      return
    }

    this.isLoading = true
    this.currentAbortController = new AbortController()
    const effectiveMode = mode || this.currentMode

    try {
      onStatus?.('thinking')

      let docContext = ''
      let ragContext = ''
      let docName = ''

      try {
        onStatus?.('reading')
        docContext = wpsDocument.getFullText()?.substring(0, 8000) || ''
        try {
          const doc = wpsDocument.getDocument()
          docName = doc?.Name || ''
        } catch {
          /* ignore */
        }
        console.log('[ChatService] 文档读取成功, 长度:', docContext.length, '文档名:', docName)
      } catch (e) {
        console.warn('[ChatService] 文档读取失败:', e.message)
        docContext = ''
      }

      if (docContext && RagService.isRagEnabled()) {
        try {
          await ragService.indexDocument(docContext, { docName, docType: 'contract' })

          const docResults = await ragService.searchDocumentContext(userMessage, 3, docName || null)
          if (docResults.length > 0) {
            ragContext += ragService.buildContextFromResults(docResults, '文档相关段落')
          }

          const reviewResults = await ragService.searchReviewHistory(userMessage, 2)
          if (reviewResults.length > 0) {
            ragContext += '\n\n' + ragService.buildContextFromResults(reviewResults, '历史审查参考')
          }

          const memResults = await ragService.searchConversationMemory(userMessage, 2)
          if (memResults.length > 0) {
            ragContext += '\n\n' + ragService.buildContextFromResults(memResults, '历史对话参考')
          }

          const lawResults = await ragService.searchLawKnowledge(userMessage, 2)
          if (lawResults.length > 0) {
            ragContext += '\n\n' + ragService.buildContextFromResults(lawResults, '法律知识参考')
          }

          if (ragContext) {
            const ragOnlyLength = ragContext.length
            const docBudget = Math.max(3000, 8000 - ragOnlyLength)
            docContext = docContext.substring(0, docBudget)
          }
        } catch (e) {
          console.warn('[RAG] 检索增强失败，回退全文模式:', e)
        }
      }

      this.conversationHistory.push({ role: 'user', content: userMessage })

      const systemPrompt = buildSystemPrompt(effectiveMode, {
        docContext,
        ragContext,
        referenceText,
        templateContent,
        inquiryType
      })

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.slice(-20)
      ]

      onStatus?.('generating')

      const aiConfig = appConfig.getAIConfig()
      const model = aiConfig.model || 'moonshotai/Kimi-K2-Instruct-0905'
      const useStream = typeof window.fetch === 'function'
      let fullResponse = ''

      if (useStream) {
        fullResponse = await this._callAIStream(aiConfig, model, messages, onChunk)
      } else {
        fullResponse = await this._callAINonStream(aiConfig, model, messages, onChunk)
      }

      const { cleanedText, actions } = parseActionsFromResponse(fullResponse)

      this.conversationHistory.push({ role: 'assistant', content: fullResponse })

      if (RagService.isRagEnabled()) {
        if (actions.length > 0) {
          ragService.indexReviewHistory({ actions }, { docName }).catch((e) => {
            console.warn('[RAG] 索引审查历史失败:', e)
          })
        }
        if (this.conversationHistory.length >= 4) {
          ragService.indexConversationMemory(this.conversationHistory, { docName }).catch((e) => {
            console.warn('[RAG] 索引对话记忆失败:', e)
          })
        }
      }

      onComplete?.({ text: cleanedText, actions, rawText: fullResponse, mode: effectiveMode })

      if (actions.length > 0) {
        onAction?.(actions)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        onError?.('请求已取消')
      } else {
        console.error('ChatService 发送消息失败:', error)
        onError?.(error.message || '发送消息失败')
      }
    } finally {
      this.isLoading = false
      this.currentAbortController = null
    }
  }

  async _callAIStream(aiConfig, model, messages, onChunk) {
    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: aiConfig.maxTokens || 8000,
        temperature: 0.1,
        stream: true
      }),
      signal: this.currentAbortController?.signal
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`AI 请求失败 (${response.status}): ${errText.substring(0, 200)}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    let keepReading = true
    while (keepReading) {
      const { done, value } = await reader.read()
      if (done) {
        keepReading = false
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content || ''
          if (delta) {
            fullText += delta
            onChunk?.(delta, fullText)
          }
        } catch {
          // skip
        }
      }
    }

    return fullText
  }

  async _callAINonStream(aiConfig, model, messages, onChunk) {
    const axios = (await import('axios')).default
    const timeout = aiConfig.timeout || 120000

    const client = axios.create({
      baseURL: aiConfig.baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`
      }
    })

    const response = await client.post('/chat/completions', {
      model,
      messages,
      max_tokens: aiConfig.maxTokens || 8000,
      temperature: 0.1
    })

    const content = response.data?.choices?.[0]?.message?.content || ''
    onChunk?.(content, content)
    return content
  }

  async applyAction(action) {
    try {
      const result = await executeAction(action)
      return result
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async applyAllActions(actions) {
    const results = []
    for (const action of actions) {
      const result = await this.applyAction(action)
      results.push({ action, result })
    }
    return results
  }

  cancel() {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
    }
  }

  clearHistory() {
    this.conversationHistory = []
  }

  getHistory() {
    return [...this.conversationHistory]
  }

  getToolDefinitions() {
    return TOOL_DEFINITIONS
  }
}

export const chatService = new ChatService()
export default chatService
