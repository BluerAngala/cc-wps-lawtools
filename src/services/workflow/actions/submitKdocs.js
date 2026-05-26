/**
 * 提交金山文档操作
 * 将提取的合同数据提交到金山文档并获取合同编号
 */

import { BaseAction, createSuccessResult, createErrorResult } from './baseAction.js'
import { ActionTypes } from '../types.js'
import { dataSubmitter } from '../../contract/dataSubmitter.js'

export class SubmitKdocsAction extends BaseAction {
  constructor() {
    super({
      type: ActionTypes.SUBMIT_KDOCS,
      name: '提交金山文档',
      description: '将合同数据提交到金山文档系统并获取合同编号',
      icon: '📤'
    })
  }

  async execute(params, context) {
    try {
      // 从上下文中获取提取的数据
      const extractedData = context.data?.extractedData || context.data

      if (!extractedData) {
        return createErrorResult('没有可提交的数据，请先执行合同信息提取')
      }

      this.emitProgress(params, '正在提交到金山文档...')

      // 调用数据提交服务
      const result = await dataSubmitter.submitExtractedData(extractedData)

      if (result.success) {
        // 将合同编号存储到上下文
        context.data.contractNumber = result.审查编号
        context.data.kdocsRecord = result.data

        this.emitProgress(params, '提交成功', `合同编号: ${result.审查编号}`)

        return createSuccessResult(`提交成功，合同编号: ${result.审查编号}`, {
          contractNumber: result.审查编号,
          kdocsRecord: result.data,
          headerAdded: result.headerAdded
        })
      } else {
        return createErrorResult(result.message || '提交失败')
      }
    } catch (error) {
      console.error('提交金山文档失败:', error)
      return createErrorResult(error.message || '提交金山文档失败')
    }
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        onProgress: {
          type: 'function',
          title: '进度回调',
          description: '接收进度信息的回调函数'
        }
      },
      required: []
    }
  }
}

export const submitKdocsAction = new SubmitKdocsAction()
