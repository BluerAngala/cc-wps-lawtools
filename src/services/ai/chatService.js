import { wpsDocument } from '../wps/document.js'
import { appConfig } from '../../utils/appConfig.js'
import { addCommentAction } from '../workflow/actions/addComment.js'
import { addRevisionAction } from '../workflow/actions/addRevision.js'
import { buildSystemPrompt } from './promptTemplates.js'

const TOOL_DEFINITIONS = [
  {
    name: 'add_comment',
    description: '在文档指定关键词位置添加批注',
    parameters: { keyword: '文档中要添加批注的精确文本', comment: '批注内容' }
  },
  {
    name: 'add_revision',
    description: '修订文档中指定文本（以修订标记呈现，用户可接受或拒绝）',
    parameters: { keyword: '要替换的原文精确文本', newText: '替换后的新文本', reason: '修订原因' }
  },
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

function _pushAction(actions, action) {
  if (!action || !action.type) return

  if (action.type === 'risk' && Array.isArray(action.items)) {
    actions.push({ type: 'risk', items: action.items })
  } else if (action.type === 'triage' && action.level) {
    actions.push({
      type: 'triage',
      level: action.level,
      summary: action.summary,
      issues: action.issues || [],
      recommendation: action.recommendation
    })
  } else if (action.type === 'compare' && Array.isArray(action.items)) {
    actions.push({ type: 'compare', items: action.items })
  } else if (action.type === 'comment' && action.keyword) {
    actions.push(action)
  } else if (action.type === 'revision' && action.keyword) {
    actions.push(action)
  }
}

function parseActionsFromResponse(text) {
  const actions = []
  const cleanedText = text.replace(/```action\s*([\s\S]*?)\s*```/g, (_match, jsonStr) => {
    try {
      const raw = jsonStr.trim()
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach(a => _pushAction(actions, a))
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
          if (Array.isArray(parsed)) parsed.forEach(a => _pushAction(actions, a))
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
  if (action.type === 'comment') {
    return addCommentAction.execute({ keyword: action.keyword, comment: action.comment })
  }
  if (action.type === 'revision') {
    return addRevisionAction.execute({
      keyword: action.keyword,
      newText: action.newText,
      reason: action.reason
    })
  }
  if (action.type === 'risk' || action.type === 'triage' || action.type === 'compare') {
    return { success: true, message: '分析结果已展示' }
  }
  return { success: false, message: `未知操作类型: ${action.type}` }
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

  async sendMessage(userMessage, { onChunk, onComplete, onError, onAction, onStatus, mode, referenceText, templateContent, inquiryType } = {}) {
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
      try {
        onStatus?.('reading')
        docContext = wpsDocument.getFullText()?.substring(0, 8000) || ''
      } catch {
        docContext = ''
      }

      this.conversationHistory.push({ role: 'user', content: userMessage })

      const systemPrompt = buildSystemPrompt(effectiveMode, {
        docContext,
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
