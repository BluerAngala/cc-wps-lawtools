/**
 * WPS 服务统一导出入口
 *
 * 使用方式：
 * import { wpsCore, wpsDocument, wpsFile, wpsTaskHandler } from '@/services/wps'
 */

// 核心服务（环境检查、任务窗格、对话框）
export { wpsCore, WPS_Enum, getUrlPath, getRouterHash } from './WpsCore.js'
export { default as Util } from './WpsCore.js'

// 文档内容服务（读取、批注、修订）
export { wpsDocument, wpsDocumentService, WPSDocumentService } from './WpsDocument.js'

// 文件操作服务（页眉、重命名、导出PDF）
export { wpsFile, wpsFileService, WPSFileService } from './WpsFile.js'

// 任务处理服务（按钮点击、AI任务）
export { wpsTaskHandler } from './WpsTaskHandler.js'
export { default as taskPane } from './WpsTaskHandler.js'

// 文档监听器
export { DocumentWatcher, default as watcher } from './DocumentWatcher.js'
