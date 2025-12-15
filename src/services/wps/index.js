/**
 * WPS 服务统一导出入口
 * 
 * 使用方式：
 * import { wpsCore, wpsDocument, wpsFile, wpsTaskHandler } from '@/services/wps'
 */

// 核心服务（环境检查、任务窗格、对话框）
export { wpsCore, WPS_Enum, getUrlPath, getRouterHash } from './core.js'
export { default as Util } from './core.js'

// 文档内容服务（读取、批注、修订）
export { wpsDocument, wpsDocumentService, WPSDocumentService } from './document.js'

// 文件操作服务（页眉、重命名、导出PDF）
export { wpsFile, wpsFileService, WPSFileService } from './file.js'

// 任务处理服务（按钮点击、AI任务）
export { wpsTaskHandler } from './taskHandler.js'
export { default as taskPane } from './taskHandler.js'

// 文档监听器
export { DocumentWatcher, default as watcher } from './watcher.js'

// 业务系统对接
export { default as systemBridge, openOfficeFileFromSystemDemo, InvokeFromSystemDemo } from './systemBridge.js'
