/**
 * 合同审查服务统一导出入口
 *
 * 使用方式：
 * import { contractReviewEngine, dataSubmitter } from '@/services/contract'
 */

// AI 审查引擎（核心）
export { ContractReviewEngine, contractReviewEngine } from './ContractReviewEngine.js'

// 数据提交（金山文档）
export { DataSubmitter, dataSubmitter } from './DataSubmitter.js'

// 文档分段
export { DocumentSegmenter, documentSegmenter } from './DocumentSegmenter.js'

// JSONL 解析
export { JSONLParser, default as JsonlParser } from './JsonlParser.js'

// AI 审查服务（SiliconFlow 包装）
export { ReviewAIService, reviewAIService } from './ReviewAiService.js'

// 审查清单生成
export { ReviewChecklistGenerator, reviewChecklistGenerator } from './ReviewChecklistGenerator.js'
