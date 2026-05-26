/**
 * JSONL 增量解析器
 * 从流式数据中逐行提取完整的 JSON 对象
 * 用于流式合同审查的实时解析
 */

import unifiedLogger from '../../utils/unifiedLogger.js'

export class JSONLParser {
  /**
   * 创建 JSONL 解析器
   * @param {Object} options - 配置选项
   * @param {Function} options.onLine - 解析到完整 JSON 行时的回调
   * @param {Function} options.onError - 解析错误时的回调
   */
  constructor(options = {}) {
    this.buffer = '' // 数据缓冲区
    this.onLine = options.onLine || (() => {})
    this.onError =
      options.onError || ((msg) => unifiedLogger.warn('JSONL解析警告', { message: msg }))
    this.lineCount = 0 // 已解析的行数
  }

  /**
   * 接收数据块
   * @param {string} chunk - 数据块
   */
  feed(chunk) {
    if (!chunk) return
    this.buffer += chunk
    this._processBuffer()
  }

  /**
   * 处理缓冲区，提取完整行
   * @private
   */
  _processBuffer() {
    // 按换行符分割
    const lines = this.buffer.split('\n')
    // 最后一个元素可能是不完整的行，保留在缓冲区
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      this._parseLine(line)
    }
  }

  /**
   * 解析单行
   * @param {string} line - 单行文本
   * @private
   */
  _parseLine(line) {
    const trimmed = line.trim()
    if (!trimmed) return // 跳过空行

    try {
      const obj = JSON.parse(trimmed)
      this.lineCount++
      this.onLine(obj)
    } catch (e) {
      // 解析失败，记录警告但不中断
      this.onError(`JSON解析失败: ${trimmed.substring(0, 100)}${trimmed.length > 100 ? '...' : ''}`)
    }
  }

  /**
   * 结束解析，处理缓冲区中剩余的数据
   */
  flush() {
    const remaining = this.buffer.trim()
    if (remaining) {
      this._parseLine(remaining)
    }
    this.buffer = ''
  }

  /**
   * 重置解析器状态
   */
  reset() {
    this.buffer = ''
    this.lineCount = 0
  }

  /**
   * 获取已解析的行数
   * @returns {number}
   */
  getLineCount() {
    return this.lineCount
  }
}

export default JSONLParser
