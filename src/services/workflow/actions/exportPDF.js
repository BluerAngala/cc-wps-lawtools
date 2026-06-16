/**
 * 导出PDF操作
 */

import { BaseAction, createSuccessResult, createErrorResult } from './BaseAction.js'
import { ActionTypes } from '../types.js'
import { wpsFileService } from '../../wps/WpsFile.js'

export class ExportPDFAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.EXPORT_PDF,
      name: '导出PDF',
      description: '将文档导出为PDF格式',
      icon: '📑'
    })
  }

  async execute(params, _context) {
    try {
      const result = await wpsFileService.exportPDF({
        outputPath: params.outputPath
      })

      if (result.success) {
        return createSuccessResult(result.message, {
          pdfFileName: result.pdfFileName,
          pdfFullPath: result.pdfFullPath
        })
      } else {
        return createErrorResult(result.message)
      }
    } catch (error) {
      return createErrorResult(error.message || '导出PDF失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        outputPath: {
          type: 'string',
          title: '输出路径',
          description: 'PDF文件的输出路径（可选，默认与文档同目录）'
        }
      },
      required: []
    }
  }
}

export const exportPDFAction = new ExportPDFAction()
