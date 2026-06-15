/**
 * AI 服务统一导出入口
 *
 * 使用方式：
 * import { chatService, playbookService, fetchCompanyInfo } from '@/services/ai'
 */

// AI 任务调度
export { TaskScheduler, default as taskScheduler } from './TaskScheduler.js'

// 对话式 AI 服务（核心入口）
export { chatService, default as ChatService } from './chatService.js'

// 企业信息查询
export { fetchCompanyInfo } from './coze.js'

// 审查策略（Playbook）
export { playbookService, default as PlaybookService } from './playbookService.js'

// 提示词生成
export {
  generateContractExtractionPrompt,
  generateContractReviewPrompt,
  validateExtractTags,
  COMMON_EXTRACT_TAGS
} from './promptGenerator.js'

// 系统提示词模板（5 种对话模式）
export { buildSystemPrompt, PROMPT_MODES } from './promptTemplates.js'

// SiliconFlow API 客户端
export { reinitializeAIClient } from './siliconflow.js'
