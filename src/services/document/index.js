/**
 * 文档处理服务统一导出入口
 *
 * 使用方式：
 * import { defaultDesensitizer, desensitizeText } from '@/services/document'
 */

// 高级脱敏
export { Desensitizer, defaultDesensitizer, desensitizeText } from './Desensitizer.js'

// 文档解析
export { DocumentParser, default as documentParser } from './DocumentParser.js'
