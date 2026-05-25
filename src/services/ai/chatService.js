import { wpsDocument } from '../wps/document.js'
import { appConfig } from '../../utils/appConfig.js'
import { addCommentAction } from '../workflow/actions/addComment.js'
import { addRevisionAction } from '../workflow/actions/addRevision.js'

const SYSTEM_PROMPT = `你是陈恒律师AI助手，专注于法律文档的阅读、审查和修改。你可以直接通过工具修改用户正在编辑的文档。

## 你能做的事情
1. **阅读文档**：自动读取当前打开的文档内容
2. **添加批注**：在指定文本位置添加法律批注
3. **添加修订**：修改文档中指定文本（会以修订标记呈现）
4. **法律分析**：对合同条款进行法律风险分析

## 如何操作文档
当你需要修改文档时，请在回复中嵌入操作指令，格式如下：

\`\`\`action
{"type":"comment","keyword":"违约金","comment":"建议审查违约金比例是否合理，一般不超过实际损失的30%"}
\`\`\`

或

\`\`\`action
{"type":"revision","keyword":"按日千分之五","newText":"按日千分之一","reason":"违约金过高，建议调整为日千分之一"}
\`\`\`

## 规则
- 每次回复可以包含多个操作指令
- 操作指令必须放在 \`\`\`action 代码块中
- keyword 必须是文档中能找到的精确文本片段
- 修改前务必向用户解释修改理由
- 不确定的内容不要擅自修改

## 当前文档上下文
{document_context}`

const TOOL_DEFINITIONS = [
  {
    name: 'add_comment',
    description: '在文档指定关键词位置添加批注',
    parameters: {
      keyword: '文档中要添加批注的精确文本',
      comment: '批注内容'
    }
  },
  {
    name: 'add_revision',
    description: '修订文档中指定文本（以修订标记呈现，用户可接受或拒绝）',
    parameters: {
      keyword: '要替换的原文精确文本',
      newText: '替换后的新文本',
      reason: '修订原因'
    }
  }
]

function buildSystemPrompt(docContext) {
  const contextSection = docContext
    ? `以下是当前文档的内容（截取前8000字符）：\n\n${docContext}`
    : '当前没有打开的文档。'
  return SYSTEM_PROMPT.replace('{document_context}', contextSection)
}

function parseActionsFromResponse(text) {
  const actions = []
  const cleanedText = text.replace(/```action\s*([\s\S]*?)\s*```/g, (_match, jsonStr) => {
    try {
      const action = JSON.parse(jsonStr.trim())
      if (action.type && action.keyword) {
        actions.push(action)
      }
    } catch (e) {
      console.warn('解析操作指令失败:', e)
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
  return { success: false, message: `未知操作类型: ${action.type}` }
}

class ChatService {
  constructor() {
    this.conversationHistory = []
    this.isLoading = false
    this.currentAbortController = null
  }

  async sendMessage(userMessage, { onChunk, onComplete, onError, onAction, onStatus } = {}) {
    if (this.isLoading) {
      onError?.('正在处理中，请等待当前操作完成')
      return
    }

    this.isLoading = true
    this.currentAbortController = new AbortController()

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

      const messages = [
        { role: 'system', content: buildSystemPrompt(docContext) },
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

      onComplete?.({ text: cleanedText, actions, rawText: fullResponse })

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
          // skip malformed SSE chunk
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
