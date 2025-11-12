// 简化版脱敏工具

// 核心敏感信息类型配置
const SENSITIVE_PATTERNS = [
  // 身份证号（优先级最高，先匹配，18位）
  {
    type: '身份证号',
    regex: /(?<!\d)[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx](?!\d)/g,
    mask: (match) => match.replace(/(\d{6})\d{8}(\d{3}[0-9Xx])/, '$1********$2')
  },
  // 手机号（11位，前后不能有数字）
  {
    type: '手机号',
    regex: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    mask: (match) => match.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },
  // 邮箱
  {
    type: '邮箱',
    regex: /[\w.-]+@[\w.-]+\.\w+/g,
    mask: (match) => {
      const [name, domain] = match.split('@')
      return name.charAt(0) + '***@' + domain
    }
  },
  // 银行卡号（16-19位，前后不能有数字，排除身份证号）
  {
    type: '银行卡号',
    regex: /(?<!\d)[1-9]\d{15,18}(?!\d)/g,
    mask: (match) => {
      // 排除身份证号（18位且符合身份证格式）
      if (match.length === 18 && /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(match)) {
        return match // 不处理，留给身份证号规则
      }
      return match.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
    }
  },
  // 姓名（简化版）
  {
    type: '姓名',
    regex:
      /(?:姓名|法定代表人|委托人|受托人)[:：\s]{1,3}([\u4e00-\u9fa5]{2,4})(?![\u4e00-\u9fa5])/g,
    mask: (match) => {
      const parts = match.split(/[:：\s]+/)
      if (parts.length >= 2) {
        const name = parts[1]
        const maskedName = name.charAt(0) + '*'.repeat(name.length - 1)
        return parts[0] + '：' + maskedName
      }
      return match
    }
  }
]

/**
 * 简化的脱敏处理函数
 * @param {string} text - 需要脱敏的文本
 * @returns {Object} - 包含脱敏后文本和敏感信息列表的对象
 */
export function desensitizeText(text) {
  if (!text) {
    return { desensitizedText: '', sensitiveInfoList: [] }
  }

  const sensitiveInfoList = []
  const matchedTexts = new Set() // 记录已匹配的文本，避免重复

  // 处理预定义的敏感信息类型
  SENSITIVE_PATTERNS.forEach((pattern) => {
    pattern.regex.lastIndex = 0
    const matches = text.match(pattern.regex)

    if (matches) {
      matches.forEach((match) => {
        // 跳过已经匹配过的文本
        if (matchedTexts.has(match)) {
          return
        }

        // 生成脱敏后的文本
        const desensitized = pattern.mask(match)

        // 如果脱敏后的文本和原文本一样，说明这个匹配被跳过了（如银行卡号规则中的身份证号）
        if (desensitized === match) {
          return
        }

        // 添加到敏感信息列表
        sensitiveInfoList.push({
          original: match,
          desensitized: desensitized,
          type: pattern.type
        })

        // 记录已匹配的文本
        matchedTexts.add(match)
      })
    }
  })

  // 生成脱敏后的文本
  let desensitizedText = text
  sensitiveInfoList.forEach((item) => {
    // 使用全局替换
    const regex = new RegExp(item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    desensitizedText = desensitizedText.replace(regex, item.desensitized)
  })

  return { desensitizedText, sensitiveInfoList }
}

/**
 * 快速脱敏函数，只返回脱敏后的文本
 * @param {string} text - 需要脱敏的文本
 * @returns {string} - 脱敏后的文本
 */
export function quickDesensitize(text) {
  return desensitizeText(text).desensitizedText
}

// 默认导出
export default {
  desensitizeText,
  quickDesensitize
}
