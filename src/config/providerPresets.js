/**
 * AI 服务商预设
 *
 * 支持 OpenAI 兼容协议的国内外主流 AI 服务商。
 * 切换服务商时自动填充 Base URL 和推荐模型。
 */

export const AI_PROVIDERS = [
  {
    id: 'siliconflow',
    name: '硅基流动',
    description: '国产 Qwen/DeepSeek/GLM 等模型',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-14B-Instruct',
    models: [
      { label: 'Qwen2.5-7B-Instruct (推荐-快速)', value: 'Qwen/Qwen2.5-7B-Instruct', tag: '推荐' },
      { label: 'Qwen2.5-14B-Instruct (推荐-平衡)', value: 'Qwen/Qwen2.5-14B-Instruct', tag: '推荐' },
      { label: 'Qwen2.5-32B-Instruct (强大)', value: 'Qwen/Qwen2.5-32B-Instruct', tag: '高级' },
      { label: 'Qwen2.5-72B-Instruct (顶级)', value: 'Qwen/Qwen2.5-72B-Instruct', tag: '高级' },
      { label: 'DeepSeek-V3 (高性能)', value: 'deepseek-ai/DeepSeek-V3', tag: '高级' },
      { label: 'GLM-4-9B-Chat (快速)', value: 'Pro/THUDM/glm-4-9b-chat', tag: '推荐' }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '深度求索官方 API',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: [
      { label: 'DeepSeek-V3 (推荐-对话)', value: 'deepseek-chat', tag: '推荐' },
      { label: 'DeepSeek-R1 (推理)', value: 'deepseek-reasoner', tag: '高级' }
    ]
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    description: 'Moonshot 长上下文模型',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: [
      { label: 'Moonshot v1 8K (推荐-快速)', value: 'moonshot-v1-8k', tag: '推荐' },
      { label: 'Moonshot v1 32K (平衡)', value: 'moonshot-v1-32k', tag: '推荐' },
      { label: 'Moonshot v1 128K (长文)', value: 'moonshot-v1-128k', tag: '高级' },
      { label: 'Kimi-K2-Instruct (开源旗舰)', value: 'moonshotai/Kimi-K2-Instruct', tag: '高级' }
    ]
  },
  {
    id: 'custom',
    name: '自定义中转',
    description: '任何 OpenAI 兼容 API（如中转站、其他云厂商）',
    baseUrl: '',
    defaultModel: '',
    models: []
  }
]

/**
 * 根据 provider id 获取预设
 */
export function getProvider(id) {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0]
}

/**
 * 根据 baseUrl 推断 provider（用于向后兼容：用户可能没设置 provider 字段）
 */
export function detectProviderByUrl(baseUrl) {
  if (!baseUrl) return 'siliconflow'
  if (baseUrl.includes('siliconflow')) return 'siliconflow'
  if (baseUrl.includes('deepseek')) return 'deepseek'
  if (baseUrl.includes('moonshot')) return 'kimi'
  return 'custom'
}
