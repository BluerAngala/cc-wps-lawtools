/**
 * 批量处理服务统一导出入口
 */

export {
  BatchProcessor,
  batchProcessor,
  BatchTaskStatus
} from './BatchProcessor.js'

export {
  contractStandardizationWorkflow,
  contractExtractionWorkflow,
  contractNumberWorkflow,
  keywordCommentWorkflow,
  presetBatchWorkflows,
  getPresetBatchWorkflow,
  cloneBatchWorkflow,
  buildKeywordList
} from './batchWorkflowConfig.js'
